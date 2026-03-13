import { NextRequest, NextResponse } from 'next/server'
import { TosClient } from '@volcengine/tos-sdk'

// 初始化TOS客户端
const tosClient = new TosClient({
  accessKeyId: process.env.VOLCENGINE_ACCESS_KEY || '',
  accessKeySecret: process.env.VOLCENGINE_SECRET_KEY || '',
  endpoint: process.env.TOS_ENDPOINT || '',
  region: process.env.VOLCENGINE_REGION || 'cn-beijing',
})

const bucketName = process.env.TOS_BUCKET || ''
let bucketChecked = false

// 自动创建 bucket
async function ensureBucketExists() {
  if (bucketChecked) return
  
  try {
    // 尝试获取 bucket 信息，检查是否存在
    try {
      await tosClient.headBucket(bucketName)
      console.log(`Bucket "${bucketName}" already exists`)
      bucketChecked = true
      return
    } catch (error: any) {
      // bucket 不存在，需要创建
      if (error.statusCode === 404 || error.message?.includes('Not Found')) {
        console.log(`Bucket "${bucketName}" not found, creating...`)
      } else {
        throw error
      }
    }
    
    // 创建 bucket
    await tosClient.createBucket({
      bucket: bucketName,
    } as any)
    
    console.log(`Bucket "${bucketName}" created successfully`)
    bucketChecked = true
    
  } catch (error: any) {
    console.error('Failed to ensure bucket exists:', error)
    throw new Error(`无法创建或访问 bucket: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 确保 bucket 存在
    await ensureBucketExists()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    const userId = formData.get('user_id') as string || 'default_user'
    const functionName = formData.get('function_name') as string || 'canvas_upload'
    
    // 生成TOS路径
    const timestamp = Date.now()
    const fileName = file.name
    const tosPath = `${userId}/${functionName}/user_upload/${timestamp}_${fileName}`
    
    // 将File转换为Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // 上传到TOS
    await tosClient.putObject({
      bucket: bucketName,
      key: tosPath,
      body: buffer,
      contentType: file.type,
    } as any)
    
    // 生成预签名URL（7天有效期）
    const expires = 7 * 24 * 60 * 60 // 7 days in seconds
    const presignedUrl = await tosClient.getPreSignedUrl({
      bucket: bucketName,
      key: tosPath,
      expires,
    } as any)
    
    console.log('Generated presigned URL:', presignedUrl)
    
    // 使用预签名URL
    const fileUrl = presignedUrl
    
    return NextResponse.json({
      success: true,
      data: {
        file_url: fileUrl,
        tos_path: tosPath,
        file_info: {
          original_filename: file.name,
          file_size: file.size,
          file_category: file.type.split('/')[0],
          mime_type: file.type,
        }
      }
    })
    
  } catch (error: any) {
    console.error('TOS upload error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path required' },
        { status: 400 }
      )
    }
    
    await tosClient.deleteObject({
      bucket: bucketName,
      key: filePath,
    } as any)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('TOS delete error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
