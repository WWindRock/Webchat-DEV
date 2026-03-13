/**
 * Manages conversation context and history
 */

import { Conversation, Message, User } from '../types'

export interface ContextConfig {
  maxHistoryLength?: number
  contextWindowSize?: number
}

export class ContextManager {
  private conversations: Map<string, Conversation> = new Map()
  private config: Required<ContextConfig>

  constructor(config: ContextConfig = {}) {
    this.config = {
      maxHistoryLength: config.maxHistoryLength ?? 100,
      contextWindowSize: config.contextWindowSize ?? 10
    }
  }

  async getOrCreateConversation(
    userId: string,
    conversationId?: string
  ): Promise<Conversation> {
    if (conversationId) {
      const existing = this.conversations.get(conversationId)
      if (existing && existing.userId === userId) {
        return existing
      }
    }

    return this.createConversation(userId)
  }

  private createConversation(userId: string): Conversation {
    const conversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.conversations.set(conversation.id, conversation)
    return conversation
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.conversations.get(conversationId) || null
  }

  async addMessage(conversationId: string, message: Message): Promise<void> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`)
    }

    conversation.messages.push(message)
    conversation.updatedAt = new Date()

    if (conversation.messages.length > this.config.maxHistoryLength) {
      conversation.messages = conversation.messages.slice(-this.config.maxHistoryLength)
    }

    if (conversation.messages.length === 1) {
      conversation.title = this.generateTitle(message.content)
    }
  }

  async buildContext(conversationId: string): Promise<{
    conversation: Conversation
    recentMessages: Message[]
    summary?: string
  }> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`)
    }

    const recentMessages = conversation.messages.slice(-this.config.contextWindowSize)
    const summary = this.generateSummary(conversation)

    return {
      conversation,
      recentMessages,
      summary
    }
  }

  async clearConversation(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) {
      return false
    }

    conversation.messages = []
    conversation.updatedAt = new Date()
    return true
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    return this.conversations.delete(conversationId)
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  private generateTitle(content: string): string {
    const maxLength = 50
    const cleanContent = content.replace(/\s+/g, ' ').trim()
    
    if (cleanContent.length <= maxLength) {
      return cleanContent
    }
    
    return cleanContent.substring(0, maxLength) + '...'
  }

  private generateSummary(conversation: Conversation): string | undefined {
    if (conversation.messages.length < 5) {
      return undefined
    }

    const messageCount = conversation.messages.length
    const userMessages = conversation.messages.filter(m => m.role === 'user')
    
    return `Conversation with ${userMessages.length} user messages and ${messageCount} total messages`
  }

  getStats(): {
    totalConversations: number
    totalMessages: number
    averageMessagesPerConversation: number
  } {
    const conversations = Array.from(this.conversations.values())
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0)
    
    return {
      totalConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation: conversations.length > 0 
        ? Math.round(totalMessages / conversations.length) 
        : 0
    }
  }
}

export const contextManager = new ContextManager()
