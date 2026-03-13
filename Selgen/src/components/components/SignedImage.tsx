'use client'

import { useSignedImageUrl } from '@/hooks/useSignedImageUrl'
import { cn } from '@/lib/utils'

interface SignedImageProps {
  src: string
  alt: string
  className?: string
  onError?: () => void
}

export function SignedImage({ src, alt, className, onError }: SignedImageProps) {
  const { url, isLoading, error } = useSignedImageUrl(src)

  if (error) {
    console.warn('SignedImage error:', error)
  }

  return (
    <img
      src={url || src}
      alt={alt}
      className={cn(className)}
      onError={onError}
      style={{ opacity: isLoading ? 0.7 : 1 }}
    />
  )
}
