import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { MemoryQueue } from './memory-queue'
import { skillExecutor } from '@/skills/engine'
import { cleanupService } from '@/storage'

// 检查是否应该使用 Redis
const shouldStartRedis = () => {
  // 如果显式禁用了 Redis，返回 false
  if (process.env.USE_REDIS === 'false') return false
  
  // 如果显式启用了 Redis，返回 true
  if (process.env.USE_REDIS === 'true') return true
  
  // 默认情况下（开发环境），如果不配置 Redis Host，则不使用 Redis
  if (!process.env.REDIS_HOST) return false
  
  return true
}

const USE_REDIS = shouldStartRedis()

let skillQueue: any
let cleanupQueue: any

if (USE_REDIS) {
  console.log('Initializing Redis Queue...')
  const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null
  })

  skillQueue = new Queue('skill-execution', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50
    }
  })
  
  // 初始化 Worker (仅在 Redis 模式下需要单独初始化 Worker)
  // 注意：在实际部署中，Worker 应该在单独的进程中运行
  // 这里为了简单，如果在同一个进程中运行，我们需要引入 Worker
  // 但为了避免 top-level await 问题，我们用异步函数包裹或者动态导入
  // 在此文件中我们只定义 Queue
} else {
  console.log('Initializing Memory Queue (No Redis)...')
  skillQueue = new MemoryQueue('skill-execution')
  cleanupQueue = new MemoryQueue('asset-cleanup')

  // 在内存模式下，直接挂载处理器
  skillQueue.process(async (job: any) => {
    const { skillName, params, userId } = job.data
    console.log(`Processing skill job: ${skillName} (${job.id})`)
    
    return await skillExecutor.execute({
      skillName,
      params,
      userId,
      timeout: 600000,
      reportProgress: async (progress, message) => {
        if (job.updateProgress) await job.updateProgress(progress)
      }
    })
  })

  cleanupQueue.process(async (job: any) => {
    console.log('Running daily cleanup...')
    const result = await cleanupService.cleanupExpiredAssets()
    console.log(`Cleanup complete: ${result.deletedCount} assets deleted`)
    return result
  })
}

export { skillQueue }

export interface JobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message?: string
  result?: any
  error?: string
  startedAt?: Date
  completedAt?: Date
}

export async function submitSkillJob(
  skillName: string,
  params: any,
  userId: string
): Promise<string> {
  const job = await skillQueue.add(
    'execute-skill',
    {
      skillName,
      params,
      userId,
      submittedAt: new Date().toISOString()
    },
    {
      jobId: `skill_${userId}_${Date.now()}`,
      priority: getSkillPriority(skillName)
    }
  )
  
  return job.id
}

function getSkillPriority(skillName: string): number {
  const priorities: Record<string, number> = {
    'image-generation': 1,
    'video-generation': 1,
    'code-assistant': 2,
    'content-writer': 3,
    'data-analyzer': 3
  }
  return priorities[skillName] || 5
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const job = await skillQueue.getJob(jobId)
  if (!job) {
    throw new Error('Job not found')
  }
  
  // 适配 BullMQ 和 MemoryQueue 的不同接口
  const state = typeof job.getState === 'function' ? await job.getState() : job.status
  
  return {
    id: job.id,
    status: state as any,
    progress: job.progress || 0,
    result: job.returnvalue,
    error: job.failedReason,
    startedAt: job.processedOn,
    completedAt: job.finishedOn
  }
}

export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await skillQueue.getJob(jobId)
  if (!job) return false
  
  if (typeof job.remove === 'function') {
    await job.remove()
  } else {
    // MemoryQueue fallback if remove not implemented
    // (Our MemoryQueue implements remove)
  }
  return true
}
