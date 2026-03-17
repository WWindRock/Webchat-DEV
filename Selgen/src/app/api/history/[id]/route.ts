import { NextRequest, NextResponse } from 'next/server'

function getCopawBaseUrl() {
  const envPort = process.env.COPAW_PORT || '7088'
  if (process.env.COPAW_BASE_URL) {
    return `${process.env.COPAW_BASE_URL}:${envPort}`
  }
  
  const externalHost = 'http://107.172.137.173'
  return `${externalHost}:${envPort}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const copawBase = getCopawBaseUrl()
    if (params.id === 'default') {
      const listRes = await fetch(copawBase + '/api/chats', { 
        cache: 'no-store',
        credentials: 'include'
      })
      if (!listRes.ok) {
        return NextResponse.json({ messages: [] })
      }
      const chats = await listRes.json()
      const first = Array.isArray(chats) ? chats[0] : null
      if (!first?.id) {
        return NextResponse.json({ messages: [] })
      }
      const detailRes = await fetch(`${copawBase}/api/chats/${first.id}`, { 
        cache: 'no-store',
        credentials: 'include'
      })
      if (!detailRes.ok) {
        return NextResponse.json({ messages: [] })
      }
      const data = await detailRes.json()
      return NextResponse.json(data)
    }
    const copawUrl = `${copawBase}/api/chats/${params.id}`
    const response = await fetch(copawUrl, { 
      cache: 'no-store',
      credentials: 'include' 
    })
    
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
    const copawBase = getCopawBaseUrl()
    
    // First, try to find the chat by session_id
    let chatId = params.id
    const listRes = await fetch(copawBase + '/api/chats', { 
      cache: 'no-store',
      credentials: 'include'
    })
    if (listRes.ok) {
      const chats = await listRes.json()
      const chat = chats.find((c: any) => c.session_id === params.id)
      if (chat && chat.id) {
        chatId = chat.id
      }
    }
    
    // Fetch existing chat spec
    const getRes = await fetch(`${copawBase}/api/chats/${chatId}`, { 
      cache: 'no-store',
      credentials: 'include'
    })
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
    
    const copawUrl = `${copawBase}/api/chats/${chatId}`
    const response = await fetch(copawUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedChat),
      credentials: 'include'
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
    const copawBase = getCopawBaseUrl()
    
    // First, try to find the chat by session_id
    let chatId = params.id
    const listRes = await fetch(copawBase + '/api/chats', { 
      cache: 'no-store',
      credentials: 'include'
    })
    if (listRes.ok) {
      const chats = await listRes.json()
      const chat = chats.find((c: any) => c.session_id === params.id)
      if (chat && chat.id) {
        chatId = chat.id
      }
    }
    
    const copawUrl = `${copawBase}/api/chats/${chatId}`
    const response = await fetch(copawUrl, { 
      method: 'DELETE',
      credentials: 'include'
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete chat' }, { status: response.status })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('History Delete API Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
