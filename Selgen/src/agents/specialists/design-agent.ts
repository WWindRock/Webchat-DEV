import { v4 as uuidv4 } from 'uuid'
import { BaseAgent } from '../base-agent'
import {
  AgentTask,
  ExecutionContext,
  AgentResponse,
  AgentMessage,
  Artifact,
} from '../types'

const DESIGN_AGENT_CONFIG = {
  id: 'agent-design',
  role: 'design' as const,
  name: 'Design Agent',
  description: 'Specialized in image generation, video creation, logo design, and visual content creation',
  backstory: `You are an expert design agent specialized in AI-powered visual content creation.
You have deep knowledge of:
- Image generation models and techniques
- Video generation and animation
- Logo and brand identity design
- Visual composition and color theory
- Various artistic styles (photorealistic, anime, oil painting, etc.)

Your goal is to understand the user's visual requirements and create stunning designs that exceed their expectations.`,
  capabilities: [
    {
      name: 'Image Generation',
      description: 'Generate images from text descriptions',
      skillNames: ['image-generation'],
    },
    {
      name: 'Video Generation',
      description: 'Create videos with AI',
      skillNames: ['video-generation'],
    },
    {
      name: 'Logo Design',
      description: 'Create professional logos',
      skillNames: ['image-generation'],
    },
    {
      name: 'Image Editing',
      description: 'Edit and enhance images',
      skillNames: ['image-generation'],
    },
  ],
  maxIterations: 5,
  verbose: true,
}

export class DesignAgent extends BaseAgent {
  constructor() {
    super(DESIGN_AGENT_CONFIG)
  }

  async executeTask(task: AgentTask, context: ExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now()
    const messages: AgentMessage[] = []
    const artifacts: Artifact[] = []

    messages.push(this.createMessage(
      `Analyzing design task: ${task.description}`,
      'thought'
    ))

    const skillInvocation = await this.determineSkill(task, context)
    
    messages.push(this.createMessage(
      `Selected skill: ${skillInvocation.skillName}`,
      'action'
    ))

    const result = await this.invokeSkill(
      skillInvocation.skillName,
      skillInvocation.params,
      context
    )

    if (result.result?.artifacts) {
      artifacts.push(...result.result.artifacts)
    }

    const finalMessage = result.result?.success
      ? `Successfully created ${artifacts.length} design artifact(s)`
      : `Design task failed: ${result.result?.error}`

    messages.push(this.createMessage(finalMessage, 'final'))

    await this.storeMemory(
      context,
      `Created design: ${task.description} - ${result.result?.success ? 'Success' : 'Failed'}`,
      'context'
    )

    return {
      success: result.result?.success ?? false,
      task: {
        ...task,
        status: result.result?.success ? 'completed' : 'failed',
        result: result.result,
        updatedAt: new Date(),
      },
      messages,
      artifacts,
      executionTime: Date.now() - startTime,
      error: result.result?.error,
    }
  }

  private determineSkill(
    task: AgentTask,
    context: ExecutionContext
  ): { skillName: string; params: Record<string, any> } {
    const desc = task.description.toLowerCase()
    const params: Record<string, any> = {
      ...task.context,
    }

    if (desc.includes('logo')) {
      params.style = 'logo'
      params.prompt = task.description
    } else if (desc.includes('video') || desc.includes('animation')) {
      return { skillName: 'video-generation', params }
    } else if (desc.includes('realistic') || desc.includes('photo')) {
      params.style = 'photorealistic'
    } else if (desc.includes('anime') || desc.includes('manga')) {
      params.style = 'anime'
    } else if (desc.includes('oil painting')) {
      params.style = 'oil-painting'
    } else if (desc.includes('watercolor')) {
      params.style = 'watercolor'
    } else if (desc.includes('3d') || desc.includes('3 d')) {
      params.style = '3d-render'
    }

    if (!params.prompt) {
      params.prompt = task.description
    }

    return { skillName: 'image-generation', params }
  }
}

export const designAgent = new DesignAgent()
