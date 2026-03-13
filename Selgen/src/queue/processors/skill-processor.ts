import { Worker } from 'bullmq'
import { skillExecutor } from '@/skills/engine'

const shouldStartRedis = () => {
  if (process.env.USE_REDIS === 'false') return false
  if (process.env.USE_REDIS === 'true') return true
  if (!process.env.REDIS_HOST) return false
  return true
}

let skillWorker: Worker | undefined

if (shouldStartRedis()) {
  const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }

  skillWorker = new Worker(
    'skill-execution',
    async (job) => {
      const { skillName, params, userId } = job.data
      
      try {
        await job.updateProgress(10)
        
        const result = await skillExecutor.execute({
          skillName,
          params,
          userId,
          timeout: 600000,
          reportProgress: async (progress, message) => {
            await job.updateProgress(progress)
          }
        })
        
        await job.updateProgress(100)
        return result
        
      } catch (error) {
        throw error
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 60000
      }
    }
  )

  skillWorker.on('completed', (job) => {
    console.log(`Skill job ${job.id} completed`)
  })

  skillWorker.on('failed', (job, error) => {
    console.error(`Skill job ${job?.id} failed:`, error)
  })
}

export { skillWorker }
