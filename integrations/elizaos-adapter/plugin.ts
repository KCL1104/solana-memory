/**
 * ElizaOS Plugin for AgentMemory Adapter
 * 
 * Provides a standard ElizaOS plugin that can be loaded via runtime.use()
 */

import type { Plugin, IAgentRuntime, Adapter } from "@elizaos/core";
import { AgentMemoryAdapter, type AgentMemoryAdapterConfig } from "./index.js";

export interface AgentMemoryPluginConfig extends AgentMemoryAdapterConfig {
  /** Auto-initialize on load */
  autoInit?: boolean;
}

/**
 * Create the database adapter instance
 */
const createAdapter = (config: AgentMemoryPluginConfig = {}): Adapter => ({
  init: (runtime: IAgentRuntime) => {
    const adapter = new AgentMemoryAdapter({
      solanaEndpoint: runtime.getSetting("SOLANA_ENDPOINT") || config.solanaEndpoint,
      walletPrivateKey: runtime.getSetting("SOLANA_PRIVATE_KEY") || config.walletPrivateKey,
      cacheTTL: config.cacheTTL,
      debug: runtime.getSetting("DEBUG") === "true" || config.debug,
      embeddingDimension: config.embeddingDimension,
    });

    if (config.autoInit !== false) {
      adapter.init().catch((error) => {
        console.error("Failed to initialize AgentMemory adapter:", error);
      });
    }

    return adapter;
  },
});

/**
 * AgentMemory Plugin for ElizaOS
 * 
 * Usage:
 * ```typescript
 * import agentMemoryPlugin from "@agent-memory/elizaos-adapter/plugin";
 * 
 * runtime.use(agentMemoryPlugin, {
 *   solanaEndpoint: "https://api.devnet.solana.com",
 *   debug: true,
 * });
 * ```
 */
export const agentMemoryPlugin = (config: AgentMemoryPluginConfig = {}): Plugin => ({
  name: "agent-memory",
  description: "AgentMemory database adapter for Solana-based persistent storage",
  adapters: [createAdapter(config)],
});

export default agentMemoryPlugin;
