import { NextRequest, NextResponse } from 'next/server'
import { saveFile } from '@/lib/storage'
import { signUploadPath } from '@/lib/uploadSigning'
import { resolvePublicBaseUrl } from '@/lib/chatAttachments'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = (formData.get('user_id') as string) || 'default_user'
    const chatId = (formData.get('chat_id') as string) || 'global'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const result = await saveFile(file, userId, chatId)
    const origin = resolvePublicBaseUrl(request.nextUrl.origin, request.headers)
    const signed = signUploadPath(result.url, origin)

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        signed_url: signed.signedUrl,
        signed_expires_at: signed.expiresAt
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    const status = errorMessage.includes('quota') ? 507 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}
