'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Lock, Sparkles, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (username: string, password: string) => boolean
  onRegister?: (username: string, password: string) => boolean
  isAuthenticated?: boolean
  error?: string
}

const TEST_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: '管理员' },
  { username: 'user1', password: 'user123', role: '普通用户' },
  { username: 'user2', password: 'user456', role: '普通用户' },
  { username: 'demo', password: 'demo123', role: '演示用户' },
]

type AuthMode = 'login' | 'register'

export function LoginModal({ isOpen, onClose, onLogin, onRegister, isAuthenticated = false, error }: LoginModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [showTestAccounts, setShowTestAccounts] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setLocalError('')
    setShowPassword(false)
    setShowTestAccounts(false)
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    resetForm()
  }

  // Prevent ESC key from closing modal when not authenticated
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAuthenticated) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    
    if (isOpen && !isAuthenticated) {
      document.addEventListener('keydown', handleKeyDown, true)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isOpen, isAuthenticated])

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!username.trim() || !password.trim()) {
      setLocalError('请输入用户名和密码')
      return
    }

    setIsLoading(true)
    const success = onLogin(username.trim(), password.trim())
    setIsLoading(false)
    
    if (!success) {
      setLocalError('用户名或密码错误')
    }
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!username.trim() || !password.trim()) {
      setLocalError('请填写所有字段')
      return
    }

    if (username.trim().length < 3) {
      setLocalError('用户名至少需要3个字符')
      return
    }

    if (password.length < 6) {
      setLocalError('密码至少需要6个字符')
      return
    }

    if (password !== confirmPassword) {
      setLocalError('两次输入的密码不一致')
      return
    }

    setIsLoading(true)
    const success = onRegister?.(username.trim(), password)
    setIsLoading(false)

    if (success) {
      onLogin(username.trim(), password)
    } else {
      setLocalError('注册失败，用户名可能已存在')
    }
  }

  const fillTestAccount = (account: typeof TEST_ACCOUNTS[0]) => {
    setUsername(account.username)
    setPassword(account.password)
    setLocalError('')
  }

  const handleClose = () => {
    // Only allow closing if authenticated
    if (isAuthenticated) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - only clickable when authenticated */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />
          
          {/* Modal Container - centered using flexbox */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md"
            >
              <div className="bg-[#141419] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />

                  <div className="relative p-6 text-center">
                    {/* Close button - only show when authenticated */}
                    {isAuthenticated && (
                      <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    )}

                    {mode === 'register' && (
                      <button
                        onClick={() => switchMode('login')}
                        className="absolute left-4 top-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                      </button>
                    )}

                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">
                      {mode === 'login' ? '欢迎回来' : '创建账号'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {mode === 'login' ? '登录以继续使用 Selgen' : '注册开始您的AI创作之旅'}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {(error || localError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                      {error || localError}
                    </motion.div>
                  )}

                  <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">用户名</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={mode === 'login' ? "请输入用户名" : "创建用户名（至少3个字符）"}
                          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">密码</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === 'login' ? "请输入密码" : "设置密码（至少6个字符）"}
                          className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">确认密码</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="再次输入密码"
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>处理中...</span>
                        </>
                      ) : (
                        <>
                          {mode === 'login' ? (
                            <>
                              <User className="w-4 h-4" />
                              <span>登录</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>注册</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </form>

                  <div className="flex items-center justify-center gap-4 text-sm">
                    {mode === 'login' ? (
                      <>
                        <span className="text-muted-foreground">还没有账号？</span>
                        <button
                          onClick={() => switchMode('register')}
                          className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                        >
                          立即注册
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">已有账号？</span>
                        <button
                          onClick={() => switchMode('login')}
                          className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                        >
                          直接登录
                        </button>
                      </>
                    )}
                  </div>

                  {mode === 'login' && (
                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={() => setShowTestAccounts(!showTestAccounts)}
                        className="w-full text-center text-sm text-muted-foreground hover:text-white transition-colors"
                      >
                        {showTestAccounts ? '隐藏测试账号' : '显示测试账号'}
                      </button>

                      <AnimatePresence>
                        {showTestAccounts && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-2"
                          >
                            <p className="text-xs text-muted-foreground text-center mb-2">
                              点击账号自动填充
                            </p>
                            {TEST_ACCOUNTS.map((account) => (
                              <button
                                key={account.username}
                                onClick={() => fillTestAccount(account)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all text-left"
                              >
                                <div>
                                  <span className="text-sm text-white">{account.username}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({account.role})</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{account.password}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LoginModal
