import { v4 as uuidv4 } from 'uuid'
import { BaseAgent } from '../base-agent'
import {
  AgentTask,
  ExecutionContext,
  AgentResponse,
  AgentMessage,
  AgentRole,
  Artifact,
} from '../types'
import {
  designAgent,
  codeAgent,
  marketingAgent,
  dataAgent,
  assistantAgent,
} from '../specialists'

const MASTER_AGENT_CONFIG = {
  id: 'agent-master',
  role: 'master' as const,
  name: 'Master Agent',
  description: 'Orchestrates tasks and delegates to specialized agents',
  backstory: `You are the Master Agent, responsible for coordinating all tasks and delegating to specialized agents.

You have access to the following specialized agents:
- **Design Agent**: Handles image generation, video creation, logo design, and visual content
- **Code Agent**: Handles code generation, debugging, and software development
- **Marketing Agent**: Handles content writing, marketing copy, and creative content
- **Data Agent**: Handles data analysis, visualization, and reporting
- **Assistant Agent**: Handles general questions and task clarification

Your job is to:
1. Understand the user's request
2. Determine which specialized agent(s) can handle the task
3. Delegate the task appropriately
4. Coordinate multiple agents if needed
5. Aggregate results and provide a final response

When multiple agents might be needed, you can initiate a debate where agents discuss and collaborate.`,
  capabilities: [
    {
      name: 'Task Orchestration',
      description: 'Coordinate and delegate tasks',
      skillNames: [],
    },
    {
      name: 'Multi-Agent Coordination',
      description: 'Coordinate multiple agents',
      skillNames: [],
    },
    {
      name: 'Result Aggregation',
      description: 'Combine results from multiple agents',
      skillNames: [],
    },
  ],
  maxIterations: 10,
  verbose: true,
}

const AGENT_MAP: Record<AgentRole, BaseAgent> = {
  master: null as any,
  design: designAgent,
  code: codeAgent,
  marketing: marketingAgent,
  data: dataAgent,
  assistant: assistantAgent,
}

export class MasterAgent extends BaseAgent {
  private taskQueue: AgentTask[] = []
  private results: Map<string, AgentResponse> = new Map()

  constructor() {
    super(MASTER_AGENT_CONFIG)
  }

  async executeTask(task: AgentTask, context: ExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now()
    const messages: AgentMessage[] = []
    const allArtifacts: Artifact[] = []

    messages.push(this.createMessage(
      `Master Agent processing: "${task.description}"`,
      'thought'
    ))

    const delegation = this.analyzeAndDelegate(task, context)
    
    messages.push(this.createMessage(
      `Task analysis complete. Delegating to: ${delegation.targetRoles.join(', ')}`,
      'action'
    ))

    if (delegation.needsDebate) {
      messages.push(this.createMessage(
        'Initiating multi-agent debate for complex task',
        'observation'
      ))

      const debateResult = await this.runDebate(task, context, delegation.targetRoles)
      allArtifacts.push(...debateResult.artifacts)
      messages.push(...debateResult.messages)
    } else {
      for (const role of delegation.targetRoles) {
        const agent = AGENT_MAP[role]
        if (!agent) continue

        messages.push(this.createMessage(
          `Delegating to ${agent.name}`,
          'action'
        ))

        const subtask: AgentTask = {
          id: uuidv4(),
          description: task.description,
          expectedOutput: task.expectedOutput,
          context: {
            ...task.context,
            parentTaskId: task.id,
          },
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = await agent.executeTask(subtask, context)
        this.results.set(role, result)

        messages.push(...result.messages)
        allArtifacts.push(...result.artifacts)

        if (!result.success && !delegation.canProceedOnFailure) {
          messages.push(this.createMessage(
            `Agent ${role} failed, attempting alternative approach`,
            'observation'
          ))
          break
        }
      }
    }

    const aggregatedResult = this.aggregateResults(
      task,
      messages,
      allArtifacts
    )

    messages.push(this.createMessage(
      `Task completed. Generated ${allArtifacts.length} artifact(s)`,
      'final'
    ))

    await this.storeMemory(
      context,
      `Master task completed: ${task.description.substring(0, 50)}... - ${allArtifacts.length} artifacts`,
      'context'
    )

    return {
      success: aggregatedResult.success,
      task: {
        ...task,
        status: aggregatedResult.success ? 'completed' : 'failed',
        result: {
          success: aggregatedResult.success,
          output: aggregatedResult.summary,
          artifacts: allArtifacts,
        },
        updatedAt: new Date(),
      },
      messages,
      artifacts: allArtifacts,
      executionTime: Date.now() - startTime,
    }
  }

  private analyzeAndDelegate(
    task: AgentTask,
    context: ExecutionContext
  ): {
    targetRoles: AgentRole[]
    needsDebate: boolean
    canProceedOnFailure: boolean
  } {
    const desc = task.description.toLowerCase()
    const targetRoles: AgentRole[] = []

    if (
      desc.includes('image') ||
      desc.includes('design') ||
      desc.includes('logo') ||
      desc.includes('video') ||
      desc.includes('photo')
    ) {
      targetRoles.push('design')
    }

    if (
      desc.includes('code') ||
      desc.includes('program') ||
      desc.includes('develop') ||
      desc.includes('function')
    ) {
      targetRoles.push('code')
    }

    if (
      desc.includes('content') ||
      desc.includes('write') ||
      desc.includes('blog') ||
      desc.includes('marketing') ||
      desc.includes('copy')
    ) {
      targetRoles.push('marketing')
    }

    if (
      desc.includes('data') ||
      desc.includes('analyze') ||
      desc.includes('chart') ||
      desc.includes('report') ||
      desc.includes('statistics')
    ) {
      targetRoles.push('data')
    }

    if (targetRoles.length === 0) {
      targetRoles.push('assistant')
    }

    const complexIndicators = [
      'and also',
      'as well as',
      'multiple',
      'several',
      'both',
      'combine',
    ]

    const needsDebate = complexIndicators.some(indicator =>
      desc.includes(indicator)
    ) && targetRoles.length > 1

    return {
      targetRoles,
      needsDebate,
      canProceedOnFailure: targetRoles.length > 1,
    }
  }

  private async runDebate(
    task: AgentTask,
    context: ExecutionContext,
    roles: AgentRole[]
  ): Promise<{
    messages: AgentMessage[]
    artifacts: Artifact[]
  }> {
    const messages: AgentMessage[] = []
    const artifacts: Artifact[] = []

    const maxRounds = 3
    let currentRound = 0
    let bestRole = roles[0]
    let bestScore = 0

    for (const role of roles) {
      const agent = AGENT_MAP[role]
      const score = agent.calculateRelevanceScore(task)
      
      messages.push(this.createMessage(
        `${agent.name} relevance score: ${score}`,
        'observation'
      ))

      if (score > bestScore) {
        bestScore = score
        bestRole = role
      }
    }

    messages.push(this.createMessage(
      `Best agent selected: ${AGENT_MAP[bestRole].name} (score: ${bestScore})`,
      'final'
    ))

    const result = await AGENT_MAP[bestRole].executeTask(task, context)
    messages.push(...result.messages)
    artifacts.push(...result.artifacts)

    return { messages, artifacts }
  }

  private aggregateResults(
    task: AgentTask,
    messages: AgentMessage[],
    artifacts: Artifact[]
  ): {
    success: boolean
    summary: string
  } {
    if (artifacts.length === 0) {
      return {
        success: messages.some(m => m.type === 'final' && m.content.includes('completed')),
        summary: 'Task completed. Check individual agent results for details.',
      }
    }

    const artifactTypes = artifacts.map(a => a.type)
    const typeSummary = artifactTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const summaryParts = Object.entries(typeSummary)
      .map(([type, count]) => `${count} ${type}(s)`)
      .join(', ')

    return {
      success: true,
      summary: `Generated: ${summaryParts}`,
    }
  }
}

export const masterAgent = new MasterAgent()
