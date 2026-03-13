import { useState, useCallback } from 'react'
import type { MemoryEntry } from '@/skills/engine'

interface UseMemoryOptions {
  conversationId?: string
  userId?: string
}

interface UseMemoryReturn {
  entries: MemoryEntry[]
  isLoading: boolean
  error: Error | null
  store: (content: string, type: string, metadata?: Record<string, any>) => Promise<void>
  retrieve: (query: string, limit?: number) => Promise<MemoryEntry[]>
  search: (query: string, limit?: number) => Promise<void>
  clear: () => void
}

export function useMemory(options: UseMemoryOptions = {}): UseMemoryReturn {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const store = useCallback(async (
    content: string,
    type: string,
    metadata?: Record<string, any>
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type,
          metadata: {
            ...metadata,
            conversationId: options.conversationId,
            userId: options.userId,
            timestamp: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to store memory')
      }

      const newEntry: MemoryEntry = {
        type,
        content,
        metadata,
        timestamp: new Date().toISOString()
      }

      setEntries(prev => [newEntry, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to store memory'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options.conversationId, options.userId])

  const retrieve = useCallback(async (query: string, limit = 10): Promise<MemoryEntry[]> => {
    try {
      const response = await fetch('/api/memory/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          limit,
          conversationId: options.conversationId,
          userId: options.userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to retrieve memories')
      }

      return response.json()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to retrieve memories')
    }
  }, [options.conversationId, options.userId])

  const search = useCallback(async (query: string, limit = 10) => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await retrieve(query, limit)
      setEntries(results)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'))
    } finally {
      setIsLoading(false)
    }
  }, [retrieve])

  const clear = useCallback(() => {
    setEntries([])
    setError(null)
  }, [])

  return {
    entries,
    isLoading,
    error,
    store,
    retrieve,
    search,
    clear
  }
}
