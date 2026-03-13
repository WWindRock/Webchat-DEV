'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { 
  Heart, 
  Eye, 
  Share2, 
  Download, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  Flame,
  Image as ImageIcon,
  Video,
  MousePointer2,
  X
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Work } from '@/types'

// Aspect ratio types
const ASPECT_RATIOS = {
  square: { class: 'aspect-square', label: '1:1' },
  portrait: { class: 'aspect-[3/4]', label: '3:4' },
  landscape: { class: 'aspect-[4/3]', label: '4:3' },
  wide: { class: 'aspect-[16/9]', label: '16:9' },
  cinema: { class: 'aspect-[21/9]', label: '21:9' },
}

type AspectRatio = keyof typeof ASPECT_RATIOS

// Extended Work type with aspect ratio
interface WorkItem extends Work {
  aspectRatio: AspectRatio
  authorName: string
  authorAvatar?: string
  isLiked?: boolean
}

// Mock data for demonstration
const MOCK_WORKS: WorkItem[] = [
  {
    id: '1',
    userId: 'user1',
    skillName: 'image-generation',
    type: 'image',
    title: 'Cyberpunk Cityscape',
    description: 'A futuristic city with neon lights',
    url: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400',
    aspectRatio: 'landscape',
    likes: 1234,
    views: 5678,
    tags: ['cyberpunk', 'city', 'neon'],
    authorName: 'Alex Chen',
    createdAt: new Date('2024-03-01T12:00:00'),
  },
  {
    id: '2',
    userId: 'user2',
    skillName: 'image-generation',
    type: 'image',
    title: 'Ethereal Portrait',
    description: 'Dreamy portrait with soft lighting',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    aspectRatio: 'portrait',
    likes: 892,
    views: 3456,
    tags: ['portrait', 'ethereal', 'art'],
    authorName: 'Sarah Miller',
    createdAt: new Date(),
  },
  {
    id: '3',
    userId: 'user3',
    skillName: 'video-generation',
    type: 'video',
    title: 'Abstract Motion',
    description: 'Flowing abstract particles',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400',
    aspectRatio: 'wide',
    likes: 2341,
    views: 8901,
    tags: ['abstract', 'motion', 'particles'],
    authorName: 'Mike Johnson',
    createdAt: new Date(),
  },
  {
    id: '4',
    userId: 'user4',
    skillName: 'image-generation',
    type: 'image',
    title: 'Nature Serenity',
    description: 'Peaceful mountain landscape',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    aspectRatio: 'square',
    likes: 567,
    views: 2345,
    tags: ['nature', 'mountain', 'peaceful'],
    authorName: 'Emma Wilson',
    createdAt: new Date(),
  },
  {
    id: '5',
    userId: 'user5',
    skillName: 'image-generation',
    type: 'image',
    title: 'Cinematic Scene',
    description: 'Movie-like dramatic composition',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
    aspectRatio: 'cinema',
    likes: 1567,
    views: 6789,
    tags: ['cinematic', 'dramatic', 'movie'],
    authorName: 'David Lee',
    createdAt: new Date(),
  },
  {
    id: '6',
    userId: 'user6',
    skillName: 'interactive',
    type: 'interactive',
    title: '3D Product Configurator',
    description: 'Interactive 3D product viewer',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    aspectRatio: 'square',
    likes: 445,
    views: 1234,
    tags: ['3d', 'interactive', 'product'],
    authorName: 'Lisa Zhang',
    createdAt: new Date(),
  },
]

export function WorksSection() {
  const [works, setWorks] = useState<WorkItem[]>(MOCK_WORKS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'interactive'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 })

  // Filter and sort works
  const filteredWorks = useMemo(() => {
    let result = [...works]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(work =>
        work.title.toLowerCase().includes(query) ||
        work.description?.toLowerCase().includes(query) ||
        work.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter(work => work.type === selectedType)
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.likes - a.likes)
        break
      case 'trending':
        result.sort((a, b) => b.views - a.views)
        break
      case 'latest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [works, searchQuery, selectedType, sortBy])

  const handleLike = (workId: string) => {
    setWorks(prev => prev.map(work =>
      work.id === workId
        ? { ...work, isLiked: !work.isLiked, likes: work.isLiked ? work.likes - 1 : work.likes + 1 }
        : work
    ))
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-4 sm:px-6 lg:px-8"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Featured Works
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing creations from our community powered by AI
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search works..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-secondary/50 border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {[
              { value: 'all', label: 'All', icon: null },
              { value: 'image', label: 'Images', icon: ImageIcon },
              { value: 'video', label: 'Videos', icon: Video },
              { value: 'interactive', label: 'Interactive', icon: MousePointer2 },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  selectedType === type.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {type.icon && <type.icon className="w-4 h-4" />}
                {type.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            {[
              { value: 'latest', icon: Clock, label: 'Latest' },
              { value: 'popular', icon: Flame, label: 'Popular' },
              { value: 'trending', icon: TrendingUp, label: 'Trending' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all',
                  sortBy === option.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <option.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredWorks.map((work, index) => (
              <WorkCard
                key={work.id}
                work={work}
                index={index}
                onLike={() => handleLike(work.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredWorks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No works found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </motion.div>
        )}

        {/* Load More */}
        {filteredWorks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <button className="px-8 py-3 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 transition-all text-sm font-medium">
              Load More
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}

// Work Card Component
const WorkCard = React.forwardRef<HTMLDivElement, {
  work: WorkItem
  index: number
  onLike: () => void
}>(({ work, index, onLike }, ref) => {
  const [isHovered, setIsHovered] = useState(false)
  const aspectRatio = ASPECT_RATIOS[work.aspectRatio]

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="break-inside-avoid mb-4 group"
    >
      <div className="relative rounded-xl overflow-hidden bg-muted/50 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
        {/* Image */}
        <div className={cn('relative overflow-hidden', aspectRatio.class)}>
          <Image
            src={work.thumbnailUrl || work.url}
            alt={work.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Type Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
            {work.type === 'image' && <ImageIcon className="w-3 h-3" />}
            {work.type === 'video' && <Video className="w-3 h-3" />}
            {work.type === 'interactive' && <MousePointer2 className="w-3 h-3" />}
            <span className="capitalize">{work.type}</span>
          </div>

          {/* Hover Overlay */}
          <motion.div
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          >
            {/* Quick Actions */}
            <motion.div
              initial={false}
              animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="absolute bottom-3 left-3 right-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onLike()
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    work.isLiked
                      ? 'bg-red-500 text-white'
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                  )}
                >
                  <Heart className={cn('w-4 h-4', work.isLiked && 'fill-current')} />
                  <span>{work.likes.toLocaleString()}</span>
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{work.views.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-1 truncate">{work.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{work.description}</p>
          
          {/* Author & Tags */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                {work.authorName.charAt(0)}
              </div>
              <span className="text-sm text-muted-foreground">{work.authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              {work.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {work.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">+{work.tags.length - 2}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

WorkCard.displayName = 'WorkCard'
