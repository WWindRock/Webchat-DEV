'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AgentCanvas } from '@/components/canvas/AgentCanvas'

export interface ToolExecution {
  id: string
  name: string
  status: 'running' | 'completed' | 'error'
  input?: any
  output?: any
  startTime: Date
  endTime?: Date
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isLoading?: boolean
  tools?: ToolExecution[]
  type?: 'text' | 'reasoning' | 'tool_call' | 'tool_output' | 'image' | 'audio'
  metadata?: any
}

const TEST_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: '管理员' },
  { username: 'user1', password: 'user123', role: '普通用户' },
  { username: 'user2', password: 'user456', role: '普通用户' },
  { username: 'demo', password: 'demo123', role: '演示用户' },
]

const COPAW_BASE_URL = 'http://107.172.137.173:7088'

export default function CanvasPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [sessionName, setSessionName] = useState<string>('新会话')
  const [sessions, setSessions] = useState<any[]>([])
  const searchParams = useSearchParams()
  const initialInput = searchParams.get('input')
  const initialSession = searchParams.get('session')
  const hasAutoSent = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const loadSessions = useCallback(async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`${COPAW_BASE_URL}/api/chats?user_id=${currentUser.username}&channel=webchat`, { 
        cache: 'no-store',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          const sorted = data.sort((a: any, b: any) => 
            new Date(b.updated_at || b.created_at || 0).getTime() - 
            new Date(a.updated_at || a.created_at || 0).getTime()
          )
          setSessions(sorted)
        } else {
          setSessions([])
        }
      }
    } catch (e) {
      console.error('Failed to load sessions:', e)
      setSessions([])
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    loadSessions()
    const interval = setInterval(loadSessions, 3000)
    return () => clearInterval(interval)
  }, [currentUser, loadSessions])

  const handleLogin = (username: string, password: string): boolean => {
    const account = TEST_ACCOUNTS.find(a => a.username === username && a.password === password)
    if (account) {
      setCurrentUser({ username: account.username })
      setIsAuthenticated(true)
      localStorage.setItem('selgen_user', JSON.stringify({ username: account.username }))
      return true
    }
    return false
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    setMessages([])
    setSessionId('')
    setSessionName('新会话')
    setSessions([])
    localStorage.removeItem('selgen_user')
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('selgen_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem('selgen_user')
      }
    }
  }, [])

  const createNewSession = useCallback(async () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newSessionName = `新会话 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    
    try {
      await fetch(`${COPAW_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newSessionName,
          session_id: newSessionId,
          user_id: currentUser?.username || 'default_user',
          channel: 'webchat'
        })
      })
    } catch (e) {
      console.error('Failed to create session on server:', e)
    }
    
    setSessionId(newSessionId)
    setSessionName(newSessionName)
    setMessages([])
    
    await loadSessions()
    
    return newSessionId
  }, [currentUser, loadSessions])

  const loadSession = useCallback(async (sid: string) => {
    try {
      setMessages([])
      setIsLoadingSession(true)
      
      const listRes = await fetch(`${COPAW_BASE_URL}/api/chats?user_id=${currentUser?.username || 'default_user'}&channel=webchat`, { 
        cache: 'no-store',
        credentials: 'include'
      })
      
      let chatId = sid
      if (listRes.ok) {
        const chats = await listRes.json()
        const chat = chats.find((c: any) => c.session_id === sid)
        if (chat && chat.id) {
          chatId = chat.id
        }
      }
      
      const res = await fetch(`${COPAW_BASE_URL}/api/chats/${chatId}`, { 
        cache: 'no-store',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setSessionName(data.name || '未命名会话')
        if (data.messages && Array.isArray(data.messages)) {
          const uiMessages = data.messages.map((m: any) => {
            let content = ''
            
            // Helper function to safely convert any value to string
            const safeToString = (val: any): string => {
              if (val === null || val === undefined) return ''
              if (typeof val === 'string') return val
              if (typeof val === 'object') {
                // Try to extract text content from object
                if (val.text) return String(val.text)
                if (val.content) {
                  if (typeof val.content === 'string') return val.content
                  if (val.content.text) return String(val.content.text)
                }
                // Handle array of content parts
                if (Array.isArray(val)) {
                  return val.map((item: any) => {
                    if (typeof item === 'string') return item
                    if (item && typeof item === 'object') {
                      return item.text || item.content || safeToString(item)
                    }
                    return String(item || '')
                  }).filter(Boolean).join(' ')
                }
                // Try JSON stringify, fallback to empty string
                try {
                  const json = JSON.stringify(val)
                  if (json !== '{}' && json !== '[]') return json
                } catch {
                  // Ignore JSON errors
                }
              }
              return String(val || '')
            }
            
            // Process content
            if (typeof m.content === 'string') {
              content = m.content
              // Handle case where backend stored [object Object] as string
              if (content === '[object Object]' || content === '[object][object]') {
                if (m.metadata?.content) {
                  content = safeToString(m.metadata.content)
                } else if (m.metadata?.text) {
                  content = String(m.metadata.text)
                } else {
                  content = ''
                }
              }
            } else if (m.content && typeof m.content === 'object') {
              content = safeToString(m.content)
            } else {
              content = safeToString(m.content)
            }
            
            // Final safety check - ensure no [object Object] remains
            if (content === '[object Object]' || content === '[object][object]' || content.includes('[object')) {
              console.warn('Detected [object Object] in message content, trying metadata fallback:', m)
              if (m.metadata?.content) {
                content = safeToString(m.metadata.content)
              } else if (m.metadata?.text) {
                content = String(m.metadata.text)
              } else {
                content = ''
              }
            }
            
            return {
              id: m.id || Math.random().toString(),
              role: m.role === 'user' ? 'user' : 'assistant',
              content,
              timestamp: new Date(m.created_at || Date.now()),
              type: m.message_type === 'reasoning' ? 'reasoning' : 'text',
              metadata: m.metadata,
            }
          })
          setMessages(uiMessages)
        } else {
          setMessages([])
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e)
      setMessages([])
    } finally {
      setIsLoadingSession(false)
    }
    setSessionId(sid)
  }, [currentUser])

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return

    let currentSid = sessionId
    let currentSname = sessionName
    
    if (!currentSid) {
      currentSid = await createNewSession()
      currentSname = `新会话 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
      setSessionName(currentSname)
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      type: 'text',
    }
    
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)

    const loadingMessageId = (Date.now() + 1).toString()
    const loadingMessage: Message = {
      id: loadingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
      type: 'text',
      tools: [],
    }
    
    const messagesWithLoading = [...newMessages, loadingMessage]
    setMessages(messagesWithLoading)
    setIsProcessing(true)
    setShowChat(true)

    try {
      const response = await fetch(`${COPAW_BASE_URL}/api/agent/process`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          input: [{ role: 'user', content: [{ type: 'text', text: content }] }],
          session_id: currentSid,
          user_id: currentUser?.username || 'default_user',
          channel: 'webchat',
          stream: true
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      const tools: ToolExecution[] = []
      let currentContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.substring(6).trim()
          if (jsonStr === '[DONE]') continue
          
          try {
            const data = JSON.parse(jsonStr)
            
            if (data.object === 'content' && data.type === 'text' && data.delta) {
              currentContent += data.text || ''
            } else if (data.object === 'message' && data.status === 'completed') {
              if (data.type === 'reasoning') {
                // Handle reasoning content if needed
              } else if (data.type === 'message') {
                // Message completed
              }
            }
            
            setMessages(prev => prev.map(msg => 
              msg.id === loadingMessageId 
                ? { 
                    ...msg, 
                    content: currentContent,
                    isLoading: false,
                    tools: tools.length > 0 ? [...tools] : undefined
                  }
                : msg
            ))
          } catch {
            // Ignore parse errors
          }
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId 
          ? { 
              ...msg, 
              content: currentContent,
              isLoading: false,
              tools: tools.length > 0 ? tools : undefined
            }
          : msg
      ))
      
      loadSessions()
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }
      console.error('Send message error:', error)
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId 
          ? { ...msg, content: error.message || '抱歉，处理请求时发生错误', isLoading: false }
          : msg
      ))
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [isProcessing, sessionId, sessionName, messages, currentUser, createNewSession, loadSessions])

  useEffect(() => {
    if (initialInput && !hasAutoSent.current) {
      hasAutoSent.current = true
      const decodedMessage = decodeURIComponent(initialInput)
      const nextSession = initialSession || `session_${Date.now()}`
      setSessionId(nextSession)
      setMessages([])
      setShowChat(true)
      setTimeout(() => {
        handleSendMessage(decodedMessage)
      }, 100)
    }
  }, [initialInput, initialSession, handleSendMessage])

  const handleCanvasMessage = (content: string) => {
    setShowChat(true)
    handleSendMessage(content)
  }

  const handleSessionChange = async (newSessionId: string) => {
    if (newSessionId === 'new') {
      await createNewSession()
    } else {
      loadSession(newSessionId)
    }
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0a0f]">
      <AgentCanvas 
        onSendMessage={handleCanvasMessage}
        chatOpen={showChat}
        chatMessages={messages}
        onChatClose={() => setShowChat(false)}
        onChatExpand={() => setShowChat(true)}
        onChatSend={handleSendMessage}
        chatProcessing={isProcessing}
        isLoadingSession={isLoadingSession}
        currentSessionId={sessionId}
        currentSessionName={sessionName}
        onSessionChange={handleSessionChange}
        onCreateNewSession={createNewSession}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        sessions={sessions}
        onRefreshSessions={loadSessions}
        chatEndRef={chatEndRef}
      />
    </div>
  )
}
