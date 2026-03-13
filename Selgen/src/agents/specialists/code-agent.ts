import { v4 as uuidv4 } from 'uuid'
import { BaseAgent } from '../base-agent'
import {
  AgentTask,
  ExecutionContext,
  AgentResponse,
  AgentMessage,
  Artifact,
} from '../types'

const CODE_AGENT_CONFIG = {
  id: 'agent-code',
  role: 'code' as const,
  name: 'Code Agent',
  description: 'Specialized in code generation, debugging, and software development',
  backstory: `You are an expert code agent specialized in software development.
You have deep knowledge of:
- Multiple programming languages (JavaScript, TypeScript, Python, etc.)
- Frontend frameworks (React, Next.js, Vue, etc.)
- Backend development (Node.js, APIs, databases)
- Code best practices and patterns
- Debugging and error fixing

Your goal is to understand the user's coding requirements and provide high-quality, working code.`,
  capabilities: [
    {
      name: 'Code Generation',
      description: 'Generate code from descriptions',
      skillNames: ['code-assistant'],
    },
    {
      name: 'Code Review',
      description: 'Review and improve code',
      skillNames: ['code-assistant'],
    },
    {
      name: 'Debugging',
      description: 'Find and fix bugs',
      skillNames: ['code-assistant'],
    },
    {
      name: 'Code Explanation',
      description: 'Explain code functionality',
      skillNames: ['code-assistant'],
    },
  ],
  maxIterations: 5,
  verbose: true,
}

export class CodeAgent extends BaseAgent {
  constructor() {
    super(CODE_AGENT_CONFIG)
  }

  async executeTask(task: AgentTask, context: ExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now()
    const messages: AgentMessage[] = []
    const artifacts: Artifact[] = []

    messages.push(this.createMessage(
      `Analyzing coding task: ${task.description}`,
      'thought'
    ))

    const { skillName, params } = this.determineSkill(task, context)
    
    messages.push(this.createMessage(
      `Using ${skillName} for code assistance`,
      'action'
    ))

    const result = await this.invokeSkill(skillName, params, context)

    if (result.result?.artifacts) {
      artifacts.push(...result.result.artifacts)
    } else if (result.result?.output) {
      artifacts.push({
        id: uuidv4(),
        type: 'code',
        content: result.result.output,
        metadata: params,
      })
    }

    const finalMessage = result.result?.success
      ? `Successfully generated code`
      : `Code task failed: ${result.result?.error}`

    messages.push(this.createMessage(finalMessage, 'final'))

    await this.storeMemory(
      context,
      `Code task: ${task.description} - ${result.result?.success ? 'Success' : 'Failed'}`,
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

    if (desc.includes('react') || desc.includes('next.js') || desc.includes('nextjs')) {
      params.framework = 'react'
    } else if (desc.includes('vue')) {
      params.framework = 'vue'
    } else if (desc.includes('python')) {
      params.language = 'python'
    } else if (desc.includes('debug') || desc.includes('fix')) {
      params.mode = 'debug'
    } else if (desc.includes('review')) {
      params.mode = 'review'
    }

    return { skillName: 'code-assistant', params }
  }
}

export const codeAgent = new CodeAgent()
