'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Image as ImageIcon,
  Video,
  Code,
  FileText,
  Trash2,
  Download,
  ExternalLink,
  Grid,
  List,
  Search,
  Filter,
  MoreVertical,
  Check
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

interface Asset {
  id: string
  type: 'image' | 'video' | 'code' | 'text'
  title?: string
  description?: string
  url: string
  thumbnailUrl?: string
  metadata?: Record<string, any>
  createdAt: string
}

interface AssetGridProps {
  assets?: Asset[]
  className?: string
  onDelete?: (id: string) => void
  onDownload?: (asset: Asset) => void
}

export function AssetGrid({ 
  assets = [], 
  className,
  onDelete,
  onDownload 
}: AssetGridProps) {
  const { t } = useI18n()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())

  const filteredAssets = assets.filter(asset => {
    const matchesFilter = filter === 'all' || asset.type === filter
    const matchesSearch = !searchQuery || 
      asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon
      case 'video': return Video
      case 'code': return Code
      default: return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'from-purple-500 to-pink-500'
      case 'video': return 'from-blue-500 to-cyan-500'
      case 'code': return 'from-green-500 to-emerald-500'
      default: return 'from-orange-500 to-amber-500'
    }
  }

  return (
    <div className={cn("", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('asset.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary/50 w-64"
            />
          </div>
          
          <div className="flex items-center gap-1 px-1 py-1 rounded-lg bg-white/5">
            {['all', 'image', 'video', 'code'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-colors",
                  filter === type 
                    ? "bg-primary/20 text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type === 'all' ? t('common.all') : type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === 'grid' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === 'list' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Asset Grid/List */}
      {filteredAssets.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">{t('asset.noAssets')}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">{t('asset.startCreating')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group relative rounded-xl overflow-hidden bg-white/5 border border-white/10",
                "hover:border-white/20 transition-all",
                selectedAssets.has(asset.id) && "ring-2 ring-primary"
              )}
            >
              {/* Selection checkbox */}
              <button
                onClick={() => {
                  const newSelected = new Set(selectedAssets)
                  if (newSelected.has(asset.id)) {
                    newSelected.delete(asset.id)
                  } else {
                    newSelected.add(asset.id)
                  }
                  setSelectedAssets(newSelected)
                }}
                className={cn(
                  "absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  selectedAssets.has(asset.id) 
                    ? "bg-primary border-primary" 
                    : "border-white/50 bg-black/30 opacity-0 group-hover:opacity-100"
                )}
              >
                {selectedAssets.has(asset.id) && <Check className="w-3 h-3 text-white" />}
              </button>

              {/* Type badge */}
              <div className={cn(
                "absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br " + getTypeColor(asset.type)
              )}>
                {(() => {
                  const Icon = getIcon(asset.type)
                  return <Icon className="w-4 h-4 text-white" />
                })()}
              </div>

              {/* Thumbnail */}
              <div className="aspect-square relative">
                {asset.type === 'image' && asset.thumbnailUrl ? (
                  <Image
                    src={asset.thumbnailUrl}
                    alt={asset.title || 'Asset'}
                    fill
                    sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                  />
                ) : asset.type === 'video' && asset.url ? (
                  <video 
                    src={asset.url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/0">
                    {(() => {
                      const Icon = getIcon(asset.type)
                      return <Icon className="w-12 h-12 text-muted-foreground/30" />
                    })()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-sm font-medium truncate">{asset.title || t('asset.untitled')}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(asset.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>

              {/* Hover actions */}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-end gap-1">
                  {onDownload && (
                    <button
                      onClick={() => onDownload(asset)}
                      className="p-1.5 rounded-lg hover:bg-white/20"
                      title={t('asset.download')}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => window.open(asset.url, '_blank')}
                    className="p-1.5 rounded-lg hover:bg-white/20"
                    title={t('asset.view')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(asset.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                      title={t('asset.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                "bg-gradient-to-br " + getTypeColor(asset.type)
              )}>
                {(() => {
                  const Icon = getIcon(asset.type)
                  return <Icon className="w-5 h-5 text-white" />
                })()}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{asset.title || t('asset.untitled')}</p>
                <p className="text-sm text-muted-foreground truncate">{asset.description || t('asset.noDescription')}</p>
              </div>
              
              <p className="text-sm text-muted-foreground shrink-0">
                {new Date(asset.createdAt).toLocaleDateString('zh-CN')}
              </p>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => window.open(asset.url, '_blank')}
                  className="p-2 rounded-lg hover:bg-white/10"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(asset.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
