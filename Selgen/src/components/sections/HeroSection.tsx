'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowDown, Zap, Image as ImageIcon, Code2, PenTool, Video } from 'lucide-react'
import { AIInput } from '@/components/ai/AIInput'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

export function HeroSection() {
  const { t } = useI18n()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  const backgroundY = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.95])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 100)
      setShowSticky(scrollPosition > 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSend = (message: string, command?: string) => {
    console.log('Sending message:', message, 'Command:', command)
    // Navigate to canvas or handle the message
    const sessionId = `session_${Date.now()}`
    window.location.href = `/canvas?input=${encodeURIComponent(message)}&session=${encodeURIComponent(sessionId)}`
  }

  const features = [
    { icon: ImageIcon, label: t('skills.image.name'), command: '/image' },
    { icon: Video, label: t('skills.video.name'), command: '/video' },
    { icon: Code2, label: t('skills.code.name'), command: '/code' },
    { icon: PenTool, label: t('skills.write.name'), command: '/write' },
  ]

  return (
    <>
      {/* Sticky Header */}
      <AnimatePresence>
        {showSticky && (
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
          >
            <div className="max-w-3xl mx-auto px-4 py-3">
              <AIInput 
                onSend={handleSend}
                placeholder={t('home.hero.placeholder')}
                compact
              />
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section
        ref={containerRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Animated Gradient Background */}
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 -z-10"
        >
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
          
          {/* Animated orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/20 blur-[120px]"
            />
            <motion.div
              animate={{
                x: [0, -100, 0],
                y: [0, 50, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[100px]"
            />
            <motion.div
              animate={{
                x: [0, 50, 0],
                y: [0, 100, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[90px]"
            />
            <motion.div
              animate={{
                x: [0, -50, 0],
                y: [0, -100, 0],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-1/3 right-1/3 w-[450px] h-[450px] rounded-full bg-pink-500/15 blur-[100px]"
            />
          </div>

          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          style={{ opacity, scale }}
          className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('home.hero.poweredBy')}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter mb-6"
          >
            <span className="bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Selgen
            </span>
          </motion.h1>

          {/* Slogan */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl font-light text-muted-foreground mb-12"
          >
            {t('home.hero.slogan')}
          </motion.p>

          {/* AI Input */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className={cn(
              "relative rounded-2xl transition-all duration-500",
              isScrolled ? "shadow-2xl shadow-primary/10" : ""
            )}>
              <AIInput
                onSend={handleSend}
                placeholder={t('home.hero.placeholder')}
                size="lg"
                showShortcuts
              />
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 mt-6"
            >
              {features.map((feature, index) => (
                <motion.button
                  key={feature.command}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend(feature.command, feature.command)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 transition-colors text-sm"
                >
                  <feature.icon className="w-4 h-4" />
                  <span>{feature.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-8 mt-16"
          >
            {[
              { value: '10M+', label: t('home.hero.stats.creations') },
              { value: '50+', label: t('home.hero.stats.skills') },
              { value: '99%', label: t('home.hero.stats.satisfaction') },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs uppercase tracking-wider">{t('home.hero.scroll')}</span>
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>
    </>
  )
}
