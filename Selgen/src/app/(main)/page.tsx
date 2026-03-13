'use client'

import { HeroSection } from '@/components/sections/HeroSection'
import { WorksSection } from '@/components/sections/WorksSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <WorksSection />
    </main>
  )
}
