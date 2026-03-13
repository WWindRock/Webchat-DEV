import { AssetManager } from './asset-manager'
import { TOSClient } from './tos-client'

export interface CleanupResult {
  deletedCount: number
  errors: string[]
  expiringSoon: number
}

export class CleanupService {
  private assetManager: AssetManager

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager
  }

  async cleanupExpiredAssets(): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedCount: 0,
      errors: [],
      expiringSoon: 0
    }

    try {
      const assets = await this.assetManager.listAssets()
      const now = new Date()

      for (const asset of assets) {
        // Skip permanent and favorite assets
        if (asset.storagePolicy === 'permanent' || asset.assetType === 'user_favorite') {
          continue
        }

        // Check if expired
        if (asset.expireTime) {
          const expireDate = new Date(asset.expireTime)
          
          if (expireDate <= now) {
            // Delete expired asset
            try {
              await this.assetManager.deleteAsset(asset.filePath)
              result.deletedCount++
            } catch (error) {
              result.errors.push(`Failed to delete ${asset.filePath}: ${error}`)
            }
          } else {
            // Check if expiring soon (within 3 days)
            const threeDaysFromNow = new Date()
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
            
            if (expireDate <= threeDaysFromNow) {
              result.expiringSoon++
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Cleanup failed: ${error}`)
    }

    return result
  }

  async getExpiringSoon(userId: string, days: number = 3): Promise<any[]> {
    const assets = await this.assetManager.listAssets(userId)
    const now = new Date()
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + days)

    return assets.filter(asset => {
      if (!asset.expireTime) return false
      const expireDate = new Date(asset.expireTime)
      return expireDate > now && expireDate <= thresholdDate
    })
  }

  async generateCleanupReport(): Promise<{
    totalAssets: number
    expiredAssets: number
    expiringSoon: number
    byType: Record<string, number>
  }> {
    const assets = await this.assetManager.listAssets()
    const now = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const byType: Record<string, number> = {}
    let expiredAssets = 0
    let expiringSoon = 0

    for (const asset of assets) {
      byType[asset.assetType] = (byType[asset.assetType] || 0) + 1

      if (asset.expireTime) {
        const expireDate = new Date(asset.expireTime)
        if (expireDate <= now) {
          expiredAssets++
        } else if (expireDate <= threeDaysFromNow) {
          expiringSoon++
        }
      }
    }

    return {
      totalAssets: assets.length,
      expiredAssets,
      expiringSoon,
      byType
    }
  }
}

export const cleanupService = new CleanupService(new AssetManager(new TOSClient()))
