import { Action } from 'solana-agent-kit';
import { AgentMemory } from '../core/AgentMemory';
import { MemoryInputSchema } from '../types';

/**
 * STORE_MEMORY Action
 * 
 * Stores a memory on-chain with optional encryption.
 * This action allows agents to persist information to the blockchain
 * for later retrieval, creating a permanent memory store.
 */
export const storeMemoryAction: Action = {
  name: "STORE_MEMORY",
  description: "Store a memory on-chain with optional encryption. Supports importance levels, tags, categories, and expiration. Creates a permanent, verifiable record of agent knowledge.",
  
  similes: ["save memory", "remember", "store information", "persist memory"],
  
  // Example for agent to learn from
  examples: [
    [
      {
        input: {
          content: "User prefers dark mode interface",
          importance: "medium",
          tags: ["user_preference", "ui"],
          category: "user_preference",
          encrypted: false
        },
        output: {
          status: "success",
          memoryId: "mem_abc123xyz",
          signature: "5Kxyz...abc",
          timestamp: 1704067200000
        },
        explanation: "Store a user preference with medium importance and relevant tags"
      }
    ],
    [
      {
        input: {
          content: "Critical API key for external service",
          importance: "critical",
          tags: ["api_key", "secret"],
          category: "system",
          encrypted: true,
          expiresAt: 1706659200000
        },
        output: {
          status: "success",
          memoryId: "mem_secret456",
          signature: "5Ksecret...xyz",
          encrypted: true,
          timestamp: 1704067200000
        },
        explanation: "Store encrypted sensitive data with expiration"
      }
    ]
  ],

  // Input parameter schema
  schema: MemoryInputSchema,

  // Handler function
  handler: async (agent, input) => {
    try {
      // Validate input
      const validatedInput = MemoryInputSchema.parse(input);

      // Initialize AgentMemory with agent's configuration
      const agentWithConfig = agent as typeof agent & { agentId?: string; network?: string; wallet?: any };
      const memory = new AgentMemory({ 
        agentId: agentWithConfig.agentId || 'default-agent',
        network: (agentWithConfig.network as any) || 'devnet',
        // Use agent's wallet for signing if available
        wallet: agentWithConfig.wallet
      });

      // Store the memory
      const result = await memory.store(validatedInput);

      return {
        status: "success",
        memoryId: result.id,
        signature: result.signature,
        encrypted: result.encrypted,
        timestamp: result.createdAt
      };
    } catch (error: any) {
      console.error("STORE_MEMORY error:", error);
      
      // Return structured error response
      return {
        status: "error",
        error: error.message || "Failed to store memory",
        code: error.code || "UNKNOWN_ERROR",
        details: error.errors || null
      };
    }
  }
};

// Also export as default for flexibility
export default storeMemoryAction;
