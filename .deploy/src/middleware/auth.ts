/**
 * Authentication Middleware for Crowe Logic Platform
 * Handles JWT validation, session management, and role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

/**
 * Verify JWT token and return user data
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as any;
    
    // Verify session is still valid in database
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Session is valid - skip updating timestamp for now

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      permissions: [] // Load from role permissions table if needed
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from request headers or cookies
 */
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    return token;
  }

  // Check API key header for service-to-service auth
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    return apiKey;
  }

  return null;
}

/**
 * Middleware to protect API routes
 */
export async function requireAuth(
  request: NextRequest,
  requiredRole?: string
): Promise<NextResponse | AuthUser> {
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await verifyToken(token);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Check role-based access
  if (requiredRole && !hasRole(user, requiredRole)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Log access for audit
  await logAccess(user, request);

  return user;
}

/**
 * Check if user has required role
 */
function hasRole(user: AuthUser, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    VIEWER: 1,
    USER: 2,
    OPERATOR: 3,
    MANAGER: 4,
    ADMIN: 5
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 999;

  return userLevel >= requiredLevel;
}

/**
 * Log API access for audit trail
 */
async function logAccess(user: AuthUser, request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: request.method,
        entity: 'API',
        entityId: url.pathname,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        oldValue: null,
        newValue: {
          url: url.pathname,
          query: Object.fromEntries(url.searchParams)
        }
      }
    });
  } catch (error) {
    console.error('Failed to log access:', error);
    // Don't fail the request if logging fails
  }
}

/**
 * Generate JWT token for user
 */
export async function generateToken(userId: string): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRY || '7d'
    }
  );

  // Store session in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return token;
}

/**
 * Revoke a token/session
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    await prisma.session.delete({
      where: { token }
    });
    return true;
  } catch (error) {
    console.error('Failed to revoke token:', error);
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupSessions() {
  try {
    const deleted = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    console.log(`Cleaned up ${deleted.count} expired sessions`);
  } catch (error) {
    console.error('Failed to cleanup sessions:', error);
  }
}
