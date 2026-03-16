import { NextRequest, NextResponse } from 'next/server'
import { signUploadPath } from '@/lib/uploadSigning'
import { normalizeAttachmentUrl, resolvePublicBaseUrl } from '@/lib/chatAttachments'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path } = body

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    // Skip URLs that don't need refreshing (no expires parameter)
    if (!path.includes('expires=') || !path.includes('/api/uploads/')) {
      return NextResponse.json({ 
        success: true, 
        url: path,
        expiresAt: null
      })
    }

    const origin = request.nextUrl.origin
    const publicBase = resolvePublicBaseUrl(origin, request.headers)
    
    const normalizedUrl = normalizeAttachmentUrl(path, publicBase)
    
    let filePath: string
    try {
      const parsed = normalizedUrl.startsWith('http') 
        ? new URL(normalizedUrl) 
        : new URL(normalizedUrl, origin)
      filePath = parsed.pathname
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (!filePath.startsWith('/api/uploads/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const signed = signUploadPath(filePath, publicBase || origin)

    return NextResponse.json({
      success: true,
      url: signed.signedUrl,
      expiresAt: signed.expiresAt
    })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to refresh signature' }, { status: 500 })
  }
}
