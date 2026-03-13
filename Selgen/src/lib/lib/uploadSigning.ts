import crypto from 'crypto'

const SIGNING_TTL_MS = 30 * 60 * 1000

const getSigningSecret = () => {
  return (
    process.env.UPLOAD_URL_SIGNING_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'dev_upload_signing_secret'
  )
}

const buildSignature = (path: string, expires: number) => {
  const secret = getSigningSecret()
  return crypto.createHmac('sha256', secret).update(`${path}:${expires}`).digest('hex')
}

export const signUploadPath = (path: string, origin?: string, ttlMs: number = SIGNING_TTL_MS) => {
  const expires = Date.now() + ttlMs
  const sig = buildSignature(path, expires)
  const base = origin ? `${origin}${path}` : path
  return {
    signedUrl: `${base}?expires=${expires}&sig=${sig}`,
    expiresAt: expires
  }
}

export const verifySignedPath = (path: string, expires: string | null, sig: string | null) => {
  if (!expires || !sig) return false
  const expiresAt = Number(expires)
  if (!Number.isFinite(expiresAt)) return false
  if (Date.now() > expiresAt) return false
  const expected = buildSignature(path, expiresAt)
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}
