'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AgentCanvas } from '@/components/canvas/AgentCanvas'
import { QueueSidebar } from '@/components/queue/QueueSidebar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

const MOCK_TASKS: any[] = [
  {
    id: '1',
    name: '暂无任务',
    status: 'pending' as const,
    progress: 0,
    agentType: '',
    createdAt: new Date(),
  },
]

export default function CanvasPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [sessionId, setSessionId] = useState<string>('default')
  // 只有存在需要展示的任务时才显示队列侧边栏
  const showQueue = true
  const searchParams = useSearchParams()
  const initialInput = searchParams.get('input')
  const initialSession = searchParams.get('session')
  const hasAutoSent = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 处理发送消息
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    // 添加加载中的助手消息
    const loadingMessageId = (Date.now() + 1).toString()
    const loadingMessage: Message = {
      id: loadingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }
    setMessages(prev => [...prev, loadingMessage])
    setIsProcessing(true)
    setShowChat(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: content,
            sessionId: sessionId
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 处理流式响应
      const contentType = response.headers.get('content-type')
      const isStream = contentType?.includes('text/plain')
      
      if (isStream && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let isThinking = true

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          
          // 处理 thinking 标记
          if (chunk.includes('__THINKING__')) {
            isThinking = false
            fullContent = fullContent.replace('__THINKING__', '')
            continue
          }
          
          fullContent += chunk
          
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessageId 
              ? { ...msg, content: fullContent, isLoading: isThinking }
              : msg
          ))
        }
        
        // 确保最后不再显示 loading
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessageId 
            ? { ...msg, content: fullContent, isLoading: false }
            : msg
        ))
      } else {
        const data = await response.json()
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessageId 
            ? { ...msg, content: data.task?.result?.output || '任务完成', isLoading: false }
            : msg
        ))
      }
    } catch (error: any) {
      // 如果是 abort 错误，不显示错误消息
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
  }, [isProcessing, sessionId])

  // 自动发送初始消息
  useEffect(() => {
    if (initialInput && !hasAutoSent.current) {
      hasAutoSent.current = true
      const decodedMessage = decodeURIComponent(initialInput)
      const nextSession = initialSession || `session_${Date.now()}`
      setSessionId(nextSession)
      setMessages([])
      
      // 先显示聊天窗口
      setShowChat(true)
      
      // 延迟一点发送消息，确保 UI 已更新
      setTimeout(() => {
        handleSendMessage(decodedMessage)
      }, 100)
    }
  }, [initialInput, initialSession, handleSendMessage])

  // 处理 AgentCanvas 的消息（当用户从画布发送消息时）
  const handleCanvasMessage = (content: string) => {
    setShowChat(true)
    handleSendMessage(content)
  }

  // Handle chat session change
  const handleSessionChange = (newSessionId: string) => {
    setSessionId(newSessionId)
    // Clear messages or load history
    setMessages([])
    // Optionally fetch history for new session
    fetchHistory(newSessionId)
  }

  const fetchHistory = async (id: string) => {
      try {
          const res = await fetch(`/api/history/${id}`)
          if (res.ok) {
              const data = await res.json()
              // Transform CoPaw messages to UI messages
              if (data.messages && Array.isArray(data.messages)) {
                  const uiMessages = data.messages.flatMap((msg: any) => {
                      if (!msg.content) return []
                      // Handle array content
                      let content = ''
                      if (Array.isArray(msg.content)) {
                          content = msg.content.map((c: any) => c.text || '').join('')
                      } else if (typeof msg.content === 'string') {
                          content = msg.content
                      }
                      
                      return [{
                          id: msg.id || Math.random().toString(),
                          role: msg.role === 'user' ? 'user' : 'assistant',
                          content: content,
                          timestamp: new Date(msg.created_at || Date.now())
                      }]
                  })
                  setMessages(uiMessages)
              }
          }
      } catch (e) {
          console.error('Failed to load history', e)
      }
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0a0f]">
      {/* 画布主体 */}
      <AgentCanvas 
        onSendMessage={handleCanvasMessage}
        chatOpen={showChat}
        chatMessages={messages}
        onChatClose={() => setShowChat(false)}
        onChatExpand={() => setShowChat(true)}
        onChatSend={handleSendMessage}
        chatProcessing={isProcessing}
        currentSessionId={sessionId}
        onSessionChange={handleSessionChange}
      />

      {/* 右侧队列侧边栏（仅在有需要的任务时显示） */}
      {showQueue && (
        <QueueSidebar 
          tasks={MOCK_TASKS}
          className={sidebarCollapsed ? 'w-12' : ''}
        />
      )}
    </div>
  )
}
