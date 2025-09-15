import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const SESSION_COOKIE = 'session_id';

export interface Session {
  id: string;
  userId: string;
  tokenFamily: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<Session> {
  const sessionId = nanoid();
  const tokenFamily = nanoid();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      tokenFamily,
      refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
      lastUsedAt: new Date(),
    },
  });

  return session;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  return await prisma.session.findUnique({
    where: { id: sessionId },
  });
}

/**
 * Get session by refresh token
 */
export async function getSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
  return await prisma.session.findFirst({
    where: {
      refreshToken,
      expiresAt: { gt: new Date() },
    },
  });
}

/**
 * Update session with new refresh token (rotation)
 */
export async function rotateRefreshToken(
  sessionId: string,
  newRefreshToken: string
): Promise<Session> {
  return await prisma.session.update({
    where: { id: sessionId },
    data: {
      refreshToken: newRefreshToken,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Extend by 7 days
    },
  });
}

/**
 * Invalidate session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId },
  });
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Invalidate sessions by token family (for refresh token reuse detection)
 */
export async function invalidateTokenFamily(tokenFamily: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { tokenFamily },
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  return await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: 'desc' },
  });
}

/**
 * Set refresh token cookie
 */
export function setRefreshTokenCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Set session ID cookie
 */
export function setSessionCookie(sessionId: string): void {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Get refresh token from cookie
 */
export function getRefreshTokenFromCookie(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

/**
 * Get session ID from cookie
 */
export function getSessionIdFromCookie(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(): void {
  const cookieStore = cookies();
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(SESSION_COOKIE);
}