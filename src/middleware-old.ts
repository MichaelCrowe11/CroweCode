/**
 * Main Middleware for Crowe Logic Platform
 * Handles security headers and basic request validation
 */

import { NextRequest, NextResponse } from 'next/server';

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Only add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Add request ID for tracing
  response.headers.set('x-request-id', crypto.randomUUID());
  response.headers.set('x-powered-by', 'Crowe Logic Platform');
  
  return response;
}

/**
 * Apply CORS headers if needed
 */
function applyCORSHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  
  // Allow requests from same origin or specific origins
  const allowedOrigins = [
    'https://croweos.com',
    'https://www.croweos.com',
    'https://crowe-logic-platform.fly.dev'
  ];
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  
  return response;
}

/**
 * Simple rate limiting check
 */
function isRateLimited(request: NextRequest): boolean {
  // For now, just basic bot detection
  const userAgent = request.headers.get('user-agent') || '';
  
  // Block obvious bots
  const badAgents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'metasploit'];
  if (badAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return true;
  }
  
  return false;
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return applyCORSHeaders(request, applySecurityHeaders(response));
  }
  
  // Basic rate limiting / security check
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
  
  // Continue to the route handler
  const response = NextResponse.next();
  
  // Apply headers
  const securedResponse = applySecurityHeaders(response);
  return applyCORSHeaders(request, securedResponse);
}