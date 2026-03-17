'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Clock, Trash2, X, Plus, Pencil, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatSync } from '@/hooks/useChatSync'

interface ChatSession {
  id: string
  session_id: string
  name: string
  updated_at: string
  created_at: string
}

interface ChatHistoryListProps {
  isOpen: boolean
  onClose: () => void
  onSelectChat: (chat: ChatSession) => void
  onNewChat: () => void
  currentSessionId?: string
  align?: 'left' | 'right'
  className?: string
}

export function ChatHistoryList({ isOpen, onClose, onSelectChat, onNewChat, currentSessionId, align = 'right', className }: ChatHistoryListProps) {
  const { sessions, isLoading, refresh } = useChatSync()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      refresh()
    }
  }, [isOpen, refresh])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (deletingId === id) {
      try {
        const res = await fetch(`/api/history/${id}`, { method: 'DELETE' })
        if (res.ok) {
          refresh()
          setDeletingId(null)
        }
      } catch (e) {
        console.error('Failed to delete chat', e)
        setDeletingId(null)
      }
    } else {
      setDeletingId(id)
    }
  }

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(null)
  }

  const handleRename = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    setEditingId(session.id)
    setDraftName(session.name || 'Untitled Chat')
  }

  const commitRename = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    const name = draftName.trim()
    if (!name) return
    try {
      const res = await fetch(`/api/history/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (res.ok) {
        refresh()
      }
    } catch (e) {
      console.error('Failed to rename chat', e)
    } finally {
      setEditingId(null)
      setDraftName('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "absolute top-16 w-72 bg-[#141419]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col",
            align === 'right' ? 'right-4' : 'left-16',
            className
          )}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              历史记录
            </h3>
            <div className="flex gap-1">
                <button onClick={onNewChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="New Chat">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground p-4">
                暂无历史记录
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectChat(session)}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent",
                    currentSessionId === session.session_id ? "bg-primary/10 border-primary/20" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                    currentSessionId === session.session_id ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground group-hover:bg-white/10 group-hover:text-foreground"
                  )}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-foreground outline-none"
                      />
                    ) : (
                      <div className={cn(
                        "text-sm font-medium truncate transition-colors",
                        currentSessionId === session.session_id ? "text-primary" : "text-foreground"
                      )}>
                        {session.name || 'Untitled Chat'}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground truncate">
                      {new Date(session.updated_at).toLocaleString()}
                    </div>
                  </div>
                  {editingId === session.id ? (
                    <button
                      onClick={(e) => commitRename(e, session)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-muted-foreground"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : deletingId === session.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDeleteCancel}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => handleRename(e, session)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-muted-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all text-muted-foreground"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
