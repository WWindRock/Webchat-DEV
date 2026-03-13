import { NextRequest, NextResponse } from 'next/server'
import { signUploadPath } from '@/lib/uploadSigning'
import { resolvePublicBaseUrl } from '@/lib/chatAttachments'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path } = body

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    // Extract the file path from the URL (remove query parameters)
    const url = new URL(path, 'http://localhost')
    const filePath = url.pathname

    // Only allow refreshing paths under /api/uploads/
    if (!filePath.startsWith('/api/uploads/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Generate new signed URL
    const base = resolvePublicBaseUrl(request.nextUrl.origin, request.headers)
    const signed = signUploadPath(filePath, base)

    return NextResponse.json({
      success: true,
      url: signed.signedUrl,
      expiresAt: signed.expiresAt
    })

  } catch (error) {
    console.error('Refresh signature error:', error)
    return NextResponse.json({ error: 'Failed to refresh signature' }, { status: 500 })
  }
}
