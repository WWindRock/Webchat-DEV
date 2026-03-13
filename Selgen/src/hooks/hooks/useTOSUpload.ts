'use client'

import { useState, useCallback } from 'react'

export interface UploadResult {
  success: boolean
  file_url: string
  raw_url?: string
  signed_url?: string
  signed_expires_at?: number
  tos_path?: string // Kept for compatibility, but might be empty
  file_info: {
    original_filename: string
    file_size: number
    file_category?: string
    mime_type?: string
  }
}

export function useTOSUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (
    file: File,
    userId: string = 'default_user',
    functionName: string = 'canvas_upload', // Kept for compatibility
    onProgress?: (percentage: number) => void,
    chatId: string = 'global' // New parameter
  ): Promise<UploadResult | null> => {
    console.log('[Local Upload] Starting upload for file:', file.name, 'size:', file.size)
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', userId)
      formData.append('chat_id', chatId)
      // function_name is not used in new API but we can keep it if we want to support legacy structure or subfolders
      // The new API uses /userId/chatId/filename structure.
      
      console.log('[Local Upload] FormData prepared, sending request...')
      onProgress?.(0)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('[Local Upload] Response received:', response.status)
      onProgress?.(100)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Local Upload] HTTP error:', response.status, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('[Local Upload] Result:', result)
      
      if (result.success) {
        console.log('[Local Upload] Success! File URL:', result.data?.url)
        return {
          success: true,
          file_url: result.data.signed_url || result.data.url,
          raw_url: result.data.url,
          signed_url: result.data.signed_url,
          signed_expires_at: result.data.signed_expires_at,
          file_info: {
            original_filename: result.data.filename,
            file_size: result.data.size
          }
        }
      } else {
        console.error('[Local Upload] API returned error:', result.error)
        throw new Error(result.error || 'Upload failed')
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed'
      console.error('[Local Upload] Error:', errorMsg)
      setError(errorMsg)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  const deleteFile = useCallback(async (filePath: string): Promise<boolean> => {
    // Implement delete if needed, but local storage doesn't support direct delete via URL yet unless we add DELETE method to API
    console.warn('Delete not implemented for local storage yet')
    return true
  }, [])

  return {
    uploadFile,
    deleteFile,
    isUploading,
    error,
  }
}
