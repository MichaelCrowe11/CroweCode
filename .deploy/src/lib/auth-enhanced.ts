import { hash, compare } from 'bcryptjs'
import { sign, verify, JwtPayload } from 'jsonwebtoken'
import { prisma } from './database'
import { randomBytes, createHash } from 'crypto'
import { z } from 'zod'

// Enhanced security configuration
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long')
  }
  return secret
}

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters long')
  }
  return createHash('sha256').update(secret + '_refresh').digest('hex')
}

// User roles enum for type safety
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

// Enhanced user payload with additional security fields
export interface UserPayload extends JwtPayload {
  id: string
  email: string
  name: string
  role: UserRole
  sessionId: string
  permissions?: string[]
  ipAddress?: string
  userAgent?: string
}

// Session management interface
export interface SessionData {
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: Date
  refreshExpiresAt: Date
  ipAddress?: string
  userAgent?: string
  isActive: boolean
}

// Input validation schemas
const EmailSchema = z.string().email().toLowerCase()
const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// Session store (in production, use Redis)
const sessions = new Map<string, SessionData>()

// Failed login attempts tracking
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>()
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

// Enhanced password hashing with salt rounds configuration
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
  return hash(password, saltRounds)
}

// Timing-safe password verification
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!hashedPassword) return false
  return compare(password, hashedPassword)
}

// Generate secure random session ID
function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

// Check if account is locked due to failed attempts
function isAccountLocked(email: string): boolean {
  const attempts = failedAttempts.get(email)
  if (!attempts) return false
  
  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime()
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    failedAttempts.delete(email)
    return false
  }
  
  return attempts.count >= MAX_FAILED_ATTEMPTS
}

// Record failed login attempt
function recordFailedAttempt(email: string): void {
  const attempts = failedAttempts.get(email) || { count: 0, lastAttempt: new Date() }
  attempts.count++
  attempts.lastAttempt = new Date()
  failedAttempts.set(email, attempts)
}

// Clear failed attempts on successful login
function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email)
}

// Enhanced token generation with session management
export function generateTokens(payload: Omit<UserPayload, 'iat' | 'exp' | 'sessionId'>): {
  accessToken: string
  refreshToken: string
  sessionId: string
} {
  const sessionId = generateSessionId()
  
  const accessToken = sign(
    { ...payload, sessionId },
    getJWTSecret(),
    { 
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
      issuer: 'crowecode-platform',
      audience: 'crowecode-api'
    }
  )
  
  const refreshToken = sign(
    { userId: payload.id, sessionId },
    getRefreshSecret(),
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: 'crowecode-platform'
    }
  )
  
  return { accessToken, refreshToken, sessionId }
}

// Enhanced token verification with session validation
export function verifyAccessToken(token: string): UserPayload | null {
  try {
    const payload = verify(token, getJWTSecret(), {
      issuer: 'crowecode-platform',
      audience: 'crowecode-api'
    }) as UserPayload
    
    // Validate session
    const session = sessions.get(payload.sessionId)
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null
    }
    
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): { userId: string; sessionId: string } | null {
  try {
    const payload = verify(token, getRefreshSecret(), {
      issuer: 'crowecode-platform'
    }) as { userId: string; sessionId: string }
    
    // Validate session
    const session = sessions.get(payload.sessionId)
    if (!session || !session.isActive || session.refreshExpiresAt < new Date()) {
      return null
    }
    
    return payload
  } catch {
    return null
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
} | null> {
  const payload = verifyRefreshToken(refreshToken)
  if (!payload) return null
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })
  
  if (!user) return null
  
  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
    role: user.role as UserRole
  })
  
  // Update session
  const session = sessions.get(payload.sessionId)
  if (session) {
    session.token = tokens.accessToken
    session.refreshToken = tokens.refreshToken
    session.expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    session.refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
  
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  }
}

// Create user with enhanced validation
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: UserRole = UserRole.USER
) {
  // Validate inputs
  const validatedEmail = EmailSchema.parse(email)
  PasswordSchema.parse(password)
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedEmail }
  })
  
  if (existingUser) {
    throw new Error('User already exists')
  }
  
  const hashedPassword = await hashPassword(password)
  
  const nameParts = name.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  
  // Create user with audit trail
  const user = await prisma.user.create({
    data: {
      email: validatedEmail,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      emailVerified: false,
      twoFactorEnabled: false
    }
  })
  
  // Log user creation event
  await logSecurityEvent('USER_CREATED', user.id, { email: validatedEmail })
  
  return user
}

// Enhanced authentication with security features
export async function authenticateUser(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
) {
  const validatedEmail = EmailSchema.parse(email)
  
  // Check for account lockout
  if (isAccountLocked(validatedEmail)) {
    await logSecurityEvent('LOGIN_LOCKED', null, { email: validatedEmail, ipAddress })
    throw new Error('Account is temporarily locked due to multiple failed login attempts')
  }
  
  const user = await prisma.user.findUnique({
    where: { email: validatedEmail }
  })
  
  if (!user) {
    recordFailedAttempt(validatedEmail)
    await logSecurityEvent('LOGIN_FAILED', null, { email: validatedEmail, reason: 'user_not_found', ipAddress })
    throw new Error('Invalid credentials')
  }
  
  const isValid = await verifyPassword(password, user.passwordHash || '')
  
  if (!isValid) {
    recordFailedAttempt(validatedEmail)
    await logSecurityEvent('LOGIN_FAILED', user.id, { reason: 'invalid_password', ipAddress })
    throw new Error('Invalid credentials')
  }
  
  // Clear failed attempts on successful verification
  clearFailedAttempts(validatedEmail)
  
  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // Return partial success for 2FA flow
    return { requiresTwoFactor: true, userId: user.id }
  }
  
  // Generate tokens
  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
    role: user.role as UserRole,
    ipAddress,
    userAgent
  })
  
  // Create session
  const sessionData: SessionData = {
    id: tokens.sessionId,
    userId: user.id,
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress,
    userAgent,
    isActive: true
  }
  
  sessions.set(tokens.sessionId, sessionData)
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })
  
  // Log successful login
  await logSecurityEvent('LOGIN_SUCCESS', user.id, { ipAddress })
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
      role: user.role
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionId: tokens.sessionId
  }
}

// Logout user and invalidate session
export async function logoutUser(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId)
  if (session) {
    session.isActive = false
    sessions.delete(sessionId)
    await logSecurityEvent('LOGOUT', session.userId, { sessionId })
  }
}

// Invalidate all sessions for a user
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const userSessions = Array.from(sessions.entries())
    .filter(([_, session]) => session.userId === userId)
    .map(([sessionId]) => sessionId)
  
  userSessions.forEach(sessionId => {
    sessions.delete(sessionId)
  })
  
  await logSecurityEvent('ALL_SESSIONS_INVALIDATED', userId, { count: userSessions.length })
}

// Change user password with old password verification
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) {
    throw new Error('User not found')
  }
  
  const isValid = await verifyPassword(oldPassword, user.passwordHash || '')
  if (!isValid) {
    await logSecurityEvent('PASSWORD_CHANGE_FAILED', userId, { reason: 'invalid_old_password' })
    throw new Error('Current password is incorrect')
  }
  
  PasswordSchema.parse(newPassword)
  const hashedPassword = await hashPassword(newPassword)
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashedPassword,
      updatedAt: new Date()
    }
  })
  
  // Invalidate all sessions after password change
  await invalidateAllUserSessions(userId)
  await logSecurityEvent('PASSWORD_CHANGED', userId)
}

// Password reset token generation
export async function generatePasswordResetToken(email: string): Promise<string> {
  const validatedEmail = EmailSchema.parse(email)
  
  const user = await prisma.user.findUnique({
    where: { email: validatedEmail }
  })
  
  if (!user) {
    // Don't reveal if user exists
    return ''
  }
  
  const resetToken = randomBytes(32).toString('hex')
  const hashedToken = createHash('sha256').update(resetToken).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  
  // Store reset token (in production, use database)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt
    }
  })
  
  await logSecurityEvent('PASSWORD_RESET_REQUESTED', user.id)
  
  return resetToken
}

// Reset password with token
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<void> {
  const hashedToken = createHash('sha256').update(token).digest('hex')
  
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() }
    }
  })
  
  if (!user) {
    throw new Error('Invalid or expired reset token')
  }
  
  PasswordSchema.parse(newPassword)
  const hashedPassword = await hashPassword(newPassword)
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date()
    }
  })
  
  await invalidateAllUserSessions(user.id)
  await logSecurityEvent('PASSWORD_RESET_COMPLETED', user.id)
}

// Security event logging
async function logSecurityEvent(
  eventType: string,
  userId: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        eventType,
        userId,
        metadata: metadata || {},
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// Permission checking
export function hasPermission(
  user: UserPayload,
  requiredPermission: string
): boolean {
  // Super admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true
  
  // Check role-based permissions
  const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.SUPER_ADMIN]: ['*'],
    [UserRole.ADMIN]: ['read', 'write', 'delete', 'manage_users'],
    [UserRole.USER]: ['read', 'write'],
    [UserRole.VIEWER]: ['read']
  }
  
  const userPermissions = rolePermissions[user.role] || []
  
  // Check if user has the required permission
  return userPermissions.includes('*') || 
         userPermissions.includes(requiredPermission) ||
         (user.permissions?.includes(requiredPermission) ?? false)
}

// Session cleanup (run periodically)
export function cleanupExpiredSessions(): void {
  const now = new Date()
  const expiredSessions: string[] = []
  
  sessions.forEach((session, sessionId) => {
    if (session.refreshExpiresAt < now) {
      expiredSessions.push(sessionId)
    }
  })
  
  expiredSessions.forEach(sessionId => sessions.delete(sessionId))
}

// Start session cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000) // Run every hour
}

// Export session store for monitoring
export function getActiveSessions(): SessionData[] {
  return Array.from(sessions.values()).filter(s => s.isActive)
}

export function getSessionCount(): number {
  return sessions.size
}