'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles,
  MousePointer2,
  Settings,
  User,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  MessageSquare,
  Clock,
  Trash2,
  Pencil,
  Check,
  X,
  LayoutDashboard,
  LogIn,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export type SidebarTab = 'canvas' | 'settings' | 'user' | 'history'

export interface ChatSession {
  id: string
  session_id: string
  name: string
  updated_at: string
  created_at: string
}

interface LeftSidebarProps {
  className?: string
  isCollapsed: boolean
  onToggleCollapse: () => void
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  currentUser?: { username: string; avatar?: string } | null
  onLogout?: () => void
  onLoginClick?: () => void
  sessions?: ChatSession[]
  currentSessionId?: string
  onSelectSession?: (session: ChatSession) => void
  onNewSession?: () => void
  onRenameSession?: (session: ChatSession, newName: string) => void
  onDeleteSession?: (sessionId: string) => void
  isHistoryLoading?: boolean
}

export function LeftSidebar({
  className,
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  onLoginClick,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  isHistoryLoading,
}: LeftSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  // 顶部工具按钮（主导航）
  const mainTools = [
    { id: 'canvas' as const, icon: MousePointer2, label: '画布', description: 'AI画布创作' },
    { id: 'history' as const, icon: History, label: '历史', description: '会话记录' },
  ]

  // 底部工具按钮（次要导航）
  const bottomTools = [
    { id: 'settings' as const, icon: Settings, label: '设置', description: '系统设置' },
  ]

  const handleRename = (session: ChatSession) => {
    setEditingId(session.id)
    setDraftName(session.name || '未命名会话')
  }

  const commitRename = (session: ChatSession) => {
    const name = draftName.trim()
    if (!name) return
    onRenameSession?.(session, name)
    setEditingId(null)
    setDraftName('')
  }

  const cancelRename = () => {
    setEditingId(null)
    setDraftName('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "h-full bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-50",
        className
      )}
    >
      {/* LOGO区域 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <Link 
          href="/" 
          className={cn(
            "flex items-center gap-3 transition-all duration-300",
            isCollapsed ? "justify-center w-full" : ""
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="font-bold text-lg text-white leading-tight">Selgen</span>
                <span className="text-[10px] text-muted-foreground">AI创作平台</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* 主导航按钮 */}
        <div className={cn(
          "flex flex-col gap-1 px-2",
          isCollapsed ? "items-center" : ""
        )}>
          {mainTools.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(activeTab === item.id ? 'canvas' : item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isCollapsed ? "justify-center w-12 h-12" : "w-full",
                activeTab === item.id
                  ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-all duration-200",
                activeTab === item.id ? "scale-110 text-purple-400" : "group-hover:scale-105"
              )} />
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col items-start flex-1"
                  >
                    <span className="font-medium text-sm">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.description}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {activeTab === item.id && !isCollapsed && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute right-2 w-1.5 h-1.5 rounded-full bg-purple-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* 动态内容区域 - 根据选中的Tab显示不同内容 */}
        <AnimatePresence mode="wait">
          {/* 历史记录面板 */}
          {!isCollapsed && activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-4 px-3"
            >
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">最近会话</span>
                  </div>
                  <button
                    onClick={onNewSession}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                    title="新建会话"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-white" />
                  </button>
                </div>

                <div className="space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {isHistoryLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">暂无历史记录</p>
                      <button
                        onClick={onNewSession}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                      >
                        创建新会话
                      </button>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession?.(session)}
                        className={cn(
                          "group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all",
                          currentSessionId === session.session_id
                            ? "bg-purple-500/10 border border-purple-500/30"
                            : "hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <MessageSquare className={cn(
                          "w-4 h-4 flex-shrink-0",
                          currentSessionId === session.session_id ? "text-purple-400" : "text-muted-foreground/50"
                        )} />
                        <div className="flex-1 min-w-0">
                          {editingId === session.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitRename(session)
                                  if (e.key === 'Escape') cancelRename()
                                }}
                                className="w-full bg-white/10 border border-purple-500/30 rounded px-2 py-1 text-xs text-foreground outline-none focus:border-purple-500"
                                autoFocus
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  commitRename(session)
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Check className="w-3 h-3 text-green-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  cancelRename()
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <X className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className={cn(
                                "text-sm truncate",
                                currentSessionId === session.session_id ? "text-purple-300 font-medium" : "text-foreground"
                              )}>
                                {session.name || '未命名会话'}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>{formatDate(session.updated_at)}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {editingId !== session.id && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRename(session)
                              }}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteSession?.(session.id)
                              }}
                              className="p-1 hover:bg-red-500/20 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 设置面板 */}
          {!isCollapsed && activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-4 px-3"
            >
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">设置</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground">主题模式</span>
                    <span className="text-xs text-purple-400">暗黑</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground">语言</span>
                    <span className="text-xs text-purple-400">简体中文</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground">自动保存</span>
                    <span className="text-xs text-green-400">开启</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-4 text-center">
                  更多设置选项开发中...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部区域 - 用户信息和次要工具 */}
      <div className="border-t border-white/10 p-3">
        {/* 次要工具按钮 */}
        {!isCollapsed && (
          <div className="mb-3 space-y-1">
            {bottomTools.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(activeTab === item.id ? 'canvas' : item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full group",
                  activeTab === item.id
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 用户信息区域 */}
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={currentUser ? onLogout : onLoginClick}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto hover:opacity-90 transition-opacity"
            >
              {currentUser ? (
                <span className="text-sm font-medium text-white">
                  {currentUser.username.charAt(0).toUpperCase()}
                </span>
              ) : (
                <LogIn className="w-5 h-5 text-white" />
              )}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/[0.02] rounded-xl border border-white/5 p-3"
            >
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {currentUser.username}
                    </div>
                    <div className="text-[10px] text-muted-foreground">已登录</div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                    title="退出登录"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-red-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <LogIn className="w-4 h-4 text-muted-foreground group-hover:text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-white">登录</div>
                    <div className="text-[10px] text-muted-foreground">开始使用 Selgen</div>
                  </div>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 折叠按钮 */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex items-center justify-center w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all group",
            isCollapsed ? "px-2" : "gap-2"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">收起</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default LeftSidebar
