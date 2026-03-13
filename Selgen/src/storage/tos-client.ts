export interface TOSUploadOptions {
  content: Buffer | ReadableStream
  filename: string
  userId: string
  skillName: string
  assetType: 'user_upload' | 'api_result' | 'user_favorite' | 'temp_file' | 'system_file'
  storagePolicy?: '1d' | '14d' | '30d' | '90d' | '1y' | 'permanent'
  customPath?: string
  metadata?: Record<string, any>
}

export interface TOSUploadResult {
  success: boolean
  fileUrl: string
  cdnUrl: string
  tosPath: string
  expiresAt?: Date
  metadata: Record<string, any>
}

export class TOSClient {
  private endpoint: string
  private bucket: string
  private accessKey: string
  private secretKey: string
  private region: string

  constructor() {
    this.endpoint = process.env.TOS_ENDPOINT || ''
    this.bucket = process.env.TOS_BUCKET || ''
    this.accessKey = process.env.VOLCENGINE_ACCESS_KEY || ''
    this.secretKey = process.env.VOLCENGINE_SECRET_KEY || ''
    this.region = process.env.VOLCENGINE_REGION || 'cn-beijing'
  }

  async upload(options: TOSUploadOptions): Promise<TOSUploadResult> {
    // Generate file path
    const date = new Date()
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
    const tosPath = options.customPath || 
      `${options.userId}/${options.skillName}/${options.assetType}/${yearMonth}/${Date.now()}_${options.filename}`

    // Calculate expiration
    const storagePolicy = options.storagePolicy || '14d'
    const expiresAt = this.calculateExpiration(storagePolicy)

    // Upload to TOS via Python service
    const result = await this.uploadToPythonService({
      content: options.content,
      tosPath,
      metadata: {
        ...options.metadata,
        userId: options.userId,
        skillName: options.skillName,
        assetType: options.assetType,
        storagePolicy,
        originalFilename: options.filename
      }
    })

    return {
      success: true,
      fileUrl: result.fileUrl,
      cdnUrl: result.cdnUrl || result.fileUrl,
      tosPath,
      expiresAt,
      metadata: result.metadata
    }
  }

  private async uploadToPythonService(params: {
    content: Buffer | ReadableStream
    tosPath: string
    metadata: Record<string, any>
  }): Promise<{ fileUrl: string; cdnUrl?: string; metadata: Record<string, any> }> {
    // In production, this would call the Python TOS upload service
    // For now, return mock data
    return {
      fileUrl: `https://${this.bucket}.${this.endpoint}/${params.tosPath}`,
      metadata: params.metadata
    }
  }

  private calculateExpiration(policy: string): Date | undefined {
    const days: Record<string, number> = {
      '1d': 1,
      '14d': 14,
      '30d': 30,
      '90d': 90,
      '1y': 365,
      'permanent': -1
    }

    const dayCount = days[policy]
    if (dayCount === -1) return undefined

    const date = new Date()
    date.setDate(date.getDate() + dayCount)
    return date
  }

  async uploadFromUrl(url: string, options: Omit<TOSUploadOptions, 'content'>): Promise<TOSUploadResult> {
    // Download file from URL
    const response = await fetch(url)
    const buffer = Buffer.from(await response.arrayBuffer())
    
    return this.upload({
      ...options,
      content: buffer
    })
  }

  async delete(tosPath: string): Promise<boolean> {
    // In production, call Python service to delete
    console.log(`Deleting from TOS: ${tosPath}`)
    return true
  }

  async getUrl(tosPath: string, expiresIn?: number): Promise<string> {
    // Generate presigned URL
    return `https://${this.bucket}.${this.endpoint}/${tosPath}`
  }

  async getMetadata(tosPath: string): Promise<Record<string, any>> {
    // In production, fetch from TOS
    return {}
  }
}

export const tosClient = new TOSClient()
