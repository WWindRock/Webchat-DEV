import { v4 as uuidv4 } from 'uuid'
import {
  AgentConfig,
  AgentTask,
  TaskResult,
  AgentMessage,
  ExecutionContext,
  AgentRole,
  AgentResponse,
  Artifact,
  SkillInvocation,
} from './types'
import { skillExecutor } from '@/skills/engine/executor'
import { memoryService } from '@/memory'

export abstract class BaseAgent {
  protected config: AgentConfig
  protected executionHistory: Map<string, AgentTask[]> = new Map()

  constructor(config: AgentConfig) {
    this.config = config
  }

  get id(): string {
    return this.config.id
  }

  get role(): AgentRole {
    return this.config.role
  }

  get name(): string {
    return this.config.name
  }

  abstract executeTask(task: AgentTask, context: ExecutionContext): Promise<AgentResponse>

  protected createMessage(
    content: string,
    type: AgentMessage['type']
  ): AgentMessage {
    return {
      id: uuidv4(),
      agentId: this.config.id,
      agentRole: this.config.role,
      content,
      timestamp: new Date(),
      type,
    }
  }

  protected async invokeSkill(
    skillName: string,
    params: Record<string, any>,
    context: ExecutionContext
  ): Promise<SkillInvocation> {
    const invocation: SkillInvocation = {
      skillName,
      params,
    }

    try {
      const result = await skillExecutor.execute({
        skillName,
        params: {
          ...params,
          userId: context.userId,
        },
        userId: context.userId,
        timeout: 300000,
      })

      invocation.result = {
        success: result.success,
        output: result.content as string,
        artifacts: result.content ? this.extractArtifacts(result) : undefined,
        error: result.error,
      }
    } catch (error) {
      invocation.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Skill execution failed',
      }
    }

    return invocation
  }

  private extractArtifacts(result: any): Artifact[] {
    const artifacts: Artifact[] = []
    
    if (result.type === 'image' && result.content) {
      artifacts.push({
        id: uuidv4(),
        type: 'image',
        content: result.content,
        url: result.metadata?.url,
        metadata: result.metadata,
      })
    } else if (result.type === 'video' && result.content) {
      artifacts.push({
        id: uuidv4(),
        type: 'video',
        content: result.content,
        url: result.metadata?.url,
        metadata: result.metadata,
      })
    } else if (result.type === 'code' && result.content) {
      artifacts.push({
        id: uuidv4(),
        type: 'code',
        content: result.content,
        metadata: result.metadata,
      })
    }

    return artifacts
  }

  protected async storeMemory(
    context: ExecutionContext,
    content: string,
    memoryType: 'fact' | 'preference' | 'context' = 'context'
  ): Promise<void> {
    try {
      await memoryService.storeMemory({
        userId: context.userId,
        projectId: context.projectId,
        conversationId: context.conversationId,
        memoryType,
        content,
        importance: memoryType === 'fact' ? 2 : 1,
      })
    } catch (error) {
      console.warn('Failed to store agent memory:', error)
    }
  }

  protected buildBackstoryWithContext(context: ExecutionContext): string {
    let backstory = this.config.backstory

    if (context.memories.length > 0) {
      const relevantMemories = context.memories.slice(0, 5)
      const memoryContext = relevantMemories
        .map((m: { content: string }) => `- ${m.content}`)
        .join('\n')
      
      backstory += `\n\nRelevant memories:\n${memoryContext}`
    }

    return backstory
  }

  protected shouldDelegate(task: AgentTask, context: ExecutionContext): {
    shouldDelegate: boolean
    targetRole?: AgentRole
    reason?: string
  } {
    const taskLower = task.description.toLowerCase()

    if (
      taskLower.includes('analyze') ||
      taskLower.includes('data') ||
      taskLower.includes('chart') ||
      taskLower.includes('statistics')
    ) {
      return {
        shouldDelegate: true,
        targetRole: 'data',
        reason: 'Task requires data analysis capabilities',
      }
    }

    if (
      taskLower.includes('marketing') ||
      taskLower.includes('content') ||
      taskLower.includes('write') ||
      taskLower.includes('blog') ||
      taskLower.includes('social media')
    ) {
      return {
        shouldDelegate: true,
        targetRole: 'marketing',
        reason: 'Task requires marketing content capabilities',
      }
    }

    if (
      taskLower.includes('image') ||
      taskLower.includes('design') ||
      taskLower.includes('logo') ||
      taskLower.includes('video') ||
      taskLower.includes('animation')
    ) {
      return {
        shouldDelegate: true,
        targetRole: 'design',
        reason: 'Task requires design and generation capabilities',
      }
    }

    if (
      taskLower.includes('code') ||
      taskLower.includes('program') ||
      taskLower.includes('debug') ||
      taskLower.includes('function')
    ) {
      return {
        shouldDelegate: true,
        targetRole: 'code',
        reason: 'Task requires coding capabilities',
      }
    }

    return { shouldDelegate: false }
  }

  public calculateRelevanceScore(task: AgentTask): number {
    const taskKeywords = task.description.toLowerCase().split(/\s+/)
    let score = 0

    for (const capability of this.config.capabilities) {
      for (const skillName of capability.skillNames) {
        const skillKeywords = skillName.toLowerCase().split(/\s+/)
        for (const taskKeyword of taskKeywords) {
          if (skillKeywords.some((sk: string) => sk.includes(taskKeyword) || taskKeyword.includes(sk))) {
            score += 1
          }
        }
      }
    }

    return score
  }
}
