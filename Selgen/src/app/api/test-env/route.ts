import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ARK_API_KEY: process.env.ARK_API_KEY ? process.env.ARK_API_KEY.substring(0, 10) + '...' : 'NOT SET',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET',
    DOUBAO_MODEL: process.env.DOUBAO_MODEL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  })
}
