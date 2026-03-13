import { NextRequest, NextResponse } from 'next/server'
import { buildCopawContentParts, resolvePublicBaseUrl } from '@/lib/chatAttachments'

export const runtime = 'nodejs' // Use Node.js runtime for streaming
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId } = body
    const normalizedSessionId = sessionId || 'default'

    // Transform payload for CoPaw
    const base = resolvePublicBaseUrl(request.nextUrl.origin, request.headers)
    const copawPayload = {
      input: [{ role: 'user', content: buildCopawContentParts(message, base) }],
      session_id: normalizedSessionId,
      user_id: 'default_user', 
      channel: 'console',
      stream: true
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[agent][input]', JSON.stringify(copawPayload.input))
      const mediaUrls: string[] = []
      for (const part of copawPayload.input[0]?.content || []) {
        if (part?.type === 'image' || part?.type === 'video' || part?.type === 'file') {
          const url = part?.source?.url
          if (typeof url === 'string') mediaUrls.push(url)
        }
      }
      if (mediaUrls.length > 0) {
        console.log('[agent][media_urls]', JSON.stringify(mediaUrls))
      }
    }

    const copawPort = process.env.COPAW_PORT || '7088'
    const copawUrl = `http://127.0.0.1:${copawPort}/api/agent/process`
    const chatsUrl = `http://127.0.0.1:${copawPort}/api/chats`

    try {
      const listRes = await fetch(`${chatsUrl}?user_id=default_user&channel=console`, { cache: 'no-store' })
      if (listRes.ok) {
        const chats = await listRes.json()
        const exists = Array.isArray(chats)
          && chats.some((c: any) => c?.session_id === normalizedSessionId)
        if (!exists) {
          await fetch(chatsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: normalizedSessionId,
              session_id: normalizedSessionId,
              user_id: 'default_user',
              channel: 'console',
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

    // Stream the response back
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    // Create a transform stream to parse SSE and extract content
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
              
              // Handle CoPaw/AgentScope SSE format
              
              // If status is 'failed', send error
              if (data.status === 'failed') {
                 controller.enqueue(encoder.encode(`Error: ${data.error?.message || 'Unknown error'}`))
                 continue
              }

              // Extract text content
              let content = ''
              if (data.delta && data.delta.content) {
                 // If delta format
                 content = data.delta.content
              } else if (data.object === 'message' && data.status === 'completed') {
                 // If completion format
                 if (Array.isArray(data.content)) {
                    content = data.content.map((p: any) => p.text || '').join('')
                 } else if (typeof data.content === 'string') {
                    content = data.content
                 }
              }

              // If we have content, send it
              // Note: CanvasPage expects raw text chunks
              if (content) {
                controller.enqueue(encoder.encode(content))
              }
            } catch (e) {
              // ignore parse error for incomplete lines
            }
          }
        }
      }
    })

    // Pipe the fetch response body through our transform
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
