import { NextRequest, NextResponse } from 'next/server'
import { skillLoader } from '@/skills/engine/loader'
import { submitSkillJob } from '@/queue/job-queue'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const trigger = searchParams.get('trigger')

    let skills = skillLoader.listSkills()

    if (category) {
      skills = skills.filter(skill =>
        (skill.metadata.categories || []).includes(category)
      )
    }

    if (trigger) {
      const skill = skillLoader.findByTrigger(trigger)
      skills = skill ? [skill] : []
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: skills.map(skill => ({
        name: skill.name,
        display_name: skill.display_name,
        description: skill.description,
        version: skill.version,
        categories: skill.metadata.categories || [],
        tags: skill.metadata.tags || [],
        permissions: skill.permissions,
        manifest: skill.manifest
      })),
      meta: {
        total: skills.length
      }
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'SKILLS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list skills'
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { skillName, params, userId } = body

    if (!skillName) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'MISSING_SKILL_NAME',
          message: 'Skill name is required'
        }
      }, { status: 400 })
    }

    const skill = skillLoader.getSkill(skillName)
    if (!skill) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'SKILL_NOT_FOUND',
          message: `Skill '${skillName}' not found`
        }
      }, { status: 404 })
    }

    const jobId = await submitSkillJob(
      skillName,
      params || {},
      userId || 'anonymous'
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        jobId,
        skillName,
        status: 'queued',
        message: `Skill '${skillName}' has been queued for execution`
      }
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'SKILL_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to execute skill'
      }
    }, { status: 500 })
  }
}
