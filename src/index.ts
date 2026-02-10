/**
 * AgentMemory Protocol - SDK Entry Point
 * 
 * Main exports for the AgentMemory SDK
 * 
 * @example
 * ```typescript
 * import { AgentMemoryClient, AGENT_MEMORY_PROGRAM_ID } from '@agent-memory/sdk';
 * import { Connection } from '@solana/web3.js';
 * 
 * const connection = new Connection('https://api.devnet.solana.com');
 * const client = new AgentMemoryClient(connection);
 * 
 * // Initialize vault
 * const result = await client.initializeVault(owner, agentKey, encryptionKey, payer);
 * ```
 */

// Core client
export { AgentMemoryClient, AGENT_MEMORY_PROGRAM_ID } from './client';

// Types
export type {
  MemoryType,
  MemoryMetadata,
  MemoryVault,
  MemoryShard,
  AgentProfile,
  VersionRecord,
  TransactionResult,
  RetryConfig,
  MemoryQuery,
  VaultQuery,
  AgentMemoryConfig,
} from './types';

export { DEFAULT_RETRY_CONFIG } from './types';

// Utilities
export {
  generateEncryptionKey,
  hashContent,
  formatPublicKey,
  formatTimestamp,
  calculateStorageCost,
  validateMemoryKey,
  validateMetadata,
} from './utils';
