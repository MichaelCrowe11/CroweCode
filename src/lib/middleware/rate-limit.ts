import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  message?: string;  // Error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

// In-memory store for rate limiting (consider using Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 60000, // 1 minute default
    max = 100,        // 100 requests per window default
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = config;

  return async function rateLimitMiddleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          },
        }
      );
    }

    // Increment counter
    entry.count++;

    // Execute handler
    const response = await handler();

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', max.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // Optionally skip counting based on response status
    if (
      (skipSuccessfulRequests && response.status < 400) ||
      (skipFailedRequests && response.status >= 400)
    ) {
      entry.count--;
    }

    return response;
  };
}

/**
 * Default key generator (IP-based)
 */
function defaultKeyGenerator(req: NextRequest): string {
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  const route = req.nextUrl.pathname;

  return `${ip}:${route}`;
}

/**
 * User-based key generator (requires authenticated user)
 */
export function userKeyGenerator(userId: string): (req: NextRequest) => string {
  return (req: NextRequest) => {
    const route = req.nextUrl.pathname;
    return `user:${userId}:${route}`;
  };
}

/**
 * API key-based key generator
 */
export function apiKeyGenerator(apiKey: string): (req: NextRequest) => string {
  return (req: NextRequest) => {
    const route = req.nextUrl.pathname;
    return `api:${apiKey}:${route}`;
  };
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // Strict rate limit for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Standard API rate limit
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  }),

  // Lenient rate limit for read operations
  read: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
    skipSuccessfulRequests: true,
  }),

  // Strict rate limit for write operations
  write: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
  }),

  // AI endpoints rate limit
  ai: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'AI API rate limit exceeded. Please wait before making more requests.',
  }),
};

/**
 * Helper to apply rate limiting to API route
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter = rateLimiters.api
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    return limiter(req, () => handler(req));
  };
}