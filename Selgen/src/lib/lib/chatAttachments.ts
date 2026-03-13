export const getPublicBaseUrl = (fallbackOrigin?: string) => {
  const raw =
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_PUBLIC_BASE_URL ||
    fallbackOrigin ||
    ''
  return raw.replace(/\/$/, '')
}

export const resolvePublicBaseUrl = (origin: string, headers?: Headers) => {
  const envBase = getPublicBaseUrl(origin)
  if (envBase && !/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(envBase)) {
    return envBase
  }
  if (headers) {
    const forwardedHost = headers.get('x-forwarded-host') || headers.get('host')
    const forwardedProto =
      headers.get('x-forwarded-proto') ||
      (origin.startsWith('https') ? 'https' : 'http')
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '')
    }
  }
  return envBase || origin
}

export const normalizeAttachmentUrl = (url: string, base: string) => {
  if (!url) return url
  if (url.startsWith('http')) {
    try {
      const parsed = new URL(url)
      if (
        base &&
        (parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname === '0.0.0.0')
      ) {
        return `${base}${parsed.pathname}${parsed.search}`
      }
      return url
    } catch {
      return url
    }
  }
  if (url.startsWith('/api/uploads/')) {
    return base ? `${base}${url}` : url
  }
  return url
}

import { signUploadPath } from '@/lib/uploadSigning'

const hasSignedParams = (url: string) => {
  return url.includes('expires=') && url.includes('sig=')
}

const signAttachmentUrlIfNeeded = (url: string, base: string) => {
  if (!url || hasSignedParams(url)) return url
  try {
    const parsed = url.startsWith('http')
      ? new URL(url)
      : new URL(url, base || 'http://localhost')
    if (!parsed.pathname.startsWith('/api/uploads/')) return url
    const origin = base || `${parsed.protocol}//${parsed.host}`
    return signUploadPath(parsed.pathname, origin).signedUrl
  } catch {
    return url
  }
}

export const buildCopawContentParts = (message: string, base: string) => {
  console.log('[buildCopawContentParts] Input message:', message)
  console.log('[buildCopawContentParts] Base URL:', base)
  
  const regex = /\[(图片|视频|附件)\s*\d+\]\(((?:https?:\/\/|\/?api\/uploads\/)[^)]+)\)/g
  const parts: any[] = []
  const attachments: { url: string; kind: 'image' | 'video' | 'file' }[] = []
  
  const normalizeInnerUrl = (raw: string) => {
    if (raw.includes('/_next/image?') && raw.includes('url=')) {
      try {
        const parsed = new URL(raw, base || 'http://localhost')
        const inner = parsed.searchParams.get('url')
        if (inner) return decodeURIComponent(inner)
      } catch {
        return raw
      }
    }
    return raw
  }
  
  const ensureLocalhostUrl = (url: string) => {
    if (!url) return url
    try {
      const parsed = url.startsWith('http') ? new URL(url) : new URL(url, base || 'http://localhost')
      if (parsed.pathname.startsWith('/api/uploads/')) {
        const localBase = 'http://127.0.0.1:6410'
        const localhostUrl = `${localBase}${parsed.pathname}${parsed.search}`
        console.log('[buildCopawContentParts] Converted to localhost URL:', url, '→', localhostUrl)
        return localhostUrl
      }
    } catch {
      return url
    }
    return url
  }
  
  let match: RegExpExecArray | null
  while ((match = regex.exec(message)) !== null) {
    const url = normalizeInnerUrl(match[2])
    const lower = url.split('?')[0].toLowerCase()
    let kind: 'image' | 'video' | 'file' = 'file'
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) kind = 'image'
    if (/\.(mp4|webm|mov|m4v)$/.test(lower)) kind = 'video'
    attachments.push({ url, kind })
    console.log('[buildCopawContentParts] Found attachment:', { url, kind })
  }
  
  const text = message
    .replace(regex, '')
    .replace(/(?:https?:\/\/\S+|\/?api\/uploads\/\S+)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  
  if (text) {
    parts.push({ type: 'text', text })
  }
  
  attachments.forEach((att) => {
    console.log('[buildCopawContentParts] Processing attachment:', att)
    let url = normalizeAttachmentUrl(att.url, base)
    console.log('[buildCopawContentParts] After normalizeAttachmentUrl:', url)
    url = signAttachmentUrlIfNeeded(url, base)
    console.log('[buildCopawContentParts] After signAttachmentUrlIfNeeded:', url)
    url = ensureLocalhostUrl(url)
    console.log('[buildCopawContentParts] After ensureLocalhostUrl:', url)
    
    if (!url) return
    
    if (att.kind === 'image') {
      parts.push({ type: 'image', source: { type: 'url', url } })
      console.log('[buildCopawContentParts] Added image part:', url)
    } else if (att.kind === 'video') {
      parts.push({ type: 'video', source: { type: 'url', url } })
      console.log('[buildCopawContentParts] Added video part:', url)
    } else {
      parts.push({ type: 'file', source: { type: 'url', url } })
    }
  })
  
  console.log('[buildCopawContentParts] Final parts:', JSON.stringify(parts, null, 2))
  return parts.length > 0 ? parts : [{ type: 'text', text: message }]
}
