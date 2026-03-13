'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot,
  Send,
  Sparkles,
  Image as ImageIcon,
  MoreHorizontal,
  Paperclip,
  X,
  Maximize2,
  Minimize2,
  Settings,
  History,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  Type,
  Palette,
  PenTool,
  Video,
  Code2,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import NextImage from 'next/image'
import { useTOSUpload } from '@/hooks/useTOSUpload'
import { useChatSync } from '@/hooks/useChatSync'
import { LeftSidebar, SidebarTab, ChatSession } from '@/components/sidebar/LeftSidebar'
import { LoginModal } from '@/components/auth/LoginModal'
import { ReactFlowCanvas, CanvasItemData } from './ReactFlowCanvas'
import { ReactFlowProvider, useReactFlow, useNodesState, useEdgesState, useViewport } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import { Message } from '@/types'

// ============================================
// Types & Constants
// ============================================

interface SkillDetail {
  id: string
  title: string
  description: string
  image: string
  icon: React.ElementType
  color: string
}

interface Skill {
  id: string
  name: string
  icon: React.ElementType
  color: string
  bgColor: string
  details: SkillDetail[]
}

const SKILLS: Skill[] = [
  {
    id: 'image',
    name: 'Image Gen',
    icon: ImageIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    details: [
      { id: 'logo', title: 'Logo Design', description: 'Create professional logos for brands', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400', icon: Palette, color: 'bg-purple-500' },
      { id: 'illustration', title: 'Illustration', description: 'Generate artistic illustrations', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', icon: PenTool, color: 'bg-pink-500' },
    ]
  },
  {
    id: 'video',
    name: 'Video Gen',
    icon: Video,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    details: [
      { id: 'animation', title: 'Animation', description: 'Create animated videos', image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400', icon: Video, color: 'bg-blue-500' },
    ]
  },
  {
    id: 'code',
    name: 'Code',
    icon: Code2,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    details: [
      { id: 'react', title: 'React Components', description: 'Generate React components', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', icon: Code2, color: 'bg-cyan-500' },
    ]
  },
  {
    id: 'write',
    name: 'Write',
    icon: FileText,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    details: [
      { id: 'blog', title: 'Blog Posts', description: 'Write engaging blog content', image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400', icon: Type, color: 'bg-orange-500' },
    ]
  },
]

const AGENTS = [
  { id: 'default', name: 'Selgen Agent', icon: Sparkles, description: 'General purpose AI assistant' },
  { id: 'designer', name: 'Designer', icon: Palette, description: 'Specialized in design tasks' },
  { id: 'coder', name: 'Coder', icon: Code2, description: 'Specialized in code generation' },
  { id: 'writer', name: 'Writer', icon: FileText, description: 'Specialized in writing content' },
]

interface AgentCanvasProps {
  className?: string
  initialMessage?: string
  autoSend?: boolean
  onAutoSendComplete?: () => void
  onSendMessage?: (message: string) => void
  chatOpen?: boolean
  chatMessages?: Message[]
  onChatClose?: () => void
  onChatExpand?: () => void
  onChatSend?: (message: string) => void
  chatProcessing?: boolean
  currentSessionId?: string
  onSessionChange?: (sessionId: string) => void
  isAuthenticated?: boolean
  currentUser?: { username: string; avatar?: string } | null
  onLogin?: (username: string, password: string) => boolean
  onLogout?: () => void
}

type SelectedSkill = { skill: Skill; detail?: SkillDetail } | null

// ============================================
// Main Component
// ============================================

function AgentCanvasContent({ 
  className,
  initialMessage,
  autoSend,
  onAutoSendComplete,
  onSendMessage,
  chatOpen = false,
  chatMessages = [],
  onChatClose,
  onChatExpand,
  onChatSend,
  chatProcessing = false,
  currentSessionId = 'default',
  onSessionChange,
  isAuthenticated = true,
  currentUser,
  onLogin,
  onLogout
}: AgentCanvasProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('canvas')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { sessions, refresh: refreshSessions, createSession, renameSession, deleteSession } = useChatSync()
  const [localAuthError, setLocalAuthError] = useState('')
  
  const [activeTool, setActiveTool] = useState<string>('canvas')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(chatOpen)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  
  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasItemData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow()
  const { zoom: viewportZoom } = useViewport()
  const zoom = Math.round(viewportZoom * 100)

  // Chat Input State
  const [inputValue, setInputValue] = useState('')
  const [inputMode, setInputMode] = useState<'skills' | 'attachments' | 'agents' | null>(null)
  const [menuSelectedIndex, setMenuSelectedIndex] = useState(0)
  const [selectedSkill, setSelectedSkill] = useState<SelectedSkill>(null)
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)
  const [attachmentSearch, setAttachmentSearch] = useState('')
  const [selectedAttachments, setSelectedAttachments] = useState<{id: string, url: string, rawUrl: string, name: string, index: number, kind: 'image' | 'video' | 'file', label: string}[]>([])
  const [activeAgent, setActiveAgent] = useState('default')
  const [previewImage, setPreviewImage] = useState<{url: string, name: string} | null>(null)
  const [modalPreview, setModalPreview] = useState<{ url: string; name: string; kind: 'image' | 'video' } | null>(null)
  const [attachmentContextMenu, setAttachmentContextMenu] = useState<{ x: number; y: number; attachment: { id: string; url: string; rawUrl: string; name: string; kind: 'image' | 'video' | 'file' } } | null>(null)
  const [signedThumbs, setSignedThumbs] = useState<Record<string, string>>({})
  const processedMediaRef = useRef<Set<string>>(new Set())
  const hasLoadedCanvasRef = useRef(false)
  
  const chatInputRef = useRef<HTMLDivElement>(null)
  const dragAttachmentIdRef = useRef<string | null>(null)
  const { uploadFile } = useTOSUpload()

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
    }
  }, [isAuthenticated])

  const handleLogin = (username: string, password: string): boolean => {
    setLocalAuthError('')
    if (onLogin) {
      const success = onLogin(username, password)
      if (success) {
        setIsLoginModalOpen(false)
        return true
      } else {
        setLocalAuthError('用户名或密码错误')
        return false
      }
    }
    return false
  }

  const handleNewChat = () => {
    const newSession = sessions.length > 0 
      ? createSession()
      : { session_id: `session_${Date.now()}`, name: '新会话 1' } as ChatSession
    if (onSessionChange) {
      onSessionChange(newSession.session_id)
    }
    setActiveSidebarTab('canvas')
    setIsHistoryOpen(false)
    setIsChatOpen(true)
  }

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
  }

  const handleRegister = (username: string, password: string): boolean => {
    const existingUsers = JSON.parse(localStorage.getItem('selgen_users') || '[]')
    if (existingUsers.some((u: any) => u.username === username)) {
      return false
    }
    existingUsers.push({ username, password })
    localStorage.setItem('selgen_users', JSON.stringify(existingUsers))
    return true
  }

  useEffect(() => {
    setIsChatOpen(chatOpen)
  }, [chatOpen])

  useEffect(() => {
    if (!currentSessionId) return
    const raw = localStorage.getItem(`canvas_state_${currentSessionId}`)
    if (raw) {
      try {
        const data = JSON.parse(raw)
        if (Array.isArray(data?.nodes)) {
          setNodes(data.nodes)
          const agentUrls = data.nodes
            .filter((n: any) => n?.data?.source === 'agent' && n?.data?.url)
            .map((n: any) => n.data.url as string)
          processedMediaRef.current = new Set(agentUrls)
        } else {
          setNodes([])
        }
        if (Array.isArray(data?.edges)) {
          setEdges(data.edges)
        } else {
          setEdges([])
        }
      } catch {
        setNodes([])
        setEdges([])
      }
    } else {
      setNodes([])
      setEdges([])
    }
    hasLoadedCanvasRef.current = true
  }, [currentSessionId, setNodes, setEdges])

  useEffect(() => {
    if (!currentSessionId || !hasLoadedCanvasRef.current) return
    const payload = {
      nodes: nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          file: undefined
        }
      })),
      edges
    }
    localStorage.setItem(`canvas_state_${currentSessionId}`, JSON.stringify(payload))
  }, [currentSessionId, edges, nodes])

  // Auto-resize textarea
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto'
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 200)}px`
    }
  }, [inputValue])

  const handleChatHistorySelect = (chat: any) => {
      if (onSessionChange) {
          onSessionChange(chat.session_id)
      }
      setActiveTool('canvas')
      setIsHistoryOpen(false)
      setIsChatOpen(true)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getMediaDimensions = (file: File): Promise<{ width: number; height: number; aspectRatio: number }> => {
    return new Promise((resolve) => {
      const isVideo = file.type.startsWith('video/')
      if (isVideo) {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            aspectRatio: video.videoWidth / video.videoHeight,
          })
        }
        video.onerror = () => {
          resolve({ width: 1920, height: 1080, aspectRatio: 16 / 9 })
        }
        video.src = URL.createObjectURL(file)
      } else {
        const img = new window.Image()
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height,
          })
        }
        img.onerror = () => {
          resolve({ width: 800, height: 600, aspectRatio: 4 / 3 })
        }
        img.src = URL.createObjectURL(file)
      }
    })
  }

  // Input Handling Logic
  const handleChatUpload = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) continue

      const id = Math.random().toString(36).substring(7)
      const dimensions = await getMediaDimensions(file)
      const centerPosition = screenToFlowPosition({
        x: window.innerWidth / 2 - 150,
        y: window.innerHeight / 2 - 150,
      })

      const newNode: Node<CanvasItemData> = {
        id,
        type: 'media',
        position: centerPosition,
        data: {
          type: isImage ? 'image' : 'video',
          status: 'uploading',
          aspectRatio: dimensions.aspectRatio,
          name: file.name,
          file,
          source: 'user',
        },
      }
      setNodes((nds) => [...nds, newNode])

      try {
        const result = await uploadFile(file, 'default_user', 'chat_upload')

        if (result && result.file_url) {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: 'completed',
                      url: result.file_url,
                      rawUrl: result.raw_url || result.file_url,
                      name: result.file_info?.original_filename || file.name,
                    },
                  }
                : node
            )
          )
        } else {
          throw new Error('Upload failed - no URL returned')
        }
      } catch (error) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, status: 'error', error: 'Upload failed' } } : node
          )
        )
      }
    }
  }, [screenToFlowPosition, setNodes, uploadFile])

  const unifiedAttachments = useMemo(() => {
    return nodes
      .filter((node) => node.data?.url)
      .filter((node) => ['image', 'video', 'file'].includes(node.data.type as string))
      .map((node) => ({
        id: node.id,
        url: node.data.url as string,
        rawUrl: (node.data.rawUrl as string) || (node.data.url as string),
        name: node.data.name as string,
        kind: node.data.type as 'image' | 'video' | 'file',
        source: (node.data.source as string) || 'user',
      }))
      .filter((att) => att.source !== 'agent')
  }, [nodes])

  const filteredAttachments = useMemo(() => {
    if (!attachmentSearch) return unifiedAttachments
    const keyword = attachmentSearch.toLowerCase()
    return unifiedAttachments.filter(att => att.name.toLowerCase().includes(keyword))
  }, [attachmentSearch, unifiedAttachments])

  useEffect(() => {
    if (inputMode === 'attachments') {
      setMenuSelectedIndex(0)
    }
  }, [attachmentSearch, inputMode])

  const getTextBeforeCaret = () => {
    const el = chatInputRef.current
    const selection = window.getSelection()
    if (!el || !selection || selection.rangeCount === 0) return ''
    const range = selection.getRangeAt(0)
    if (!el.contains(range.startContainer)) return ''
    const preRange = range.cloneRange()
    preRange.selectNodeContents(el)
    preRange.setEnd(range.startContainer, range.startOffset)
    return preRange.toString()
  }

  const removeLastTriggerChar = (char: string) => {
    const el = chatInputRef.current
    if (!el) return
    const textBefore = getTextBeforeCaret()
    const idx = textBefore.lastIndexOf(char)
    if (idx === -1) return
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let currentIndex = 0
    let node = walker.nextNode()
    while (node) {
      const text = node.textContent || ''
      if (idx < currentIndex + text.length) {
        const offset = idx - currentIndex
        node.textContent = text.slice(0, offset) + text.slice(offset + 1)
        break
      }
      currentIndex += text.length
      node = walker.nextNode()
    }
  }

  const updateAttachmentLabelsFromDom = () => {
    const el = chatInputRef.current
    if (!el) return
    const ids: string[] = []
    const tags = Array.from(el.querySelectorAll('[data-attachment-id]')) as HTMLElement[]
    tags.forEach((tag, idx) => {
      const id = tag.dataset.attachmentId || ''
      if (!id) return
      const att = selectedAttachments.find(a => a.id === id)
      if (!att) return
      const label = labelForAttachment(att.kind, idx + 1)
      tag.textContent = label
      tag.dataset.attachmentLabel = label
      ids.push(id)
    })
    if (ids.length > 0) {
      setSelectedAttachments(prev => {
        const ordered = ids.map(id => prev.find(a => a.id === id)).filter(Boolean) as typeof prev
        return ordered.map((att, idx) => ({
          ...att,
          index: idx,
          label: labelForAttachment(att.kind, idx + 1)
        }))
      })
    }
  }

  const insertAttachmentTagAtCursor = (label: string, attachmentId: string) => {
    const el = chatInputRef.current
    const selection = window.getSelection()
    if (!el || !selection) return
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    const tag = document.createElement('span')
    tag.textContent = label
    tag.dataset.attachmentId = attachmentId
    tag.dataset.attachmentLabel = label
    tag.contentEditable = 'false'
    tag.className = 'inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/40 text-xs text-primary'
    tag.draggable = true
    const space = document.createTextNode(' ')
    if (range) {
      range.deleteContents()
      range.insertNode(tag)
      tag.after(space)
      range.setStartAfter(space)
      range.setEndAfter(space)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      el.appendChild(tag)
      el.appendChild(space)
    }
    el.focus()
    setInputValue(el.textContent || '')
    updateAttachmentLabelsFromDom()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const menuOptions = inputMode === 'skills'
      ? SKILLS
      : inputMode === 'attachments'
        ? filteredAttachments
        : inputMode === 'agents'
          ? AGENTS
          : []
    
    if (inputMode && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      e.preventDefault()
      if (menuOptions.length === 0) {
        return
      }
      
      if (e.key === 'ArrowDown') {
        setMenuSelectedIndex(prev => (prev + 1) % menuOptions.length)
      } else if (e.key === 'ArrowUp') {
        setMenuSelectedIndex(prev => (prev - 1 + menuOptions.length) % menuOptions.length)
      } else if (e.key === 'Enter') {
        if (inputMode === 'skills' && SKILLS[menuSelectedIndex]) {
          handleSkillSelect(SKILLS[menuSelectedIndex])
        } else if (inputMode === 'attachments' && filteredAttachments[menuSelectedIndex]) {
          const item = filteredAttachments[menuSelectedIndex]
          handleAttachmentSelect(item, menuSelectedIndex)
        } else if (inputMode === 'agents' && AGENTS[menuSelectedIndex]) {
          handleAgentSelect(AGENTS[menuSelectedIndex].id)
        }
        setMenuSelectedIndex(0)
      }
      return
    }
    
    // Backspace to remove last tag when input is empty
    if (e.key === 'Backspace') {
      const selection = window.getSelection()
      const el = chatInputRef.current
      if (selection && el && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        if (range.collapsed) {
          const container = range.startContainer
          if (container.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
            const prev = container.previousSibling as HTMLElement | null
            if (prev && (prev.dataset?.attachmentId || prev.dataset?.skillLabel)) {
              e.preventDefault()
              if (prev.dataset.attachmentId) {
                const id = prev.dataset.attachmentId
                prev.remove()
                setSelectedAttachments(prevState => {
                  const next = prevState.filter(a => a.id !== id)
                  return next.map((att, idx) => ({
                    ...att,
                    index: idx,
                    label: labelForAttachment(att.kind, idx + 1)
                  }))
                })
                updateAttachmentLabelsFromDom()
                return
              }
              if (prev.dataset.skillLabel) {
                prev.remove()
                setSelectedSkill(null)
                return
              }
              return
            }
          }
        }
      }

      if (inputValue === '' && !inputMode) {
        if (selectedAttachments.length > 0) {
          setSelectedAttachments(prev => prev.slice(0, -1).map((att, idx) => ({
            ...att,
            index: idx,
            label: labelForAttachment(att.kind, idx + 1)
          })))
        } else if (selectedSkill) {
          setSelectedSkill(null)
        }
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
    if (e.key === 'Escape') {
      setInputMode(null)
      setMenuSelectedIndex(0)
      setAttachmentSearch('')
    }
  }

  const handleInputChange = () => {
    const el = chatInputRef.current
    const value = el?.textContent || ''
    setInputValue(value)
    const textBeforeCursor = getTextBeforeCaret()
    const lastChar = textBeforeCursor.slice(-1)

    if (lastChar === '/') {
      setInputMode('skills')
      setMenuSelectedIndex(0)
      return
    }

    if (lastChar === '#') {
      setInputMode('attachments')
      setMenuSelectedIndex(0)
      setAttachmentSearch('')
      return
    }

    if (lastChar === '@') {
      setInputMode('agents')
      setMenuSelectedIndex(0)
      return
    }

    if (inputMode === 'attachments') {
      const hashIndex = textBeforeCursor.lastIndexOf('#')
      if (hashIndex >= 0) {
        setAttachmentSearch(textBeforeCursor.slice(hashIndex + 1))
      } else {
        setAttachmentSearch('')
      }
      return
    }

    if (inputMode && !value.includes('/') && !value.includes('#') && !value.includes('@')) {
      setInputMode(null)
      setMenuSelectedIndex(0)
      setAttachmentSearch('')
    }
  }

  const insertSkillTagAtCursor = (skill: Skill) => {
    const el = chatInputRef.current
    const selection = window.getSelection()
    if (!el || !selection) return
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    const tag = document.createElement('span')
    tag.textContent = `[${skill.name}]`
    tag.dataset.skillLabel = `[${skill.name}]`
    tag.contentEditable = 'false'
    tag.className = `inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${skill.bgColor} ${skill.color}`
    const space = document.createTextNode(' ')
    if (range) {
      range.deleteContents()
      range.insertNode(tag)
      tag.after(space)
      range.setStartAfter(space)
      range.setEndAfter(space)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      el.appendChild(tag)
      el.appendChild(space)
    }
    el.focus()
    setInputValue(el.textContent || '')
  }

  const handleSkillSelect = (skill: Skill) => {
    removeLastTriggerChar('/')
    insertSkillTagAtCursor(skill)
    setSelectedSkill({ skill })
    setInputMode(null)
  }

  const resolveAttachmentKind = useCallback((url: string) => {
    const lower = url.split('?')[0].toLowerCase()
    if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return 'video'
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return 'image'
    return 'file'
  }, [])

  const parseMessageAttachments = useCallback((content: string) => {
    const items: { label: string; url: string; kind: 'image' | 'video' | 'file' }[] = []
    const regex = /\[(图片|视频|附件)\s*\d+\]\(((?:https?:\/\/|\/?api\/uploads\/)[^)]+)\)/g
    const normalizeUrl = (raw: string) => {
      if (raw.includes('/_next/image?') && raw.includes('url=')) {
        try {
          const parsed = new URL(raw, window.location.origin)
          const inner = parsed.searchParams.get('url')
          if (inner) return decodeURIComponent(inner)
        } catch {
          return raw
        }
      }
      return raw
    }
    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      const label = match[1]
      const url = normalizeUrl(match[2])
      const kind = resolveAttachmentKind(url)
      items.push({ label, url, kind })
    }
    const text = content
      .replace(regex, '')
      .replace(/(?:https?:\/\/\S+|\/?api\/uploads\/\S+)/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    return { text, items }
  }, [resolveAttachmentKind])

  const isUnsignedUploadUrl = useCallback((url: string) => {
    if (!url) return false
    if (!url.includes('/api/uploads/')) return false
    return !(url.includes('expires=') && url.includes('sig='))
  }, [])

  const getSignedUrl = useCallback((url: string) => {
    return signedThumbs[url] || url
  }, [signedThumbs])

  useEffect(() => {
    const pending: string[] = []
    const collect = (url?: string) => {
      if (!url) return
      if (isUnsignedUploadUrl(url) && !signedThumbs[url]) {
        pending.push(url)
      }
    }
    for (const msg of chatMessages) {
      const { items } = parseMessageAttachments(msg.content || '')
      for (const att of items) {
        if (att.kind !== 'image' && att.kind !== 'video') continue
        collect(att.url)
      }
    }
    for (const att of unifiedAttachments) {
      if (att.kind !== 'image' && att.kind !== 'video') continue
      collect(att.url)
    }
    if (pending.length === 0) return
    let cancelled = false
    const fetchSignedUrl = async (rawUrl: string) => {
      try {
        const timeout = new Promise<string>((resolve) =>
          setTimeout(() => resolve(rawUrl), 3000)
        )
        const fetchPromise = fetch('/api/uploads/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl })
        }).catch(() => rawUrl)
        const resOrUrl = await Promise.race([fetchPromise, timeout])
        if (typeof resOrUrl === 'string') return resOrUrl
        if (!resOrUrl.ok) return rawUrl
        const data = await resOrUrl.json()
        return data?.data?.signed_url || rawUrl
      } catch {
        return rawUrl
      }
    }
    ;(async () => {
      for (const url of pending) {
        if (cancelled) return
        const signed = await fetchSignedUrl(url)
        if (signed && signed !== url) {
          setSignedThumbs((prev) => (prev[url] ? prev : { ...prev, [url]: signed }))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chatMessages, unifiedAttachments, isUnsignedUploadUrl, signedThumbs, parseMessageAttachments])

  const labelForAttachment = (kind: 'image' | 'video' | 'file', order: number) => {
    const labelPrefix = kind === 'video' ? '视频' : kind === 'image' ? '图片' : '附件'
    return `[${labelPrefix} ${order}]`
  }

  const handleAttachmentSelect = (attachment: {id: string, url: string, rawUrl: string, name: string, kind?: 'image' | 'video' | 'file'}, index: number, removeTrigger: boolean = true) => {
    if (removeTrigger) {
      removeLastTriggerChar('#')
    }
    const kind = attachment.kind ?? resolveAttachmentKind(attachment.url)
    const order = selectedAttachments.length + 1
    const label = labelForAttachment(kind, order)
    insertAttachmentTagAtCursor(label, attachment.id)
    setSelectedAttachments(prev => [...prev, { ...attachment, index: order - 1, kind, label }])
    setInputMode(null)
    setAttachmentSearch('')
  }

  const addAttachmentToChat = (attachment: {id: string, url: string, rawUrl: string, name: string, kind?: 'image' | 'video' | 'file'}) => {
    if (selectedAttachments.some(att => att.id === attachment.id)) {
      return
    }
    handleAttachmentSelect(attachment, selectedAttachments.length, false)
  }

  const handleAttachmentContextMenu = useCallback((e: React.MouseEvent, attachment: { id: string; url?: string; rawUrl?: string; name: string; type: 'image' | 'video' | 'audio' | 'file' }) => {
    const kind = attachment.type === 'video' || attachment.type === 'image' ? attachment.type : 'file'
    setAttachmentContextMenu({
      x: e.clientX,
      y: e.clientY,
      attachment: {
        id: attachment.id,
        url: attachment.url || '',
        rawUrl: attachment.rawUrl || attachment.url || '',
        name: attachment.name,
        kind
      }
    })
  }, [])

  const handleAgentSelect = (agentId: string) => {
    removeLastTriggerChar('@')
    setActiveAgent(agentId)
    setInputMode(null)
  }

  const handleSend = async () => {
    if (!inputValue.trim() && !selectedSkill && selectedAttachments.length === 0) return
    const el = chatInputRef.current
    let composed = ''
    const fetchSignedUrl = async (rawUrl: string) => {
      try {
        const timeout = new Promise<string>((resolve) =>
          setTimeout(() => resolve(rawUrl), 3000)
        )
        const fetchPromise = fetch('/api/uploads/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl })
        }).catch(() => rawUrl)
        const resOrUrl = await Promise.race([fetchPromise, timeout])
        if (typeof resOrUrl === 'string') return resOrUrl
        if (!resOrUrl.ok) return rawUrl
        const data = await resOrUrl.json()
        return data?.data?.signed_url || rawUrl
      } catch {
        return rawUrl
      }
    }
    const signedMap = new Map<string, string>()
    await Promise.all(
      selectedAttachments.map(async (att) => {
        if (!att.rawUrl) return
        if (signedMap.has(att.rawUrl)) return
        const signedUrl = await fetchSignedUrl(att.rawUrl)
        signedMap.set(att.rawUrl, signedUrl)
      })
    )
    if (el) {
      el.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          composed += node.textContent || ''
        } else if (node instanceof HTMLElement && node.dataset.attachmentLabel) {
          const id = node.dataset.attachmentId || ''
          const att = selectedAttachments.find(a => a.id === id)
          const rawUrl = att?.rawUrl || ''
          const signedUrl = rawUrl ? (signedMap.get(rawUrl) || rawUrl) : ''
          composed += `${node.dataset.attachmentLabel}${signedUrl ? `(${signedUrl})` : ''}`
        } else if (node instanceof HTMLElement && node.dataset.skillLabel) {
          composed += node.dataset.skillLabel
        }
      })
    } else {
      composed = inputValue
    }
    composed = composed.trim()
    console.log('[AgentCanvas] Composed message to send:', composed)
    console.log('[AgentCanvas] Selected attachments:', selectedAttachments)
    if (onChatSend) {
      onChatSend(composed)
    } else if (onSendMessage) {
      onSendMessage(composed)
    }
    setInputValue('')
    setSelectedSkill(null)
    setSelectedAttachments([])
    if (chatInputRef.current) {
      chatInputRef.current.textContent = ''
    }
  }

  useEffect(() => {
    const mediaUrls: { url: string; type: 'image' | 'video' | 'audio' | 'file'; name: string }[] = []
    const urlRegex = /(https?:\/\/[^\s)]+|\/api\/uploads\/[^\s)]+)/g
    const extensionType = (url: string) => {
      const lower = url.split('?')[0].toLowerCase()
      if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return 'image'
      if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return 'video'
      if (/\.(mp3|wav|m4a|aac|flac|ogg)$/.test(lower)) return 'audio'
      return 'file'
    }

    for (const msg of chatMessages) {
      if (msg.role !== 'assistant') continue
      const matches = msg.content?.match(urlRegex) || []
      for (const rawUrl of matches) {
        const url = rawUrl.replace(/[)\]]+$/, '')
        if (processedMediaRef.current.has(url)) continue
        processedMediaRef.current.add(url)
        const type = extensionType(url)
        const name = url.split('/').pop() || url
        mediaUrls.push({ url, type, name })
      }
    }

    if (mediaUrls.length === 0) return

    setNodes((prev) => {
      const existing = prev.filter(n => n.data.source === 'agent')
      const baseIndex = existing.length
      const columnCount = 3
      const gapX = 340
      const gapY = 240
      const startX = 60
      const startY = 60

      const newNodes: Node<CanvasItemData>[] = mediaUrls.map((item, idx) => {
        const index = baseIndex + idx
        const col = index % columnCount
        const row = Math.floor(index / columnCount)
        const position = { x: startX + col * gapX, y: startY + row * gapY }
        return {
          id: `chat_media_${Date.now()}_${index}`,
          type: item.type === 'image' || item.type === 'video' ? 'media' : 'file',
          position,
          data: {
            type: item.type,
            status: 'completed',
            aspectRatio: item.type === 'image' || item.type === 'video' ? 16 / 9 : 1,
            name: item.name,
            url: item.url,
            rawUrl: item.url,
            source: 'agent',
          },
        }
      })
      return [...prev, ...newNodes]
    })
  }, [chatMessages, setNodes])

  const toolbarItems = [
    { id: 'canvas', icon: MousePointer2, label: 'Select' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  const activeSkillDetails = hoveredSkill
    ? SKILLS.find((s) => s.id === hoveredSkill)?.details
    : null

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeSidebarTab}
        onTabChange={setActiveSidebarTab}
        currentUser={currentUser}
        onLogout={onLogout}
        onLoginClick={handleLoginClick}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(session) => {
          if (onSessionChange) {
            onSessionChange(session.session_id)
          }
          setActiveSidebarTab('canvas')
          setIsChatOpen(true)
        }}
        onNewSession={handleNewChat}
        onRenameSession={(session, newName) => {
          renameSession(session.session_id, newName)
        }}
        onDeleteSession={(sessionId) => {
          deleteSession(sessionId)
        }}
      />
      <div
        className={cn("relative flex-1 h-full bg-[#0a0a0f] text-foreground overflow-hidden", className)}
        onClick={() => setAttachmentContextMenu(null)}
      >
        <ReactFlowCanvas 
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={setNodes}
          onAttachmentContextMenu={handleAttachmentContextMenu}
        />

        <div className="absolute top-4 left-4 z-50">
          <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#141419]/90 backdrop-blur-sm border border-white/10 shadow-lg">
            <button onClick={() => zoomOut()} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors" title="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-muted-foreground text-sm font-medium transition-colors min-w-[60px] cursor-default">
              {zoom}%
            </button>
            <button onClick={() => zoomIn()} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors" title="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-2" />
            <button onClick={() => fitView()} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors" title="Fit View">
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-2" />
            <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors" title="Fullscreen">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Chat Panel - Right Side - Increased Width to 480px */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ x: 480, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 480, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-4 top-4 bottom-4 w-[480px] bg-[#141419]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col"
            >
               {/* Chat Header */}
               <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">CoPaw Assistant</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">Online</span>
                      </div>
                    </div>
                  </div>
                   <div className="flex items-center gap-1">
                     <button className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors">
                       <MoreHorizontal className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => {
                         setIsChatOpen(false)
                         onChatClose?.()
                       }}
                       className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors"
                     >
                       <Minimize2 className="w-4 h-4" />
                     </button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg, idx) => {
                    const { text, items } = parseMessageAttachments(msg.content || '')
                    const isUser = msg.role === 'user'
                    return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className={cn(
                        "flex gap-3",
                        isUser ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                        isUser 
                          ? "bg-gradient-to-br from-violet-500 to-purple-600" 
                          : "bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10"
                      )}>
                        {isUser ? (
                          <UserIcon className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <div className={cn(
                        "flex flex-col gap-1 max-w-[85%]",
                        isUser ? "items-end" : "items-start"
                      )}>
                         <div className={cn(
                           "relative px-4 py-3 text-sm leading-relaxed",
                           isUser 
                             ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-purple-500/20" 
                             : "bg-[#1a1a1f] border border-white/10 text-foreground rounded-2xl rounded-tl-sm shadow-xl"
                         )}>
                           {text && (
                             <p className="whitespace-pre-wrap" style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
                               {text}
                             </p>
                           )}
                           {msg.isLoading && !text && (
                             <div className="flex items-center gap-1.5 py-1">
                               <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                               <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                               <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                             </div>
                           )}
                           {items.length > 0 && (
                             <div className="mt-3 flex flex-wrap gap-2">
                               {items.map((att, index) => {
                                 const displayUrl = signedThumbs[att.url] || att.url
                                 return (
                                 <motion.button
                                   key={`${att.url}-${index}`}
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                                   onClick={() => {
                                     if (att.kind === 'image' || att.kind === 'video') {
                                       setModalPreview({ url: displayUrl, name: att.label, kind: att.kind })
                                     }
                                   }}
                                   className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#0a0a0f] border border-white/10 shadow-lg group"
                                 >
                                   {att.kind === 'image' ? (
                                     <NextImage
                                       src={displayUrl}
                                       alt={att.label}
                                       width={80}
                                       height={80}
                                       className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                     />
                                   ) : att.kind === 'video' ? (
                                     <video
                                       src={displayUrl}
                                       className="w-full h-full object-cover"
                                       muted
                                       preload="metadata"
                                     />
                                   ) : (
                                     <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                       {att.label}
                                     </div>
                                   )}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </motion.button>
                               )})}
                             </div>
                           )}
                         </div>
                         <span className="text-[10px] text-muted-foreground/50 px-1">
                           {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                       </div>
                     </motion.div>
                   )})}
                   {chatProcessing && !chatMessages.some(m => m.isLoading) && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="flex gap-3"
                     >
                       <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center shadow-lg">
                         <Bot className="w-4 h-4 text-purple-400" />
                       </div>
                       <div className="flex items-center gap-1 px-4 py-3 bg-[#1a1a1f] border border-white/10 rounded-2xl rounded-tl-sm shadow-xl">
                         <motion.div 
                           animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                           transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} 
                           className="w-1.5 h-1.5 bg-purple-400 rounded-full" 
                         />
                         <motion.div 
                           animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                           transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.2 }} 
                           className="w-1.5 h-1.5 bg-purple-400 rounded-full" 
                         />
                         <motion.div 
                           animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                           transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.4 }} 
                           className="w-1.5 h-1.5 bg-purple-400 rounded-full" 
                         />
                       </div>
                     </motion.div>
                   )}
                </div>

               {/* Chat Input Area */}
               <div className="p-4 bg-[#141419]/50 border-t border-white/10">
                 {/* Popups for Skills/Attachments/Agents */}
                 <div className="relative">
                   {/* Input Mode Popups */}
                   {inputMode === 'skills' && (
                     <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                        <div className="flex flex-col p-1">
                          {SKILLS.map((skill, idx) => (
                            <button
                              key={skill.id}
                              onClick={() => handleSkillSelect(skill)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left',
                                skill.bgColor, skill.color, 'border-current hover:opacity-80',
                                menuSelectedIndex === idx && 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1f]'
                              )}
                            >
                              <skill.icon className="w-4 h-4" />
                              <span>{skill.name}</span>
                            </button>
                          ))}
                        </div>
                     </div>
                   )}

                   {inputMode === 'attachments' && (
                     <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                        <div className="p-2">
                          <div className="flex flex-col gap-1">
                            {filteredAttachments.map((att, idx) => (
                              <button
                                key={att.id}
                                onClick={() => handleAttachmentSelect(att, idx)}
                                className={cn(
                                  'flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all overflow-hidden text-left',
                                  menuSelectedIndex === idx && 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1f]'
                                )}
                              >
                                <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0">
                                  {idx + 1}
                                </div>
                                {att.kind !== 'file' && att.url ? (
                                  <NextImage
                                    src={getSignedUrl(att.url)}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                )}
                                <span className="text-xs text-muted-foreground truncate">{att.name}</span>
                              </button>
                            ))}
                            {filteredAttachments.length === 0 && (
                              <span className="text-xs text-muted-foreground py-1 text-center">No items found</span>
                            )}
                          </div>
                        </div>
                     </div>
                   )}

                   {inputMode === 'agents' && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                        <div className="flex flex-col p-1">
                          {AGENTS.map((agent, idx) => (
                            <button
                              key={agent.id}
                              onClick={() => handleAgentSelect(agent.id)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left',
                                'bg-white/5 border-white/10 hover:border-white/20',
                                activeAgent === agent.id && 'border-primary bg-primary/10',
                                menuSelectedIndex === idx && 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1f]'
                              )}
                            >
                              <agent.icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{agent.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                   )}
                 </div>

               {unifiedAttachments.filter(att => att.kind !== 'file').length > 0 && (
                   <div className="mb-3">
                     <div className="flex flex-wrap gap-2">
                        {unifiedAttachments.filter(att => att.kind !== 'file').map((att) => (
                         <div
                           key={att.id}
                           className="relative group"
                            onMouseEnter={() => att.url && setPreviewImage({ url: getSignedUrl(att.url), name: att.name })}
                           onMouseLeave={() => setPreviewImage(null)}
                           onContextMenu={(e) => {
                             e.preventDefault()
                             setAttachmentContextMenu({
                               x: e.clientX,
                               y: e.clientY,
                               attachment: att
                             })
                           }}
                         >
                          {att.url ? (
                             <NextImage
                              src={getSignedUrl(att.url)}
                               alt={att.name}
                               width={48}
                               height={48}
                               className="w-12 h-12 rounded-lg object-cover"
                             />
                           ) : (
                             <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                               <ImageIcon className="w-6 h-6 text-purple-400" />
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {previewImage && (
                   <div className="fixed z-[200] left-1/2 -translate-x-1/2" style={{ bottom: '220px' }}>
                    <NextImage
                      src={getSignedUrl(previewImage.url)}
                       alt={previewImage.name}
                       width={450}
                       height={300}
                       className="max-w-[450px] max-h-[300px] rounded-lg shadow-2xl object-contain"
                     />
                   </div>
                 )}

                {modalPreview && (
                  <div
                    className="fixed inset-0 z-[220] bg-black/70 flex items-center justify-center"
                    onClick={() => setModalPreview(null)}
                  >
                    {modalPreview.kind === 'image' ? (
                      <NextImage
                        src={getSignedUrl(modalPreview.url)}
                        alt={modalPreview.name}
                        width={900}
                        height={700}
                        className="max-w-[80vw] max-h-[80vh] rounded-xl object-contain"
                      />
                    ) : (
                      <video
                        src={modalPreview.url}
                        className="max-w-[80vw] max-h-[80vh] rounded-xl"
                        controls
                        autoPlay
                      />
                    )}
                  </div>
                )}

                {attachmentContextMenu && (
                  <div
                    className="fixed z-[210] bg-[#1a1a1f] border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
                    style={{ left: attachmentContextMenu.x, top: attachmentContextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        addAttachmentToChat(attachmentContextMenu.attachment)
                        setAttachmentContextMenu(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/5 flex items-center gap-2"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>添加到聊天</span>
                    </button>
                  </div>
                )}

                 {/* Input Bar */}
                 <div className="relative bg-[#0a0a0f] border border-white/10 rounded-xl focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                   <div className="relative py-2 pl-3 pr-12">
                     {!inputValue && selectedAttachments.length === 0 && !selectedSkill && (
                       <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
                         Type / for skills, # for attachments, @ for agents...
                       </div>
                     )}
                     <div
                       ref={chatInputRef}
                       contentEditable
                       suppressContentEditableWarning
                       onInput={handleInputChange}
                       onKeyDown={handleKeyDown}
                       onDragStart={(e) => {
                         const target = e.target as HTMLElement
                         const id = target.dataset?.attachmentId
                         if (id) {
                           dragAttachmentIdRef.current = id
                         }
                       }}
                       onDragOver={(e) => {
                         if (dragAttachmentIdRef.current) {
                           e.preventDefault()
                         }
                       }}
                       onDrop={(e) => {
                         const el = chatInputRef.current
                         const draggedId = dragAttachmentIdRef.current
                         dragAttachmentIdRef.current = null
                         if (!el || !draggedId) return
                         const target = e.target as HTMLElement
                         const targetId = target.dataset?.attachmentId
                         if (!targetId || targetId === draggedId) return
                         const draggedEl = el.querySelector(`[data-attachment-id=\"${draggedId}\"]`)
                         const targetEl = el.querySelector(`[data-attachment-id=\"${targetId}\"]`)
                         if (draggedEl && targetEl) {
                           targetEl.before(draggedEl)
                           updateAttachmentLabelsFromDom()
                           setInputValue(el.textContent || '')
                         }
                       }}
                       onMouseOver={(e) => {
                         const target = e.target as HTMLElement
                         const id = target.dataset?.attachmentId
                         if (!id) return
                         const att = selectedAttachments.find(a => a.id === id)
                         if (att?.url) {
                           setPreviewImage({ url: att.url, name: att.name })
                         }
                       }}
                       onMouseOut={(e) => {
                         const target = e.target as HTMLElement
                         const id = target.dataset?.attachmentId
                         if (id) {
                           setPreviewImage(null)
                         }
                       }}
                       className="min-h-[28px] max-h-[200px] overflow-y-auto text-sm outline-none"
                     />
                   </div>
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <button 
                         className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                         onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*,video/*'
                            input.multiple = true
                            input.onchange = (e) => handleChatUpload((e.target as HTMLInputElement).files!)
                            input.click()
                         }}
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleSend()}
                        disabled={!inputValue.trim() && !selectedSkill && selectedAttachments.length === 0}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          (inputValue.trim() || selectedSkill || selectedAttachments.length > 0)
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-white/5 text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                 </div>

                 {/* Helper Hints */}
                 <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                      <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded border border-white/5">/</kbd> skills</span>
                      <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded border border-white/5">#</kbd> attach</span>
                      <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded border border-white/5">@</kbd> agent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                          {AGENTS.find(a => a.id === activeAgent)?.icon && 
                             React.createElement(AGENTS.find(a => a.id === activeAgent)!.icon, { className: "w-2.5 h-2.5 text-white" })
                          }
                       </div>
                       <span className="text-[10px] text-muted-foreground">{AGENTS.find(a => a.id === activeAgent)?.name}</span>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

         {!isChatOpen && (
           <button
             onClick={() => {
               setIsChatOpen(true)
               onChatExpand?.()
             }}
             className="fixed right-4 top-1/2 -translate-y-1/2 z-40 px-3 py-2 rounded-full bg-[#141419]/90 border border-white/10 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
           >
             展开聊天
           </button>
         )}

         <LoginModal
           isOpen={isLoginModalOpen}
           onClose={() => setIsLoginModalOpen(false)}
           onLogin={handleLogin}
           onRegister={handleRegister}
           error={localAuthError}
         />
       </div>
     </div>
   )
 }

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function AgentCanvas(props: AgentCanvasProps) {
  return (
    <ReactFlowProvider>
      <AgentCanvasContent {...props} />
    </ReactFlowProvider>
  )
}
