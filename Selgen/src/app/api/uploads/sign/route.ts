import { NextRequest, NextResponse } from 'next/server'
import { signUploadPath } from '@/lib/uploadSigning'
import { normalizeAttachmentUrl, resolvePublicBaseUrl } from '@/lib/chatAttachments'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = body?.url as string | undefined
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }
    const origin = request.nextUrl.origin
    const publicBase = resolvePublicBaseUrl(origin, request.headers)
    const normalizedUrl = normalizeAttachmentUrl(url, publicBase)
    const parsed = normalizedUrl.startsWith('http') ? new URL(normalizedUrl) : new URL(normalizedUrl, origin)
    if (!parsed.pathname.startsWith('/api/uploads/')) {
      return NextResponse.json({ error: 'Invalid upload path' }, { status: 400 })
    }
    const signed = signUploadPath(parsed.pathname, publicBase || origin)
    return NextResponse.json({
      success: true,
      data: {
        signed_url: signed.signedUrl,
        signed_expires_at: signed.expiresAt
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
