import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const copawPort = process.env.COPAW_PORT || '7088'
    const copawUrl = `http://127.0.0.1:${copawPort}/api/chats`
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
