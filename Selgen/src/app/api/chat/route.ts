import { NextRequest, NextResponse } from 'next/server'
import { buildCopawContentParts, resolvePublicBaseUrl } from '@/lib/chatAttachments'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, history } = body

    // Transform payload for CoPaw
    const base = resolvePublicBaseUrl(request.nextUrl.origin, request.headers)
    const normalizedSessionId = conversationId || 'default'
    const copawPayload = {
      input: [{ role: 'user', content: buildCopawContentParts(message, base) }],
      session_id: normalizedSessionId,
      user_id: 'default', 
      channel: 'console',
      stream: false
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[chat][input]', JSON.stringify(copawPayload.input))
    }

    const copawPort = process.env.COPAW_PORT || '7088'
    const copawUrl = `http://127.0.0.1:${copawPort}/api/agent/process`
    const chatsUrl = `http://127.0.0.1:${copawPort}/api/chats`

    try {
      const listRes = await fetch(`${chatsUrl}?user_id=default&channel=console`, { cache: 'no-store' })
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
              user_id: 'default',
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(copawPayload),
      cache: 'no-store'
    })

    if (!response.ok) {
        const text = await response.text()
        console.error('CoPaw API Error:', response.status, text)
        // Try to parse error if it's JSON
        try {
            const errJson = JSON.parse(text)
            if (errJson.error && errJson.error.message) {
                 return NextResponse.json({ 
                    content: `Error from CoPaw: ${errJson.error.message}`,
                    type: 'text'
                })
            }
        } catch (e) {
            // ignore
        }
        return NextResponse.json({ 
            content: `Error communicating with AI backend: ${response.status} ${response.statusText}`,
            type: 'text'
        }) 
    }

    // Parse SSE response
    const text = await response.text()
    const lines = text.split('\n')
    let finalContent = ''
    let errorMsg = ''
    
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            try {
                const jsonStr = line.substring(6)
                const data = JSON.parse(jsonStr)
                
                // Check for failure
                if (data.status === 'failed') {
                    errorMsg = data.error?.message || 'Unknown agent error'
                }

                // Check for message content
                // ConsoleChannel emits "message" objects when a message is completed
                if (data.object === 'message' && data.status === 'completed') {
                    // Extract content
                    // data.content might be list of ContentPart or string
                    if (Array.isArray(data.content)) {
                        finalContent += data.content.map((p: any) => p.text || '').join('')
                    } else if (typeof data.content === 'string') {
                        finalContent += data.content
                    }
                }
            } catch (e) {
                // ignore parse error
            }
        }
    }

    if (errorMsg) {
        return NextResponse.json({
            content: `AI Agent Error: ${errorMsg}`,
            type: 'text'
        })
    }
    
    return NextResponse.json({
      content: finalContent || "No response from agent.",
      type: 'text',
      metadata: {}
    })

  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
