/**
 * Manages memory storage and retrieval
 */

import { Message } from '../types'

export interface MemoryEntry {
  id: string
  type: 'interaction' | 'fact' | 'preference' | 'context'
  content: string
  metadata?: Record<string, any>
  timestamp: Date
  conversationId?: string
  importance?: number
}

export interface MemoryQuery {
  type?: string
  conversationId?: string
  limit?: number
  minImportance?: number
}

export interface MemoryConfig {
  maxEntries?: number
  defaultImportance?: number
  decayFactor?: number
}

export class MemoryManager {
  private memories: Map<string, MemoryEntry> = new Map()
  private config: Required<MemoryConfig>

  constructor(config: MemoryConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      defaultImportance: config.defaultImportance ?? 1,
      decayFactor: config.decayFactor ?? 0.95
    }
  }

  async store(data: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      ...data,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      importance: data.importance ?? this.config.defaultImportance
    }

    this.memories.set(entry.id, entry)
    await this.cleanup()

    return entry
  }

  async storeInteraction(
    conversationId: string,
    userMessage: Message,
    assistantMessage: Message,
    skillResults?: any[]
  ): Promise<MemoryEntry> {
    const content = JSON.stringify({
      user: userMessage.content,
      assistant: assistantMessage.content,
      skills: skillResults?.map(s => s.skill) || []
    })

    return this.store({
      type: 'interaction',
      content,
      conversationId,
      metadata: {
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        skillCount: skillResults?.length || 0
      },
      importance: this.calculateImportance(userMessage.content)
    })
  }

  async storeFact(fact: string, metadata?: Record<string, any>): Promise<MemoryEntry> {
    return this.store({
      type: 'fact',
      content: fact,
      metadata,
      importance: 2
    })
  }

  async storePreference(
    key: string,
    value: any,
    userId: string
  ): Promise<MemoryEntry> {
    return this.store({
      type: 'preference',
      content: JSON.stringify({ key, value }),
      metadata: { userId, preferenceKey: key },
      importance: 3
    })
  }

  async retrieve(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const entries = Array.from(this.memories.values())
    
    const scored = entries.map(entry => ({
      entry,
      score: this.calculateRelevance(entry, query)
    }))

    scored.sort((a, b) => b.score - a.score)

    return scored
      .slice(0, limit)
      .map(s => s.entry)
  }

  async query(filters: MemoryQuery): Promise<MemoryEntry[]> {
    let entries = Array.from(this.memories.values())

    if (filters.type) {
      entries = entries.filter(e => e.type === filters.type)
    }

    if (filters.conversationId) {
      entries = entries.filter(e => e.conversationId === filters.conversationId)
    }

    if (filters.minImportance !== undefined) {
      entries = entries.filter(e => (e.importance || 0) >= filters.minImportance!)
    }

    entries.sort((a, b) => {
      const scoreA = (a.importance || 0) * this.timeDecay(a.timestamp)
      const scoreB = (b.importance || 0) * this.timeDecay(b.timestamp)
      return scoreB - scoreA
    })

    return entries.slice(0, filters.limit || 10)
  }

  async getRecent(limit: number = 10): Promise<MemoryEntry[]> {
    const entries = Array.from(this.memories.values())
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return entries.slice(0, limit)
  }

  async delete(memoryId: string): Promise<boolean> {
    return this.memories.delete(memoryId)
  }

  async clear(): Promise<void> {
    this.memories.clear()
  }

  async getStats(): Promise<{
    totalEntries: number
    byType: Record<string, number>
    averageImportance: number
  }> {
    const entries = Array.from(this.memories.values())
    const byType: Record<string, number> = {}

    entries.forEach(entry => {
      byType[entry.type] = (byType[entry.type] || 0) + 1
    })

    const totalImportance = entries.reduce((sum, e) => sum + (e.importance || 0), 0)

    return {
      totalEntries: entries.length,
      byType,
      averageImportance: entries.length > 0 ? totalImportance / entries.length : 0
    }
  }

  private calculateRelevance(entry: MemoryEntry, query: string): number {
    const content = entry.content.toLowerCase()
    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/)
    
    let score = 0
    
    words.forEach(word => {
      if (content.includes(word)) {
        score += 1
      }
    })

    score *= entry.importance || 1
    score *= this.timeDecay(entry.timestamp)

    return score
  }

  private calculateImportance(content: string): number {
    let importance = this.config.defaultImportance

    if (content.includes('?')) importance += 0.5
    if (content.length > 100) importance += 0.5
    if (/\b(important|urgent|critical|remember)\b/i.test(content)) importance += 1

    return Math.min(importance, 5)
  }

  private timeDecay(timestamp: Date): number {
    const age = Date.now() - timestamp.getTime()
    const days = age / (1000 * 60 * 60 * 24)
    return Math.pow(this.config.decayFactor, days)
  }

  private async cleanup(): Promise<void> {
    if (this.memories.size <= this.config.maxEntries) {
      return
    }

    const entries = Array.from(this.memories.entries())
    entries.sort((a, b) => {
      const scoreA = (a[1].importance || 0) * this.timeDecay(a[1].timestamp)
      const scoreB = (b[1].importance || 0) * this.timeDecay(b[1].timestamp)
      return scoreA - scoreB
    })

    const toDelete = entries.slice(0, entries.length - this.config.maxEntries)
    toDelete.forEach(([id]) => this.memories.delete(id))
  }
}

export const memoryManager = new MemoryManager()
