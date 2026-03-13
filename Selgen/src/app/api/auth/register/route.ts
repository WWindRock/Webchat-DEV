import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accounts } from '@/lib/db/schema'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

function hashPassword(password: string, salt: string): string {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const userId = uuidv4()
    const salt = generateSalt()
    const hashedPassword = hashPassword(password, salt)

    // 插入用户 - 不使用 returning
    await db.insert(users).values({
      id: userId,
      name: name || email.split('@')[0],
      email: email,
      creditsRemaining: 100,
      creditsUsed: 0,
    })

    // 插入账户
    await db.insert(accounts).values({
      id: uuidv4(),
      userId: userId,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: email,
      password: `${salt}:${hashedPassword}`,
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    const errorStr = String(error)
    if (errorStr.includes('duplicate') || errorStr.includes('23505')) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create account: ' + errorStr },
      { status: 500 }
    )
  }
}
