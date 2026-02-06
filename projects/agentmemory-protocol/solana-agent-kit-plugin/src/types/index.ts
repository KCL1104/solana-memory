/**
 * Core types for AgentMemory Solana Agent Kit Plugin
 */

export interface AgentMemoryPluginConfig {
  /** AgentMemory protocol program ID */
  programId: string;
  /** Optional: encryption key derivation seed */
  encryptionKey?: string;
  /** Default memory expiration in days (default: 30) */
  defaultExpiryDays?: number;
  /** Solana cluster */
  cluster?: "mainnet-beta" | "devnet" | "testnet" | "localnet";
  /** Override RPC endpoint */
  rpcUrl?: string;
  /** Transaction confirmation options */
  confirmOptions?: ConfirmOptions;
}

export interface StoreMemoryOptions {
  /** Content to store (encrypted before on-chain) */
  content: string;
  /** Searchable tags */
  tags?: string[];
  /** Memory priority */
  priority?: MemoryPriority;
  /** Optional expiration */
  expiresAt?: Date;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface RetrieveOptions {
  /** Filter by tags */
  tags?: string[];
  /** Semantic search query (requires indexer) */
  query?: string;
  /** Max results (default: 10) */
  limit?: number;
  /** Time filter - before this date */
  before?: Date;
  /** Time filter - after this date */
  after?: Date;
  /** Include decayed memories */
  includeExpired?: boolean;
}

export interface UpdateOptions {
  /** New content */
  content?: string;
  /** Replace tags */
  tags?: string[];
  /** Update priority */
  priority?: MemoryPriority;
  /** Update expiration */
  expiresAt?: Date;
}

export interface ShareOptions {
  /** Access level for recipient */
  accessLevel: "read" | "write";
  /** Share expiration */
  expiresAt?: Date;
}

export interface MemoryEntry {
  /** Unique memory identifier */
  id: string;
  /** SHA-256 hash for verification */
  contentHash: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Expiration timestamp */
  expiresAt?: Date;
  /** Searchable tags */
  tags: string[];
  /** Provenance chain entries */
  provenance: ProvenanceEntry[];
  /** Priority level */
  priority: MemoryPriority;
  /** Encrypted content (if retrieved with decryption) */
  content?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface ProvenanceEntry {
  /** Action performed */
  action: "create" | "update" | "share" | "delete";
  /** Timestamp */
  timestamp: Date;
  /** Actor who performed the action */
  actor: string;
  /** Transaction signature */
  signature: string;
}

export interface AgentIdentity {
  /** Unique agent identifier */
  agentId: string;
  /** Solana public key */
  pubkey: string;
  /** Registration timestamp */
  registeredAt: Date;
  /** Last activity timestamp */
  lastActive: Date;
  /** Total memories stored */
  memoryCount: number;
}

export type MemoryPriority = "low" | "medium" | "high" | "critical";

// Re-export Solana types for convenience
export type { 
  PublicKey, 
  Transaction, 
  ConfirmOptions,
  Connection 
} from "@solana/web3.js";
