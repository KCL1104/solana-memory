import type { Plugin, SolanaAgentKit } from "solana-agent-kit";

// Import all actions
import storeMemoryAction from "./actions/storeMemory";
import retrieveMemoryAction from "./actions/retrieveMemory";
import updateMemoryAction from "./actions/updateMemory";
import deleteMemoryAction from "./actions/deleteMemory";
import {
  searchMemoryAction,
  memoryStatsAction,
  cleanupMemoryAction,
} from "./actions/utils";

// Import all tools
import {
  storeMemory,
  retrieveMemories,
  updateMemory,
  deleteMemory,
  searchMemories,
  getMemoryStats,
  cleanupExpiredMemories,
  exportMemories,
  importMemories,
} from "./tools/memory";

// Import types
export * from "./types";

/**
 * Memory Plugin for Solana Agent Kit
 * 
 * This plugin provides memory management capabilities for AI agents,
 * allowing them to store, retrieve, update, and delete memories on the Solana blockchain.
 * 
 * Features:
 * - Store memories using Solana Memo program (on-chain)
 * - Retrieve memories with filtering by tags, time, priority
 * - Update existing memories
 * - Delete memories
 * - Search memories by content
 * - Memory statistics and cleanup
 * 
 * @example
 * ```typescript
 * import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
 * import MemoryPlugin from "@solana-agent-kit/plugin-memory";
 * 
 * const agent = new SolanaAgentKit(
 *   wallet,
 *   "https://api.mainnet-beta.solana.com",
 *   {}
 * ).use(MemoryPlugin);
 * 
 * // Store a memory
 * await agent.methods.storeMemory(agent, {
 *   content: "User prefers USDC",
 *   tags: ["preferences"],
 *   priority: 8,
 * });
 * ```
 */
const MemoryPlugin: Plugin = {
  name: "memory",

  // Combine all methods
  methods: {
    storeMemory,
    retrieveMemories,
    updateMemory,
    deleteMemory,
    searchMemories,
    getMemoryStats,
    cleanupExpiredMemories,
    exportMemories,
    importMemories,
  },

  // Combine all actions
  actions: [
    storeMemoryAction,
    retrieveMemoryAction,
    updateMemoryAction,
    deleteMemoryAction,
    searchMemoryAction,
    memoryStatsAction,
    cleanupMemoryAction,
  ],

  // Initialize function
  initialize: function (agent: SolanaAgentKit): void {
    // Plugin initialization logic
    // In a full implementation, this might:
    // - Set up storage accounts
    // - Initialize indexes
    // - Load configuration
    console.log("Memory Plugin initialized for agent:", agent.wallet.publicKey.toString());
  },
};

// Default export for convenience
export default MemoryPlugin;
