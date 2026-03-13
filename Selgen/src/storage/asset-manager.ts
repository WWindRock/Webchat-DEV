import { TOSClient } from './tos-client'

export interface AssetMetadata {
  filePath: string
  userId: string
  skillName: string
  assetType: string
  storagePolicy: string
  uploadTime: string
  expireTime?: string
  fileInfo: {
    originalFilename: string
    fileSize: number
    fileCategory: string
    mimeType: string
    dimensions?: {
      width: number
      height: number
    }
  }
  tosInfo: {
    bucket: string
    endpoint: string
    tosPath: string
    fileUrl: string
    cdnUrl: string
  }
  customMetadata: Record<string, any>
}

export class AssetManager {
  private tosClient: TOSClient
  private metadataStore: Map<string, AssetMetadata> = new Map()

  constructor(tosClient: TOSClient) {
    this.tosClient = tosClient
  }

  async registerAsset(metadata: AssetMetadata): Promise<void> {
    this.metadataStore.set(metadata.filePath, metadata)
    // In production, save to database
  }

  async getAsset(filePath: string): Promise<AssetMetadata | undefined> {
    return this.metadataStore.get(filePath)
  }

  async listAssets(userId?: string, skillName?: string): Promise<AssetMetadata[]> {
    let assets = Array.from(this.metadataStore.values())
    
    if (userId) {
      assets = assets.filter(a => a.userId === userId)
    }
    
    if (skillName) {
      assets = assets.filter(a => a.skillName === skillName)
    }
    
    return assets.sort((a, b) => 
      new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
    )
  }

  async searchAssets(query: string): Promise<AssetMetadata[]> {
    const assets = Array.from(this.metadataStore.values())
    const lowerQuery = query.toLowerCase()
    
    return assets.filter(asset => 
      asset.fileInfo.originalFilename.toLowerCase().includes(lowerQuery) ||
      asset.skillName.toLowerCase().includes(lowerQuery) ||
      Object.values(asset.customMetadata).some(v => 
        String(v).toLowerCase().includes(lowerQuery)
      )
    )
  }

  async markAsFavorite(filePath: string): Promise<boolean> {
    const asset = this.metadataStore.get(filePath)
    if (!asset) return false
    
    asset.assetType = 'user_favorite'
    asset.storagePolicy = 'permanent'
    asset.customMetadata.isFavorite = true
    delete asset.expireTime
    
    this.metadataStore.set(filePath, asset)
    return true
  }

  async deleteAsset(filePath: string): Promise<boolean> {
    const asset = this.metadataStore.get(filePath)
    if (!asset) return false
    
    // Delete from TOS
    await this.tosClient.delete(asset.tosInfo.tosPath)
    
    // Remove from local store
    this.metadataStore.delete(filePath)
    return true
  }

  async extendRetention(filePath: string, newPolicy: string): Promise<boolean> {
    const asset = this.metadataStore.get(filePath)
    if (!asset) return false
    
    asset.storagePolicy = newPolicy
    
    // Recalculate expiration
    if (newPolicy === 'permanent') {
      delete asset.expireTime
    } else {
      const days = parseInt(newPolicy)
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + days)
      asset.expireTime = expireDate.toISOString()
    }
    
    this.metadataStore.set(filePath, asset)
    return true
  }
}

export const assetManager = new AssetManager(new TOSClient())
