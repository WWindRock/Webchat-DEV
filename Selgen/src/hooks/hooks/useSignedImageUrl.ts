'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseSignedImageUrlOptions {
  refreshThreshold?: number // Refresh when less than this many ms remaining (default: 5 minutes)
}

export function useSignedImageUrl(
  originalUrl: string | undefined,
  options: UseSignedImageUrlOptions = {}
) {
  const { refreshThreshold = 5 * 60 * 1000 } = options
  const [url, setUrl] = useState(originalUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshUrl = useCallback(async () => {
    if (!originalUrl) return

    // Check if URL needs refresh
    try {
      const parsedUrl = new URL(originalUrl)
      const expires = parsedUrl.searchParams.get('expires')

      if (expires) {
        const expiresAt = parseInt(expires, 10)
        const now = Date.now()

        // If URL is still valid and not near expiration, use it
        if (expiresAt > now + refreshThreshold) {
          setUrl(originalUrl)
          return
        }
      }

      // Need to refresh
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/uploads/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: originalUrl })
      })

      if (!response.ok) {
        throw new Error('Failed to refresh URL')
      }

      const data = await response.json()
      if (data.success) {
        setUrl(data.url)
      } else {
        throw new Error(data.error || 'Failed to refresh URL')
      }
    } catch (err) {
      console.error('Failed to refresh signed URL:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fall back to original URL even if refresh failed
      setUrl(originalUrl)
    } finally {
      setIsLoading(false)
    }
  }, [originalUrl, refreshThreshold])

  useEffect(() => {
    refreshUrl()
  }, [refreshUrl])

  // Set up periodic refresh
  useEffect(() => {
    if (!originalUrl) return

    const interval = setInterval(() => {
      refreshUrl()
    }, refreshThreshold / 2) // Check halfway through the threshold

    return () => clearInterval(interval)
  }, [originalUrl, refreshThreshold, refreshUrl])

  return { url, isLoading, error, refreshUrl }
}
