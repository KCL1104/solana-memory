import { MemoryStorage } from 'agentmemory';

/**
 * AgentMemory adapter for the Minecraft Demo
 * Provides a simplified interface for storing and retrieving agent memories
 */

export interface MemoryEntry {
    id?: string;
    content: string;
    importance: 'low' | 'medium' | 'high';
    tags: string[];
    metadata?: Record<string, any>;
    timestamp?: number;
}

export interface MemorySearchOptions {
    query?: string;
    tags?: string[];
    limit?: number;
}

export class AgentMemory {
    private storage: Map<string, MemoryEntry>;
    private agentId: string;
    private network: string;

    constructor(config: { agentId: string; network: string }) {
        this.agentId = config.agentId;
        this.network = config.network;
        this.storage = new Map();
    }

    /**
     * Store a memory entry
     */
    async store(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<string> {
        const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullEntry: MemoryEntry = {
            ...entry,
            id,
            timestamp: Date.now()
        };
        
        this.storage.set(id, fullEntry);
        return id;
    }

    /**
     * Search memories by query and tags
     */
    async search(options: MemorySearchOptions): Promise<MemoryEntry[]> {
        let results = Array.from(this.storage.values());

        // Filter by tags if specified
        if (options.tags && options.tags.length > 0) {
            results = results.filter(entry => 
                options.tags!.some(tag => entry.tags.includes(tag))
            );
        }

        // Filter by query if specified
        if (options.query) {
            const queryLower = options.query.toLowerCase();
            results = results.filter(entry =>
                entry.content.toLowerCase().includes(queryLower) ||
                entry.tags.some(tag => tag.toLowerCase().includes(queryLower))
            );
        }

        // Sort by timestamp (newest first)
        results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Apply limit
        if (options.limit && options.limit > 0) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    /**
     * Get a memory by ID
     */
    async get(id: string): Promise<MemoryEntry | null> {
        return this.storage.get(id) || null;
    }

    /**
     * Delete a memory by ID
     */
    async delete(id: string): Promise<boolean> {
        return this.storage.delete(id);
    }

    /**
     * Get all memories
     */
    async getAll(): Promise<MemoryEntry[]> {
        return Array.from(this.storage.values())
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    /**
     * Clear all memories
     */
    async clear(): Promise<void> {
        this.storage.clear();
    }

    /**
     * Get agent ID
     */
    getAgentId(): string {
        return this.agentId;
    }

    /**
     * Get network
     */
    getNetwork(): string {
        return this.network;
    }

    /**
     * Get memory stats
     */
    getStats(): { total: number; byImportance: Record<string, number> } {
        const entries = Array.from(this.storage.values());
        const byImportance: Record<string, number> = { low: 0, medium: 0, high: 0 };
        
        for (const entry of entries) {
            byImportance[entry.importance] = (byImportance[entry.importance] || 0) + 1;
        }

        return {
            total: entries.length,
            byImportance
        };
    }
}

export default AgentMemory;
