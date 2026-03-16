'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, Sparkles, User, Bot } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface ChatViewProps {
  messages: Message[]
  onClose: () => void
  onSend: (message: string) => void
  isProcessing: boolean
}

export function ChatView({ messages, onClose, onSend, isProcessing }: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute left-0 right-0 bottom-full z-[100] overflow-hidden"
    >
      <div className="max-w-4xl mx-auto bg-[#0a0a0f] border-t border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#141419]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs font-medium text-foreground">AI Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-muted-foreground transition-colors"
            title="折叠"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="max-h-[200px] overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 text-xs ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-lg px-2 py-1 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-white/10 text-foreground'
              }`}>
                {message.isLoading ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span className="text-[10px]">AI 正在思考...</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{
                    typeof message.content === 'string' 
                      ? message.content 
                      : message.content && typeof message.content === 'object' 
                        ? (message.content.text || JSON.stringify(message.content))
                        : String(message.content || '')
                  }</p>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-2.5 h-2.5 text-foreground" />
                </div>
              )}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </motion.div>
  )
}
