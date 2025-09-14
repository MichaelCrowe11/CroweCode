import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations/auth';
import { parseBody } from '@/lib/middleware/validation';
import { withRateLimit, rateLimiters } from '@/lib/middleware/rate-limit';
import {
  generateTokenPair,
  generateAccessToken,
  generateRefreshToken
} from '@/lib/auth/jwt';
import {
  createSession,
  setRefreshTokenCookie,
  setSessionCookie,
} from '@/lib/auth/session';
import { nanoid } from 'nanoid';

/**
 * POST /api/auth/login
 * User login endpoint with validation, rate limiting, and refresh tokens
 */
export const POST = withRateLimit(
  async (req: NextRequest) => {
    try {
      // 1. Validate request body
      const { data: validatedData, error: validationError } = await parseBody(
        req,
        loginSchema
      );

      if (validationError) {
        return validationError;
      }

      const { email, password } = validatedData;

      // 2. Find user in database
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          emailVerified: true,
          twoFactorEnabled: true,
        },
      });

      if (!user || !user.passwordHash) {
        // Don't reveal whether user exists
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          },
          { status: 401 }
        );
      }

      // 3. Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        // Track failed login attempt
        Sentry.captureMessage('Failed login attempt', {
          level: 'info',
          extra: {
            email: email.toLowerCase(),
            ip: req.headers.get('x-forwarded-for') || 'unknown',
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          },
          { status: 401 }
        );
      }

      // 4. Check if email is verified
      if (!user.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EMAIL_NOT_VERIFIED',
              message: 'Please verify your email before logging in',
            },
          },
          { status: 403 }
        );
      }

      // 5. Handle 2FA if enabled
      if (user.twoFactorEnabled) {
        // Generate temporary token for 2FA verification
        const tempToken = nanoid();

        // Store temp token in cache (Redis) with 5 min expiry
        // await redis.setex(`2fa:${tempToken}`, 300, user.id);

        return NextResponse.json({
          success: true,
          data: {
            requiresTwoFactor: true,
            tempToken,
          },
        });
      }

      // 6. Generate tokens
      const sessionId = nanoid();
      const tokenFamily = nanoid();

      const { accessToken, refreshToken } = await generateTokenPair(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        sessionId,
        tokenFamily
      );

      // 7. Create session
      const userAgent = req.headers.get('user-agent') || undefined;
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                       req.headers.get('x-real-ip') ||
                       undefined;

      await createSession(
        user.id,
        refreshToken,
        userAgent,
        ipAddress
      );

      // 8. Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // 9. Set cookies
      const response = NextResponse.json({
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      });

      // Set HTTP-only cookies
      setRefreshTokenCookie(refreshToken);
      setSessionCookie(sessionId);

      // Track successful login
      Sentry.setUser({
        id: user.id,
        email: user.email,
      });

      return response;
    } catch (error) {
      // Log error to Sentry
      Sentry.captureException(error, {
        tags: {
          endpoint: 'auth/login',
        },
      });

      console.error('Login error:', error);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred during login',
          },
        },
        { status: 500 }
      );
    }
  },
  rateLimiters.auth // Use strict rate limiting for auth endpoints
);