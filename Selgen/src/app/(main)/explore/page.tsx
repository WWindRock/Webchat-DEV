'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  TrendingUp,
  Clock,
  Star,
  Image as ImageIcon,
  Video,
  Code,
  FileText,
  Filter,
  Grid,
  List
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

interface ExploreWork {
  id: string
  title: string
  type: 'image' | 'video' | 'code' | 'text'
  thumbnail: string
  author: {
    name: string
    avatar: string
  }
  likes: number
  views: number
  createdAt: string
  tags: string[]
}

const MOCK_WORKS: ExploreWork[] = [
  {
    id: '1',
    title: 'Futuristic AI Logo Collection',
    type: 'image',
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    author: { name: 'DesignPro', avatar: '' },
    likes: 234,
    views: 1520,
    createdAt: '2024-02-15',
    tags: ['logo', 'ai', 'futuristic']
  },
  {
    id: '2',
    title: 'E-commerce Product Video',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400',
    author: { name: 'VideoMaster', avatar: '' },
    likes: 189,
    views: 2340,
    createdAt: '2024-02-14',
    tags: ['video', 'ecommerce', 'marketing']
  },
  {
    id: '3',
    title: 'React Dashboard Component',
    type: 'code',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    author: { name: 'CodeWizard', avatar: '' },
    likes: 456,
    views: 5620,
    createdAt: '2024-02-13',
    tags: ['react', 'dashboard', 'component']
  },
  {
    id: '4',
    title: 'Tech Blog Article',
    type: 'text',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400',
    author: { name: 'ContentKing', avatar: '' },
    likes: 78,
    views: 890,
    createdAt: '2024-02-12',
    tags: ['blog', 'tech', 'tutorial']
  },
  {
    id: '5',
    title: '3D Character Design',
    type: 'image',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    author: { name: '3DArtist', avatar: '' },
    likes: 312,
    views: 2890,
    createdAt: '2024-02-11',
    tags: ['3d', 'character', 'design']
  },
  {
    id: '6',
    title: 'Animation Reel 2024',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
    author: { name: 'MotionPro', avatar: '' },
    likes: 567,
    views: 7890,
    createdAt: '2024-02-10',
    tags: ['animation', 'reel', 'showcase']
  },
]

const CATEGORIES = [
  { id: 'all', nameKey: 'explore.all', icon: Grid },
  { id: 'image', nameKey: 'explore.image', icon: ImageIcon },
  { id: 'video', nameKey: 'explore.video', icon: Video },
  { id: 'code', nameKey: 'explore.code', icon: Code },
  { id: 'text', nameKey: 'explore.text', icon: FileText },
]

const TRENDING_TAGS = [
  'AI Art', 'Logo Design', 'Video Editing', 'React', 
  'Marketing', 'Tutorial', '3D', 'Animation'
]

export default function ExplorePage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'trending' | 'recent' | 'popular'>('trending')

  const filteredWorks = MOCK_WORKS.filter(work => {
    if (selectedCategory !== 'all' && work.type !== selectedCategory) return false
    if (searchQuery && !work.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !work.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false
    }
    return true
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon
      case 'video': return Video
      case 'code': return Code
      case 'text': return FileText
      default: return FileText
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('explore.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                    selectedCategory === cat.id
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent"
                  )}
                >
                  <cat.icon className="w-4 h-4" />
                  {t(cat.nameKey)}
                </button>
              ))}
            </div>

            {/* View & Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-[#141419] border border-white/10 text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="trending">{t('explore.trending')}</option>
                <option value="recent">{t('explore.recent')}</option>
                <option value="popular">{t('explore.popular')}</option>
              </select>
              <div className="flex items-center bg-[#141419] rounded-xl border border-white/10 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === 'grid' ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === 'list' ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trending Tags */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{t('explore.trendingTags')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Works Grid */}
        {filteredWorks.length > 0 ? (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {filteredWorks.map((work, index) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group cursor-pointer",
                  viewMode === 'list' && "flex gap-4 p-4 rounded-2xl bg-[#141419] border border-white/5 hover:border-white/10"
                )}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#141419] mb-3">
                      <Image
                        src={work.thumbnail}
                        alt={work.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm flex items-center gap-1">
                        {(() => {
                          const Icon = getTypeIcon(work.type)
                          return <Icon className="w-3 h-3 text-white" />
                        })()}
                      </div>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {work.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <span>{work.author.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" /> {work.likes}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-48 h-32 rounded-xl overflow-hidden bg-[#141419] flex-shrink-0">
                      <Image
                        src={work.thumbnail}
                        alt={work.title}
                        width={192}
                        height={128}
                        sizes="192px"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {work.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">by {work.author.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" /> {work.likes}
                        </span>
                        <span>{work.views} views</span>
                        <span>{work.createdAt}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {work.tags.map(tag => (
                          <span key={tag} className="text-xs px-2 py-1 rounded-md bg-white/5 text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('explore.noResults')}</h3>
            <p className="text-muted-foreground">{t('explore.tryOther')}</p>
          </div>
        )}
      </main>
    </div>
  )
}
