'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Crown,
  Check,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

interface UsageRecord {
  id: string
  date: string
  type: 'image' | 'video' | 'code' | 'text'
  tokens: number
  cost: number
  model: string
  description: string
}

const MOCK_BILLING_DATA = {
  subscription: {
    plan: 'Pro',
    price: 29,
    interval: 'month',
    status: 'active',
    nextBilling: '2024-03-01',
    credits: 1000,
    creditsUsed: 687
  },
  balance: {
    available: 313,
    pending: 0,
    totalSpent: 145.50
  },
  usageRecords: [
    { id: '1', date: '2024-02-15', type: 'image', tokens: 1250, cost: 0.25, model: 'doubao-seed-2-0-pro-260215', description: '生成科技感Logo' },
    { id: '2', date: '2024-02-15', type: 'code', tokens: 3200, cost: 0.64, model: 'doubao-seed-2-0-pro-260215', description: 'React组件生成' },
    { id: '3', date: '2024-02-14', type: 'video', tokens: 5800, cost: 1.16, model: 'doubao-seed-2-0-pro-260215', description: '视频脚本优化' },
    { id: '4', date: '2024-02-14', type: 'text', tokens: 2100, cost: 0.42, model: 'doubao-seed-2-0-pro-260215', description: '博客文章写作' },
    { id: '5', date: '2024-02-13', type: 'image', tokens: 980, cost: 0.20, model: 'doubao-seed-2-0-pro-260215', description: '海报设计' },
    { id: '6', date: '2024-02-13', type: 'code', tokens: 4500, cost: 0.90, model: 'doubao-seed-2-0-pro-260215', description: 'API接口生成' },
    { id: '7', date: '2024-02-12', type: 'video', tokens: 3200, cost: 0.64, model: 'doubao-seed-2-0-pro-260215', description: '短视频脚本' },
    { id: '8', date: '2024-02-12', type: 'image', tokens: 1500, cost: 0.30, model: 'doubao-seed-2-0-pro-260215', description: '产品展示图' },
  ] as UsageRecord[]
}

export default function BillingPage() {
  const { t } = useI18n()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const data = MOCK_BILLING_DATA

  const totalTokens = data.usageRecords.reduce((sum, r) => sum + r.tokens, 0)
  const totalCost = data.usageRecords.reduce((sum, r) => sum + r.cost, 0)
  const avgCostPerDay = totalCost / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)

  const usageByType = data.usageRecords.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + r.tokens
    return acc
  }, {} as Record<string, number>)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'from-blue-500 to-cyan-500'
      case 'video': return 'from-purple-500 to-pink-500'
      case 'code': return 'from-green-500 to-emerald-500'
      case 'text': return 'from-orange-500 to-amber-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'image': return t('type.image')
      case 'video': return t('type.video')
      case 'code': return t('type.code')
      case 'text': return t('type.text')
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">{t('billing.title')}</h1>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm">
              <Download className="w-4 h-4" />
              {t('billing.downloadBill')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-[#141419] border border-primary/20"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{data.subscription.plan} {t('billing.currentPlan')}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                      {data.subscription.status === 'active' ? t('billing.active') : t('billing.inactive')}
                    </span>
                  </div>
                  <p className="text-muted-foreground">${data.subscription.price}/{t('billing.perMonth')}</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 transition-colors text-sm font-medium">
                {t('billing.upgrade')}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5">
                <div className="text-2xl font-bold">{data.subscription.credits}</div>
                <div className="text-sm text-muted-foreground">{t('billing.creditsThisMonth')}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-orange-400">{data.subscription.creditsUsed}</div>
                <div className="text-sm text-muted-foreground">{t('billing.used')}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-green-400">{data.subscription.credits - data.subscription.creditsUsed}</div>
                <div className="text-sm text-muted-foreground">{t('billing.remaining')}</div>
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(data.subscription.creditsUsed / data.subscription.credits) * 100}%` }}
                className="h-full bg-gradient-to-r from-primary to-purple-500"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('billing.nextBilling')}: {data.subscription.nextBilling}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-[#141419] border border-white/5"
          >
            <h3 className="font-semibold mb-4">{t('billing.accountBalance')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-green-400" />
                  <span>{t('billing.available')}</span>
                </div>
                <span className="font-bold">{data.balance.available}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-orange-400" />
                  <span>{t('billing.pending')}</span>
                </div>
                <span className="font-bold">{data.balance.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  <span>{t('billing.totalSpent')}</span>
                </div>
                <span className="font-bold">${data.balance.totalSpent.toFixed(2)}</span>
              </div>
            </div>

            <button className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
              {t('billing.recharge')}
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('billing.usageStats')}</h3>
            <div className="flex items-center gap-1 bg-[#141419] rounded-xl p-1">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg transition-colors",
                    timeRange === range
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range === '7d' ? '7' + t('billing.perMonth') : range === '30d' ? '30' + t('billing.perMonth') : '90' + t('billing.perMonth')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-[#141419] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">{t('billing.totalConsumption')}</span>
              </div>
              <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{t('billing.tokens')}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#141419] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-muted-foreground">{t('billing.totalCost')}</span>
              </div>
              <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">USD</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#141419] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">{t('billing.dailyAvg')}</span>
              </div>
              <div className="text-2xl font-bold">${avgCostPerDay.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">USD/{t('billing.perMonth')}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#141419] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-green-400" />
                <span className="text-sm text-muted-foreground">{t('billing.unitPrice')}</span>
              </div>
              <div className="text-2xl font-bold">${(totalCost / totalTokens * 1000).toFixed(4)}</div>
              <div className="text-sm text-muted-foreground">USD/1K {t('billing.tokens')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(usageByType).map(([type, tokens]) => (
              <div key={type} className="p-4 rounded-xl bg-[#141419] border border-white/5">
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
                  getTypeColor(type)
                )}>
                  <span className="text-white font-bold">{type.charAt(0).toUpperCase()}</span>
                </div>
                <div className="font-medium">{getTypeLabel(type)}</div>
                <div className="text-2xl font-bold">{tokens.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{t('billing.tokens')}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">{t('billing.usageRecords')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('billing.time')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('billing.type')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('billing.description')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('billing.model')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('billing.tokens')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('billing.cost')}</th>
                </tr>
              </thead>
              <tbody>
                {data.usageRecords.map((record) => (
                  <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-sm">{record.date}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium",
                        getTypeColor(record.type),
                        "text-white"
                      )}>
                        {getTypeLabel(record.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{record.description}</td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">{record.model.slice(0, 20)}...</td>
                    <td className="py-3 px-4 text-sm text-right">{record.tokens.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-orange-400">${record.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/5">
                  <td colSpan={4} className="py-3 px-4 font-medium">{t('billing.total')}</td>
                  <td className="py-3 px-4 text-right font-bold">{totalTokens.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-orange-400">${totalCost.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold mb-4">{t('billing.paymentMethods')}</h3>
          <div className="p-4 rounded-xl bg-[#141419] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium">•••• •••• •••• 4242</div>
                <div className="text-sm text-muted-foreground">{t('billing.expires')}: 12/25</div>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm">
              {t('common.edit')}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
