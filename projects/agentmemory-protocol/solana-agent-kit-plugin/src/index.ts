/**
 * AgentMemory Solana Agent Kit Plugin
 * 
 * Official plugin for integrating AgentMemory Protocol with Solana Agent Kit.
 * Enables AI agents to store and retrieve encrypted memories on Solana.
 * 
 * @example
 * ```typescript
 * import { SolanaAgentKit } from "solana-agent-kit";
 * import { AgentMemoryPlugin } from "@agentmemory/solana-agent-kit-plugin";
 * 
 * const agentKit = new SolanaAgentKit({ ... });
 * const memoryPlugin = new AgentMemoryPlugin({
 *   programId: "AGMEM...",
 *   encryptionKey: process.env.MEMORY_KEY,
 * });
 * 
 * agentKit.use(memoryPlugin);
 * ```
 */

// Main plugin
export { AgentMemoryPlugin } from "./client";

// Types
export type {
  AgentMemoryPluginConfig,
  StoreMemoryOptions,
  RetrieveOptions,
  UpdateOptions,
  ShareOptions,
  MemoryEntry,
  ProvenanceEntry,
  AgentIdentity,
  MemoryPriority,
} from "./types";

// Encryption utilities
export { EncryptionModule, generateEncryptionKey } from "./encryption";

// Version
export const VERSION = "0.1.0-alpha";
