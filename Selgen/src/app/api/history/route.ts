import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const copawUrl = 'http://127.0.0.1:6413/api/chats'
    const response = await fetch(copawUrl)
    
    if (!response.ok) {
        throw new Error(`Failed to fetch chats: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('History API Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
