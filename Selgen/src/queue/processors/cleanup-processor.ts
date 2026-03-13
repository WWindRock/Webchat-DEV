import { Worker } from 'bullmq'
import { cleanupService } from '@/storage'

const shouldStartRedis = () => {
  if (process.env.USE_REDIS === 'false') return false
  if (process.env.USE_REDIS === 'true') return true
  if (!process.env.REDIS_HOST) return false
  return true
}

let cleanupWorker: Worker | undefined

if (shouldStartRedis()) {
  const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }

  cleanupWorker = new Worker(
    'asset-cleanup',
    async (job) => {
      console.log('Running daily cleanup...')
      const result = await cleanupService.cleanupExpiredAssets()
      
      console.log(`Cleanup complete: ${result.deletedCount} assets deleted`)
      if (result.errors.length > 0) {
        console.error('Cleanup errors:', result.errors)
      }
      
      return result
    },
    {
      connection: redisConnection
    }
  )
}

export { cleanupWorker }
