import { createClient } from 'redis'
import { siteConfig } from '@/config/site'

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached')
            return false
          }
          return Math.min(retries * 100, 3000)
        }
      }
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      console.log('Redis: Connected successfully')
    })

    await redisClient.connect()
  }

  return redisClient
}

// Cache wrapper with automatic serialization
export class Cache {
  private static instance: Cache
  private client: ReturnType<typeof createClient> | null = null
  private defaultTTL = 3600 // 1 hour

  private constructor() {}

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache()
    }
    return Cache.instance
  }

  async initialize() {
    if (!this.client) {
      this.client = await getRedisClient()
    }
    return this
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) await this.initialize()
      const data = await this.client!.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.client) await this.initialize()
      await this.client!.setEx(
        key,
        ttl || this.defaultTTL,
        JSON.stringify(value)
      )
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.client) await this.initialize()
      await this.client!.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async flush(): Promise<void> {
    try {
      if (!this.client) await this.initialize()
      await this.client!.flushAll()
    } catch (error) {
      console.error('Cache flush error:', error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) await this.initialize()
      const result = await this.client!.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  // Pattern-based key deletion
  async delPattern(pattern: string): Promise<void> {
    try {
      if (!this.client) await this.initialize()
      const keys = await this.client!.keys(pattern)
      if (keys.length > 0) {
        await this.client!.del(keys)
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
    }
  }

  // Get or set with callback
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const fresh = await callback()
    await this.set(key, fresh, ttl)
    return fresh
  }
}

// Export singleton instance
export const cache = Cache.getInstance()

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  session: (token: string) => `session:${token}`,
  project: (id: string) => `project:${id}`,
  file: (projectId: string, path: string) => `file:${projectId}:${path}`,
  aiResponse: (prompt: string) => `ai:${Buffer.from(prompt).toString('base64').slice(0, 50)}`,
  githubRepo: (owner: string, repo: string) => `github:${owner}:${repo}`,
  analytics: (userId: string, date: string) => `analytics:${userId}:${date}`,
  rateLimit: (ip: string) => `ratelimit:${ip}`,
  search: (query: string) => `search:${Buffer.from(query).toString('base64').slice(0, 30)}`
}

// Cache middleware for Next.js API routes
export function withCache(
  handler: Function,
  options: {
    key?: string | ((req: any) => string)
    ttl?: number
    skip?: (req: any) => boolean
  } = {}
) {
  return async (req: any, res: any) => {
    // Skip caching if condition is met
    if (options.skip && options.skip(req)) {
      return handler(req, res)
    }

    // Generate cache key
    const cacheKey = typeof options.key === 'function'
      ? options.key(req)
      : options.key || `api:${req.url}:${JSON.stringify(req.query)}`

    // Try to get from cache
    const cached = await cache.get(cacheKey)
    if (cached) {
      res.setHeader('X-Cache', 'HIT')
      return res.status(200).json(cached)
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res)
    res.json = (data: any) => {
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, options.ttl)
      }
      res.setHeader('X-Cache', 'MISS')
      return originalJson(data)
    }

    return handler(req, res)
  }
}