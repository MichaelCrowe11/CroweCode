import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    
    const user = await createUser(email, password, name)
    
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
      role: user.role
    })
    
    const response = NextResponse.json(
      { 
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
          role: user.role
        }
      },
      { status: 201 }
    )
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    
    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}