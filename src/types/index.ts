/**
 * AgentMemory Protocol - Core Types
 * Type definitions for the AgentMemory SDK
 */

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// MEMORY TYPES
// ============================================================================

export type MemoryType = 
  | 'conversation' 
  | 'learning' 
  | 'preference' 
  | 'task' 
  | 'relationship' 
  | 'knowledge' 
  | 'system';

export interface MemoryMetadata {
  memoryType: MemoryType;
  importance: number; // 0-100
  tags: string[];
  ipfsCid?: string;
}

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export interface MemoryVault {
  owner: PublicKey;
  agentKey: PublicKey;
  encryptionPubkey: Uint8Array;
  createdAt: bigint;
  updatedAt: bigint;
  memoryCount: number;
  totalMemorySize: bigint;
  stakedAmount: bigint;
  rewardPoints: number;
  isActive: boolean;
  bump: number;
}

export interface VersionRecord {
  version: number;
  contentHash: Uint8Array;
  contentSize: number;
  metadata: MemoryMetadata;
  createdAt: bigint;
}

export interface MemoryShard {
  vault: PublicKey;
  key: string;
  contentHash: Uint8Array;
  contentSize: number;
  metadata: MemoryMetadata;
  createdAt: bigint;
  updatedAt: bigint;
  version: number;
  isDeleted: boolean;
  isEncrypted: boolean;
  deletedAt?: bigint;
  versionHistory: VersionRecord[];
  bump: number;
}

export interface AgentProfile {
  agentKey: PublicKey;
  owner: PublicKey;
  vault: PublicKey;
  name: string;
  capabilities: string[];
  reputationScore: number;
  tasksCompleted: number;
  createdAt: bigint;
  updatedAt: bigint;
  lastTaskAt: bigint;
  isPublic: boolean;
  bump: number;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
  confirmationStatus?: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface MemoryQuery {
  memoryType?: MemoryType;
  tags?: string[];
  startTime?: bigint;
  endTime?: bigint;
  limit?: number;
  offset?: number;
}

export interface VaultQuery {
  owner?: PublicKey;
  agentKey?: PublicKey;
  isActive?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AgentMemoryConfig {
  programId?: PublicKey;
  commitment?: string;
  retryConfig?: Partial<RetryConfig>;
  rpcEndpoint?: string;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 1.5,
};
