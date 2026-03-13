import { NextRequest, NextResponse } from 'next/server'
import crypto from "crypto"
import Database from 'better-sqlite3'
import path from 'path'
import { sign } from 'jsonwebtoken'

const sqlite = new Database(path.join(process.cwd(), 'selgen.db'))
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-key'

function hashPassword(password: string, salt: string): string {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash
}

function verifyPassword(password: string, storedPassword: string): boolean {
  const parts = storedPassword.split(':')
  if (parts.length !== 2) return false
  const [salt, hash] = parts
  const newHash = hashPassword(password, salt)
  return newHash === hash
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // 查找用户
    const user = sqlite.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(email) as any

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 查找账户
    const account = sqlite.prepare(`
      SELECT * FROM accounts WHERE user_id = ? AND provider = 'credentials'
    `).get(user.id) as any

    if (!account || !account.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 验证密码
    const isValid = verifyPassword(password, account.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 创建 JWT token
    const token = sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    // 设置 cookie
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
