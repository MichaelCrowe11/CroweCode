/**
 * Enhanced Middleware for CroweCode Platform
 * Comprehensive security, rate limiting, and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitMiddleware } from './middleware/rate-limiter'
import { verifyAccessToken } from './lib/auth-enhanced'
import { createHash } from 'crypto'

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}

// Security configuration
const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'connect-src': ["'self'", 'https://api.anthropic.com', 'https://api.openai.com', 'wss:'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  },
  
  // Allowed origins for CORS
  allowedOrigins: [
    'https://crowecode.com',
    'https://www.crowecode.com',
    'https://crowe-logic-platform.fly.dev',
    'https://crowe-logic-platform.vercel.app'
  ],
  
  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '0', // Disabled in modern browsers, CSP is preferred
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin'
  },
  
  // HSTS configuration (production only)
  hsts: 'max-age=63072000; includeSubDomains; preload',
  
  // Blocked user agents
  blockedAgents: [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'metasploit',
    'scrapy', 'curl', 'wget', 'python-requests',
    'go-http-client', 'java/', 'perl/', 'ruby/',
    'scanner', 'bot', 'spider', 'crawl'
  ],
  
  // Blocked paths
  blockedPaths: [
    '/.env', '/.git', '/.svn', '/wp-admin', '/admin',
    '/phpmyadmin', '/.htaccess', '/web.config',
    '/.aws', '/.ssh', '/config.php', '/db.php'
  ],
  
  // Request size limits
  maxBodySize: 10 * 1024 * 1024, // 10MB
  maxUrlLength: 2048,
  maxHeaderSize: 8192
}

// Request analytics
interface RequestMetrics {
  timestamp: number
  method: string
  path: string
  statusCode: number
  responseTime: number
  userAgent?: string
  ip?: string
  userId?: string
}

const requestMetrics: RequestMetrics[] = []
const MAX_METRICS = 1000

// Log request metrics
function logRequestMetrics(metrics: RequestMetrics): void {
  requestMetrics.push(metrics)
  if (requestMetrics.length > MAX_METRICS) {
    requestMetrics.shift()
  }
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production' && process.env.MONITORING_ENABLED === 'true') {
    sendToMonitoring(metrics)
  }
}

// Send metrics to monitoring service
async function sendToMonitoring(metrics: RequestMetrics): Promise<void> {
  try {
    // DataDog, New Relic, or custom monitoring
    if (process.env.DATADOG_API_KEY) {
      // await sendToDataDog(metrics)
    }
  } catch (error) {
    console.error('Failed to send metrics:', error)
  }
}

// Generate Content Security Policy header
function generateCSP(): string {
  const policies = Object.entries(SECURITY_CONFIG.csp)
    .map(([directive, values]) => {
      if (values.length === 0) return directive
      return `${directive} ${values.join(' ')}`
    })
    .join('; ')
  
  return policies
}

// Apply security headers to response
function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  // Basic security headers
  Object.entries(SECURITY_CONFIG.headers).forEach(([header, value]) => {
    response.headers.set(header, value)
  })
  
  // Content Security Policy
  if (process.env.CSP_ENABLED !== 'false') {
    response.headers.set('Content-Security-Policy', generateCSP())
  }
  
  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', SECURITY_CONFIG.hsts)
  }
  
  // Request tracking
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-powered-by', 'CroweCode Platform')
  
  // Cache control for security
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  return response
}

// Apply CORS headers
function applyCORSHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin')
  
  // In development, allow localhost
  const allowedOrigins = [...SECURITY_CONFIG.allowedOrigins]
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001'
    )
  }
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-API-Key, X-Request-ID, X-CSRF-Token'
    )
    response.headers.set('Access-Control-Max-Age', '86400')
    response.headers.set('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining')
  }
  
  return response
}

// Security checks
function performSecurityChecks(request: NextRequest): NextResponse | null {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  
  // Check for blocked paths
  if (SECURITY_CONFIG.blockedPaths.some(path => url.pathname.startsWith(path))) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }
  
  // Check for blocked user agents
  if (SECURITY_CONFIG.blockedAgents.some(agent => userAgent.includes(agent))) {
    // Allow some legitimate bots in specific cases
    const legitimateBots = ['googlebot', 'bingbot', 'slackbot', 'discordbot']
    if (!legitimateBots.some(bot => userAgent.includes(bot))) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
  }
  
  // Check URL length
  if (url.href.length > SECURITY_CONFIG.maxUrlLength) {
    return NextResponse.json(
      { error: 'URL too long' },
      { status: 414 }
    )
  }
  
  // Check for SQL injection patterns in URL
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i
  ]
  
  if (sqlPatterns.some(pattern => pattern.test(url.href))) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
  
  // Check for XSS patterns in query parameters
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi
  ]
  
  const queryString = url.search
  if (xssPatterns.some(pattern => pattern.test(queryString))) {
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    )
  }
  
  return null
}

// Authentication check for protected routes
async function checkAuthentication(request: NextRequest): Promise<NextResponse | null> {
  const path = request.nextUrl.pathname
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/reset-password',
    '/api/health',
    '/api/metrics',
    '/',
    '/login',
    '/register',
    '/reset-password'
  ]
  
  // Check if route is public
  if (publicRoutes.some(route => path === route || path.startsWith(`${route}/`))) {
    return null
  }
  
  // Check for API routes that require authentication
  if (path.startsWith('/api')) {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
      )
    }
    
    const token = authHeader.substring(7)
    const user = verifyAccessToken(token)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' } }
      )
    }
    
    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email)
    requestHeaders.set('x-user-role', user.role)
    
    // Check for admin routes
    if (path.startsWith('/api/admin') && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
  }
  
  return null
}

// CSRF protection
function checkCSRFToken(request: NextRequest): NextResponse | null {
  // Only check for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return null
  }
  
  // Skip CSRF for API routes with Bearer token
  if (request.headers.get('authorization')?.startsWith('Bearer ')) {
    return null
  }
  
  const csrfToken = request.headers.get('x-csrf-token')
  const sessionCsrf = request.cookies.get('csrf-token')?.value
  
  if (!csrfToken || !sessionCsrf || csrfToken !== sessionCsrf) {
    return NextResponse.json(
      { error: 'CSRF token validation failed' },
      { status: 403 }
    )
  }
  
  return null
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const url = new URL(request.url)
  const path = url.pathname
  
  try {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 })
      return applyCORSHeaders(request, applySecurityHeaders(response, request))
    }
    
    // Security checks
    const securityCheck = performSecurityChecks(request)
    if (securityCheck) {
      logRequestMetrics({
        timestamp: Date.now(),
        method: request.method,
        path,
        statusCode: securityCheck.status,
        responseTime: Date.now() - startTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.ip
      })
      return securityCheck
    }
    
    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request)
    if (rateLimitResponse) {
      logRequestMetrics({
        timestamp: Date.now(),
        method: request.method,
        path,
        statusCode: 429,
        responseTime: Date.now() - startTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.ip
      })
      return rateLimitResponse
    }
    
    // Authentication check
    const authCheck = await checkAuthentication(request)
    if (authCheck) {
      logRequestMetrics({
        timestamp: Date.now(),
        method: request.method,
        path,
        statusCode: authCheck.status,
        responseTime: Date.now() - startTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.ip
      })
      return authCheck
    }
    
    // CSRF protection
    const csrfCheck = checkCSRFToken(request)
    if (csrfCheck) {
      logRequestMetrics({
        timestamp: Date.now(),
        method: request.method,
        path,
        statusCode: csrfCheck.status,
        responseTime: Date.now() - startTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.ip
      })
      return csrfCheck
    }
    
    // Continue to the route handler
    const response = NextResponse.next()
    
    // Apply security headers
    const securedResponse = applySecurityHeaders(response, request)
    const finalResponse = applyCORSHeaders(request, securedResponse)
    
    // Log successful request
    logRequestMetrics({
      timestamp: Date.now(),
      method: request.method,
      path,
      statusCode: finalResponse.status,
      responseTime: Date.now() - startTime,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.ip,
      userId: request.headers.get('x-user-id') || undefined
    })
    
    return finalResponse
  } catch (error) {
    console.error('Middleware error:', error)
    
    // Log error
    logRequestMetrics({
      timestamp: Date.now(),
      method: request.method,
      path,
      statusCode: 500,
      responseTime: Date.now() - startTime,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.ip
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export metrics for monitoring
export function getRequestMetrics(): RequestMetrics[] {
  return [...requestMetrics]
}

export function getMetricsSummary() {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000
  
  const recentMetrics = requestMetrics.filter(m => m.timestamp > fiveMinutesAgo)
  
  if (recentMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      requestsPerMinute: 0
    }
  }
  
  const totalRequests = recentMetrics.length
  const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
  const errors = recentMetrics.filter(m => m.statusCode >= 400).length
  const errorRate = (errors / totalRequests) * 100
  const requestsPerMinute = totalRequests / 5
  
  return {
    totalRequests,
    averageResponseTime,
    errorRate,
    requestsPerMinute,
    statusCodes: recentMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1
      return acc
    }, {} as Record<number, number>)
  }
}