'use client'

import { Suspense } from 'react'

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f]"><div className="text-white">Loading...</div></div>}>{children}</Suspense>
}
