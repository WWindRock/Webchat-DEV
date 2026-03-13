import { NextRequest, NextResponse } from 'next/server'
import { assetManager } from '@/storage/asset-manager'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const skillName = searchParams.get('skillName')
    const search = searchParams.get('search')

    let assets

    if (search) {
      assets = await assetManager.searchAssets(search)
    } else {
      assets = await assetManager.listAssets(userId || undefined, skillName || undefined)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: assets.map(asset => ({
        filePath: asset.filePath,
        userId: asset.userId,
        skillName: asset.skillName,
        assetType: asset.assetType,
        uploadTime: asset.uploadTime,
        expireTime: asset.expireTime,
        fileInfo: asset.fileInfo,
        tosInfo: {
          bucket: asset.tosInfo.bucket,
          endpoint: asset.tosInfo.endpoint,
          cdnUrl: asset.tosInfo.cdnUrl
        },
        customMetadata: asset.customMetadata
      })),
      meta: {
        total: assets.length
      }
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'ASSETS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list assets'
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const skillName = formData.get('skillName') as string
    const userId = formData.get('userId') as string
    const assetType = formData.get('assetType') as string
    const storagePolicy = formData.get('storagePolicy') as string
    const metadata = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'File is required'
        }
      }, { status: 400 })
    }

    if (!skillName || !userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'skillName and userId are required'
        }
      }, { status: 400 })
    }

    const customMetadata = metadata ? JSON.parse(metadata) : {}

    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = `${userId}/${skillName}/${Date.now()}_${file.name}`

    await assetManager.registerAsset({
      filePath,
      userId,
      skillName,
      assetType: assetType || 'upload',
      storagePolicy: storagePolicy || '30d',
      uploadTime: new Date().toISOString(),
      fileInfo: {
        originalFilename: file.name,
        fileSize: file.size,
        fileCategory: file.type.split('/')[0],
        mimeType: file.type
      },
      tosInfo: {
        bucket: process.env.TOS_BUCKET || '',
        endpoint: process.env.TOS_ENDPOINT || '',
        tosPath: filePath,
        fileUrl: '',
        cdnUrl: ''
      },
      customMetadata
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        filePath,
        message: 'Asset uploaded successfully'
      }
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'ASSET_UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload asset'
      }
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'MISSING_FILEPATH',
          message: 'File path is required'
        }
      }, { status: 400 })
    }

    const deleted = await assetManager.deleteAsset(filePath)

    if (!deleted) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        }
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        filePath,
        message: 'Asset deleted successfully'
      }
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'ASSET_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete asset'
      }
    }, { status: 500 })
  }
}
