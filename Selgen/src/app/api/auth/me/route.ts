import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-key'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  try {
    const decoded = verify(token, JWT_SECRET) as any
    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      }
    })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}
