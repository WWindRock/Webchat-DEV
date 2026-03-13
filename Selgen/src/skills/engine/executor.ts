/**
 * Skill Executor - 支持 LLM 调用的技能执行器
 * 符合 Claude Code SKILL.md 标准
 */

import { SkillContext, SkillResult, SkillParameters, SkillStreamChunk, LLMMessage, RegisteredSkill } from './types'
import { SkillPermissions } from './permissions'
import { skillLoader } from './loader'
import { getDefaultProvider } from '@/llm'

export interface ExecutionOptions {
  skillName: string
  params: SkillParameters
  userId: string
  conversationId?: string
  sessionId?: string
  arguments?: string
  timeout?: number
  reportProgress?: (progress: number, message?: string) => Promise<void>
}

export interface LLMExecutionOptions extends ExecutionOptions {
  useLLM?: boolean
}

export class SkillExecutor {
  private executions: Map<string, AbortController> = new Map()

  async execute(options: ExecutionOptions): Promise<SkillResult> {
    const { skillName, params, userId, timeout = 60000 } = options
    const executionId = `${skillName}_${userId}_${Date.now()}`
    
    const controller = new AbortController()
    this.executions.set(executionId, controller)

    try {
      // Create execution timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          controller.abort()
          reject(new Error(`Skill execution timeout after ${timeout}ms`))
        }, timeout)
      })

      // Execute skill
      const executionPromise = this.runSkill(skillName, params, userId, controller.signal, options.reportProgress)

      const result = await Promise.race([executionPromise, timeoutPromise])
      
      return result
    } catch (error) {
      return {
        success: false,
        type: 'text',
        content: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      this.executions.delete(executionId)
    }
  }

  /**
   * 使用 LLM 执行技能（Claude Code 风格）
   * 支持 $ARGUMENTS 替换和动态上下文注入
   */
  async executeWithLLM(options: LLMExecutionOptions): Promise<SkillResult> {
    const { 
      skillName, 
      params, 
      userId, 
      conversationId,
      sessionId,
      arguments: rawArgs = '',
      timeout = 60000 
    } = options

    const skill = skillLoader.getSkill(skillName)
    if (!skill) {
      return {
        success: false,
        type: 'text',
        content: null,
        error: `Skill not found: ${skillName}`
      }
    }

    // 检查是否禁用模型调用
    if (skill.disable_model_invocation && !rawArgs) {
      return {
        success: false,
        type: 'text',
        content: null,
        error: `Skill ${skillName} requires manual invocation`
      }
    }

    // 获取 LLM Provider
    const llm = getDefaultProvider()
    if (!llm) {
      // 如果没有 LLM，回退到传统执行方式
      console.warn('[SkillExecutor] No LLM provider, falling back to script execution')
      return this.execute({ skillName, params, userId, timeout })
    }

    try {
      // 构建系统提示词
      let systemPrompt = skill.documentation || ''
      
      // 替换 $ARGUMENTS 占位符
      if (rawArgs) {
        systemPrompt = skillLoader.parseArguments(systemPrompt, rawArgs)
      }

      // 替换 ${CLAUDE_SESSION_ID}
      const currentSessionId = sessionId || `session_${Date.now()}`
      systemPrompt = systemPrompt.replace(/\$\{CLAUDE_SESSION_ID\}/g, currentSessionId)

      // 加载支持文件的引用
      if (skill.supportingFiles) {
        const references = this.buildReferences(skill.supportingFiles)
        systemPrompt += '\n\n## Additional Resources\n' + references
      }

      // 构建消息
      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt }
      ]

      // 添加用户参数
      if (rawArgs) {
        messages.push({ 
          role: 'user', 
          content: rawArgs 
        })
      } else if (params) {
        messages.push({ 
          role: 'user', 
          content: typeof params === 'string' ? params : JSON.stringify(params, null, 2)
        })
      }

      // 调用 LLM
      await options.reportProgress?.(30, 'Calling LLM...')
      
      const response = await llm.chat({
        model: skill.model || 'doubao-pro-32k',
        messages,
        temperature: 0.7,
        max_tokens: 4096
      })

      await options.reportProgress?.(100, 'Complete')

      return {
        success: true,
        type: 'text',
        content: response.choices[0]?.message?.content || '',
        metadata: {
          skill: skillName,
          model: response.model,
          sessionId: currentSessionId,
          usage: response.usage
        }
      }

    } catch (error) {
      console.error('[SkillExecutor] LLM execution error:', error)
      return {
        success: false,
        type: 'text',
        content: null,
        error: error instanceof Error ? error.message : 'LLM execution failed'
      }
    }
  }

  private buildReferences(supportingFiles: Record<string, string>): string {
    const refs: string[] = []
    
    if (supportingFiles['reference.md']) {
      refs.push('- [Reference](reference.md)')
    }
    if (supportingFiles['examples.md']) {
      refs.push('- [Examples](examples.md)')
    }
    if (supportingFiles['template.md']) {
      refs.push('- [Template](template.md)')
    }
    
    return refs.join('\n')
  }

  private async runSkill(
    skillName: string,
    params: SkillParameters,
    userId: string,
    signal: AbortSignal,
    reportProgress?: (progress: number, message?: string) => Promise<void>
  ): Promise<SkillResult> {
    // Check permissions
    const permissions = await SkillPermissions.forSkill(skillName)
    
    if (!permissions.canExecute) {
      return {
        success: false,
        type: 'text',
        content: null,
        error: 'Permission denied: Cannot execute this skill'
      }
    }

    // Validate parameters
    const validationResult = this.validateParameters(skillName, params)
    if (!validationResult.valid) {
      return {
        success: false,
        type: 'text',
        content: null,
        error: validationResult.error
      }
    }

    // Create execution context
    const context = await this.createContext(userId, permissions, reportProgress)

    // Execute skill script
    try {
      const skillModule = await this.loadSkillModule(skillName)
      const result = await skillModule.default(params, context)
      
      return {
        success: true,
        type: result.type || 'text',
        content: result.content,
        metadata: result.metadata
      }
    } catch (error) {
      return {
        success: false,
        type: 'text',
        content: null,
        error: error instanceof Error ? error.message : 'Execution failed'
      }
    }
  }

  private validateParameters(skillName: string, params: SkillParameters): { valid: boolean; error?: string } {
    const skill = skillLoader.getSkill(skillName)
    if (!skill?.metadata?.parameters) {
      return { valid: true }
    }

    const paramDefs = skill.metadata.parameters
    
    // 检查必需参数
    for (const [name, def] of Object.entries(paramDefs)) {
      if (def.required && (params[name] === undefined || params[name] === null)) {
        return { valid: false, error: `Missing required parameter: ${name}` }
      }
    }

    return { valid: true }
  }

  private async createContext(
    userId: string,
    permissions: any,
    reportProgress?: (progress: number, message?: string) => Promise<void>
  ): Promise<SkillContext> {
    return {
      user: {
        id: userId,
        name: 'User',
        preferences: {}
      },
      conversation: {
        id: `conv_${Date.now()}`,
        history: []
      },
      resources: {
        get: async (uri: string) => null,
        load: async (uri: string) => Buffer.from('')
      },
      memory: {
        store: async () => {},
        retrieve: async () => []
      },
      skills: {
        invoke: async (name: string, params: any) => {
          return this.execute({ skillName: name, params, userId })
        },
        list: async () => skillLoader.listSkills().map(s => ({
          name: s.name,
          description: s.description
        }))
      },
      storage: {
        tos: {
          upload: async () => ({ success: true, fileUrl: '', cdnUrl: '', tosPath: '', metadata: {} }),
          uploadFromUrl: async () => ({ success: true, fileUrl: '', cdnUrl: '', tosPath: '', metadata: {} }),
          delete: async () => true,
          getUrl: async () => '',
          getMetadata: async () => ({})
        },
        local: {
          read: async () => Buffer.from(''),
          write: async () => {},
          delete: async () => {}
        }
      },
      permissions: {
        canInvoke: () => permissions.canInvoke,
        canAccess: () => permissions.canAccess,
        canNetwork: () => permissions.canNetwork
      },
      logger: {
        info: (msg: string) => console.log(`[INFO] ${msg}`),
        error: (msg: string, err?: any) => console.error(`[ERROR] ${msg}`, err),
        warn: (msg: string) => console.warn(`[WARN] ${msg}`)
      },
      reportProgress: reportProgress || (async () => {})
    }
  }

  private async loadSkillModule(skillName: string): Promise<any> {
    const skillPath = `../../../skills/${skillName}/scripts/index.ts`
    try {
      return await import(skillPath)
    } catch (e) {
      // 如果脚本不存在，返回空执行器
      return {
        default: async (params: any, context: any) => ({
          success: true,
          type: 'text',
          content: `Skill ${skillName} executed with params: ${JSON.stringify(params)}`
        })
      }
    }
  }

  cancelExecution(executionId: string): boolean {
    const controller = this.executions.get(executionId)
    if (controller) {
      controller.abort()
      this.executions.delete(executionId)
      return true
    }
    return false
  }
}

export const skillExecutor = new SkillExecutor()
