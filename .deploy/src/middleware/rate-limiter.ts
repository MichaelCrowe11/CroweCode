import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'
import { createHash } from 'crypto'

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  handler?: (req: NextRequest) => NextResponse
}

// Default configurations for different endpoints
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - stricter limits
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later'
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later'
  },
  '/api/auth/reset-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later'
  },
  
  // AI endpoints - prevent abuse
  '/api/ai': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'AI request limit exceeded, please wait before trying again'
  },
  '/api/ai/chat': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Chat request limit exceeded, please slow down'
  },
  
  // Database operations - moderate limits
  '/api/oracle': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Database query limit exceeded'
  },
  '/api/database': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Database operation limit exceeded'
  },
  
  // File operations - stricter for uploads
  '/api/files/upload': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'File upload limit exceeded'
  },
  '/api/files': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'File operation limit exceeded'
  },
  
  // Default for all other API endpoints
  'default': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Rate limit exceeded, please try again later'
  }
}

// Store for tracking requests
interface RequestRecord {
  count: number
  resetTime: number
  firstRequest: number
  blocked: boolean
}

// LRU cache for efficient memory usage
const requestStore = new LRUCache<string, RequestRecord>({
  max: 10000, // Maximum number of keys to store
  ttl: 60 * 60 * 1000, // 1 hour TTL
  updateAgeOnGet: false,
  updateAgeOnHas: false
})

// Distributed rate limiting (for production with Redis)
class DistributedRateLimiter {
  private static instance: DistributedRateLimiter
  private redisClient: any = null
  
  private constructor() {
    // Initialize Redis client if available
    if (process.env.REDIS_URL) {
      this.initRedis()
    }
  }
  
  static getInstance(): DistributedRateLimiter {
    if (!this.instance) {
      this.instance = new DistributedRateLimiter()
    }
    return this.instance
  }
  
  private async initRedis() {
    try {
      const { Redis } = await import('ioredis')
      this.redisClient = new Redis(process.env.REDIS_URL!)
    } catch (error) {
      console.error('Redis initialization failed:', error)
    }
  }
  
  async increment(key: string, windowMs: number): Promise<number> {
    if (!this.redisClient) {
      // Fallback to local storage
      return this.incrementLocal(key, windowMs)
    }
    
    try {
      const multi = this.redisClient.multi()
      const now = Date.now()
      const window = Math.floor(now / windowMs)
      const redisKey = `rate_limit:${key}:${window}`
      
      multi.incr(redisKey)
      multi.expire(redisKey, Math.ceil(windowMs / 1000))
      
      const results = await multi.exec()
      return results[0][1] as number
    } catch (error) {
      console.error('Redis rate limit error:', error)
      return this.incrementLocal(key, windowMs)
    }
  }
  
  private incrementLocal(key: string, windowMs: number): number {
    const now = Date.now()
    const record = requestStore.get(key) || {
      count: 0,
      resetTime: now + windowMs,
      firstRequest: now,
      blocked: false
    }
    
    if (now > record.resetTime) {
      // Reset the window
      record.count = 1
      record.resetTime = now + windowMs
      record.firstRequest = now
      record.blocked = false
    } else {
      record.count++
    }
    
    requestStore.set(key, record)
    return record.count
  }
  
  async isBlocked(key: string): Promise<boolean> {
    const record = requestStore.get(key)
    return record?.blocked || false
  }
  
  async block(key: string, duration: number): Promise<void> {
    const record = requestStore.get(key)
    if (record) {
      record.blocked = true
      record.resetTime = Date.now() + duration
      requestStore.set(key, record)
    }
  }
}

// Generate unique key for rate limiting
function generateKey(req: NextRequest, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req)
  }
  
  // Default key generation strategy
  const components: string[] = []
  
  // IP address (handle various proxy headers)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') || // Cloudflare
             req.ip ||
             'unknown'
  components.push(ip)
  
  // User ID if authenticated
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    const tokenHash = createHash('sha256').update(authHeader).digest('hex').substring(0, 8)
    components.push(tokenHash)
  }
  
  // API endpoint
  const { pathname } = new URL(req.url)
  components.push(pathname)
  
  // User agent fingerprint
  const userAgent = req.headers.get('user-agent')
  if (userAgent) {
    const uaHash = createHash('sha256').update(userAgent).digest('hex').substring(0, 8)
    components.push(uaHash)
  }
  
  return components.join(':')
}

// Get rate limit configuration for endpoint
function getConfig(pathname: string): RateLimitConfig {
  // Check for exact match
  if (RATE_LIMIT_CONFIGS[pathname]) {
    return RATE_LIMIT_CONFIGS[pathname]
  }
  
  // Check for pattern match
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config
    }
  }
  
  // Return default config
  return RATE_LIMIT_CONFIGS.default
}

// Main rate limiting middleware
export async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = new URL(req.url)
  
  // Skip rate limiting for non-API routes
  if (!pathname.startsWith('/api')) {
    return null
  }
  
  // Skip for health checks
  if (pathname === '/api/health' || pathname === '/api/metrics') {
    return null
  }
  
  const config = getConfig(pathname)
  const key = generateKey(req, config)
  const limiter = DistributedRateLimiter.getInstance()
  
  // Check if the key is blocked
  if (await limiter.isBlocked(key)) {
    return createRateLimitResponse(config, 0, config.maxRequests, config.windowMs)
  }
  
  // Increment request count
  const requestCount = await limiter.increment(key, config.windowMs)
  
  // Check if limit exceeded
  if (requestCount > config.maxRequests) {
    // Block the key for extended period on severe violations
    if (requestCount > config.maxRequests * 2) {
      await limiter.block(key, config.windowMs * 2)
    }
    
    // Use custom handler if provided
    if (config.handler) {
      return config.handler(req)
    }
    
    return createRateLimitResponse(config, 0, config.maxRequests, config.windowMs)
  }
  
  // Add rate limit headers to successful responses
  const remaining = Math.max(0, config.maxRequests - requestCount)
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  headers.set('X-RateLimit-Remaining', remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString())
  
  // Continue with the request (headers will be merged in the main middleware)
  return null
}

// Create rate limit exceeded response
function createRateLimitResponse(
  config: RateLimitConfig,
  remaining: number,
  limit: number,
  windowMs: number
): NextResponse {
  const resetTime = new Date(Date.now() + windowMs)
  
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: config.message || 'Too many requests, please try again later',
      retryAfter: Math.ceil(windowMs / 1000),
      resetTime: resetTime.toISOString()
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toISOString(),
        'Retry-After': Math.ceil(windowMs / 1000).toString()
      }
    }
  )
}

// Advanced rate limiting features

// Sliding window rate limiter for more accurate limiting
export class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map()
  
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get or create window for key
    let timestamps = this.windows.get(key) || []
    
    // Remove old timestamps outside the window
    timestamps = timestamps.filter(ts => ts > windowStart)
    
    // Check if limit would be exceeded
    if (timestamps.length >= limit) {
      this.windows.set(key, timestamps)
      return false
    }
    
    // Add current timestamp and allow request
    timestamps.push(now)
    this.windows.set(key, timestamps)
    return true
  }
  
  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour
    
    for (const [key, timestamps] of this.windows.entries()) {
      const filtered = timestamps.filter(ts => ts > now - maxAge)
      if (filtered.length === 0) {
        this.windows.delete(key)
      } else {
        this.windows.set(key, filtered)
      }
    }
  }
}

// Token bucket algorithm for burst handling
export class TokenBucket {
  private buckets: Map<string, {
    tokens: number
    lastRefill: number
  }> = new Map()
  
  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {}
  
  consume(key: string, tokens: number = 1): boolean {
    const now = Date.now()
    let bucket = this.buckets.get(key)
    
    if (!bucket) {
      bucket = {
        tokens: this.capacity,
        lastRefill: now
      }
    }
    
    // Refill tokens based on time passed
    const timePassed = (now - bucket.lastRefill) / 1000
    const tokensToAdd = Math.min(
      timePassed * this.refillRate,
      this.capacity - bucket.tokens
    )
    
    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this.capacity)
    bucket.lastRefill = now
    
    // Check if we have enough tokens
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens
      this.buckets.set(key, bucket)
      return true
    }
    
    this.buckets.set(key, bucket)
    return false
  }
  
  getTokens(key: string): number {
    const bucket = this.buckets.get(key)
    if (!bucket) return this.capacity
    
    const now = Date.now()
    const timePassed = (now - bucket.lastRefill) / 1000
    const tokensToAdd = Math.min(
      timePassed * this.refillRate,
      this.capacity - bucket.tokens
    )
    
    return Math.min(bucket.tokens + tokensToAdd, this.capacity)
  }
}

// Adaptive rate limiting based on server load
export class AdaptiveRateLimiter {
  private baseLimit: number
  private currentLimit: number
  private lastAdjustment: number = Date.now()
  
  constructor(baseLimit: number) {
    this.baseLimit = baseLimit
    this.currentLimit = baseLimit
  }
  
  async adjustLimit(cpuUsage: number, memoryUsage: number, responseTime: number): Promise<void> {
    const now = Date.now()
    
    // Only adjust every 30 seconds
    if (now - this.lastAdjustment < 30000) return
    
    this.lastAdjustment = now
    
    // Calculate load factor (0-1, higher is worse)
    const loadFactor = Math.max(
      cpuUsage / 100,
      memoryUsage / 100,
      Math.min(responseTime / 1000, 1) // Cap at 1 second
    )
    
    // Adjust limit based on load
    if (loadFactor > 0.8) {
      // High load - reduce limit
      this.currentLimit = Math.max(
        Math.floor(this.baseLimit * 0.5),
        10 // Minimum limit
      )
    } else if (loadFactor > 0.6) {
      // Moderate load - slightly reduce
      this.currentLimit = Math.floor(this.baseLimit * 0.75)
    } else {
      // Low load - use base limit
      this.currentLimit = this.baseLimit
    }
  }
  
  getLimit(): number {
    return this.currentLimit
  }
}

// Export singleton instance
export const slidingWindowLimiter = new SlidingWindowRateLimiter()
export const tokenBucket = new TokenBucket(100, 10) // 100 tokens, 10 per second
export const adaptiveLimiter = new AdaptiveRateLimiter(100)

// Cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    slidingWindowLimiter.cleanup()
  }, 60 * 60 * 1000) // Run every hour
}