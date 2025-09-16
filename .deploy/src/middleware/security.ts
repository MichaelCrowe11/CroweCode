/**
 * Security Middleware for Crowe Logic Platform
 * Implements CORS, CSP, XSS protection, and other security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Security configuration
 */
export const securityConfig = {
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'https://croweos.com',
      'https://www.croweos.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
      'X-User-ID'
    ],
    maxAge: 86400 // 24 hours
  },
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'", 'https://api.anthropic.com', 'wss://croweos.com'],
      'frame-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    }
  },
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }
};

/**
 * Generate CSP header string
 */
function generateCSP(nonce?: string): string {
  const directives = { ...securityConfig.csp.directives };
  
  if (nonce) {
    directives['script-src'] = [...directives['script-src'], `'nonce-${nonce}'`];
    directives['style-src'] = [...directives['style-src'], `'nonce-${nonce}'`];
  }
  
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return true;
    }
  }
  
  return securityConfig.cors.origins.includes(origin);
}

/**
 * Apply CORS headers
 */
export function applyCORSHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', securityConfig.cors.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', securityConfig.cors.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Max-Age', securityConfig.cors.maxAge.toString());
  }
  
  return response;
}

/**
 * Handle preflight requests
 */
export function handlePreflight(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }
  
  const response = new NextResponse(null, { status: 204 });
  return applyCORSHeaders(request, response);
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  // Apply standard security headers
  Object.entries(securityConfig.headers).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  // Apply CSP header
  const csp = generateCSP(nonce);
  response.headers.set('Content-Security-Policy', csp);
  
  // Add request ID for tracing
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);
  
  return response;
}

/**
 * Validate and sanitize input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove null bytes
    input = input.replace(/\0/g, '');
    
    // Encode HTML entities
    input = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    // Limit string length
    if (input.length > 10000) {
      input = input.substring(0, 10000);
    }
    
    return input;
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate request size
 */
export function validateRequestSize(request: NextRequest, maxSize: number = 10 * 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return false;
  }
  
  return true;
}

/**
 * Check for common attack patterns
 */
export function detectAttackPatterns(request: NextRequest): boolean {
  const url = request.url;
  const userAgent = request.headers.get('user-agent') || '';
  
  // Common attack patterns
  const attackPatterns = [
    /\.\.\//,                    // Path traversal
    /<script[\s\S]*?>/i,         // XSS
    /javascript:/i,              // XSS
    /on\w+\s*=/i,               // XSS event handlers
    /union.*select/i,           // SQL injection
    /exec\s*\(/i,               // Command injection
    /eval\s*\(/i,               // Code injection
    /\${.*}/,                   // Template injection
    /{{.*}}/,                   // Template injection
    /%00/,                      // Null byte injection
    /\x00/,                     // Null byte injection
  ];
  
  // Check URL
  for (const pattern of attackPatterns) {
    if (pattern.test(url)) {
      console.warn(`Attack pattern detected in URL: ${url}`);
      return true;
    }
  }
  
  // Check user agent for known bad actors
  const badAgents = [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'metasploit'
  ];
  
  const lowerAgent = userAgent.toLowerCase();
  for (const agent of badAgents) {
    if (lowerAgent.includes(agent)) {
      console.warn(`Suspicious user agent detected: ${userAgent}`);
      return true;
    }
  }
  
  return false;
}

/**
 * IP-based blocking
 */
const blockedIPs = new Set<string>();
const ipAttempts = new Map<string, number>();

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

export function recordFailedAttempt(ip: string) {
  const attempts = (ipAttempts.get(ip) || 0) + 1;
  ipAttempts.set(ip, attempts);
  
  // Block IP after 10 failed attempts
  if (attempts >= 10) {
    blockedIPs.add(ip);
    console.warn(`IP blocked due to suspicious activity: ${ip}`);
    
    // Auto-unblock after 1 hour
    setTimeout(() => {
      blockedIPs.delete(ip);
      ipAttempts.delete(ip);
    }, 60 * 60 * 1000);
  }
}

/**
 * Main security middleware
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Check if IP is blocked
  if (isIPBlocked(ip)) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
  
  // Handle preflight requests
  const preflightResponse = handlePreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }
  
  // Validate request size
  if (!validateRequestSize(request)) {
    return NextResponse.json(
      { error: 'Request too large' },
      { status: 413 }
    );
  }
  
  // Check for attack patterns
  if (detectAttackPatterns(request)) {
    recordFailedAttempt(ip);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
  
  return null;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash sensitive data
 */
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
  return `${actualSalt}:${hash}`;
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  const [salt, hash] = hashedData.split(':');
  const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}
