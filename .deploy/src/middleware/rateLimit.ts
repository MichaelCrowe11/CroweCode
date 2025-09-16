/**
 * Rate Limiting Middleware for Crowe Logic Platform
 * Prevents API abuse and ensures fair usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

export interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

/**
 * Default rate limit configurations for different endpoints
 */
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // General API rate limit
  default: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100
  },
  
  // Strict limit for AI endpoints
  ai: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 20,
    message: 'Too many AI requests, please slow down'
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts'
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,
    message: 'Upload rate limit exceeded'
  },
  
  // Database write operations
  write: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 50
  },
  
  // Read-heavy endpoints
  read: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 200
  }
};

/**
 * Generate rate limit key based on request
 */
function generateKey(request: NextRequest, prefix: string = 'ratelimit'): string {
  // Try to get user identifier in order of preference
  const userId = request.headers.get('x-user-id');
  const apiKey = request.headers.get('x-api-key');
  const authToken = request.cookies.get('auth-token')?.value;
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Use most specific identifier available
  const identifier = userId || apiKey || authToken || ip;
  const endpoint = new URL(request.url).pathname;
  
  return `${prefix}:${endpoint}:${identifier}`;
}

/**
 * Check if request exceeds rate limit
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.default
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = config.keyGenerator?.(request) || generateKey(request);
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  try {
    // Use Redis sorted set to track requests with timestamps
    const pipeline = redis.pipeline();
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) {
      // Redis error, allow request but log
      console.error('Rate limit check failed, allowing request');
      return { allowed: true, remaining: config.maxRequests, resetAt: new Date(now + config.windowMs) };
    }
    
    const count = (results[1]?.[1] as number) || 0;
    const allowed = count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count - 1);
    const resetAt = new Date(now + config.windowMs);
    
    // If over limit, remove the request we just added
    if (!allowed) {
      await redis.zrem(key, `${now}-${Math.random()}`);
    }
    
    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow request but log for monitoring
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(now + config.windowMs) };
  }
}

/**
 * Rate limit middleware
 */
export async function rateLimit(
  request: NextRequest,
  configName: string = 'default'
): Promise<NextResponse | null> {
  const config = rateLimitConfigs[configName] || rateLimitConfigs.default;
  const { allowed, remaining, resetAt } = await checkRateLimit(request, config);
  
  if (!allowed) {
    const response = NextResponse.json(
      {
        error: config.message || 'Rate limit exceeded',
        retryAfter: resetAt.toISOString()
      },
      { status: 429 }
    );
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', resetAt.toISOString());
    response.headers.set('Retry-After', Math.ceil((resetAt.getTime() - Date.now()) / 1000).toString());
    
    return response;
  }
  
  // Request allowed, return null to continue
  return null;
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  limit: number,
  resetAt: Date
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetAt.toISOString());
  
  return response;
}

/**
 * Sliding window rate limiter for more accurate limiting
 */
export class SlidingWindowRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private prefix: string;

  constructor(windowMs: number, maxRequests: number, prefix: string = 'sliding') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.prefix = prefix;
  }

  async isAllowed(identifier: string): Promise<boolean> {
    const now = Date.now();
    const key = `${this.prefix}:${identifier}`;
    const previousWindow = `${key}:prev`;
    const currentWindow = `${key}:curr`;
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    
    try {
      const pipeline = redis.pipeline();
      
      // Get counts from previous and current windows
      pipeline.get(previousWindow);
      pipeline.get(currentWindow);
      
      const results = await pipeline.exec();
      const prevCount = parseInt(results?.[0]?.[1] as string || '0');
      const currCount = parseInt(results?.[1]?.[1] as string || '0');
      
      // Calculate weighted count
      const windowProgress = (now - windowStart) / this.windowMs;
      const weightedCount = prevCount * (1 - windowProgress) + currCount;
      
      if (weightedCount >= this.maxRequests) {
        return false;
      }
      
      // Increment current window counter
      const multi = redis.multi();
      multi.incr(currentWindow);
      multi.expire(currentWindow, Math.ceil(this.windowMs / 1000) * 2);
      
      // Rotate windows if needed
      if (now - windowStart > this.windowMs) {
        multi.rename(currentWindow, previousWindow);
        multi.del(currentWindow);
      }
      
      await multi.exec();
      return true;
    } catch (error) {
      console.error('Sliding window rate limit error:', error);
      return true; // Allow on error
    }
  }
}

/**
 * Distributed rate limiter using token bucket algorithm
 */
export class TokenBucketRateLimiter {
  private capacity: number;
  private refillRate: number;
  private prefix: string;

  constructor(capacity: number, refillRate: number, prefix: string = 'bucket') {
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per second
    this.prefix = prefix;
  }

  async consume(identifier: string, tokens: number = 1): Promise<boolean> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    
    try {
      // Lua script for atomic token bucket operations
      const luaScript = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local tokens_requested = tonumber(ARGV[4])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local current_tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now
        
        -- Calculate tokens to add based on time elapsed
        local time_elapsed = (now - last_refill) / 1000
        local tokens_to_add = time_elapsed * refill_rate
        current_tokens = math.min(capacity, current_tokens + tokens_to_add)
        
        if current_tokens >= tokens_requested then
          current_tokens = current_tokens - tokens_requested
          redis.call('HMSET', key, 'tokens', current_tokens, 'last_refill', now)
          redis.call('EXPIRE', key, 3600)
          return 1
        else
          redis.call('HMSET', key, 'tokens', current_tokens, 'last_refill', now)
          redis.call('EXPIRE', key, 3600)
          return 0
        end
      `;
      
      const result = await redis.eval(
        luaScript,
        1,
        key,
        this.capacity,
        this.refillRate,
        now,
        tokens
      ) as number;
      
      return result === 1;
    } catch (error) {
      console.error('Token bucket error:', error);
      return true; // Allow on error
    }
  }
}
