import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const copawPort = process.env.COPAW_PORT || '7088'
    const copawBase = `http://127.0.0.1:${copawPort}/api/chats`
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
    const copawPort = process.env.COPAW_PORT || '7088'
    const copawBase = `http://127.0.0.1:${copawPort}/api/chats`
    
    // First, try to find the chat by session_id
    let chatId = params.id
    const listRes = await fetch(copawBase, { cache: 'no-store' })
    if (listRes.ok) {
      const chats = await listRes.json()
      const chat = chats.find((c: any) => c.session_id === params.id)
      if (chat && chat.id) {
        chatId = chat.id
      }
    }
    
    // Fetch existing chat spec
    const getRes = await fetch(`${copawBase}/${chatId}`, { cache: 'no-store' })
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    
    const existingChat = await getRes.json()
    
    // Update with new name while preserving all other fields
    const updatedChat = {
      ...existingChat,
      name,
      updated_at: new Date().toISOString()
    }
    
    const copawUrl = `${copawBase}/${chatId}`
    const response = await fetch(copawUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedChat)
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
    const copawPort = process.env.COPAW_PORT || '7088'
    const copawBase = `http://127.0.0.1:${copawPort}/api/chats`
    
    // First, try to find the chat by session_id
    let chatId = params.id
    const listRes = await fetch(copawBase, { cache: 'no-store' })
    if (listRes.ok) {
      const chats = await listRes.json()
      const chat = chats.find((c: any) => c.session_id === params.id)
      if (chat && chat.id) {
        chatId = chat.id
      }
    }
    
    const copawUrl = `${copawBase}/${chatId}`
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
