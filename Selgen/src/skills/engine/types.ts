/**
 * Skill系统类型定义
 * 符合 Claude Code SKILL.md 标准
 */

export interface SkillMetadata {
  // Claude Code 标准字段
  name: string
  description: string
  argument_hint?: string
  disable_model_invocation?: boolean
  user_invocable?: boolean
  allowed_tools?: string[]
  model?: string
  context?: 'default' | 'fork'
  agent?: string
  hooks?: Record<string, any>

  // 扩展字段
  display_name?: string
  version?: string
  author?: string
  tags?: string[]
  categories?: string[]
  triggers?: {
    commands: string[]
    keywords: string[]
    auto_activate: boolean
  }
  parameters?: Record<string, ParameterDefinition>
  permissions?: PermissionConfig
  execution?: ExecutionConfig
  resources?: ResourceDependency[]
  related_skills?: string[]
}

export interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required?: boolean
  default?: any
  enum?: any[]
}

export interface PermissionConfig {
  network?: boolean
  filesystem?: {
    read?: boolean
    write?: boolean
    paths?: string[]
  }
  skills?: {
    invoke?: string[]
  }
  resources?: string[]
}

export interface ExecutionConfig {
  timeout?: number
  max_memory?: string
  type?: 'sync' | 'async'
  retry_policy?: {
    max_attempts: number
    backoff?: 'fixed' | 'exponential'
  }
}

export interface ResourceDependency {
  uri: string
  description: string
}

export interface SkillContext {
  user: {
    id: string
    name: string
    preferences: Record<string, any>
  }
  conversation: {
    id: string
    history: Message[]
  }
  resources: {
    get: (uri: string) => Promise<any>
    load: (uri: string) => Promise<Buffer>
  }
  memory: {
    store: (data: MemoryEntry) => Promise<void>
    retrieve: (query: string, limit?: number) => Promise<MemoryEntry[]>
  }
  skills: {
    invoke: (skillName: string, params: any) => Promise<SkillResult>
    list: () => Promise<SkillInfo[]>
  }
  storage: {
    tos: TOSClient
    local: LocalStorage
  }
  permissions: {
    canInvoke: (skillName: string) => boolean
    canAccess: (resource: string) => boolean
    canNetwork: () => boolean
  }
  logger: {
    info: (message: string, meta?: any) => void
    error: (message: string, error?: any) => void
    warn: (message: string, meta?: any) => void
  }
  reportProgress: (progress: number, message?: string) => Promise<void>
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface MemoryEntry {
  type: string
  content: string
  metadata?: Record<string, any>
  timestamp?: string
}

export interface SkillResult {
  success: boolean
  type: 'text' | 'image' | 'video' | 'code' | 'component' | 'mixed'
  content: any
  metadata?: Record<string, any>
  error?: string
}

export interface SkillStreamChunk {
  type: 'progress' | 'result' | 'error' | 'log'
  progress?: number
  message?: string
  result?: SkillResult
  error?: string
  log?: string
}

export interface SkillInfo {
  name: string
  display_name?: string
  description: string
  version?: string
  disable_model_invocation?: boolean
  user_invocable?: boolean
}

export interface TOSClient {
  upload: (options: any) => Promise<any>
  uploadFromUrl: (url: string, options: any) => Promise<any>
  delete: (tosPath: string) => Promise<boolean>
  getUrl: (tosPath: string, expiresIn?: number) => Promise<string>
  getMetadata: (tosPath: string) => Promise<Record<string, any>>
}

export interface LocalStorage {
  read: (path: string) => Promise<Buffer>
  write: (path: string, data: Buffer) => Promise<void>
  delete: (path: string) => Promise<void>
}

export interface RegisteredSkill {
  name: string
  display_name?: string
  description: string
  version?: string
  path: string
  metadata: SkillMetadata
  manifest: any
  permissions: PermissionConfig
  isActive: boolean
  lastLoaded: Date
  
  // Claude Code 扩展字段
  argument_hint?: string
  disable_model_invocation?: boolean
  user_invocable?: boolean
  allowed_tools?: string[]
  model?: string
  context?: 'default' | 'fork'
  agent?: string
  hooks?: Record<string, any>
  
  // 文档内容
  documentation?: string
  
  // 支持文件
  supportingFiles?: Record<string, string>
}

export type SkillParameters = Record<string, any>

// ============================================
// LLM Provider 类型定义 (火山引擎 Doubao)
// ============================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMRequest {
  model: string
  messages: LLMMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  tools?: any[]
}

export interface LLMResponse {
  id: string
  model: string
  choices: {
    index: number
    message: LLMMessage
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface LLMProvider {
  chat(request: LLMRequest): Promise<LLMResponse>
  chatStream(request: LLMRequest, onChunk: (chunk: string) => void): Promise<void>
}

// ============================================
// Skill LLM Context (Claude Code 风格)
// ============================================

export interface SkillLLMContext {
  skill: RegisteredSkill
  arguments: string
  sessionId: string
  userId: string
  messages: LLMMessage[]
}
