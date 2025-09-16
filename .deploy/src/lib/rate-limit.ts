// src/lib/rate-limit.ts - Advanced rate limiting for CroweCode platform
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Different rate limits for different types of operations
export const rateLimits = {
  // API endpoints - per user per minute
  api: new Ratelimit({
    redis: process.env.REDIS_URL ? Redis.fromEnv() : new Map(),
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'crowecode:api',
  }),

  // AI operations - more restrictive (expensive operations)
  ai: new Ratelimit({
    redis: process.env.REDIS_URL ? Redis.fromEnv() : new Map(),
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'crowecode:ai',
  }),

  // File operations - moderate limits
  files: new Ratelimit({
    redis: process.env.REDIS_URL ? Redis.fromEnv() : new Map(),
    limiter: Ratelimit.slidingWindow(50, '1 m'),
    analytics: true,
    prefix: 'crowecode:files',
  }),

  // Terminal operations - very restrictive (security sensitive)
  terminal: new Ratelimit({
    redis: process.env.REDIS_URL ? Redis.fromEnv() : new Map(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'crowecode:terminal',
  }),

  // Authentication attempts - strict limits
  auth: new Ratelimit({
    redis: process.env.REDIS_URL ? Redis.fromEnv() : new Map(),
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
    analytics: true,
    prefix: 'crowecode:auth',
  }),

  // Global rate limit per IP - prevent abuse
  global: new Ratelimit({
    redis: process.env.REDIS_URL ? Redis.fromEnv() : new Map(),
    limiter: Ratelimit.slidingWindow(200, '1 m'),
    analytics: true,
    prefix: 'crowecode:global',
  }),
};

/**
 * Get rate limit identifier based on user and request context
 */
export function getRateLimitId(
  request: Request,
  userId?: string,
  type: 'user' | 'ip' | 'mixed' = 'mixed'
): string {
  const ip = getClientIP(request);
  
  switch (type) {
    case 'user':
      return userId || ip; // Fallback to IP if no user
    case 'ip':
      return ip;
    case 'mixed':
    default:
      return userId ? `user:${userId}` : `ip:${ip}`;
  }
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;
  
  // Try different headers that might contain the real IP
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip', 
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded', 
    'forwarded'
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can be a comma-separated list, take the first one
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback - this might not work in all environments
  return 'unknown';
}

/**
 * Validate if a string is a valid IP address
 */
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Check multiple rate limits and return the most restrictive result
 */
export async function checkRateLimits(
  request: Request,
  userId?: string,
  limitTypes: Array<keyof typeof rateLimits> = ['global', 'api']
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  restrictedBy?: string;
}> {
  const results = [];

  for (const limitType of limitTypes) {
    const rateLimit = rateLimits[limitType];
    const identifier = getRateLimitId(request, userId);
    
    try {
      const result = await rateLimit.limit(identifier);
      results.push({
        ...result,
        type: limitType
      });

      // If any rate limit fails, return immediately
      if (!result.success) {
        return {
          success: false,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          restrictedBy: limitType
        };
      }
    } catch (error) {
      console.error(`Rate limit check failed for ${limitType}:`, error);
      // In case of error, allow the request but log it
      continue;
    }
  }

  // All rate limits passed, return the most restrictive remaining count
  const mostRestrictive = results.reduce((prev, current) => 
    (current.remaining < prev.remaining) ? current : prev
  );

  return {
    success: true,
    limit: mostRestrictive?.limit,
    remaining: mostRestrictive?.remaining,
    reset: mostRestrictive?.reset,
  };
}

/**
 * Get rate limit headers to include in responses
 */
export function getRateLimitHeaders(result: {
  limit?: number;
  remaining?: number;
  reset?: number;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (result.limit !== undefined) {
    headers['X-RateLimit-Limit'] = result.limit.toString();
  }
  if (result.remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = result.remaining.toString();
  }
  if (result.reset !== undefined) {
    headers['X-RateLimit-Reset'] = new Date(result.reset).toISOString();
  }

  return headers;
}

/**
 * Role-based rate limit multipliers
 */
export function getRoleLimitMultiplier(role?: string): number {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 5.0; // 5x normal limits
    case 'MANAGER':
      return 3.0; // 3x normal limits  
    case 'OPERATOR':
      return 2.0; // 2x normal limits
    case 'USER':
      return 1.0; // Normal limits
    case 'VIEWER':
      return 0.5; // Half limits
    default:
      return 0.25; // Quarter limits for unauthenticated
  }
}

/**
 * Advanced rate limiting with role-based adjustments
 */
export async function advancedRateLimit(
  request: Request,
  userId?: string,
  userRole?: string,
  limitType: keyof typeof rateLimits = 'api'
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}> {
  const rateLimit = rateLimits[limitType];
  const identifier = getRateLimitId(request, userId);
  const multiplier = getRoleLimitMultiplier(userRole);
  
  try {
    const result = await rateLimit.limit(identifier);
    
    // Apply role-based adjustment to remaining count
    const adjustedRemaining = Math.floor(result.remaining * multiplier);
    const adjustedLimit = Math.floor(result.limit * multiplier);
    
    const finalResult = {
      success: result.success && adjustedRemaining > 0,
      limit: adjustedLimit,
      remaining: Math.max(0, adjustedRemaining),
      reset: result.reset,
    };

    return {
      ...finalResult,
      headers: getRateLimitHeaders(finalResult),
    };

  } catch (error) {
    console.error(`Advanced rate limit check failed:`, error);
    
    // Fallback - allow request but with minimal limits
    return {
      success: true,
      limit: 10,
      remaining: 5,
      reset: Date.now() + 60000,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '5',
        'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
      },
    };
  }
}

/**
 * Create a rate limiting middleware for API routes
 */
export function createRateLimitMiddleware(
  limitType: keyof typeof rateLimits = 'api',
  options?: {
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request) => boolean;
    message?: string;
  }
) {
  return async (request: Request, userId?: string, userRole?: string) => {
    // Check if we should skip rate limiting
    if (options?.skip?.(request)) {
      return null; // Skip rate limiting
    }

    const result = await advancedRateLimit(request, userId, userRole, limitType);
    
    if (!result.success) {
      const error = new Response(
        JSON.stringify({
          error: options?.message || 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          message: `Too many requests. Limit: ${result.limit}, Reset: ${new Date(result.reset).toISOString()}`,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            ...result.headers,
          },
        }
      );
      return error;
    }

    return result.headers; // Return headers to be added to successful response
  };
}