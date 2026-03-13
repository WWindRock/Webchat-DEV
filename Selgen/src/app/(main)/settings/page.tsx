'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key,
  Save,
  Camera,
  Mail,
  Phone,
  Building2,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

interface SettingsSection {
  id: string
  nameKey: string
  icon: any
  descriptionKey: string
}

export default function SettingsPage() {
  const { t } = useI18n()
  const [activeSection, setActiveSection] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)

  const SECTIONS: SettingsSection[] = [
    { id: 'profile', nameKey: 'settings.profile', icon: User, descriptionKey: 'settings.profileDesc' },
    { id: 'notifications', nameKey: 'settings.notifications', icon: Bell, descriptionKey: 'settings.notificationsDesc' },
    { id: 'security', nameKey: 'settings.security', icon: Shield, descriptionKey: 'settings.securityDesc' },
    { id: 'appearance', nameKey: 'settings.appearance', icon: Palette, descriptionKey: 'settings.appearanceDesc' },
    { id: 'language', nameKey: 'settings.language', icon: Globe, descriptionKey: 'settings.languageDesc' },
    { id: 'api', nameKey: 'settings.api', icon: Key, descriptionKey: 'settings.apiDesc' },
  ]

  const [profile, setProfile] = useState({
    name: 'Alex',
    email: 'alex@example.com',
    phone: '+86 138 0000 0000',
    company: 'Selgen Inc.',
    bio: 'AI 创作者',
    avatar: ''
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: true,
    updates: true
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">{t('settings.profile')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.profileDesc')}</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white">
                  {profile.name.charAt(0)}
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#141419] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h4 className="font-medium">{t('settings.avatar')}</h4>
                <p className="text-sm text-muted-foreground">{t('settings.clickToEdit')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.name')}</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.company')}</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">{t('settings.bio')}</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                {isSaving ? t('settings.saving') : t('settings.saveChanges')}
              </button>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">{t('settings.notifications')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.notificationsDesc')}</p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'email', labelKey: 'settings.emailNotify', descKey: 'settings.emailNotifyDesc' },
                { key: 'push', labelKey: 'settings.pushNotify', descKey: 'settings.pushNotifyDesc' },
                { key: 'sms', labelKey: 'settings.smsNotify', descKey: 'settings.smsNotifyDesc' },
                { key: 'marketing', labelKey: 'settings.marketingNotify', descKey: 'settings.marketingNotifyDesc' },
                { key: 'updates', labelKey: 'settings.productUpdates', descKey: 'settings.productUpdatesDesc' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-[#141419] border border-white/5">
                  <div>
                    <h4 className="font-medium">{t(item.labelKey)}</h4>
                    <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors",
                      notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-white/20"
                    )}
                  >
                    <motion.div
                      animate={{ x: notifications[item.key as keyof typeof notifications] ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">{t('settings.security')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.securityDesc')}</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141419] border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.password')}</h4>
                    <p className="text-sm text-muted-foreground">{t('settings.lastUpdated')}: 2024-02-01</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm">
                    {t('settings.changePassword')}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141419] border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.twoFactor')}</h4>
                    <p className="text-sm text-muted-foreground">{t('settings.twoFactorDesc')}</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm">
                    {t('settings.enable')}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141419] border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.activeSessions')}</h4>
                    <p className="text-sm text-muted-foreground">{t('settings.activeSessionsDesc')}</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm">
                    {t('common.view')}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-400">{t('settings.dangerZone')}</h4>
                    <p className="text-sm text-muted-foreground">{t('settings.dangerZoneDesc')}</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm">
                    <Trash2 className="w-4 h-4" />
                    {t('settings.deleteAccount')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">{t('settings.appearance')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.appearanceDesc')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">{t('settings.theme')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'dark', labelKey: 'settings.dark' },
                    { key: 'light', labelKey: 'settings.light' },
                    { key: 'system', labelKey: 'settings.system' }
                  ].map((theme) => (
                    <button
                      key={theme.key}
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        theme.key === 'dark' ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20"
                      )}
                    >
                      {t(theme.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">{t('settings.accentColor')}</label>
                <div className="flex gap-3">
                  {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-10 h-10 rounded-xl border-2 transition-all",
                        color === '#8b5cf6' ? "border-white" : "border-transparent hover:scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">{t('settings.language')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.languageDesc')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.interfaceLanguage')}</label>
                <select className="w-full px-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none">
                  <option value="zh">简体中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.timezone')}</label>
                <select className="w-full px-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none">
                  <option>Asia/Shanghai (UTC+8)</option>
                  <option>America/New_York (UTC-5)</option>
                  <option>Europe/London (UTC+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.dateFormat')}</label>
                <select className="w-full px-4 py-3 rounded-xl bg-[#141419] border border-white/10 focus:border-primary/50 focus:outline-none">
                  <option>YYYY-MM-DD</option>
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">{t('settings.api')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.apiDesc')}</p>
            </div>

            <div className="p-6 rounded-xl bg-[#141419] border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{t('settings.yourApiKey')}</h4>
                <button className="px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm">
                  {t('settings.generateNewKey')}
                </button>
              </div>
              <div className="p-3 rounded-lg bg-black/30 font-mono text-sm text-muted-foreground">
                sk-••••••••••••••••••••••••
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('settings.apiKeyWarning')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-medium text-blue-400 mb-2">{t('settings.apiLimit')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('settings.currentPlan')}: Pro (1000 {t('common.search')}/分钟)
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">{t('settings.title')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0 hidden md:block">
            <nav className="space-y-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                    activeSection === section.id
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <section.icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{t(section.nameKey)}</div>
                    <div className="text-xs text-muted-foreground">{t(section.descriptionKey)}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-[#141419] border border-white/5"
            >
              {renderSection()}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
