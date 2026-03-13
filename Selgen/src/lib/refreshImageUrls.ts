import { signUploadPath } from './uploadSigning'
import { resolvePublicBaseUrl } from './chatAttachments'

/**
 * Refresh signed URLs in message content
 * This is used when displaying historical messages to ensure image URLs are valid
 */
export const refreshSignedUrlsInContent = async (
  content: string,
  baseUrl: string
): Promise<string> => {
  // Match signed upload URLs
  const signedUrlRegex = /(https?:\/\/[^\s"]+\/api\/uploads\/[^\s"]+\?expires=\d+&sig=[a-f0-9]+)/g

  const matches = content.match(signedUrlRegex)
  if (!matches) return content

  let refreshedContent = content

  for (const url of matches) {
    try {
      const parsedUrl = new URL(url)
      const expires = parsedUrl.searchParams.get('expires')

      // Check if URL is expired or will expire in next 5 minutes
      if (expires) {
        const expiresAt = parseInt(expires, 10)
        const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000

        if (expiresAt < fiveMinutesFromNow) {
          // URL is expired or about to expire, refresh it
          const filePath = parsedUrl.pathname
          const signed = signUploadPath(filePath, baseUrl)
          refreshedContent = refreshedContent.replace(url, signed.signedUrl)
        }
      }
    } catch (error) {
      console.error('Failed to refresh URL:', url, error)
    }
  }

  return refreshedContent
}

/**
 * Refresh signed URLs in message array
 */
export const refreshSignedUrlsInMessages = async (
  messages: Array<{ content: string; [key: string]: any }>,
  baseUrl: string
): Promise<Array<{ content: string; [key: string]: any }>> => {
  return Promise.all(
    messages.map(async (msg) => ({
      ...msg,
      content: await refreshSignedUrlsInContent(msg.content, baseUrl)
    }))
  )
}
