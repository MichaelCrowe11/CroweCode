// src/lib/withAuth.ts - Route-level authentication helper
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
};

export type AuthenticatedRequest = NextRequest & {
  user: AuthenticatedUser;
};

export type AuthenticatedHandler = (
  req: AuthenticatedRequest
) => Promise<Response>;

/**
 * Enhanced authentication wrapper for API routes
 * Provides additional validation and user context
 */
export function withAuth(handler: AuthenticatedHandler, options?: {
  requiredRole?: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'USER' | 'VIEWER';
  requireEmailVerified?: boolean;
  allowApiKey?: boolean;
}) {
  return async (req: NextRequest) => {
    try {
      // Check if user context was already added by middleware
      const userId = req.headers.get('x-user-id');
      const userEmail = req.headers.get('x-user-email');
      const userRole = req.headers.get('x-user-role');
      const userVerified = req.headers.get('x-user-verified') === 'true';

      if (!userId) {
        return NextResponse.json(
          { 
            error: 'Authentication required',
            code: 'UNAUTHORIZED',
            message: 'No valid authentication found'
          }, 
          { status: 401 }
        );
      }

      // Create user object
      const user: AuthenticatedUser = {
        id: userId,
        email: userEmail || '',
        role: userRole || 'USER',
        emailVerified: userVerified,
      };

      // Role-based access control
      if (options?.requiredRole) {
        const roleHierarchy = ['VIEWER', 'USER', 'OPERATOR', 'MANAGER', 'ADMIN'];
        const requiredLevel = roleHierarchy.indexOf(options.requiredRole);
        const userLevel = roleHierarchy.indexOf(user.role);

        if (userLevel < requiredLevel) {
          return NextResponse.json(
            { 
              error: 'Insufficient permissions',
              code: 'FORBIDDEN',
              message: `Required role: ${options.requiredRole}, user role: ${user.role}`
            }, 
            { status: 403 }
          );
        }
      }

      // Email verification requirement
      if (options?.requireEmailVerified && !user.emailVerified) {
        return NextResponse.json(
          { 
            error: 'Email verification required',
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address to access this resource'
          }, 
          { status: 403 }
        );
      }

      // Add user to request object
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;

      // Call the handler with authenticated request
      return await handler(authenticatedReq);

    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          code: 'AUTH_ERROR',
          message: 'An error occurred during authentication'
        }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Alternative JWT verification for routes that bypass middleware
 */
export async function verifyTokenDirect(token: string): Promise<AuthenticatedUser | null> {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.sub as string,
      email: payload.email as string || '',
      role: payload.role as string || 'USER',
      emailVerified: payload.emailVerified as boolean || false,
    };
  } catch (error) {
    console.error('Direct token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from request (Authorization header or cookie)
 */
export function extractToken(req: NextRequest): string | null {
  // Try Authorization header first
  const bearerToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (bearerToken) return bearerToken;

  // Try cookie
  const cookieToken = req.cookies.get('token')?.value;
  if (cookieToken) return cookieToken;

  return null;
}

/**
 * Lightweight auth check (just returns user if authenticated)
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const token = extractToken(req);
  if (!token) return null;

  return await verifyTokenDirect(token);
}