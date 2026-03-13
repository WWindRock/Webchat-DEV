
import { JobStatus } from './job-queue'

export class MemoryQueue {
  private jobs = new Map<string, any>()
  private processor: ((job: any) => Promise<any>) | null = null

  constructor(public name: string) {}

  async add(name: string, data: any, opts: any) {
    const job = {
      id: opts.jobId || Date.now().toString(),
      data,
      opts,
      status: 'pending' as const,
      progress: 0,
      returnvalue: null,
      failedReason: null,
      processedOn: null,
      finishedOn: null,
      timestamp: Date.now(),
      
      updateProgress: async (progress: number) => {
        job.progress = progress
      },
      
      getState: async () => job.status,
      
      remove: async () => {
        this.jobs.delete(job.id)
      }
    }

    this.jobs.set(job.id, job)
    
    // 模拟异步处理
    setTimeout(() => {
      if (this.processor) {
        this.processJob(job)
      }
    }, 100)

    return job
  }

  private async processJob(job: any) {
    if (!this.processor) return

    job.status = 'processing'
    job.processedOn = new Date()

    try {
      job.returnvalue = await this.processor(job)
      job.status = 'completed'
    } catch (error) {
      console.error('Job failed:', error)
      job.failedReason = error instanceof Error ? error.message : String(error)
      job.status = 'failed'
    } finally {
      job.finishedOn = new Date()
    }
  }

  process(processor: (job: any) => Promise<any>) {
    this.processor = processor
  }

  async getJob(jobId: string) {
    return this.jobs.get(jobId)
  }
}
