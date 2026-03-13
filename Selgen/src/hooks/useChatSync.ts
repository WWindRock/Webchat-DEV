'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface ChatSession {
  id: string
  session_id: string
  name: string
  updated_at: string
  created_at: string
}

export function useChatSync() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastUpdatedRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/history')
      if (res.ok) {
        const data = await res.json()
        const sorted = Array.isArray(data) 
          ? data.sort((a: ChatSession, b: ChatSession) => 
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
          : []
        
        // Check if there are any changes
        const latestUpdated = sorted[0]?.updated_at || null
        if (latestUpdated !== lastUpdatedRef.current) {
          setSessions(sorted)
          lastUpdatedRef.current = latestUpdated
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync chats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Start polling
  useEffect(() => {
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        fetchSessions()
      }, 3000) // Poll every 3 seconds
    }

    startPolling()

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [fetchSessions])

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchSessions()
  }, [fetchSessions])

  return {
    sessions,
    isLoading,
    error,
    refresh
  }
}
