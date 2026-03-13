import { QdrantClient } from '@qdrant/js-client-rest'
import { AgentMemory, NewAgentMemory } from '@/lib/db/schema'

export interface MemoryEntry {
  id: string
  userId: string
  projectId?: string
  conversationId?: string
  memoryType: 'interaction' | 'fact' | 'preference' | 'context'
  content: string
  importance: number
  vectorId?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface MemoryQuery {
  userId: string
  projectId?: string
  conversationId?: string
  query: string
  limit?: number
  minImportance?: number
}

export class QdrantMemoryStore {
  private client: QdrantClient
  private collectionName: string

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    })
    this.collectionName = process.env.QDRANT_COLLECTION || 'selgen-memories'
  }

  async initialize(): Promise<void> {
    try {
      const collections = await this.client.getCollections()
      const exists = collections.collections.some(c => c.name === this.collectionName)

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 384,
            distance: 'Cosine',
          },
        })
        console.log(`Created Qdrant collection: ${this.collectionName}`)
      }
    } catch (error) {
      console.warn('Failed to initialize Qdrant collection:', error)
      console.warn('Falling back to database-only memory storage')
    }
  }

  async storeMemory(
    userId: string,
    content: string,
    options: {
      projectId?: string
      conversationId?: string
      memoryType: 'interaction' | 'fact' | 'preference' | 'context'
      importance?: number
      metadata?: Record<string, any>
    }
  ): Promise<string | null> {
    const id = crypto.randomUUID()
    
    try {
      // Generate embedding (in production, use an embedding model)
      const embedding = await this.generateEmbedding(content)
      
      const point = {
        id,
        vector: embedding,
        payload: {
          userId,
          content,
          ...options,
          createdAt: new Date().toISOString(),
        },
      }

      await this.client.upsert(this.collectionName, {
        points: [point],
      })

      return id
    } catch (error) {
      console.warn('Failed to store in Qdrant:', error)
      return null
    }
  }

  async retrieveMemories(query: MemoryQuery): Promise<MemoryEntry[]> {
    try {
      const embedding = await this.generateEmbedding(query.query)
      
      const searchResult = await this.client.search(this.collectionName, {
        vector: embedding,
        limit: query.limit || 5,
        filter: {
          must: [
            { key: 'userId', match: { value: query.userId } },
          ],
          should: query.projectId
            ? [{ key: 'projectId', match: { value: query.projectId } }]
            : [],
        },
      })

      return searchResult.map(result => ({
        id: result.id as string,
        userId: result.payload?.userId as string,
        projectId: result.payload?.projectId as string | undefined,
        conversationId: result.payload?.conversationId as string | undefined,
        memoryType: result.payload?.memoryType as any,
        content: result.payload?.content as string,
        importance: result.payload?.importance as number || 1,
        metadata: result.payload?.metadata as Record<string, any>,
        createdAt: new Date(result.payload?.createdAt as string),
      }))
    } catch (error) {
      console.warn('Failed to retrieve from Qdrant:', error)
      return []
    }
  }

  async deleteMemory(vectorId: string): Promise<boolean> {
    try {
      await this.client.delete(this.collectionName, {
        points: [vectorId],
      })
      return true
    } catch (error) {
      console.warn('Failed to delete from Qdrant:', error)
      return false
    }
  }

  async deleteUserMemories(userId: string): Promise<boolean> {
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            { key: 'userId', match: { value: userId } },
          ],
        },
      })
      return true
    } catch (error) {
      console.warn('Failed to delete user memories from Qdrant:', error)
      return false
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // In production, use an embedding model API (OpenAI, Cohere, etc.)
    // For now, return a simple hash-based vector for compatibility
    const hash = this.simpleHash(text)
    const embedding = new Array(384).fill(0)
    
    // Fill embedding with pseudo-random values based on hash
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = Math.sin(hash + i) * Math.cos(hash - i)
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / magnitude)
  }

  private simpleHash(text: string): number {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash
  }
}

export const qdrantMemory = new QdrantMemoryStore()
