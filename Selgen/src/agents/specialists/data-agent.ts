import { v4 as uuidv4 } from 'uuid'
import { BaseAgent } from '../base-agent'
import {
  AgentTask,
  ExecutionContext,
  AgentResponse,
  AgentMessage,
  Artifact,
} from '../types'

const DATA_AGENT_CONFIG = {
  id: 'agent-data',
  role: 'data' as const,
  name: 'Data Agent',
  description: 'Specialized in data analysis, statistics, and data visualization',
  backstory: `You are an expert data analysis agent.
You have deep knowledge of:
- Data analysis and statistics
- Data visualization
- Report generation
- Trend analysis
- Business intelligence

Your goal is to analyze data and provide actionable insights.`,
  capabilities: [
    {
      name: 'Data Analysis',
      description: 'Analyze datasets',
      skillNames: ['data-analyzer'],
    },
    {
      name: 'Visualization',
      description: 'Create charts and graphs',
      skillNames: ['data-analyzer'],
    },
    {
      name: 'Reporting',
      description: 'Generate data reports',
      skillNames: ['data-analyzer'],
    },
    {
      name: 'Statistics',
      description: 'Statistical analysis',
      skillNames: ['data-analyzer'],
    },
  ],
  maxIterations: 5,
  verbose: true,
}

export class DataAgent extends BaseAgent {
  constructor() {
    super(DATA_AGENT_CONFIG)
  }

  async executeTask(task: AgentTask, context: ExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now()
    const messages: AgentMessage[] = []
    const artifacts: Artifact[] = []

    messages.push(this.createMessage(
      `Analyzing data task: ${task.description}`,
      'thought'
    ))

    const { skillName, params } = this.determineSkill(task, context)
    
    messages.push(this.createMessage(
      `Performing data ${params.analysisType || 'analysis'}`,
      'action'
    ))

    const result = await this.invokeSkill(skillName, params, context)

    if (result.result?.output) {
      artifacts.push({
        id: uuidv4(),
        type: 'data',
        content: result.result.output,
        metadata: params,
      })
    }

    const finalMessage = result.result?.success
      ? `Successfully completed data analysis`
      : `Data analysis failed: ${result.result?.error}`

    messages.push(this.createMessage(finalMessage, 'final'))

    await this.storeMemory(
      context,
      `Data analysis: ${task.description} - ${result.result?.success ? 'Success' : 'Failed'}`,
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

    if (desc.includes('chart') || desc.includes('graph') || desc.includes('visual')) {
      params.analysisType = 'visualization'
    } else if (desc.includes('report')) {
      params.analysisType = 'report'
    } else if (desc.includes('trend')) {
      params.analysisType = 'trend'
    } else if (desc.includes('statistics') || desc.includes('statistical')) {
      params.analysisType = 'statistics'
    } else {
      params.analysisType = 'general'
    }

    return { skillName: 'data-analyzer', params }
  }
}

export const dataAgent = new DataAgent()
