import { useState, useCallback, useRef } from 'react'
import type { Message, Conversation } from '@/types'
import type { SkillResult } from '@/skills/engine'

interface UseAgentChatOptions {
  conversationId?: string
  onMessageSend?: (message: Message) => void
  onMessageReceive?: (message: Message) => void
}

interface UseAgentChatReturn {
  messages: Message[]
  isLoading: boolean
  error: Error | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  appendMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
}

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    options.onMessageSend?.(userMessage)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: options.conversationId,
          history: messages
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.content,
        type: data.type || 'text',
        metadata: data.metadata,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      options.onMessageReceive?.(assistantMessage)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [messages, options])

  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort()
    setMessages([])
    setError(null)
  }, [])

  const appendMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, ...updates } : msg))
    )
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    appendMessage,
    updateMessage
  }
}
