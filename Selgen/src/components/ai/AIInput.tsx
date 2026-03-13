'use client'

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Code2, 
  FileText, 
  BarChart3,
  Command,
  X,
  CornerDownLeft,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

// Skill definition
interface Skill {
  id: string
  nameKey: string
  command: string
  descKey: string
  icon: React.ElementType
  color: string
}

// Available skills
const SKILLS: Skill[] = [
  {
    id: 'image',
    nameKey: 'skills.image.name',
    command: '/image',
    descKey: 'skills.image.desc',
    icon: ImageIcon,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'video',
    nameKey: 'skills.video.name',
    command: '/video',
    descKey: 'skills.video.desc',
    icon: Video,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'code',
    nameKey: 'skills.code.name',
    command: '/code',
    descKey: 'skills.code.desc',
    icon: Code2,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'write',
    nameKey: 'skills.write.name',
    command: '/write',
    descKey: 'skills.write.desc',
    icon: FileText,
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'analyze',
    nameKey: 'skills.analyze.name',
    command: '/analyze',
    descKey: 'skills.analyze.desc',
    icon: BarChart3,
    color: 'from-red-500 to-rose-500',
  },
]

interface AIInputProps {
  onSend: (message: string, command?: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
  compact?: boolean
  showShortcuts?: boolean
}

export function AIInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  loading = false,
  className,
  size = 'md',
  dark = false,
  compact = false,
  showShortcuts = false,
}: AIInputProps) {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState(0)
  const [activeCommand, setActiveCommand] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Close commands on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCommands(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)

    // Check for command trigger
    if (value === '/') {
      setShowCommands(true)
      setSelectedCommand(0)
    } else if (value.startsWith('/')) {
      setShowCommands(true)
    } else {
      setShowCommands(false)
      setActiveCommand(null)
    }

    // Check if a command is typed
    const commandMatch = SKILLS.find(skill => 
      value.toLowerCase().startsWith(skill.command.toLowerCase() + ' ')
    )
    if (commandMatch) {
      setActiveCommand(commandMatch.id)
    } else {
      setActiveCommand(null)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCommand(prev => (prev + 1) % filteredSkills.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCommand(prev => (prev - 1 + filteredSkills.length) % filteredSkills.length)
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        selectSkill(filteredSkills[selectedCommand])
      } else if (e.key === 'Escape') {
        setShowCommands(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectSkill = (skill: Skill) => {
    setInput(skill.command + ' ')
    setActiveCommand(skill.id)
    setShowCommands(false)
    inputRef.current?.focus()
  }

  const handleSend = () => {
    if (!input.trim() || disabled || loading) return

    // Extract command if present
    const commandMatch = SKILLS.find(skill => 
      input.toLowerCase().startsWith(skill.command.toLowerCase() + ' ')
    )
    
    const command = commandMatch?.command
    const message = command 
      ? input.slice(command.length).trim() 
      : input.trim()

    onSend(message, command)
    setInput('')
    setActiveCommand(null)
    setShowCommands(false)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  // Filter skills based on input
  const filteredSkills = input === '/' 
    ? SKILLS 
    : SKILLS.filter(skill => 
        t(skill.nameKey).toLowerCase().includes(input.slice(1).toLowerCase()) ||
        skill.command.toLowerCase().includes(input.slice(1).toLowerCase())
      )

  const sizeClasses = {
    sm: 'min-h-[40px] text-sm',
    md: 'min-h-[48px] text-sm',
    lg: 'min-h-[56px] text-base',
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Command Palette */}
      <AnimatePresence>
        {showCommands && filteredSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute bottom-full left-0 right-0 mb-2 rounded-xl border shadow-2xl overflow-hidden z-50',
              dark 
                ? 'bg-[#1a1a20] border-white/10' 
                : 'bg-popover border-border'
            )}
          >
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
              {t('skills.available')}
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {filteredSkills.map((skill, index) => (
                <button
                  key={skill.id}
                  onClick={() => selectSkill(skill)}
                  onMouseEnter={() => setSelectedCommand(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    index === selectedCommand
                      ? dark 
                        ? 'bg-white/10' 
                        : 'bg-accent'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                    skill.color
                  )}>
                    <skill.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t(skill.nameKey)}</span>
                      <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {skill.command}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {t(skill.descKey)}
                    </p>
                  </div>
                  {index === selectedCommand && (
                    <CornerDownLeft className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
            <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/50 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-sans">↑↓</kbd>
                {t('skills.toNavigate')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-sans">↵</kbd>
                {t('skills.toSelect')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-sans">esc</kbd>
                {t('skills.toClose')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Container */}
      <div
        className={cn(
          'relative flex items-end gap-2 rounded-2xl border transition-all duration-200',
          dark
            ? 'bg-[#1a1a20] border-white/10 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20'
            : 'bg-background border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
          compact ? 'p-2' : 'p-3',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Active Command Indicator */}
        {activeCommand && (
          <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            <Zap className="w-3 h-3" />
            {t(SKILLS.find(s => s.id === activeCommand)?.nameKey || '')}
            <button
              onClick={() => {
                setActiveCommand(null)
                setInput('')
                inputRef.current?.focus()
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-primary-foreground/20"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={1}
          className={cn(
            'flex-1 bg-transparent resize-none outline-none placeholder:text-muted-foreground',
            sizeClasses[size]
          )}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled || loading}
          className={cn(
            'shrink-0 rounded-xl transition-all duration-200 flex items-center justify-center',
            compact ? 'w-8 h-8' : 'w-10 h-10',
            input.trim() && !disabled && !loading
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {loading ? (
            <Loader2 className={cn('animate-spin', compact ? 'w-4 h-4' : 'w-5 h-5')} />
          ) : (
            <Send className={cn(compact ? 'w-4 h-4' : 'w-5 h-5')} />
          )}
        </button>
      </div>

      {/* Shortcuts Hint */}
      {showShortcuts && !showCommands && (
        <div className={cn(
          'flex items-center gap-4 mt-2 text-xs text-muted-foreground',
          dark && 'text-white/40'
        )}>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-sans">/</kbd>
            {t('skills.forCommands')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-sans">↵</kbd>
            {t('skills.toSend')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-sans">Shift + ↵</kbd>
            {t('skills.forNewLine')}
          </span>
        </div>
      )}
    </div>
  )
}
