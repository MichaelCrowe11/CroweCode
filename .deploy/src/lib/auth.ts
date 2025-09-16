import { hash, compare } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { prisma } from './database'

const JWT_SECRET = process.env.JWT_SECRET || 'crowe-logic-secret-key-change-in-production'

export interface UserPayload {
  id: string
  email: string
  name: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function generateToken(payload: UserPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export async function createUser(email: string, password: string, name: string) {
  const hashedPassword = await hashPassword(password)
  
  const nameParts = name.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  
  return prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: 'USER'
    }
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    throw new Error('Invalid credentials')
  }
  
  const isValid = await verifyPassword(password, user.passwordHash || '')
  
  if (!isValid) {
    throw new Error('Invalid credentials')
  }
  
  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
    role: user.role
  })
  
  return { user, token }
}