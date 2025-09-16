/**
 * Advanced Caching Service for CroweCode Platform
 * Provides multi-tier caching with Redis, in-memory, and edge caching
 */

import { LRUCache } from 'lru-cache'
import { createHash } from 'crypto'
import { compress, decompress } from 'zlib'
import { promisify } from 'util'

const gzip = promisify(compress)
const gunzip = promisify(decompress)

// Cache configuration
export interface CacheConfig {
  ttl?: number // Time to live in milliseconds
  max?: number // Maximum number of items
  maxSize?: number // Maximum size in bytes
  stale?: boolean // Allow stale cache on error
  compress?: boolean // Compress cached data
  tags?: string[] // Cache tags for invalidation
}

// Cache entry metadata
interface CacheEntry<T> {
  data: T
  metadata: {
    created: number
    accessed: number
    accessCount: number
    size: number
    compressed: boolean
    tags: string[]
    etag?: string
  }
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  hitRate: number
  size: number
  itemCount: number
}

/**
 * Multi-tier cache implementation
 */
export class CacheService {
  private static instance: CacheService
  
  // L1 Cache - In-memory LRU cache
  private memoryCache: LRUCache<string, CacheEntry<any>>
  
  // L2 Cache - Redis (if available)
  private redisClient: any = null
  
  // Cache statistics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRate: 0,
    size: 0,
    itemCount: 0
  }
  
  // Tag-based invalidation map
  private tagMap: Map<string, Set<string>> = new Map()
  
  private constructor() {
    // Initialize in-memory cache
    this.memoryCache = new LRUCache<string, CacheEntry<any>>({
      max: 1000, // Maximum 1000 items
      maxSize: 100 * 1024 * 1024, // 100MB
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      sizeCalculation: (entry) => entry.metadata.size,
      dispose: (entry, key) => {
        this.stats.evictions++
        this.removeFromTags(key, entry.metadata.tags)
      },
      updateAgeOnGet: true,
      updateAgeOnHas: false
    })
    
    // Initialize Redis if available
    this.initRedis()
    
    // Start periodic cleanup
    this.startCleanup()
  }
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }
  
  /**
   * Initialize Redis connection
   */
  private async initRedis(): Promise<void> {
    if (!process.env.REDIS_URL) return
    
    try {
      const { Redis } = await import('ioredis')
      this.redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) return null
          return Math.min(times * 100, 3000)
        },
        enableOfflineQueue: false
      })
      
      this.redisClient.on('error', (error: Error) => {
        console.error('Redis error:', error)
      })
      
      this.redisClient.on('connect', () => {
        console.log('Redis connected')
      })
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
    }
  }
  
  /**
   * Generate cache key
   */
  private generateKey(keyOrData: string | object): string {
    if (typeof keyOrData === 'string') {
      return keyOrData
    }
    
    // Generate deterministic key from object
    const sorted = JSON.stringify(keyOrData, Object.keys(keyOrData).sort())
    return createHash('sha256').update(sorted).digest('hex')
  }
  
  /**
   * Compress data if needed
   */
  private async compressData(data: any, compress: boolean): Promise<Buffer | string> {
    if (!compress) {
      return JSON.stringify(data)
    }
    
    const json = JSON.stringify(data)
    return await gzip(Buffer.from(json))
  }
  
  /**
   * Decompress data if needed
   */
  private async decompressData(data: Buffer | string, compressed: boolean): Promise<any> {
    if (!compressed) {
      return typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString())
    }
    
    const decompressed = await gunzip(data as Buffer)
    return JSON.parse(decompressed.toString())
  }
  
  /**
   * Calculate data size
   */
  private calculateSize(data: any): number {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    return Buffer.byteLength(str)
  }
  
  /**
   * Add key to tag groups
   */
  private addToTags(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set())
      }
      this.tagMap.get(tag)!.add(key)
    })
  }
  
  /**
   * Remove key from tag groups
   */
  private removeFromTags(key: string, tags: string[]): void {
    tags.forEach(tag => {
      const keys = this.tagMap.get(tag)
      if (keys) {
        keys.delete(key)
        if (keys.size === 0) {
          this.tagMap.delete(tag)
        }
      }
    })
  }
  
  /**
   * Get data from cache
   */
  async get<T>(key: string, options?: { stale?: boolean }): Promise<T | null> {
    const cacheKey = this.generateKey(key)
    
    // Try L1 cache first
    let entry = this.memoryCache.get(cacheKey)
    
    if (entry) {
      this.stats.hits++
      entry.metadata.accessed = Date.now()
      entry.metadata.accessCount++
      this.updateHitRate()
      
      try {
        const data = await this.decompressData(entry.data, entry.metadata.compressed)
        return data as T
      } catch (error) {
        console.error('Cache decompression error:', error)
        this.memoryCache.delete(cacheKey)
        return null
      }
    }
    
    // Try L2 cache (Redis)
    if (this.redisClient) {
      try {
        const redisData = await this.redisClient.get(cacheKey)
        if (redisData) {
          const entry = JSON.parse(redisData) as CacheEntry<any>
          this.stats.hits++
          this.updateHitRate()
          
          // Promote to L1 cache
          this.memoryCache.set(cacheKey, entry)
          
          const data = await this.decompressData(entry.data, entry.metadata.compressed)
          return data as T
        }
      } catch (error) {
        console.error('Redis get error:', error)
        
        // If stale is allowed, try to get from memory cache even if expired
        if (options?.stale) {
          const staleEntry = this.memoryCache.get(cacheKey, { allowStale: true })
          if (staleEntry) {
            return await this.decompressData(staleEntry.data, staleEntry.metadata.compressed) as T
          }
        }
      }
    }
    
    this.stats.misses++
    this.updateHitRate()
    return null
  }
  
  /**
   * Set data in cache
   */
  async set<T>(
    key: string,
    data: T,
    config?: CacheConfig
  ): Promise<void> {
    const cacheKey = this.generateKey(key)
    const compress = config?.compress ?? this.shouldCompress(data)
    const ttl = config?.ttl ?? 5 * 60 * 1000 // 5 minutes default
    const tags = config?.tags ?? []
    
    try {
      const compressedData = await this.compressData(data, compress)
      const size = this.calculateSize(compressedData)
      
      const entry: CacheEntry<any> = {
        data: compressedData,
        metadata: {
          created: Date.now(),
          accessed: Date.now(),
          accessCount: 0,
          size,
          compressed: compress,
          tags,
          etag: createHash('md5').update(JSON.stringify(data)).digest('hex')
        }
      }
      
      // Set in L1 cache
      this.memoryCache.set(cacheKey, entry, { ttl })
      this.addToTags(cacheKey, tags)
      
      // Set in L2 cache (Redis)
      if (this.redisClient) {
        try {
          await this.redisClient.setex(
            cacheKey,
            Math.ceil(ttl / 1000),
            JSON.stringify(entry)
          )
        } catch (error) {
          console.error('Redis set error:', error)
        }
      }
      
      this.stats.sets++
      this.stats.itemCount = this.memoryCache.size
      this.stats.size = this.memoryCache.calculatedSize ?? 0
    } catch (error) {
      console.error('Cache set error:', error)
      throw error
    }
  }
  
  /**
   * Delete from cache
   */
  async delete(key: string): Promise<boolean> {
    const cacheKey = this.generateKey(key)
    
    // Get entry for tag cleanup
    const entry = this.memoryCache.get(cacheKey)
    if (entry) {
      this.removeFromTags(cacheKey, entry.metadata.tags)
    }
    
    // Delete from L1 cache
    const deleted = this.memoryCache.delete(cacheKey)
    
    // Delete from L2 cache (Redis)
    if (this.redisClient) {
      try {
        await this.redisClient.del(cacheKey)
      } catch (error) {
        console.error('Redis delete error:', error)
      }
    }
    
    if (deleted) {
      this.stats.deletes++
      this.stats.itemCount = this.memoryCache.size
      this.stats.size = this.memoryCache.calculatedSize ?? 0
    }
    
    return deleted
  }
  
  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    const keysToDelete = new Set<string>()
    
    tags.forEach(tag => {
      const keys = this.tagMap.get(tag)
      if (keys) {
        keys.forEach(key => keysToDelete.add(key))
      }
    })
    
    let deletedCount = 0
    for (const key of keysToDelete) {
      if (await this.delete(key)) {
        deletedCount++
      }
    }
    
    return deletedCount
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    this.tagMap.clear()
    
    if (this.redisClient) {
      try {
        await this.redisClient.flushdb()
      } catch (error) {
        console.error('Redis clear error:', error)
      }
    }
    
    this.stats.itemCount = 0
    this.stats.size = 0
  }
  
  /**
   * Get or set cache (memoization helper)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    config?: CacheConfig
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    // Generate fresh data
    const data = await factory()
    
    // Cache the result
    await this.set(key, data, config)
    
    return data
  }
  
  /**
   * Wrap function with caching
   */
  memoize<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config?: CacheConfig & { keyGenerator?: (...args: Parameters<T>) => string }
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = config?.keyGenerator
        ? config.keyGenerator(...args)
        : this.generateKey({ fn: fn.name, args })
      
      return await this.getOrSet(key, () => fn(...args), config)
    }) as T
  }
  
  /**
   * Check if data should be compressed
   */
  private shouldCompress(data: any): boolean {
    const size = this.calculateSize(data)
    return size > 1024 // Compress if larger than 1KB
  }
  
  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }
  
  /**
   * Warm up cache
   */
  async warmUp(entries: Array<{ key: string; factory: () => Promise<any>; config?: CacheConfig }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, factory, config }) =>
        this.getOrSet(key, factory, config).catch(error =>
          console.error(`Cache warm-up failed for key ${key}:`, error)
        )
      )
    )
  }
  
  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    if (typeof setInterval === 'undefined') return
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.memoryCache.purgeStale()
      this.stats.itemCount = this.memoryCache.size
      this.stats.size = this.memoryCache.calculatedSize ?? 0
    }, 60 * 1000)
    
    // Log stats every 5 minutes in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        console.log('Cache stats:', this.getStats())
      }, 5 * 60 * 1000)
    }
  }
}

/**
 * Edge caching with Cloudflare Workers KV or Vercel Edge Config
 */
export class EdgeCache {
  private static instance: EdgeCache
  private kvNamespace: any = null
  
  private constructor() {
    this.initEdgeStorage()
  }
  
  static getInstance(): EdgeCache {
    if (!EdgeCache.instance) {
      EdgeCache.instance = new EdgeCache()
    }
    return EdgeCache.instance
  }
  
  private async initEdgeStorage(): Promise<void> {
    // Initialize based on deployment platform
    if (process.env.CF_ACCOUNT_ID && process.env.CF_KV_NAMESPACE_ID) {
      // Cloudflare Workers KV
      try {
        // This would be initialized in the edge runtime
        console.log('Edge caching ready for Cloudflare Workers KV')
      } catch (error) {
        console.error('Failed to initialize Cloudflare KV:', error)
      }
    } else if (process.env.EDGE_CONFIG) {
      // Vercel Edge Config
      try {
        const { get } = await import('@vercel/edge-config')
        console.log('Edge caching ready for Vercel Edge Config')
      } catch (error) {
        console.error('Failed to initialize Vercel Edge Config:', error)
      }
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (process.env.CF_KV_NAMESPACE_ID) {
      // Cloudflare Workers KV implementation
      // This would run in the edge runtime
      return null
    } else if (process.env.EDGE_CONFIG) {
      // Vercel Edge Config implementation
      try {
        const { get } = await import('@vercel/edge-config')
        return await get(key) as T
      } catch {
        return null
      }
    }
    return null
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Edge caching set operations would be handled through API or build process
    console.log(`Edge cache set: ${key}`)
  }
}

/**
 * Query result caching decorator
 */
export function CacheResult(config?: CacheConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const cache = CacheService.getInstance()
    
    descriptor.value = async function (...args: any[]) {
      const key = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`
      
      return await cache.getOrSet(
        key,
        () => originalMethod.apply(this, args),
        config
      )
    }
    
    return descriptor
  }
}

/**
 * Invalidate cache decorator
 */
export function InvalidateCache(tags: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const cache = CacheService.getInstance()
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)
      await cache.invalidateByTags(tags)
      return result
    }
    
    return descriptor
  }
}

// Export singleton instances
export const cache = CacheService.getInstance()
export const edgeCache = EdgeCache.getInstance()

// Export cache utilities
export const cacheUtils = {
  /**
   * Create cache key from request
   */
  createRequestKey(req: Request): string {
    const url = new URL(req.url)
    const method = req.method
    const params = url.searchParams.toString()
    const body = req.body ? JSON.stringify(req.body) : ''
    
    return createHash('sha256')
      .update(`${method}:${url.pathname}:${params}:${body}`)
      .digest('hex')
  },
  
  /**
   * Parse cache control header
   */
  parseCacheControl(header: string): Record<string, string | boolean> {
    const directives: Record<string, string | boolean> = {}
    
    header.split(',').forEach(directive => {
      const [key, value] = directive.trim().split('=')
      directives[key] = value || true
    })
    
    return directives
  },
  
  /**
   * Check if response is cacheable
   */
  isCacheable(response: Response): boolean {
    const cacheControl = response.headers.get('cache-control')
    if (!cacheControl) return false
    
    const directives = this.parseCacheControl(cacheControl)
    
    return !directives['no-store'] &&
           !directives['private'] &&
           response.status >= 200 &&
           response.status < 300
  }
}