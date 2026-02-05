import { MemoryStorage } from 'agentmemory';
import { 
  MemoryInput, 
  Memory, 
  MemorySearchQuery, 
  MemoryUpdateInput,
  MemoryConfig 
} from '../types';

/**
 * AgentMemory class - Main interface for storing and retrieving agent memories
 * 
 * This class provides a high-level API for:
 * - Storing memories with metadata
 * - Retrieving memories by ID
 * - Searching memories with filters
 * - Updating and deleting memories
 * - Managing memory versions
 */
export class AgentMemory {
  private storage: MemoryStorage;
  private config: MemoryConfig;
  private memories: Map<string, Memory> = new Map();
  private versions: Map<string, Memory[]> = new Map();

  constructor(config: MemoryConfig & { wallet?: any }) {
    this.config = config;
    this.storage = new MemoryStorage();
  }

  /**
   * Store a new memory
   */
  async store(input: MemoryInput): Promise<Memory> {
    const now = Date.now();
    const id = `mem_${this.generateId()}`;
    
    const memory: Memory = {
      id,
      content: input.content,
      importance: input.importance || 'medium',
      tags: input.tags || [],
      category: input.category || 'custom',
      metadata: {
        ...input.metadata,
        agentId: this.config.agentId
      },
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      encrypted: input.encrypted || false,
      version: 1,
      signature: `sig_${this.generateId()}`
    };

    this.memories.set(id, memory);
    this.versions.set(id, [memory]);

    return memory;
  }

  /**
   * Retrieve a memory by ID
   */
  async retrieve(memoryId: string, options?: { decrypt?: boolean }): Promise<Memory | null> {
    const memory = this.memories.get(memoryId);
    if (!memory) return null;

    // Check if memory has expired
    if (memory.expiresAt && memory.expiresAt < Date.now()) {
      return null;
    }

    // Simulate decryption if needed
    if (memory.encrypted && options?.decrypt !== false) {
      return {
        ...memory,
        content: this.decryptContent(memory.content)
      };
    }

    return memory;
  }

  /**
   * Search memories with filters
   */
  async search(query: MemorySearchQuery): Promise<Array<{ memory: Memory; relevance: number; matchedTags?: string[] }>> {
    const results: Array<{ memory: Memory; relevance: number; matchedTags?: string[] }> = [];

    for (const memory of this.memories.values()) {
      let relevance = 0;
      let matchedTags: string[] = [];

      // Check status filter
      if (query.status && memory.metadata.status !== query.status) {
        continue;
      }

      // Check if expired
      if (memory.expiresAt && memory.expiresAt < Date.now()) {
        continue;
      }

      // Check importance filter
      if (query.importance) {
        const importanceList = Array.isArray(query.importance) ? query.importance : [query.importance];
        if (!importanceList.includes(memory.importance)) {
          continue;
        }
      }

      // Check category filter
      if (query.category) {
        const categoryList = Array.isArray(query.category) ? query.category : [query.category];
        if (!categoryList.includes(memory.category)) {
          continue;
        }
      }

      // Check date range
      if (query.fromDate && memory.createdAt < query.fromDate) continue;
      if (query.toDate && memory.createdAt > query.toDate) continue;

      // Check tags filter
      if (query.tags && query.tags.length > 0) {
        matchedTags = query.tags.filter(tag => memory.tags.includes(tag));
        if (matchedTags.length === 0) continue;
        relevance += matchedTags.length * 0.2;
      }

      // Semantic search simulation (basic text matching)
      if (query.query) {
        const queryLower = query.query.toLowerCase();
        const contentLower = memory.content.toLowerCase();
        
        if (contentLower.includes(queryLower)) {
          relevance += 0.5 + (queryLower.length / contentLower.length) * 0.3;
        }
        
        // Check tags for query match
        const tagMatches = memory.tags.filter(tag => 
          tag.toLowerCase().includes(queryLower)
        );
        relevance += tagMatches.length * 0.1;
      }

      // Apply minimum relevance threshold
      if (query.minRelevance && relevance < query.minRelevance) {
        continue;
      }

      results.push({ memory, relevance: Math.min(relevance, 1), matchedTags });
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply limit and offset
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    
    return results.slice(offset, offset + limit);
  }

  /**
   * Update an existing memory
   */
  async update(memoryId: string, input: MemoryUpdateInput): Promise<Memory> {
    const existing = this.memories.get(memoryId);
    if (!existing) {
      throw new Error('Memory not found');
    }

    const now = Date.now();
    let updatedMemory: Memory;

    if (input.createVersion !== false) {
      // Create new version
      const versions = this.versions.get(memoryId) || [];
      updatedMemory = {
        ...existing,
        content: input.content || existing.content,
        importance: input.importance || existing.importance,
        tags: this.updateTags(existing.tags, input.addTags, input.removeTags),
        category: input.category || existing.category,
        metadata: { ...existing.metadata, ...input.metadata },
        expiresAt: input.expiresAt || existing.expiresAt,
        updatedAt: now,
        version: existing.version + 1,
        previousVersion: existing.id,
        signature: `sig_${this.generateId()}`
      };
      versions.push(updatedMemory);
      this.versions.set(memoryId, versions);
    } else {
      // Update in place
      updatedMemory = {
        ...existing,
        content: input.content || existing.content,
        importance: input.importance || existing.importance,
        tags: this.updateTags(existing.tags, input.addTags, input.removeTags),
        category: input.category || existing.category,
        metadata: { ...existing.metadata, ...input.metadata },
        expiresAt: input.expiresAt || existing.expiresAt,
        updatedAt: now,
        signature: `sig_${this.generateId()}`
      };
    }

    this.memories.set(memoryId, updatedMemory);
    return updatedMemory;
  }

  /**
   * Delete a memory
   */
  async delete(memoryId: string, options?: { hardDelete?: boolean }): Promise<void> {
    if (options?.hardDelete) {
      this.memories.delete(memoryId);
      this.versions.delete(memoryId);
    } else {
      // Soft delete - mark as deleted
      const memory = this.memories.get(memoryId);
      if (memory) {
        memory.metadata.status = 'deleted';
        memory.updatedAt = Date.now();
      }
    }
  }

  /**
   * Archive a memory
   */
  async archive(memoryId: string): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) {
      throw new Error('Memory not found');
    }
    memory.metadata.status = 'archived';
    memory.updatedAt = Date.now();
  }

  /**
   * List recent memories
   */
  async listRecent(options?: { limit?: number; category?: string; tags?: string[] }): Promise<Memory[]> {
    let memories = Array.from(this.memories.values());

    // Filter by category
    if (options?.category) {
      memories = memories.filter(m => m.category === options.category);
    }

    // Filter by tags
    if (options?.tags && options.tags.length > 0) {
      memories = memories.filter(m => 
        options.tags!.some(tag => m.tags.includes(tag))
      );
    }

    // Sort by created date (newest first)
    memories.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    const limit = options?.limit || 10;
    return memories.slice(0, limit);
  }

  /**
   * Get version history for a memory
   */
  async getVersions(memoryId: string): Promise<Array<{ version: number; content: string; updatedAt: number; signature?: string }>> {
    const versions = this.versions.get(memoryId) || [];
    return versions.map(v => ({
      version: v.version,
      content: v.content,
      updatedAt: v.updatedAt,
      signature: v.signature
    }));
  }

  /**
   * Helper to update tags
   */
  private updateTags(current: string[], add?: string[], remove?: string[]): string[] {
    let updated = [...current];
    if (add) {
      updated = [...updated, ...add.filter(tag => !updated.includes(tag))];
    }
    if (remove) {
      updated = updated.filter(tag => !remove.includes(tag));
    }
    return updated;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Simulate decryption (in real implementation, use actual encryption)
   */
  private decryptContent(content: string): string {
    // Placeholder for actual decryption logic
    return content;
  }
}

export default AgentMemory;
