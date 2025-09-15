// src/lib/ai-cache.ts - AI Response Caching System
import { createHash } from 'crypto';

// In-memory cache (for development/simple deployments)
class MemoryCache {
  private cache = new Map<string, { value: any; timestamp: number; ttl: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Redis cache (for production)
class RedisCache {
  private redis: any;

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        const { Redis } = require('@upstash/redis');
        this.redis = Redis.fromEnv();
      } catch (error) {
        console.warn('Redis not available, falling back to memory cache');
        this.redis = null;
      }
    }
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(value));
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
  }
}

// Cache interface
interface CacheAdapter {
  set(key: string, value: any, ttl: number): Promise<void>;
  get(key: string): Promise<any | null>;
  delete(key: string): Promise<void>;
}

// Singleton cache instance
class AICache {
  private adapter: CacheAdapter;
  
  constructor() {
    this.adapter = process.env.REDIS_URL ? new RedisCache() : new MemoryCache();
  }

  /**
   * Generate cache key from prompt and context
   */
  private generateKey(prompt: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const content = `${prompt}:${contextStr}`;
    return `ai:${createHash('sha256').update(content).digest('hex').substring(0, 16)}`;
  }

  /**
   * Cache AI response with intelligent TTL based on content type
   */
  async cacheResponse(
    prompt: string, 
    response: any, 
    context?: any,
    customTTL?: number
  ): Promise<void> {
    const key = this.generateKey(prompt, context);
    
    // Determine TTL based on content type and complexity
    let ttl = customTTL;
    if (!ttl) {
      // Code generation: cache for 1 hour (stable patterns)
      if (prompt.toLowerCase().includes('generate') || prompt.toLowerCase().includes('code')) {
        ttl = 60 * 60 * 1000; // 1 hour
      }
      // Documentation: cache for 4 hours (less volatile)
      else if (prompt.toLowerCase().includes('document') || prompt.toLowerCase().includes('explain')) {
        ttl = 4 * 60 * 60 * 1000; // 4 hours
      }
      // Analysis: cache for 30 minutes (might change with code changes)
      else if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('review')) {
        ttl = 30 * 60 * 1000; // 30 minutes
      }
      // General responses: cache for 15 minutes
      else {
        ttl = 15 * 60 * 1000; // 15 minutes
      }
    }

    await this.adapter.set(key, {
      response,
      prompt: prompt.substring(0, 100), // Store truncated prompt for debugging
      timestamp: Date.now(),
      context: context ? Object.keys(context) : [],
    }, ttl);
  }

  /**
   * Get cached response if available and fresh
   */
  async getCachedResponse(prompt: string, context?: any): Promise<any | null> {
    const key = this.generateKey(prompt, context);
    const cached = await this.adapter.get(key);
    
    if (cached) {
      console.log(`AI Cache hit for key: ${key}`);
      return cached.response;
    }

    return null;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // This would require more sophisticated cache backend for pattern matching
    // For now, just log the intent
    console.log(`Would invalidate cache pattern: ${pattern}`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ hits: number; misses: number; size: number }> {
    // Placeholder - would need more sophisticated tracking
    return { hits: 0, misses: 0, size: 0 };
  }

  /**
   * Check if response should be cached based on content
   */
  shouldCache(prompt: string, response: any): boolean {
    // Don't cache error responses
    if (response.error) return false;
    
    // Don't cache very short responses (likely not useful)
    if (typeof response === 'string' && response.length < 10) return false;
    
    // Don't cache responses with personal/sensitive info
    const sensitivePatterns = [
      /api[_\s]?key/i,
      /password/i,
      /secret/i,
      /token/i,
      /credential/i,
      /personal/i,
    ];
    
    const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
    if (sensitivePatterns.some(pattern => pattern.test(responseStr))) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const aiCache = new AICache();

/**
 * Decorator for caching AI responses
 */
export function withAICache(ttl?: number) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const [prompt, ...otherArgs] = args;
      
      // Try to get from cache first
      const cached = await aiCache.getCachedResponse(prompt, { args: otherArgs });
      if (cached) {
        return cached;
      }

      // Call original method
      const response = await method.apply(this, args);

      // Cache the response if appropriate
      if (aiCache.shouldCache(prompt, response)) {
        await aiCache.cacheResponse(prompt, response, { args: otherArgs }, ttl);
      }

      return response;
    };

    return descriptor;
  };
}

/**
 * Cached AI request helper
 */
export async function cachedAIRequest(
  requestFn: () => Promise<any>,
  cacheKey: string,
  ttl: number = 30 * 60 * 1000 // 30 minutes default
): Promise<any> {
  // Try cache first
  const cached = await aiCache.getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  // Make request
  const response = await requestFn();

  // Cache if appropriate
  if (aiCache.shouldCache(cacheKey, response)) {
    await aiCache.cacheResponse(cacheKey, response, undefined, ttl);
  }

  return response;
}

/**
 * Batch cache operations
 */
export class BatchAICache {
  private operations: Array<{ key: string; value: any; ttl: number }> = [];

  add(prompt: string, response: any, context?: any, ttl?: number): void {
    if (!aiCache.shouldCache(prompt, response)) return;

    this.operations.push({
      key: prompt,
      value: { response, context },
      ttl: ttl || 30 * 60 * 1000
    });
  }

  async flush(): Promise<void> {
    const promises = this.operations.map(op => 
      aiCache.cacheResponse(op.key, op.value.response, op.value.context, op.ttl)
    );

    await Promise.allSettled(promises);
    this.operations = [];
  }
}