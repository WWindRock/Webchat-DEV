import { NextRequest, NextResponse } from 'next/server'
import { getJobStatus, cancelJob, JobStatus } from '@/queue/job-queue'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')

    if (!jobId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'MISSING_JOB_ID',
          message: 'Job ID is required'
        }
      }, { status: 400 })
    }

    const status = await getJobStatus(jobId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: status
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Job not found') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found'
        }
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'JOB_STATUS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get job status'
      }
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')

    if (!jobId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'MISSING_JOB_ID',
          message: 'Job ID is required'
        }
      }, { status: 400 })
    }

    const cancelled = await cancelJob(jobId)

    if (!cancelled) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found or already completed'
        }
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        jobId,
        status: 'cancelled',
        message: `Job ${jobId} has been cancelled`
      }
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'JOB_CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel job'
      }
    }, { status: 500 })
  }
}
