export * from './types'
export * from './base-agent'
export * from './specialists'
export * from './masters'

import { masterAgent } from './masters'
import { designAgent, codeAgent, marketingAgent, dataAgent, assistantAgent } from './specialists'
import { AgentRole, ExecutionContext, AgentTask } from './types'

export const agents = {
  master: masterAgent,
  design: designAgent,
  code: codeAgent,
  marketing: marketingAgent,
  data: dataAgent,
  assistant: assistantAgent,
}

export function getAgentByRole(role: AgentRole) {
  return agents[role]
}

export async function executeUserTask(
  userId: string,
  description: string,
  options?: {
    projectId?: string
    conversationId?: string
    context?: Record<string, any>
  }
): Promise<any> {
  const task: AgentTask = {
    id: `task_${Date.now()}`,
    description,
    status: 'pending',
    context: options?.context,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const executionContext: ExecutionContext = {
    userId,
    projectId: options?.projectId,
    conversationId: options?.conversationId,
    taskHistory: [],
    artifacts: [],
    memories: [],
    skillResults: new Map(),
  }

  return masterAgent.executeTask(task, executionContext)
}
