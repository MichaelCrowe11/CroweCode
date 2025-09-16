/**
 * Enhanced Middleware for CroweCode Platform
 * Handles JWT authentication, security headers, and request validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = new Set<string>([
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/public',
]);

// Public pages that don't require authentication  
const PUBLIC_PAGES = new Set<string>([
  '/',
  '/login', 
  '/register',
  '/about',
  '/pricing',
  '/docs',
]);

/**
 * Verify JWT token using jose (Edge runtime compatible)
 */
async function verifyJWT(token: string): Promise<any> {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return null;
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Apply comprehensive security headers
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Core security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS in production only
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Monaco editor needs unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:", // AI APIs and WebSocket
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  
  // Request tracking
  response.headers.set('x-request-id', crypto.randomUUID());
  response.headers.set('x-powered-by', 'CroweCode Platform');
  
  return response;
}

/**
 * Enhanced rate limiting and security checks
 */
function isRateLimited(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Block malicious user agents
  const maliciousAgents = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'metasploit', 'burp',
    'owasp', 'dirbuster', 'gobuster', 'wfuzz', 'wpscan'
  ];
  
  if (maliciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    console.warn(`Blocked malicious agent from ${ip}: ${userAgent}`);
    return true;
  }
  
  // Block empty user agents (likely bots)
  if (!userAgent.trim()) {
    console.warn(`Blocked empty user agent from ${ip}`);
    return true;
  }
  
  // Additional suspicious patterns
  const suspiciousPatterns = [
    /wget|curl/i, // Command line tools (unless explicitly allowed)
    /python-requests|php/i, // Scripting tools
    /bot|crawler|spider/i, // Exclude legitimate bots if needed
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    console.warn(`Blocked suspicious pattern from ${ip}: ${userAgent}`);
    return true;
  }
  
  return false;
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    response.headers.set('Access-Control-Max-Age', '86400');
    return applySecurityHeaders(response);
  }

  // Rate limiting and security checks
  if (isRateLimited(request)) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Access denied',
        code: 'RATE_LIMITED',
        message: 'Request blocked by security policy'
      }), 
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Handle API routes
  if (pathname.startsWith('/api')) {
    // Check if this is a public API route
    const isPublicAPI = Array.from(PUBLIC_API_ROUTES).some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );
    
    if (isPublicAPI) {
      const response = NextResponse.next();
      return applySecurityHeaders(response);
    }

    // Extract JWT token
    const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const cookieToken = request.cookies.get('token')?.value;
    const token = bearerToken || cookieToken;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          message: 'Please provide a valid authentication token'
        }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="CroweCode API"'
          }
        }
      );
    }

    // Verify JWT token
    const payload = await verifyJWT(token);
    if (!payload) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
          message: 'The provided authentication token is invalid or expired'
        }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="CroweCode API"'
          }
        }
      );
    }

    // Add user context to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    requestHeaders.set('x-user-email', payload.email as string || '');
    requestHeaders.set('x-user-role', payload.role as string || 'USER');
    requestHeaders.set('x-user-verified', payload.emailVerified ? 'true' : 'false');

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return applySecurityHeaders(response);
  }

  // Handle page routes  
  const isPublicPage = Array.from(PUBLIC_PAGES).some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicPage) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // Protected pages - require authentication
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token for page access
  const payload = await verifyJWT(token);
  if (!payload) {
    // Clear invalid token and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // User is authenticated - continue with security headers
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/api/:path*',
    '/trpc/:path*',
    '/',
    '/login',
    '/register',
    '/ide',
    '/ide/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/settings',
    '/settings/:path*',
  ],
};