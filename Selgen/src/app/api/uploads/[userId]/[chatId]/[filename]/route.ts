import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { verifySignedPath } from '@/lib/uploadSigning'

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json',
  }
  return map[ext] || 'application/octet-stream'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; chatId: string; filename: string } }
) {
  const isValid = verifySignedPath(
    request.nextUrl.pathname,
    request.nextUrl.searchParams.get('expires'),
    request.nextUrl.searchParams.get('sig')
  )
  if (!isValid) {
    return new NextResponse('Invalid or expired signature', { status: 403 })
  }
  const { userId, chatId, filename } = params
  
  // Security check: prevent directory traversal
  if (userId.includes('..') || chatId.includes('..') || filename.includes('..')) {
    return new NextResponse('Invalid path', { status: 400 })
  }

  const BASE_UPLOAD_DIR = path.join(os.homedir(), '.copaw', 'upload')
  const filepath = path.join(BASE_UPLOAD_DIR, userId, chatId, filename)

  if (!fs.existsSync(filepath)) {
    return new NextResponse('File not found', { status: 404 })
  }

  const stat = fs.statSync(filepath)
  const fileStream = fs.createReadStream(filepath)
  const contentType = getMimeType(filename)

  // Convert Node stream to Web stream
  const iterator = fileStream[Symbol.asyncIterator]()
  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
