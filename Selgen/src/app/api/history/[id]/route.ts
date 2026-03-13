import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const copawBase = 'http://127.0.0.1:6413/api/chats'
    if (params.id === 'default') {
      const listRes = await fetch(copawBase, { cache: 'no-store' })
      if (!listRes.ok) {
        return NextResponse.json({ messages: [] })
      }
      const chats = await listRes.json()
      const first = Array.isArray(chats) ? chats[0] : null
      if (!first?.id) {
        return NextResponse.json({ messages: [] })
      }
      const detailRes = await fetch(`${copawBase}/${first.id}`, { cache: 'no-store' })
      if (!detailRes.ok) {
        return NextResponse.json({ messages: [] })
      }
      const data = await detailRes.json()
      return NextResponse.json(data)
    }
    const copawUrl = `${copawBase}/${params.id}`
    const response = await fetch(copawUrl, { cache: 'no-store' })
    
    if (!response.ok) {
        // If 404, try fetching messages directly if chat detail fails (depends on CoPaw API structure)
        // But from previous curl, /api/chats/{id} returns full chat object including messages
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('History Detail API Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const name = (body?.name as string) || ''
    const copawUrl = `http://127.0.0.1:6413/api/chats/${params.id}`
    const response = await fetch(copawUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to rename chat' }, { status: response.status })
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('History Rename API Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const copawUrl = `http://127.0.0.1:6413/api/chats/${params.id}`
    const response = await fetch(copawUrl, { method: 'DELETE' })
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete chat' }, { status: response.status })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('History Delete API Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
