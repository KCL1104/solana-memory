import { PublicKey } from "@solana/web3.js";

/**
 * Memory entry structure
 */
export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: number;
  tags: string[];
  priority: number; // 1-10, higher = more important
  expiresAt?: number; // Optional expiration timestamp
}

/**
 * Options for storing a memory
 */
export interface StoreMemoryOptions {
  content: string;
  tags?: string[];
  priority?: number;
  expiresAt?: number;
  useMemoProgram?: boolean; // Use Solana Memo program for small memories
}

/**
 * Options for retrieving memories
 */
export interface RetrieveMemoryOptions {
  tag?: string;
  limit?: number;
  before?: number; // Timestamp
  after?: number; // Timestamp
  minPriority?: number;
  includeExpired?: boolean;
}

/**
 * Options for updating a memory
 */
export interface UpdateMemoryOptions {
  id: string;
  content?: string;
  tags?: string[];
  priority?: number;
  expiresAt?: number;
}

/**
 * Response from memory operations
 */
export interface MemoryResponse {
  status: "success" | "error";
  memory?: MemoryEntry;
  memories?: MemoryEntry[];
  message?: string;
  signature?: string; // Transaction signature if on-chain
}

/**
 * Configuration for the memory plugin
 */
export interface MemoryPluginConfig {
  storageType: "memo" | "account" | "hybrid";
  defaultPriority: number;
  maxMemoriesPerAccount: number;
  autoCleanup: boolean;
  encryptionKey?: string; // Optional encryption for sensitive memories
}

/**
 * On-chain memory account data
 */
export interface MemoryAccountData {
  owner: PublicKey;
  memories: MemoryEntry[];
  lastUpdated: number;
  version: number;
}

/**
 * Filter options for memory queries
 */
export interface MemoryFilter {
  tags?: string[];
  priorityMin?: number;
  priorityMax?: number;
  createdAfter?: number;
  createdBefore?: number;
  searchQuery?: string; // Full-text search
}
