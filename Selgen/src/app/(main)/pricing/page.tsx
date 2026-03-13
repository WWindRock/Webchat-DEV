'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Check, 
  Zap, 
  Crown, 
  Building2,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

const FEATURES = [
  { nameKey: 'pricing.creditsMo', free: '50', pro: '1,000', enterprise: '5,000' },
  { nameKey: 'pricing.imageGen', free: '✓', pro: '✓ (Advanced)', enterprise: '✓ (Advanced)' },
  { nameKey: 'pricing.videoGen', free: '✗', pro: '✓', enterprise: '✓' },
  { nameKey: 'pricing.codeGen', free: '✓', pro: '✓', enterprise: '✓' },
  { nameKey: 'pricing.speed', free: 'Standard', pro: 'Priority', enterprise: 'Fastest' },
  { nameKey: 'pricing.projects', free: '1', pro: '∞', enterprise: '∞' },
  { nameKey: 'pricing.customSkills', free: '✗', pro: '✓', enterprise: '✓' },
  { nameKey: 'pricing.api', free: '✗', pro: '✓', enterprise: '✓' },
  { nameKey: 'pricing.team', free: '✗', pro: '✗', enterprise: '✓' },
  { nameKey: 'pricing.support', free: '✗', pro: 'Priority', enterprise: '✓' },
]

const FAQS = [
  { qKey: 'pricing.faq1q', aKey: 'pricing.faq1a' },
  { qKey: 'pricing.faq2q', aKey: 'pricing.faq2a' },
  { qKey: 'pricing.faq3q', aKey: 'pricing.faq3a' },
  { qKey: 'pricing.faq4q', aKey: 'pricing.faq4a' },
]

interface Plan {
  id: string
  nameKey: string
  price: number
  descriptionKey: string
  icon: any
  featuresKey: string[]
  popular?: boolean
  creditsKey: string
}

const getPlans = (): Plan[] => [
  {
    id: 'free',
    nameKey: 'pricing.free',
    price: 0,
    descriptionKey: 'pricing.freeDesc',
    icon: Zap,
    creditsKey: 'pricing.credits50',
    featuresKey: [
      'pricing.featureBasic1',
      'pricing.featureBasic2',
      'pricing.featureBasic3',
      'pricing.featureBasic4',
      'pricing.featureBasic5',
    ]
  },
  {
    id: 'pro',
    nameKey: 'pricing.pro',
    price: 29,
    descriptionKey: 'pricing.proDesc',
    icon: Crown,
    creditsKey: 'pricing.credits1000',
    popular: true,
    featuresKey: [
      'pricing.featurePro1',
      'pricing.featurePro2',
      'pricing.featurePro3',
      'pricing.featurePro4',
      'pricing.featurePro5',
      'pricing.featurePro6',
      'pricing.featurePro7',
    ]
  },
  {
    id: 'enterprise',
    nameKey: 'pricing.enterprise',
    price: 99,
    descriptionKey: 'pricing.enterpriseDesc',
    icon: Building2,
    creditsKey: 'pricing.credits5000',
    featuresKey: [
      'pricing.featureEnt1',
      'pricing.featureEnt2',
      'pricing.featureEnt3',
      'pricing.featureEnt4',
      'pricing.featureEnt5',
      'pricing.featureEnt6',
      'pricing.featureEnt7',
      'pricing.featureEnt8',
    ]
  },
]

export default function PricingPage() {
  const { t } = useI18n()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const plans = getPlans()

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">{t('pricing.title')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('pricing.title')}</h1>
          <p className="text-muted-foreground text-lg">{t('pricing.subtitle')}</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1 bg-[#141419] rounded-xl p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                billingCycle === 'monthly' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('pricing.perMonth')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                billingCycle === 'yearly' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('pricing.perYear')}
              <span className="text-green-500 text-xs">{t('pricing.save20')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative p-6 rounded-2xl border transition-all",
                plan.popular ? "bg-gradient-to-b from-primary/10 to-[#141419] border-primary/30" : "bg-[#141419] border-white/5 hover:border-white/10"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-xs font-medium">
                  {t('pricing.popular')}
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", plan.popular ? "bg-primary/20" : "bg-white/5")}>
                  <plan.icon className={cn("w-6 h-6", plan.popular ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t(plan.nameKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(plan.descriptionKey)}</p>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">${billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price}</span>
                <span className="text-muted-foreground">/{billingCycle === 'yearly' ? t('pricing.month') : t('pricing.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.featuresKey.map((featureKey, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {t(featureKey)}
                  </li>
                ))}
              </ul>
              <button className={cn("w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2", plan.popular ? "bg-primary hover:bg-primary/90" : "bg-white/10 hover:bg-white/20")}>
                {plan.id === 'free' ? t('pricing.startFree') : t('pricing.getPro')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">{t('pricing.features')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 font-medium">{t('pricing.features')}</th>
                  <th className="text-center py-4 px-4 font-medium">{t('pricing.free')}</th>
                  <th className="text-center py-4 px-4 font-medium">{t('pricing.pro')}</th>
                  <th className="text-center py-4 px-4 font-medium">{t('pricing.enterprise')}</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-4 px-4">{t(feature.nameKey)}</td>
                    <td className="text-center py-4 px-4">{feature.free}</td>
                    <td className="text-center py-4 px-4">{feature.pro}</td>
                    <td className="text-center py-4 px-4">{feature.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-center mb-8">{t('pricing.faqTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141419] border border-white/5">
                <h4 className="font-medium mb-2">{t(faq.qKey)}</h4>
                <p className="text-sm text-muted-foreground">{t(faq.aKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
