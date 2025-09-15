import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { nanoid } from 'nanoid';

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-jwt-secret-here'
);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-jwt-refresh-secret'
);

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  sessionId: string;
  tokenFamily: string;
}

/**
 * Generate access token
 */
export async function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'>): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(nanoid())
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);
}

/**
 * Generate refresh token
 */
export async function generateRefreshToken(
  userId: string,
  sessionId: string,
  tokenFamily: string
): Promise<string> {
  return await new SignJWT({ userId, sessionId, tokenFamily })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(nanoid())
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return payload as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
    return payload as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Generate token pair (access + refresh)
 */
export async function generateTokenPair(
  user: { id: string; email: string; role: string },
  sessionId: string,
  tokenFamily: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    }),
    generateRefreshToken(user.id, sessionId, tokenFamily),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return payload;
  } catch {
    return null;
  }
}