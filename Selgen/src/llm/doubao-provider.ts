/**
 * 火山引擎 Doubao 大模型 Provider
 * 使用 ARK API 调用 Doubao 2.0 模型
 */

import OpenAI from 'openai'
import { LLMProvider, LLMRequest, LLMResponse, LLMMessage } from '../skills/engine/types'

export interface DoubaoConfig {
  apiKey: string
  baseURL?: string
  model?: string
  defaultTemperature?: number
  defaultMaxTokens?: number
}

export class DoubaoProvider implements LLMProvider {
  private client: OpenAI
  private defaultModel: string
  private defaultTemperature: number
  private defaultMaxTokens: number

  constructor(config: DoubaoConfig) {
    console.log('[DoubaoProvider] Constructor called with config:', {
      model: config.model || 'doubao-seed-2-0-pro-260215',
      baseURL: config.baseURL || 'https://ark.cn-beijing.volces.com/api/v3',
      hasApiKey: !!config.apiKey
    })
    
    this.defaultModel = config.model || 'doubao-seed-2-0-pro-260215'
    this.defaultTemperature = config.defaultTemperature ?? 0.7
    this.defaultMaxTokens = config.defaultMaxTokens ?? 4096

    // 火山引擎 ARK API 端点
    const baseURL = config.baseURL || 'https://ark.cn-beijing.volces.com/api/v3'

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL,
      timeout: 120000,
      maxRetries: 3
    })
    
    console.log('[DoubaoProvider] Client created successfully')
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model || this.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? this.defaultTemperature,
      max_tokens: request.max_tokens ?? this.defaultMaxTokens,
      top_p: request.top_p,
      stream: false,
      tools: request.tools
    })

    return this.convertToLLMResponse(response)
  }

  async chatStream(
    request: LLMRequest, 
    onChunk: (chunk: string) => void
  ): Promise<void> {
    console.log('[DoubaoProvider] chatStream called with model:', request.model || this.defaultModel)
    console.log('[DoubaoProvider] API baseURL:', this.client['baseURL'])
    
    try {
      const stream = await this.client.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? this.defaultTemperature,
        max_tokens: request.max_tokens ?? this.defaultMaxTokens,
        top_p: request.top_p,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          onChunk(content)
        }
      }
    } catch (error) {
      console.error('[DoubaoProvider] chatStream error:', error)
      throw error
    }
  }

  private convertToLLMResponse(response: OpenAI.Chat.Completions.ChatCompletion): LLMResponse {
    return {
      id: response.id,
      model: response.model,
      choices: response.choices.map(choice => ({
        index: choice.index,
        message: {
          role: choice.message.role || 'assistant',
          content: choice.message.content || ''
        },
        finish_reason: choice.finish_reason || 'stop'
      })),
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      } : undefined
    }
  }

  // 便捷方法：简单聊天
  async chatSimple(
    content: string,
    systemPrompt?: string,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
    }
  ): Promise<string> {
    const messages: LLMMessage[] = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content })

    const response = await this.chat({
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature ?? this.defaultTemperature,
      max_tokens: options?.maxTokens ?? this.defaultMaxTokens
    })

    return response.choices[0]?.message?.content || ''
  }
}

// 创建默认 Provider 实例
let defaultProvider: DoubaoProvider | null = null

export function createDoubaoProvider(config: DoubaoConfig): DoubaoProvider {
  return new DoubaoProvider(config)
}

export function getDefaultProvider(): DoubaoProvider | null {
  return defaultProvider
}

export function setDefaultProvider(provider: DoubaoProvider): void {
  defaultProvider = provider
}

// 从环境变量创建 Provider
export function createProviderFromEnv(): DoubaoProvider | null {
  const apiKey = process.env.ARK_API_KEY || process.env.OPENROUTER_API_KEY
  
  console.log('[DoubaoProvider] createProviderFromEnv called')
  console.log('[DoubaoProvider] ARK_API_KEY exists:', !!apiKey)
  console.log('[DoubaoProvider] ARK_API_KEY value:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET')
  console.log('[DoubaoProvider] OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY)
  console.log('[DoubaoProvider] DOUBAO_MODEL:', process.env.DOUBAO_MODEL)
  
  if (!apiKey) {
    console.warn('No ARK_API_KEY or OPENROUTER_API_KEY found in environment')
    return null
  }

  // 确定模型名称
  let model = process.env.DOUBAO_MODEL || 'doubao-pro-32k'
  
  // 如果使用 OpenRouter，模型格式不同
  const baseURL = process.env.OPENROUTER_API_KEY 
    ? 'https://openrouter.ai/api/v1'
    : 'https://ark.cn-beijing.volces.com/api/v3'
  
  // OpenRouter 使用不同的模型标识
  if (process.env.OPENROUTER_API_KEY) {
    model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet'
  }

  return new DoubaoProvider({
    apiKey,
    baseURL,
    model,
    defaultTemperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    defaultMaxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096')
  })
}

// 初始化默认 Provider
export function initializeLLM(): DoubaoProvider | null {
  console.log('[LLM] initializeLLM called')
  
  if (defaultProvider) {
    console.log('[LLM] Returning cached provider')
    return defaultProvider
  }
  
  console.log('[LLM] Creating new provider...')
  defaultProvider = createProviderFromEnv()
  
  if (defaultProvider) {
    console.log(`[LLM] Initialized with model: ${defaultProvider['defaultModel']}`)
  } else {
    console.error('[LLM] Failed to create provider - check API key configuration')
  }
  
  return defaultProvider
}
