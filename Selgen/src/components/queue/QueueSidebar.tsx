'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  List, 
  Clock, 
  History, 
  ChevronLeft, 
  ChevronRight,
  Play, 
  Pause, 
  RotateCcw,
  X,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  MoreVertical,
  Calendar,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface QueueTask {
  id: string
  name: string
  description?: string
  status: TaskStatus
  progress: number
  agentType?: string
  createdAt: Date
  updatedAt?: Date
  result?: any
  error?: string
}

interface QueueSidebarProps {
  className?: string
  tasks?: QueueTask[]
  onTaskAction?: (taskId: string, action: 'pause' | 'resume' | 'cancel' | 'retry') => void
}

export function QueueSidebar({ 
  className, 
  tasks: externalTasks,
}: QueueSidebarProps) {
  const { t } = useI18n()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'queue' | 'scheduled' | 'history'>('queue')
  const [tasks, setTasks] = useState<QueueTask[]>([])

  useEffect(() => {
    if (externalTasks) {
      setTasks(externalTasks)
    }
  }, [externalTasks])

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const processingTasks = tasks.filter(t => t.status === 'processing')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const failedTasks = tasks.filter(t => t.status === 'failed')

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 48 : 320 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        "h-full bg-[#0a0a0f]/95 border-l border-white/10 flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
              >
                <button
                  onClick={() => setActiveTab('queue')}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    activeTab === 'queue' 
                      ? "bg-primary/20 text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-3 h-3 inline mr-1" />
                  {t('queue.queue')}
                </button>
                <button
                  onClick={() => setActiveTab('scheduled')}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    activeTab === 'scheduled' 
                      ? "bg-primary/20 text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  {t('queue.scheduled')}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    activeTab === 'history' 
                      ? "bg-primary/20 text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <History className="w-3 h-3 inline mr-1" />
                  {t('queue.history')}
                </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            {activeTab === 'queue' && (
              <div className="p-2 space-y-2">
                {processingTasks.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                      {t('queue.processing')}
                    </div>
                    {processingTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task}
                        isHighlighted
                        t={t}
                      />
                    ))}
                  </div>
                )}

                {pendingTasks.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                      {t('queue.waiting')} ({pendingTasks.length})
                    </div>
                    {pendingTasks.map(task => (
                      <TaskCard key={task.id} task={task} t={t} />
                    ))}
                  </div>
                )}

                {tasks.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{t('queue.noTasks')}</p>
                    <p className="text-xs mt-1">{t('queue.startCreating')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'scheduled' && (
              <div className="p-2">
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{t('queue.noScheduled')}</p>
                  <p className="text-xs mt-1">{t('queue.setScheduled')}</p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-2 space-y-2">
                {completedTasks.concat(failedTasks).slice(0, 10).map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task}
                    showResult
                    t={t}
                  />
                ))}

                {completedTasks.length === 0 && failedTasks.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{t('queue.noHistory')}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-2">
          <div className="relative">
            <List className="w-5 h-5 text-muted-foreground" />
            {processingTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </div>
          {processingTasks.length > 0 && (
            <span className="text-xs text-primary font-medium">
              {processingTasks.length}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'pending':
      return <Circle className="w-4 h-4 text-muted-foreground" />
    case 'processing':
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-500" />
  }
}

function getStatusColor(status: TaskStatus) {
  switch (status) {
    case 'pending':
      return 'bg-muted'
    case 'processing':
      return 'bg-primary'
    case 'completed':
      return 'bg-green-500'
    case 'failed':
      return 'bg-red-500'
  }
}

interface TaskCardProps {
  task: QueueTask
  isHighlighted?: boolean
  showResult?: boolean
  t: (key: string) => string
}

function TaskCard({ task, isHighlighted, showResult, t }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "rounded-lg border border-white/5 bg-[#141419]/50 overflow-hidden",
        isHighlighted && "border-primary/30 bg-primary/5"
      )}
    >
      <div 
        className="flex items-center gap-2 p-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {getStatusIcon(task.status)}
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{task.name}</div>
          {task.agentType && (
            <div className="text-xs text-muted-foreground">{task.agentType}</div>
          )}
        </div>

        {task.status === 'processing' && (
          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", getStatusColor(task.status))}
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-2 pb-2"
          >
            {task.description && (
              <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
            )}
            
            {task.status === 'processing' && (
              <div className="text-xs text-primary mb-2">
                {task.progress}% {t('queue.progress')}
              </div>
            )}

            {task.error && (
              <div className="text-xs text-red-400 mb-2 p-2 bg-red-500/10 rounded">
                {task.error}
              </div>
            )}

            {showResult && task.result && (
              <div className="text-xs text-muted-foreground mb-2 p-2 bg-white/5 rounded">
                {task.result.output || task.result.summary || t('queue.taskDone')}
              </div>
            )}

            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-white/10 text-muted-foreground">
                <RotateCcw className="w-3 h-3" />
              </button>
              <button className="p-1 rounded hover:bg-white/10 text-muted-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default QueueSidebar
