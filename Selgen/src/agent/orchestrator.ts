/**
 * Agent orchestrator that coordinates skill execution and manages conversation flow
 * 支持 LLM 调用（火山引擎 Doubao）
 * 自动扫描 skills 目录并让 LLM 知道如何调用
 */

import { SkillExecutor } from '../skills/engine/executor'
import { ContextManager } from './context-manager'
import { MemoryManager } from './memory-manager'
import { Message, Conversation, User } from '../types'
import { getDefaultProvider, initializeLLM } from '../llm'
import { skillLoader } from '../skills/engine/loader'

export interface OrchestratorConfig {
  maxTurns?: number
  timeout?: number
  enableMemory?: boolean
  defaultModel?: string
}

export interface TurnResult {
  turn: number
  message: Message
  skillResults?: any[]
  completed: boolean
}

export class AgentOrchestrator {
  private skillExecutor: SkillExecutor
  private contextManager: ContextManager
  private memoryManager: MemoryManager
  private config: Required<OrchestratorConfig>
  private llmInitialized = false
  private skillsDescription = ''

  constructor(config: OrchestratorConfig = {}) {
    this.config = {
      maxTurns: config.maxTurns ?? 10,
      timeout: config.timeout ?? 300000,
      enableMemory: config.enableMemory ?? true,
      defaultModel: config.defaultModel ?? 'doubao-seed-2-0-pro-260215'
    }
    this.skillExecutor = new SkillExecutor()
    this.contextManager = new ContextManager()
    this.memoryManager = new MemoryManager()
  }

  private ensureLLM(): void {
    if (!this.llmInitialized) {
      const llm = initializeLLM()
      if (llm) {
        console.log('[Orchestrator] LLM initialized successfully')
      } else {
        console.warn('[Orchestrator] LLM initialization failed, using fallback responses')
      }
      this.llmInitialized = true
    }
  }

  /**
   * 自动扫描 skills 目录并生成 Skills 描述
   */
  private async scanSkills(): Promise<string> {
    if (this.skillsDescription) {
      return this.skillsDescription
    }

    try {
      const skills = await skillLoader.loadAllSkills()
      
      if (skills.length === 0) {
        return ''
      }

      const skillsInfo = skills.map(skill => {
        const commands = skill.metadata.triggers?.commands || []
        const keywords = skill.metadata.triggers?.keywords || []
        const desc = skill.description || skill.metadata.description || ''
        
        return {
          name: skill.name,
          commands: commands.length > 0 ? commands : [`/${skill.name}`],
          keywords,
          description: desc,
          usage: commands.length > 0 
            ? `使用命令: ${commands.join(', ')} 或直接描述你的需求`
            : `直接描述: ${desc}`
        }
      })

      // 构建 Skills 描述
      this.skillsDescription = `
## 可用的 Skills（技能）

你可以根据用户需求调用以下技能：

${skillsInfo.map(s => `
### ${s.name}
- **描述**: ${s.description}
- **调用方式**: ${s.usage}
- **触发关键词**: ${s.keywords.length > 0 ? s.keywords.join(', ') : '无'}
`).join('\n')}

### 如何选择合适的 Skill:
1. **图像相关** → 使用 image-generation 技能
2. **视频相关** → 使用 video-generation 技能  
3. **代码相关** → 使用 code-assistant 技能
4. **写作/营销** → 使用 content-writer 技能
5. **数据分析** → 使用 data-analyzer 技能

当用户请求与某个技能相关时，你应该：
1. 识别用户需求对应的技能
2. 调用相应的技能（使用 /技能名 或描述需求）
3. 将技能执行结果返回给用户
`

      console.log(`[Orchestrator] Loaded ${skills.length} skills`)
      return this.skillsDescription
    } catch (error) {
      console.error('[Orchestrator] Failed to scan skills:', error)
      return ''
    }
  }

  async processMessage(
    user: User,
    content: string,
    conversationId?: string
  ): Promise<TurnResult> {
    // 确保 LLM 已初始化并扫描 skills
    this.ensureLLM()
    await this.scanSkills()

    const conversation = await this.contextManager.getOrCreateConversation(
      user.id,
      conversationId
    )

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }

    await this.contextManager.addMessage(conversation.id, userMessage)

    const context = await this.contextManager.buildContext(conversation.id)
    
    let skillResults: any[] = []
    
    // 检查是否需要调用 skill
    if (this.shouldInvokeSkill(content)) {
      const skills = this.extractSkills(content)
      skillResults = await this.executeSkills(skills, user.id, context)
    }

    // 使用 LLM 生成响应
    const assistantMessage = await this.generateResponse(
      conversation,
      context,
      skillResults,
      content
    )

    await this.contextManager.addMessage(conversation.id, assistantMessage)

    if (this.config.enableMemory) {
      await this.memoryManager.storeInteraction(
        conversation.id,
        userMessage,
        assistantMessage,
        skillResults
      )
    }

    return {
      turn: conversation.messages.length,
      message: assistantMessage,
      skillResults,
      completed: this.isConversationComplete(conversation)
    }
  }

  private shouldInvokeSkill(content: string): boolean {
    // 检查是否以 / 开头（命令）或包含已知技能关键词
    const lowerContent = content.toLowerCase()
    
    // 检查是否以 / 开头
    if (content.trim().startsWith('/')) {
      return true
    }

    // 检查内容是否匹配已知技能的关键词
    const skills = skillLoader.listSkills()
    for (const skill of skills) {
      const keywords = skill.metadata.triggers?.keywords || []
      const name = skill.name.toLowerCase()
      
      // 检查关键词
      for (const kw of keywords) {
        if (lowerContent.includes(kw.toLowerCase())) {
          return true
        }
      }
      
      // 检查技能名称是否出现在内容中
      if (lowerContent.includes(name.replace(/-/g, ' ')) || 
          lowerContent.includes(name.replace(/-/g, ''))) {
        return true
      }
    }

    return false
  }

  private extractSkills(content: string): Array<{ name: string; params: any; rawArgs: string }> {
    const skills: Array<{ name: string; params: any; rawArgs: string }> = []
    const lowerContent = content.toLowerCase()
    
    // 首先尝试解析 /skill-name arguments 格式
    const parts = content.trim().split(/\s+/)
    if (parts[0].startsWith('/')) {
      const skillName = parts[0].substring(1)
      const rawArgs = parts.slice(1).join(' ')
      skills.push({
        name: skillName,
        params: { query: rawArgs },
        rawArgs
      })
      return skills
    }

    // 否则通过关键词匹配
    const availableSkills = skillLoader.listSkills()
    
    for (const skill of availableSkills) {
      const keywords = skill.metadata.triggers?.keywords || []
      const name = skill.name.toLowerCase()
      
      // 检查技能名称
      if (lowerContent.includes(name.replace(/-/g, ' ')) || 
          lowerContent.includes(name.replace(/-/g, ''))) {
        skills.push({
          name: skill.name,
          params: { query: content },
          rawArgs: content
        })
        break
      }
      
      // 检查关键词
      for (const kw of keywords) {
        if (lowerContent.includes(kw.toLowerCase())) {
          skills.push({
            name: skill.name,
            params: { query: content },
            rawArgs: content
          })
          break
        }
      }
    }

    return skills
  }

  private async executeSkills(
    skills: Array<{ name: string; params: any; rawArgs: string }>,
    userId: string,
    context: any
  ): Promise<any[]> {
    const results = []

    for (const skill of skills) {
      try {
        // 尝试使用 LLM 执行 skill（Claude Code 风格）
        const result = await this.skillExecutor.executeWithLLM({
          skillName: skill.name,
          params: skill.params,
          userId,
          arguments: skill.rawArgs,
          timeout: this.config.timeout,
          useLLM: true
        })
        results.push({ skill: skill.name, result })
      } catch (error) {
        results.push({
          skill: skill.name,
          error: error instanceof Error ? error.message : 'Execution failed'
        })
      }
    }

    return results
  }

  private async generateResponse(
    conversation: Conversation,
    context: any,
    skillResults: any[],
    userContent: string
  ): Promise<Message> {
    // 确保 LLM 已初始化
    this.ensureLLM()
    
    const llm = getDefaultProvider()
    
    // 如果有 skill 执行结果，直接返回
    if (skillResults.length > 0) {
      const hasErrors = skillResults.some(r => r.error)
      
      if (!hasErrors) {
        const successfulResults = skillResults.filter(r => r.result?.success)
        if (successfulResults.length > 0) {
          const content = successfulResults
            .map(r => r.result.content || `Skill ${r.skill} executed successfully`)
            .join('\n\n')
          
          return {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content,
            timestamp: new Date()
          }
        }
      }
    }

    // 使用 LLM 生成响应
    if (llm) {
      try {
        // 构建对话历史
        const messages = context.recentMessages?.map((m: Message) => ({
          role: m.role,
          content: m.content
        })) || []

        // 构建系统提示词（包含可用 Skills）
        const skillsInfo = await this.scanSkills()
        
        const systemPrompt = `你是 Selgen AI 助手，一个能帮助用户完成各种任务的 AI 助手。

你的能力包括：
- 图像生成和设计
- 视频创作
- 代码编写和调试
- 内容写作和营销
- 数据分析
- 问答和协助

${skillsInfo}

重要规则：
1. 当用户请求涉及图像、视频、代码、写作、数据分析时，你应该调用相应的技能
2. 用户可以直接用 /技能名 来调用技能，也可以直接描述需求
3. 如果用户的需求不明确，可以询问更多细节
4. 始终保持友好、简洁和有帮助的回复
5. 用中文回复，除非用户用英文`

        const response = await llm.chat({
          model: this.config.defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            { role: 'user', content: userContent }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })

        return {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: response.choices[0]?.message?.content || '任务完成',
          timestamp: new Date()
        }
      } catch (error) {
        console.error('[Orchestrator] LLM response generation failed:', error)
      }
    }

    // LLM 不可用时的回退响应
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: this.generateFallbackResponse(userContent, skillResults),
      timestamp: new Date()
    }
  }

  private generateFallbackResponse(content: string, skillResults: any[]): string {
    const lowerContent = content.toLowerCase()
    
    if (skillResults.length > 0) {
      return `我已处理您的请求: "${content}"`
    }

    if (lowerContent.includes('hello') || lowerContent.includes('你好') || lowerContent.includes('hi')) {
      return '你好！我是 Selgen AI 助手。我可以帮助你完成以下任务：\n\n🎨 图像生成和设计\n🎬 视频创作\n💻 代码编写和调试\n📝 内容写作和营销\n📊 数据分析\n❓ 问答和协助\n\n请告诉我你需要什么帮助？'
    }

    if (lowerContent.includes('help') || lowerContent.includes('帮助') || lowerContent.includes('你能做什么')) {
      return `我可以帮助你完成各种任务：

🎨 **图像生成** - 描述你想要生成的图片
🎬 **视频生成** - 描述你想要生成的视频  
💻 **代码助手** - 编写或调试代码
📝 **内容写作** - 博客、营销文案等
📊 **数据分析** - 分析数据、生成报告

直接输入你的需求，我会自动识别并调用相应的技能来帮助你！`
    }

    return `我理解你的请求: "${content}"

为了更好地帮助你，请告诉我：
- 你具体想要做什么？
- 有什么特殊的风格或要求吗？

或者你可以直接使用以下命令：
- /image [描述] - 生成图片
- /video [描述] - 生成视频
- /code [需求] - 编写代码
- /write [主题] - 写作内容
- /analyze [需求] - 数据分析`
  }

  private isConversationComplete(conversation: Conversation): boolean {
    return conversation.messages.length >= this.config.maxTurns * 2
  }

  async getConversationHistory(conversationId: string): Promise<Conversation | null> {
    return this.contextManager.getConversation(conversationId)
  }

  async clearConversation(conversationId: string): Promise<boolean> {
    return this.contextManager.clearConversation(conversationId)
  }

  /**
   * 手动获取当前加载的 Skills 列表
   */
  async getLoadedSkills() {
    return skillLoader.listSkills()
  }
}

export const agentOrchestrator = new AgentOrchestrator()
