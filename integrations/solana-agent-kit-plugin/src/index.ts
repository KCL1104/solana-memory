/**
 * @agentmemory/solana-agent-kit-plugin
 * 
 * AgentMemory Protocol plugin for Solana Agent Kit v2
 * On-chain memory storage and retrieval for AI agents
 */

// Export types
export {
  MemoryInput,
  Memory,
  MemoryConfig,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryUpdateInput,
  MemoryImportance,
  MemoryCategory,
  MemoryStatus,
  MemoryInputSchema,
  MemorySearchQuerySchema,
  MemoryUpdateInputSchema,
  MemoryConfigSchema
} from './types';

// Export actions
export { storeMemoryAction } from './actions/storeMemory';
export { 
  retrieveMemoryAction, 
  retrieveMemoryVersionsAction 
} from './actions/retrieveMemory';
export { 
  searchMemoryAction, 
  listRecentMemoriesAction 
} from './actions/searchMemory';
export { 
  updateMemoryAction, 
  deleteMemoryAction, 
  archiveMemoryAction 
} from './actions/updateMemory';

// Export tools
export { 
  createMemoryTools, 
  memoryTools 
} from './tools/memoryTools';

// Export plugin definition for Solana Agent Kit v2
import { Plugin } from 'solana-agent-kit';
import { storeMemoryAction } from './actions/storeMemory';
import { retrieveMemoryAction, retrieveMemoryVersionsAction } from './actions/retrieveMemory';
import { searchMemoryAction, listRecentMemoriesAction } from './actions/searchMemory';
import { updateMemoryAction, deleteMemoryAction, archiveMemoryAction } from './actions/updateMemory';

/**
 * AgentMemory Plugin for Solana Agent Kit v2
 * 
 * This plugin provides on-chain memory storage capabilities for AI agents,
 * enabling persistent, verifiable, and searchable knowledge across sessions.
 */
export const agentMemoryPlugin: Plugin = {
  name: "@agentmemory/solana-agent-kit-plugin",
  version: "1.0.0",
  description: "On-chain memory storage and retrieval for AI agents",
  
  // All actions provided by this plugin
  actions: [
    storeMemoryAction,
    retrieveMemoryAction,
    retrieveMemoryVersionsAction,
    searchMemoryAction,
    listRecentMemoriesAction,
    updateMemoryAction,
    deleteMemoryAction,
    archiveMemoryAction
  ],

  // Initialize plugin (called when agent starts)
  initialize: async (agent) => {
    console.log(`[AgentMemory] Plugin initialized for agent: ${agent.agentId}`);
    
    // Validate configuration
    if (!agent.agentId) {
      throw new Error("AgentMemory plugin requires agent.agentId to be set");
    }

    // Plugin is ready
    return {
      status: "ready",
      actions: 8,
      features: [
        "store_memory",
        "retrieve_memory", 
        "search_memory",
        "update_memory",
        "delete_memory",
        "archive_memory",
        "version_control"
      ]
    };
  },

  // Cleanup (called when agent shuts down)
  cleanup: async () => {
    console.log("[AgentMemory] Plugin cleanup");
  }
};

/**
 * Convenience export - default plugin instance
 */
export default agentMemoryPlugin;

/**
 * Plugin metadata for registry
 */
export const metadata = {
  id: "agentmemory-solana-agent-kit",
  name: "AgentMemory Protocol",
  description: "Persistent on-chain memory for AI agents",
  version: "1.0.0",
  author: "AgentMemory Team",
  license: "MIT",
  homepage: "https://github.com/agentmemory/agent-memory",
  repository: "https://github.com/agentmemory/agent-memory/tree/main/integrations/solana-agent-kit-plugin",
  tags: ["memory", "storage", "persistent", "on-chain"],
  compatibility: {
    "solana-agent-kit": ">=2.0.0",
    "@solana/web3.js": ">=1.87.0"
  }
};
