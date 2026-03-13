'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Image, 
  Video, 
  Code, 
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssetGrid } from '@/components/dashboard/AssetGrid'
import { useI18n } from '@/i18n'

const MOCK_DASHBOARD_DATA = {
  user: {
    id: '1',
    name: 'Alex',
    email: 'alex@example.com',
    image: null,
    subscriptionTier: 'pro' as const,
    creditsRemaining: 850,
    creditsUsed: 150,
    subscriptionExpiresAt: '2024-03-01',
  },
  assets: [
    { id: '1', type: 'image' as const, title: '科技感Logo', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400', createdAt: '2024-02-10' },
    { id: '2', type: 'image' as const, title: '产品Banner', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', createdAt: '2024-02-09' },
    { id: '3', type: 'video' as const, title: '宣传视频', url: '', createdAt: '2024-02-08' },
    { id: '4', type: 'code' as const, title: 'React组件', url: '', createdAt: '2024-02-07' },
    { id: '5', type: 'image' as const, title: '海报设计', url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400', createdAt: '2024-02-06' },
  ],
  assetStats: { image: 3, video: 1, code: 1 },
  usage: {
    thisMonth: 150,
    last30Days: [
      { date: '2024-02-01', credits: 20 },
      { date: '2024-02-02', credits: 35 },
      { date: '2024-02-03', credits: 15 },
      { date: '2024-02-04', credits: 50 },
      { date: '2024-02-05', credits: 25 },
      { date: '2024-02-06', credits: 30 },
      { date: '2024-02-07', credits: 45 },
    ],
  },
}

function UsageChart({ data }: { data: { date: string; credits: number }[] }) {
  const { t } = useI18n()
  const maxCredits = Math.max(...data.map(d => d.credits), 1)
  
  return (
    <div className="h-32 flex items-end gap-1">
      {data.map((day, index) => {
        const height = (day.credits / maxCredits) * 100
        return (
          <motion.div
            key={day.date}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(height, 4)}%` }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex-1 rounded-t-sm bg-primary/40 hover:bg-primary/60 relative group"
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-[#141419] border border-white/10 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {day.credits} {t('dashboard.credits')}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useI18n()
  const [data] = useState<typeof MOCK_DASHBOARD_DATA | null>(MOCK_DASHBOARD_DATA)
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')

  const stats = [
    { labelKey: 'dashboard.totalAssets', value: 5, icon: Sparkles },
    { labelKey: 'dashboard.images', value: 3, icon: Image },
    { labelKey: 'dashboard.videos', value: 1, icon: Video },
    { labelKey: 'dashboard.code', value: 1, icon: Code },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-2xl bg-[#141419] border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:bg-white/10 transition-transform">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
            </motion.div>
          ))}
        </div>

        {/* Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-[#141419] border border-white/5 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t('dashboard.usageStats')}</h3>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {(['7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    timeRange === range
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range === '7d' ? '7' + t('billing.perMonth') : '30' + t('billing.perMonth')}
                </button>
              ))}
            </div>
          </div>
          <UsageChart data={data?.usage.last30Days || []} />
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">{t('dashboard.thisMonth')}: <span className="text-foreground font-medium">{data?.usage.thisMonth || 0}</span> {t('dashboard.credits')}</span>
            <span className="flex items-center gap-1 text-green-500">
              <TrendingUp className="w-4 h-4" />
              +12%
            </span>
          </div>
        </motion.div>

        {/* Assets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{t('dashboard.myAssets')}</h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm">
              <Plus className="w-4 h-4" />
              {t('dashboard.createNew')}
            </button>
          </div>
          <AssetGrid assets={data?.assets || []} />
        </motion.div>
      </main>
    </div>
  )
}
