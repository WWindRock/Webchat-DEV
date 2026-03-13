'use client'

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  NodeToolbar,
  useReactFlow,
  BackgroundVariant,
  SelectionMode,
  Position,
} from '@xyflow/react'
import type { Node, Edge, OnNodesChange, OnEdgesChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import {
  X,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Layers,
  Type,
  Box,
  Loader2,
  Play,
  Pause,
  MoreHorizontal,
  Download,
  Edit3,
  Eraser,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTOSUpload } from '@/hooks/useTOSUpload'
import { SignedImage } from '@/components/SignedImage'

// ============================================
// Types
// ============================================

export interface CanvasItemData extends Record<string, unknown> {
  type: 'image' | 'video' | 'audio' | 'file'
  status: 'uploading' | 'processing' | 'completed' | 'error'
  url?: string
  rawUrl?: string
  name: string
  aspectRatio: number
  file?: File
  error?: string
  source?: 'canvas' | 'chat' | 'user' | 'agent'
}

// ============================================
// Custom Nodes
// ============================================

function ToolbarButton({ icon: Icon, tooltip, onClick }: { icon: React.ElementType; tooltip: string; onClick?: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
      title={tooltip}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

function MediaNode({ id, data, selected, onAttachmentContextMenu }: { id: string; data: CanvasItemData; selected: boolean; onAttachmentContextMenu?: (e: React.MouseEvent, attachment: { id: string; url?: string; rawUrl?: string; name: string; type: CanvasItemData['type'] }) => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={20}
      >
        <div className="flex items-center gap-1 px-2 py-2 rounded-xl bg-[#141419]/95 backdrop-blur-sm border border-white/10 shadow-2xl">
          <ToolbarButton icon={ZoomIn} tooltip="Zoom In" />
          <ToolbarButton icon={ZoomOut} tooltip="Zoom Out" />
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarButton icon={Layers} tooltip="Remove Background" />
          <ToolbarButton icon={Box} tooltip="Mockup" />
          <ToolbarButton icon={Eraser} tooltip="Erase" />
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarButton icon={Edit3} tooltip="Edit Elements" />
          <ToolbarButton icon={Type} tooltip="Edit Text" />
          <ToolbarButton icon={Download} tooltip="Download" />
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarButton icon={MoreHorizontal} tooltip="More Options" />
        </div>
      </NodeToolbar>

      <div
        className={cn(
          "relative rounded-xl overflow-hidden bg-[#141419] border-2 transition-all",
          selected
            ? "border-primary shadow-lg shadow-primary/20"
            : "border-white/10 hover:border-white/20"
        )}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onAttachmentContextMenu?.(e, {
            id,
            url: data.url,
            rawUrl: data.rawUrl,
            name: data.name,
            type: data.type
          })
        }}
        style={{ width: 300, aspectRatio: data.aspectRatio }}
      >
        {data.status === 'uploading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141419]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-primary mb-2" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </div>
        )}

        {data.status === 'processing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141419]">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-primary mb-2" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
        )}

        {data.status === 'completed' && data.url && (
          <>
            {data.type === 'image' ? (
              <SignedImage
                src={data.url}
                alt={data.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={data.url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    onClick={handlePlayPause}
                    className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {data.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141419]">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
              <X className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-sm text-red-400">Upload failed</span>
          </div>
        )}
      </div>

    </>
  )
}

function FileNode({ id, data, selected, onAttachmentContextMenu }: { id: string; data: CanvasItemData; selected: boolean; onAttachmentContextMenu?: (e: React.MouseEvent, attachment: { id: string; url?: string; rawUrl?: string; name: string; type: CanvasItemData['type'] }) => void }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#141419] border-2 transition-all p-4 w-[260px]",
        selected
          ? "border-primary shadow-lg shadow-primary/20"
          : "border-white/10 hover:border-white/20"
      )}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onAttachmentContextMenu?.(e, {
          id,
          url: data.url,
          rawUrl: data.rawUrl,
          name: data.name,
          type: data.type
        })
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          {data.type === 'audio' ? (
            <Sparkles className="w-5 h-5 text-primary" />
          ) : (
            <Download className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{data.name}</div>
          <div className="text-xs text-muted-foreground capitalize">{data.type}</div>
        </div>
      </div>
      {data.url && (
        <a
          href={data.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-xs text-primary hover:underline"
        >
          <Download className="w-3 h-3" />
          Open
        </a>
      )}
    </div>
  )
}

// ============================================
// Main Component
// ============================================

interface ReactFlowCanvasProps {
  className?: string
  nodes?: Node<CanvasItemData>[]
  edges?: Edge[]
  onNodesChange?: OnNodesChange<Node<CanvasItemData>>
  onEdgesChange?: OnEdgesChange<Edge>
  setNodes?: React.Dispatch<React.SetStateAction<Node<CanvasItemData>[]>>
  onAttachmentContextMenu?: (e: React.MouseEvent, attachment: { id: string; url?: string; rawUrl?: string; name: string; type: CanvasItemData['type'] }) => void
}

export function ReactFlowCanvas({ 
  className,
  nodes = [], 
  edges = [], 
  onNodesChange, 
  onEdgesChange,
  setNodes,
  onAttachmentContextMenu
}: ReactFlowCanvasProps) {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const { uploadFile } = useTOSUpload()
  const { screenToFlowPosition, fitView } = useReactFlow()
  const onAttachmentContextMenuRef = useRef(onAttachmentContextMenu)

  useEffect(() => {
    onAttachmentContextMenuRef.current = onAttachmentContextMenu
  }, [onAttachmentContextMenu])

  const nodeTypes = useMemo(() => ({
    media: (props: any) => (
      <MediaNode
        {...props}
        onAttachmentContextMenu={(e, attachment) => onAttachmentContextMenuRef.current?.(e, attachment)}
      />
    ),
    file: (props: any) => (
      <FileNode
        {...props}
        onAttachmentContextMenu={(e, attachment) => onAttachmentContextMenuRef.current?.(e, attachment)}
      />
    )
  }), [])

  // File Upload Logic (Context Menu)
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!setNodes) return // Need setNodes to add files

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) continue

      const dimensions = await getMediaDimensions(file)
      const id = Math.random().toString(36).substring(7)

      // Center node in viewport
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
        const result = await uploadFile(file, 'default_user', 'canvas_upload')

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
            node.id === id
              ? { ...node, data: { ...node.data, status: 'error', error: 'Upload failed' } }
              : node
          )
        )
      }
    }
  }, [setNodes, uploadFile, screenToFlowPosition])

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

  return (
    <div 
      className={cn("w-full h-full bg-[#0a0a0f]", className)}
      onContextMenu={(e) => {
        e.preventDefault()
        setContextMenuPos({ x: e.clientX, y: e.clientY })
        setShowContextMenu(true)
      }}
      onClick={() => setShowContextMenu(false)}
    >
      <ReactFlow<Node<CanvasItemData>, Edge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        minZoom={0.1}
        maxZoom={5}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        panOnDrag={[1]}
        selectionOnDrag={false}
        selectionMode={SelectionMode.Partial}
        className="bg-[#0a0a0f]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.15)"
        />
      </ReactFlow>
      
      {/* Right Click Context Menu */}
      {showContextMenu && (
        <div 
          className="fixed z-[150] bg-[#1a1a1f] border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*,video/*'
              input.multiple = true
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files
                if (files) handleFileUpload(files)
              }
              input.click()
              setShowContextMenu(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/5 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload to Canvas</span>
          </button>
          <button
            onClick={() => {
              fitView()
              setShowContextMenu(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/5 flex items-center gap-2"
          >
            <ZoomIn className="w-4 h-4" />
            <span>Fit View</span>
          </button>
        </div>
      )}
    </div>
  )
}
