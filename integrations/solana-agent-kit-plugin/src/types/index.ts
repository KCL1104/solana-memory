import { z } from 'zod';

/**
 * Memory importance levels
 */
export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';

/**
 * Memory category for organization
 */
export type MemoryCategory = 'conversation' | 'task' | 'insight' | 'context' | 'user_preference' | 'system' | 'custom';

/**
 * Memory status for lifecycle management
 */
export type MemoryStatus = 'active' | 'archived' | 'deleted';

/**
 * Input for storing a new memory
 */
export interface MemoryInput {
  /** The content to store */
  content: string;
  /** Importance level - affects storage duration and retrieval priority */
  importance?: MemoryImportance;
  /** Tags for categorization and filtering */
  tags?: string[];
  /** Memory category */
  category?: MemoryCategory;
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** Expiration time in milliseconds from now */
  expiresAt?: number;
  /** Whether to encrypt the memory content */
  encrypted?: boolean;
}

/**
 * Stored memory with metadata
 */
export interface Memory {
  /** Unique identifier (on-chain address or hash) */
  id: string;
  /** The stored content */
  content: string;
  /** Importance level */
  importance: MemoryImportance;
  /** Tags */
  tags: string[];
  /** Category */
  category: MemoryCategory;
  /** Metadata */
  metadata: Record<string, any>;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Expiration timestamp */
  expiresAt?: number;
  /** Whether content is encrypted */
  encrypted: boolean;
  /** Version number for tracking updates */
  version: number;
  /** Previous version ID (for version chain) */
  previousVersion?: string;
  /** Storage transaction signature */
  signature?: string;
}

/**
 * Configuration for AgentMemory
 */
export interface MemoryConfig {
  /** Unique agent identifier */
  agentId: string;
  /** Solana network to use */
  network?: 'devnet' | 'mainnet-beta' | 'testnet';
  /** RPC endpoint (optional - uses default if not specified) */
  rpcUrl?: string;
  /** Program ID for AgentMemory protocol */
  programId?: string;
  /** Encryption key for secure storage */
  encryptionKey?: string;
  /** Default memory expiration in milliseconds */
  defaultExpiration?: number;
  /** Maximum number of memories to cache in memory */
  maxCacheSize?: number;
}

/**
 * Search query for finding memories
 */
export interface MemorySearchQuery {
  /** Text to search for (semantic search) */
  query?: string;
  /** Filter by tags */
  tags?: string[];
  /** Filter by importance */
  importance?: MemoryImportance | MemoryImportance[];
  /** Filter by category */
  category?: MemoryCategory | MemoryCategory[];
  /** Filter by status */
  status?: MemoryStatus;
  /** Time range - start timestamp */
  fromDate?: number;
  /** Time range - end timestamp */
  toDate?: number;
  /** Maximum results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Minimum relevance score (0-1) */
  minRelevance?: number;
}

/**
 * Search result with relevance score
 */
export interface MemorySearchResult {
  /** The memory */
  memory: Memory;
  /** Relevance score (0-1, higher is better) */
  relevance: number;
  /** Matched tags */
  matchedTags?: string[];
}

/**
 * Update input for existing memory
 */
export interface MemoryUpdateInput {
  /** New content (optional - leave undefined to keep current) */
  content?: string;
  /** New importance (optional) */
  importance?: MemoryImportance;
  /** Tags to add */
  addTags?: string[];
  /** Tags to remove */
  removeTags?: string[];
  /** New category (optional) */
  category?: MemoryCategory;
  /** Metadata to merge */
  metadata?: Record<string, any>;
  /** New expiration (optional) */
  expiresAt?: number;
  /** Whether to create a new version or overwrite */
  createVersion?: boolean;
}

/**
 * Validation schemas using Zod
 */
export const MemoryInputSchema = z.object({
  content: z.string().min(1).max(10000),
  importance: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.enum(['conversation', 'task', 'insight', 'context', 'user_preference', 'system', 'custom']).optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.number().optional(),
  encrypted: z.boolean().optional(),
});

export const MemorySearchQuerySchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  importance: z.union([
    z.enum(['low', 'medium', 'high', 'critical']),
    z.array(z.enum(['low', 'medium', 'high', 'critical']))
  ]).optional(),
  category: z.union([
    z.enum(['conversation', 'task', 'insight', 'context', 'user_preference', 'system', 'custom']),
    z.array(z.enum(['conversation', 'task', 'insight', 'context', 'user_preference', 'system', 'custom']))
  ]).optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
  fromDate: z.number().optional(),
  toDate: z.number().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  minRelevance: z.number().min(0).max(1).optional(),
});

export const MemoryUpdateInputSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  importance: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  addTags: z.array(z.string().max(50)).optional(),
  removeTags: z.array(z.string().max(50)).optional(),
  category: z.enum(['conversation', 'task', 'insight', 'context', 'user_preference', 'system', 'custom']).optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.number().optional(),
  createVersion: z.boolean().optional(),
});

export const MemoryConfigSchema = z.object({
  agentId: z.string().min(1),
  network: z.enum(['devnet', 'mainnet-beta', 'testnet']).optional(),
  rpcUrl: z.string().url().optional(),
  programId: z.string().optional(),
  encryptionKey: z.string().optional(),
  defaultExpiration: z.number().optional(),
  maxCacheSize: z.number().optional(),
});
