import type { Metadata } from 'next'
import { I18nProvider } from '@/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'Selgen - AI Creative Studio',
  description: 'AI驱动的创意工作室，通过对话与AI协作，生成图像、视频、代码和交互式内容',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
