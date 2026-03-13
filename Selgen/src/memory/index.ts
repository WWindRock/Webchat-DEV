import { db } from '@/lib/db'
import { agentMemories } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { qdrantMemory } from './qdrant-store'

export interface StoreMemoryOptions {
  userId: string
  projectId?: string
  conversationId?: string
  memoryType: 'interaction' | 'fact' | 'preference' | 'context'
  content: string
  importance?: number
  metadata?: Record<string, any>
}

export interface QueryMemoryOptions {
  userId: string
  projectId?: string
  conversationId?: string
  query: string
  limit?: number
  minImportance?: number
}

class MemoryService {
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    
    try {
      await qdrantMemory.initialize()
    } catch (error) {
      console.warn('Qdrant initialization failed, using database-only mode')
    }
    
    this.initialized = true
  }

  async storeMemory(options: StoreMemoryOptions): Promise<string> {
    await this.initialize()

    const id = crypto.randomUUID()
    const { userId, projectId, conversationId, memoryType, content, importance = 1, metadata } = options

    // Store in database
    const [memory] = await db
      .insert(agentMemories)
      .values({
        id,
        userId,
        projectId,
        conversationId,
        memoryType,
        content,
        importance,
        metadata,
      })
      .returning()

    // Also store in vector DB for semantic search
    try {
      const vectorId = await qdrantMemory.storeMemory(userId, content, {
        projectId,
        conversationId,
        memoryType,
        importance,
        metadata,
      })

      if (vectorId) {
        await db
          .update(agentMemories)
          .set({ vectorId })
          .where(eq(agentMemories.id, id))
      }
    } catch (error) {
      console.warn('Failed to store memory in vector DB:', error)
    }

    return id
  }

  async storeInteraction(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    options?: {
      projectId?: string
      conversationId?: string
      metadata?: Record<string, any>
    }
  ): Promise<string> {
    const content = JSON.stringify({
      user: userMessage,
      assistant: assistantMessage,
    })

    return this.storeMemory({
      userId,
      projectId: options?.projectId,
      conversationId: options?.conversationId,
      memoryType: 'interaction',
      content,
      importance: 1,
      metadata: options?.metadata,
    })
  }

  async storePreference(
    userId: string,
    key: string,
    value: any,
    options?: {
      projectId?: string
      metadata?: Record<string, any>
    }
  ): Promise<string> {
    const content = JSON.stringify({ key, value })

    return this.storeMemory({
      userId,
      projectId: options?.projectId,
      memoryType: 'preference',
      content,
      importance: 3,
      metadata: { preferenceKey: key, ...options?.metadata },
    })
  }

  async storeFact(
    userId: string,
    fact: string,
    options?: {
      projectId?: string
      conversationId?: string
      metadata?: Record<string, any>
    }
  ): Promise<string> {
    return this.storeMemory({
      userId,
      projectId: options?.projectId,
      conversationId: options?.conversationId,
      memoryType: 'fact',
      content: fact,
      importance: 2,
      metadata: options?.metadata,
    })
  }

  async retrieveMemories(options: QueryMemoryOptions): Promise<Array<{
    id: string
    content: string
    memoryType: string
    importance: number
    createdAt: Date
  }>> {
    await this.initialize()

    const { userId, projectId, conversationId, query, limit = 5, minImportance } = options

    // Try vector search first
    const vectorResults = await qdrantMemory.retrieveMemories({
      userId,
      projectId,
      conversationId,
      query,
      limit,
    })

    if (vectorResults.length > 0) {
      return vectorResults.map(r => ({
        id: r.id,
        content: r.content,
        memoryType: r.memoryType,
        importance: r.importance,
        createdAt: r.createdAt,
      }))
    }

    // Fallback to database text search
    const conditions = [eq(agentMemories.userId, userId)]
    if (projectId) {
      conditions.push(eq(agentMemories.projectId, projectId))
    }

    const results = await db
      .select({
        id: agentMemories.id,
        content: agentMemories.content,
        memoryType: agentMemories.memoryType,
        importance: agentMemories.importance,
        createdAt: agentMemories.createdAt,
      })
      .from(agentMemories)
      .where(and(...conditions))
      .orderBy(desc(agentMemories.importance), desc(agentMemories.createdAt))
      .limit(limit)

    return results.map(r => ({
      id: r.id,
      content: r.content,
      memoryType: r.memoryType,
      importance: r.importance ?? 1,
      createdAt: r.createdAt ?? new Date(),
    }))
  }

  async getRecentMemories(
    userId: string,
    options?: {
      projectId?: string
      limit?: number
    }
  ): Promise<Array<{
    id: string
    content: string
    memoryType: string
    importance: number
    createdAt: Date
  }>> {
    const limit = options?.limit || 10

    const results = await db
      .select({
        id: agentMemories.id,
        content: agentMemories.content,
        memoryType: agentMemories.memoryType,
        importance: agentMemories.importance,
        createdAt: agentMemories.createdAt,
      })
      .from(agentMemories)
      .where(eq(agentMemories.userId, userId))
      .orderBy(desc(agentMemories.createdAt))
      .limit(limit)

    return results.map(r => ({
      id: r.id,
      content: r.content,
      memoryType: r.memoryType,
      importance: r.importance ?? 1,
      createdAt: r.createdAt ?? new Date(),
    }))
  }

  async deleteMemory(id: string): Promise<boolean> {
    const [memory] = await db
      .select()
      .from(agentMemories)
      .where(eq(agentMemories.id, id))

    if (memory?.vectorId) {
      await qdrantMemory.deleteMemory(memory.vectorId)
    }

    await db
      .delete(agentMemories)
      .where(eq(agentMemories.id, id))

    return true
  }

  async clearUserMemories(userId: string): Promise<boolean> {
    await qdrantMemory.deleteUserMemories(userId)
    
    await db
      .delete(agentMemories)
      .where(eq(agentMemories.userId, userId))

    return true
  }
}

export const memoryService = new MemoryService()
