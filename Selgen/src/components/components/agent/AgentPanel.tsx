'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  ChevronUp, 
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  MessageSquare,
  Cpu,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AgentMessage } from '@/agents/types'

interface AgentPanelProps {
  isExpanded: boolean
  onToggle: () => void
  messages?: AgentMessage[]
  isProcessing?: boolean
  taskStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  className?: string
}

export function AgentPanel({
  isExpanded,
  onToggle,
  messages = [],
  isProcessing = false,
  taskStatus = 'pending',
  className,
}: AgentPanelProps) {
  const [displayMessages, setDisplayMessages] = useState<AgentMessage[]>([])

  useEffect(() => {
    if (messages.length > 0) {
      setDisplayMessages(messages)
    }
  }, [messages])

  const getStatusIcon = () => {
    if (isProcessing) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    switch (taskStatus) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  const getStatusColor = () => {
    if (isProcessing) return 'text-primary'
    switch (taskStatus) {
      case 'completed':
        return 'text-green-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              "fixed inset-4 z-50 pointer-events-none",
              className
            )}
          >
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-2xl pointer-events-auto">
                <div className="relative bg-[#0a0a0f]/90 backdrop-blur-xl rounded-2xl border border-primary/30 shadow-2xl shadow-primary/10 overflow-hidden">
                  {/* Scanning line effect */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                      initial={{ y: '-100%' }}
                      animate={{ y: '200%' }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent"
                    />
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                          0deg,
                          transparent,
                          transparent 2px,
                          rgba(139, 92, 246, 0.03) 2px,
                          rgba(139, 92, 246, 0.03) 4px
                        )`,
                      }}
                    />
                  </div>

                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-2xl border border-primary/20" />
                  <div className="absolute inset-0 rounded-2xl border border-primary/5" />

                  {/* Header */}
                  <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isProcessing ? "bg-primary/20" : "bg-white/5"
                        )}>
                          {getStatusIcon()}
                        </div>
                        {isProcessing && (
                          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-medium", getStatusColor())}>
                            Agent
                          </span>
                          {isProcessing && (
                            <span className="text-xs text-primary animate-pulse">
                              处理中...
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          <span>{messages.length > 0 ? '思考中' : '等待输入'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onToggle}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="relative max-h-[400px] overflow-y-auto p-4 space-y-3">
                    {displayMessages.length === 0 && !isProcessing && (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">等待您的指令</p>
                      </div>
                    )}

                    {displayMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "rounded-lg p-3 text-sm",
                          message.type === 'thought' && "bg-white/5 border border-white/5",
                          message.type === 'action' && "bg-primary/10 border border-primary/20",
                          message.type === 'observation' && "bg-cyan-500/10 border border-cyan-500/20",
                          message.type === 'final' && "bg-green-500/10 border border-green-500/20"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-xs font-medium uppercase",
                            message.type === 'thought' && "text-muted-foreground",
                            message.type === 'action' && "text-primary",
                            message.type === 'observation' && "text-cyan-400",
                            message.type === 'final' && "text-green-400"
                          )}>
                            {message.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {message.agentRole}
                          </span>
                        </div>
                        <p className="text-foreground/90">{message.content}</p>
                      </motion.div>
                    ))}

                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-primary"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Agent 正在思考...</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Status bar */}
                  <div className="relative px-4 py-2 border-t border-white/10 bg-white/5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        <span>AI Processing</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{displayMessages.length} steps</span>
                        <span>v1.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed state - floating button at top */}
      {!isExpanded && (
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onClick={onToggle}
          className={cn(
            "fixed top-4 left-1/2 -translate-x-1/2 z-40",
            "flex items-center gap-2 px-4 py-2",
            "bg-[#141419]/90 backdrop-blur-sm rounded-full",
            "border border-white/10 shadow-lg",
            "hover:border-primary/30 transition-colors",
            isProcessing && "animate-pulse"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : taskStatus === 'completed' ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : taskStatus === 'failed' ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <Bot className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {isProcessing ? '处理中' : taskStatus === 'completed' ? '已完成' : taskStatus === 'failed' ? '失败' : 'Agent'}
          </span>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      )}
    </>
  )
}

export default AgentPanel
