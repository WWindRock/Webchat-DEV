import { NextRequest, NextResponse } from 'next/server'
import { buildCopawContentParts, resolvePublicBaseUrl } from '@/lib/chatAttachments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, userId = 'default_user' } = body
    const normalizedSessionId = sessionId || `session_${Date.now()}`

    const base = resolvePublicBaseUrl(request.nextUrl.origin, request.headers)
    const copawPayload = {
      input: [{ role: 'user', content: buildCopawContentParts(message, base) }],
      session_id: normalizedSessionId,
      user_id: userId,
      channel: 'webchat',
      stream: true
    }

    const copawPort = process.env.COPAW_PORT || '7088'
    const copawUrl = `http://127.0.0.1:${copawPort}/api/agent/process`
    const chatsUrl = `http://127.0.0.1:${copawPort}/api/chats`

    // Sync chat with CoPaw
    try {
      const listRes = await fetch(`${chatsUrl}?user_id=${userId}&channel=webchat`, { cache: 'no-store' })
      if (listRes.ok) {
        const chats = await listRes.json()
        const exists = Array.isArray(chats)
          && chats.some((c: any) => c?.session_id === normalizedSessionId)
        if (!exists) {
          await fetch(chatsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: message.slice(0, 30) || '新会话',
              session_id: normalizedSessionId,
              user_id: userId,
              channel: 'webchat',
            }),
            cache: 'no-store',
          })
        }
      }
    } catch (error) {
      console.error('CoPaw chat sync error:', error)
    }

    const response = await fetch(copawUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(copawPayload),
      cache: 'no-store'
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('CoPaw API Error:', response.status, text)
      return NextResponse.json({ 
        content: `Error communicating with AI backend: ${response.status} ${response.statusText}`,
        type: 'text'
      }, { status: response.status }) 
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk)
        const lines = text.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6).trim()
              if (jsonStr === '[DONE]') continue
              
              const data = JSON.parse(jsonStr)
              
              // Forward the full message data to client
              // This includes tool calls, reasoning, and regular content
              controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
            } catch (e) {
              // ignore parse error for incomplete lines
            }
          }
        }
      }
    })

    const stream = response.body ? response.body.pipeThrough(transformStream) : null
    if (!stream) {
      return NextResponse.json({ error: 'Empty response body' }, { status: 502 })
    }

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-store, no-transform'
      }
    })

  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
