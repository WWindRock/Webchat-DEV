import { v4 as uuidv4 } from 'uuid'
import { BaseAgent } from '../base-agent'
import {
  AgentTask,
  ExecutionContext,
  AgentResponse,
  AgentMessage,
  Artifact,
} from '../types'

const MARKETING_AGENT_CONFIG = {
  id: 'agent-marketing',
  role: 'marketing' as const,
  name: 'Marketing Agent',
  description: 'Specialized in content writing, marketing copy, and creative content creation',
  backstory: `You are an expert marketing agent specialized in content creation.
You have deep knowledge of:
- Content marketing strategies
- Copywriting (headlines, descriptions, ads)
- Blog post and article writing
- Social media content
- Email marketing
- Brand voice and tone

Your goal is to create compelling content that engages audiences and drives results.`,
  capabilities: [
    {
      name: 'Content Writing',
      description: 'Write articles, blog posts, and content',
      skillNames: ['content-writer'],
    },
    {
      name: 'Copywriting',
      description: 'Create marketing copy',
      skillNames: ['content-writer'],
    },
    {
      name: 'Social Media',
      description: 'Create social media content',
      skillNames: ['content-writer'],
    },
    {
      name: 'Marketing Strategy',
      description: 'Develop marketing strategies',
      skillNames: ['content-writer'],
    },
  ],
  maxIterations: 5,
  verbose: true,
}

export class MarketingAgent extends BaseAgent {
  constructor() {
    super(MARKETING_AGENT_CONFIG)
  }

  async executeTask(task: AgentTask, context: ExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now()
    const messages: AgentMessage[] = []
    const artifacts: Artifact[] = []

    messages.push(this.createMessage(
      `Analyzing marketing task: ${task.description}`,
      'thought'
    ))

    const { skillName, params } = this.determineSkill(task, context)
    
    messages.push(this.createMessage(
      `Creating ${params.contentType} content`,
      'action'
    ))

    const result = await this.invokeSkill(skillName, params, context)

    if (result.result?.output) {
      artifacts.push({
        id: uuidv4(),
        type: 'text',
        content: result.result.output,
        metadata: params,
      })
    }

    const finalMessage = result.result?.success
      ? `Successfully created ${params.contentType || 'content'}`
      : `Marketing task failed: ${result.result?.error}`

    messages.push(this.createMessage(finalMessage, 'final'))

    await this.storeMemory(
      context,
      `Marketing content: ${task.description} - ${result.result?.success ? 'Success' : 'Failed'}`,
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
      prompt: task.description,
      ...task.context,
    }

    if (desc.includes('blog') || desc.includes('article')) {
      params.contentType = 'blog'
    } else if (desc.includes('social media') || desc.includes('twitter') || desc.includes('instagram')) {
      params.contentType = 'social'
    } else if (desc.includes('email')) {
      params.contentType = 'email'
    } else if (desc.includes('ad') || desc.includes('advertisement')) {
      params.contentType = 'advertisement'
    } else if (desc.includes('product description') || desc.includes('product')) {
      params.contentType = 'product'
    } else {
      params.contentType = 'general'
    }

    return { skillName: 'content-writer', params }
  }
}

export const marketingAgent = new MarketingAgent()
