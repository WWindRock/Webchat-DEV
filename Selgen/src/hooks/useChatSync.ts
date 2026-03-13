'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface ChatSession {
  id: string
  session_id: string
  name: string
  updated_at: string
  created_at: string
}

interface SessionData {
  messages: any[]
  canvas: {
    nodes: any[]
    edges: any[]
  }
  name: string
  updated_at: string
}

const SESSIONS_LIST_KEY = 'selgen_sessions_list'
const SESSION_DATA_PREFIX = 'selgen_session_data_'

export function useChatSync() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastUpdatedRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadSessionsFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_LIST_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const sorted = parsed.sort((a: ChatSession, b: ChatSession) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
          setSessions(sorted)
          return sorted
        }
      }
    } catch (err) {
      console.error('Failed to load sessions from storage:', err)
    }
    return []
  }, [])

  const saveSessionsToStorage = useCallback((sessionList: ChatSession[]) => {
    try {
      localStorage.setItem(SESSIONS_LIST_KEY, JSON.stringify(sessionList))
    } catch (err) {
      console.error('Failed to save sessions to storage:', err)
    }
  }, [])

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/history')
      if (res.ok) {
        const data = await res.json()
        const apiSessions = Array.isArray(data) ? data : []
        
        const storedSessions = loadSessionsFromStorage()
        
        const sessionMap = new Map<string, ChatSession>()
        
        storedSessions.forEach((s: ChatSession) => {
          sessionMap.set(s.session_id, s)
        })
        
        apiSessions.forEach((s: ChatSession) => {
          if (!sessionMap.has(s.session_id)) {
            sessionMap.set(s.session_id, s)
          } else {
            const existing = sessionMap.get(s.session_id)!
            if (new Date(s.updated_at) > new Date(existing.updated_at)) {
              sessionMap.set(s.session_id, s)
            }
          }
        })
        
        const merged = Array.from(sessionMap.values()).sort((a: ChatSession, b: ChatSession) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        
        const latestUpdated = merged[0]?.updated_at || null
        if (latestUpdated !== lastUpdatedRef.current) {
          setSessions(merged)
          saveSessionsToStorage(merged)
          lastUpdatedRef.current = latestUpdated
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err)
      const stored = loadSessionsFromStorage()
      if (stored.length > 0) {
        setSessions(stored)
      }
      setError(err instanceof Error ? err.message : 'Failed to sync chats')
    } finally {
      setIsLoading(false)
    }
  }, [loadSessionsFromStorage, saveSessionsToStorage])

  const createSession = useCallback((name?: string): ChatSession => {
    const now = new Date().toISOString()
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newSession: ChatSession = {
      id: sessionId,
      session_id: sessionId,
      name: name || `新会话 ${sessions.length + 1}`,
      created_at: now,
      updated_at: now,
    }
    
    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)
    saveSessionsToStorage(updatedSessions)
    
    return newSession
  }, [sessions, saveSessionsToStorage])

  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    const updatedSessions = sessions.map(s => 
      s.session_id === sessionId 
        ? { ...s, ...updates, updated_at: new Date().toISOString() }
        : s
    )
    setSessions(updatedSessions)
    saveSessionsToStorage(updatedSessions)
  }, [sessions, saveSessionsToStorage])

  const renameSession = useCallback((sessionId: string, newName: string) => {
    updateSession(sessionId, { name: newName })
  }, [updateSession])

  const deleteSession = useCallback((sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.session_id !== sessionId)
    setSessions(updatedSessions)
    saveSessionsToStorage(updatedSessions)
    
    try {
      localStorage.removeItem(`${SESSION_DATA_PREFIX}${sessionId}`)
    } catch (err) {
      console.error('Failed to delete session data:', err)
    }
  }, [sessions, saveSessionsToStorage])

  const getSessionData = useCallback((sessionId: string): SessionData | null => {
    try {
      const stored = localStorage.getItem(`${SESSION_DATA_PREFIX}${sessionId}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.error('Failed to load session data:', err)
    }
    return null
  }, [])

  const saveSessionData = useCallback((sessionId: string, data: Partial<SessionData>) => {
    try {
      const existing = getSessionData(sessionId) || {
        messages: [],
        canvas: { nodes: [], edges: [] },
        name: '',
        updated_at: new Date().toISOString()
      }
      const updated = { ...existing, ...data, updated_at: new Date().toISOString() }
      localStorage.setItem(`${SESSION_DATA_PREFIX}${sessionId}`, JSON.stringify(updated))
      
      updateSession(sessionId, { updated_at: updated.updated_at })
    } catch (err) {
      console.error('Failed to save session data:', err)
    }
  }, [getSessionData, updateSession])

  useEffect(() => {
    loadSessionsFromStorage()
    fetchSessions()
  }, [fetchSessions, loadSessionsFromStorage])

  useEffect(() => {
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        fetchSessions()
      }, 3000)
    }

    startPolling()

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [fetchSessions])

  const refresh = useCallback(() => {
    return fetchSessions()
  }, [fetchSessions])

  return {
    sessions,
    isLoading,
    error,
    refresh,
    createSession,
    renameSession,
    deleteSession,
    getSessionData,
    saveSessionData,
  }
}
