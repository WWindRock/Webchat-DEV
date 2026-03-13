'use client'

import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Crown, 
  Zap, 
  Check, 
  CreditCard,
  Clock,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubscriptionPanelProps {
  tier?: 'free' | 'pro' | 'enterprise'
  creditsRemaining?: number
  creditsUsed?: number
  expiresAt?: string
  className?: string
}

const TIERS = [
  {
    id: 'free',
    name: '免费版',
    price: '¥0',
    period: '永久',
    credits: 100,
    features: [
      '100 积分/月',
      '基础图像生成',
      '标准处理速度',
      '社区支持',
    ],
    notFeatures: [
      '高清图像',
      '视频生成',
      '优先队列',
      '定时任务',
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    price: '¥99',
    period: '/月',
    credits: 1000,
    popular: true,
    features: [
      '1000 积分/月',
      '高清图像生成',
      '视频生成',
      '优先处理',
      '定时任务',
      '优先支持',
    ],
    notFeatures: [
      'API 访问',
      '自定义品牌',
    ],
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: '¥399',
    period: '/月',
    credits: 5000,
    features: [
      '5000 积分/月',
      '超清图像生成',
      '高级视频生成',
      '最快处理',
      'API 访问',
      '自定义品牌',
      '专属客服',
      'SLA 保障',
    ],
    notFeatures: [],
  },
]

export function SubscriptionPanel({
  tier = 'free',
  creditsRemaining = 100,
  creditsUsed = 0,
  expiresAt,
  className,
}: SubscriptionPanelProps) {
  const currentTier = TIERS.find(t => t.id === tier) || TIERS[0]
  const totalCredits = creditsRemaining + creditsUsed
  const usagePercentage = totalCredits > 0 ? (creditsUsed / totalCredits) * 100 : 0

  return (
    <div className={cn("", className)}>
      {/* Current Plan Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141419] to-[#0a0a0f] p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{currentTier.name}</h3>
              {tier !== 'free' && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentTier.price}{currentTier.period}
            </p>
          </div>
          
          {tier === 'free' && (
            <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
              升级
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Credits Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">本月已用积分</span>
            <span className="font-medium">{creditsUsed} / {totalCredits}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
              className={cn(
                "h-full rounded-full",
                usagePercentage > 90 ? "bg-red-500" :
                usagePercentage > 70 ? "bg-yellow-500" :
                "bg-primary"
              )}
            />
          </div>
        </div>

        {/* Credits Remaining */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">剩余积分</span>
          </div>
          <span className="text-xl font-bold text-primary">{creditsRemaining}</span>
        </div>

        {expiresAt && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>有效期至 {new Date(expiresAt).toLocaleDateString('zh-CN')}</span>
          </div>
        )}
      </div>

      {/* Plans Comparison */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          升级计划
        </h4>
        
        {TIERS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative rounded-xl border p-4 transition-all",
              plan.id === tier 
                ? "border-primary/50 bg-primary/5" 
                : "border-white/10 hover:border-white/20",
              plan.popular && "ring-2 ring-primary/30"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-primary text-xs font-medium text-primary-foreground">
                最受欢迎
              </div>
            )}
            
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{plan.name}</h4>
                  {plan.id === tier && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-2xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                </p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">{plan.credits}</span>
                </div>
                <span className="text-xs text-muted-foreground">积分/月</span>
              </div>
            </div>

            <div className="space-y-1">
              {plan.features.slice(0, 4).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-3 h-3 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
              {plan.notFeatures.slice(0, 2).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" />
                  <span className="text-muted-foreground/50">{feature}</span>
                </div>
              ))}
            </div>

            {plan.id !== tier && (
              <button className={cn(
                "w-full mt-4 py-2 rounded-xl text-sm font-medium transition-colors",
                plan.popular 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white/10 hover:bg-white/20"
              )}>
                立即升级
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Billing History Link */}
      <button className="w-full mt-6 py-3 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors flex items-center justify-center gap-2">
        <CreditCard className="w-4 h-4" />
        查看账单历史
      </button>
    </div>
  )
}
