export type AgentRole = 
  | 'master'
  | 'data'
  | 'marketing'
  | 'design'
  | 'code'
  | 'assistant'

export interface AgentCapability {
  name: string
  description: string
  skillNames: string[]
}

export interface AgentConfig {
  id: string
  role: AgentRole
  name: string
  description: string
  backstory: string
  capabilities: AgentCapability[]
  maxIterations?: number
  verbose?: boolean
}

export interface AgentTask {
  id: string
  description: string
  expectedOutput?: string
  context?: Record<string, any>
  parentTaskId?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  assignedAgent?: string
  result?: TaskResult
  subtasks?: AgentTask[]
  createdAt: Date
  updatedAt: Date
}

export interface TaskResult {
  success: boolean
  output?: string
  artifacts?: Artifact[]
  error?: string
  metadata?: Record<string, any>
}

export interface Artifact {
  id: string
  type: 'text' | 'image' | 'video' | 'code' | 'data'
  content: any
  url?: string
  metadata?: Record<string, any>
}

export interface AgentMessage {
  id: string
  agentId: string
  agentRole: AgentRole
  content: string
  timestamp: Date
  type: 'thought' | 'action' | 'observation' | 'final'
}

export interface AgentDebate {
  id: string
  taskId: string
  agents: DebateParticipant[]
  rounds: number
  currentRound: number
  status: 'pending' | 'in_progress' | 'completed'
  finalDecision?: string
  createdAt: Date
}

export interface DebateParticipant {
  agentId: string
  agentRole: AgentRole
  arguments: string[]
  votes: number
  finalPosition?: string
}

export interface ExecutionContext {
  userId: string
  projectId?: string
  conversationId?: string
  taskHistory: AgentTask[]
  artifacts: Artifact[]
  memories: Array<{
    id: string
    content: string
    type: string
  }>
  skillResults: Map<string, any>
}

export interface SkillInvocation {
  skillName: string
  params: Record<string, any>
  result?: TaskResult
}

export interface AgentResponse {
  success: boolean
  task: AgentTask
  messages: AgentMessage[]
  artifacts: Artifact[]
  executionTime: number
  error?: string
}
