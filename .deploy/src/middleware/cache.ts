/**
 * Caching Middleware for Crowe Logic Platform
 * Implements multiple caching strategies for optimal performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import crypto from 'crypto';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false
});

// Cache configuration
export const cacheConfig = {
  // Cache TTL in seconds for different route patterns
  ttl: {
    static: 86400,      // 24 hours for static assets
    api: 300,           // 5 minutes for API responses
    page: 3600,         // 1 hour for rendered pages
    search: 600,        // 10 minutes for search results
    analytics: 60,      // 1 minute for analytics data
  },
  
  // Routes to cache
  patterns: {
    static: /\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|css|js)$/i,
    api: /^\/api\/(data|analytics|reports)/,
    page: /^\/(agriculture|ml-lab|substrate|analytics)/,
    search: /^\/api\/search/,
  },
  
  // Cache key prefixes
  prefix: {
    page: 'page:',
    api: 'api:',
    etag: 'etag:',
    user: 'user:'
  }
};

/**
 * Generate cache key based on request
 */
export function generateCacheKey(request: NextRequest, prefix: string = ''): string {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();
  
  // Include user ID if authenticated
  const userId = request.headers.get('x-user-id') || 'anonymous';
  
  // Create cache key
  const keyParts = [
    prefix,
    method,
    pathname,
    searchParams,
    userId
  ].filter(Boolean).join(':');
  
  // Hash long keys
  if (keyParts.length > 200) {
    return prefix + crypto.createHash('sha256').update(keyParts).digest('hex');
  }
  
  return keyParts;
}

/**
 * Generate ETag for content
 */
export function generateETag(content: string | Buffer): string {
  return crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
}

/**
 * Check if request is cacheable
 */
export function isCacheable(request: NextRequest): boolean {
  // Only cache GET and HEAD requests
  if (!['GET', 'HEAD'].includes(request.method)) {
    return false;
  }
  
  // Don't cache authenticated requests by default
  const hasAuth = request.headers.get('authorization');
  if (hasAuth) {
    return false;
  }
  
  // Don't cache requests with specific headers
  const nocache = request.headers.get('cache-control')?.includes('no-cache');
  if (nocache) {
    return false;
  }
  
  return true;
}

/**
 * Get cache TTL for request
 */
export function getCacheTTL(request: NextRequest): number {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check patterns
  for (const [type, pattern] of Object.entries(cacheConfig.patterns)) {
    if (pattern.test(pathname)) {
      return cacheConfig.ttl[type as keyof typeof cacheConfig.ttl];
    }
  }
  
  // Default TTL
  return 60; // 1 minute
}

/**
 * Cache middleware
 */
export async function cacheMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Check if request is cacheable
  if (!isCacheable(request)) {
    return handler();
  }
  
  const cacheKey = generateCacheKey(request, cacheConfig.prefix.page);
  
  try {
    // Check cache
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      // Parse cached response
      const { body, headers, status } = JSON.parse(cached);
      
      // Check ETag
      const etag = headers['etag'];
      const clientEtag = request.headers.get('if-none-match');
      
      if (etag && clientEtag === etag) {
        // Return 304 Not Modified
        return new NextResponse(null, {
          status: 304,
          headers: {
            'etag': etag,
            'x-cache': 'HIT',
            'cache-control': `public, max-age=${getCacheTTL(request)}`
          }
        });
      }
      
      // Return cached response
      const response = new NextResponse(body, {
        status,
        headers: {
          ...headers,
          'x-cache': 'HIT',
          'x-cache-key': cacheKey
        }
      });
      
      return response;
    }
  } catch (error) {
    console.error('Cache read error:', error);
    // Continue without cache on error
  }
  
  // Execute handler
  const response = await handler();
  
  // Cache successful responses
  if (response.status >= 200 && response.status < 300) {
    try {
      const body = await response.text();
      const etag = generateETag(body);
      const ttl = getCacheTTL(request);
      
      // Prepare cache data
      const cacheData = {
        body,
        headers: {
          'content-type': response.headers.get('content-type'),
          'etag': etag,
        },
        status: response.status
      };
      
      // Store in cache
      await redis.setex(
        cacheKey,
        ttl,
        JSON.stringify(cacheData)
      );
      
      // Return response with cache headers
      return new NextResponse(body, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'etag': etag,
          'cache-control': `public, max-age=${ttl}`,
          'x-cache': 'MISS',
          'x-cache-key': cacheKey
        }
      });
    } catch (error) {
      console.error('Cache write error:', error);
      // Return original response on cache error
      return response;
    }
  }
  
  return response;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string | RegExp): Promise<number> {
  try {
    const keys = await redis.keys(
      typeof pattern === 'string' ? pattern : '*'
    );
    
    if (keys.length === 0) {
      return 0;
    }
    
    // Filter by regex if provided
    const keysToDelete = typeof pattern === 'string'
      ? keys
      : keys.filter(key => pattern.test(key));
    
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
    
    return keysToDelete.length;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Warm up cache with critical routes
 */
export async function warmupCache(baseUrl: string) {
  const criticalRoutes = [
    '/',
    '/agriculture',
    '/ml-lab',
    '/substrate',
    '/api/health'
  ];
  
  console.log('Warming up cache...');
  
  for (const route of criticalRoutes) {
    try {
      const response = await fetch(`${baseUrl}${route}`);
      if (response.ok) {
        console.log(`✓ Cached: ${route}`);
      }
    } catch (error) {
      console.error(`✗ Failed to cache ${route}:`, error);
    }
  }
  
  console.log('Cache warmup complete');
}

/**
 * Cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number;
  memory: string;
  hits: number;
  misses: number;
  hitRate: number;
}> {
  try {
    const info = await redis.info('memory');
    const stats = await redis.info('stats');
    
    // Parse Redis info
    const memoryUsed = info.match(/used_memory_human:(.+)/)?.[1] || '0';
    const keyspaceHits = parseInt(stats.match(/keyspace_hits:(\d+)/)?.[1] || '0');
    const keyspaceMisses = parseInt(stats.match(/keyspace_misses:(\d+)/)?.[1] || '0');
    
    const dbsize = await redis.dbsize();
    const total = keyspaceHits + keyspaceMisses;
    const hitRate = total > 0 ? (keyspaceHits / total) * 100 : 0;
    
    return {
      keys: dbsize,
      memory: memoryUsed,
      hits: keyspaceHits,
      misses: keyspaceMisses,
      hitRate: Math.round(hitRate * 100) / 100
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      keys: 0,
      memory: '0',
      hits: 0,
      misses: 0,
      hitRate: 0
    };
  }
}

/**
 * Response caching decorator for API routes
 */
export function withCache(ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [request] = args;
      const cacheKey = generateCacheKey(request, cacheConfig.prefix.api);
      
      // Try to get from cache
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json(JSON.parse(cached), {
            headers: {
              'x-cache': 'HIT',
              'cache-control': `public, max-age=${ttl}`
            }
          });
        }
      } catch (error) {
        console.error('Cache error:', error);
      }
      
      // Call original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      if (result.status >= 200 && result.status < 300) {
        try {
          const data = await result.json();
          await redis.setex(cacheKey, ttl, JSON.stringify(data));
        } catch (error) {
          console.error('Cache write error:', error);
        }
      }
      
      return result;
    };
    
    return descriptor;
  };
}
