import { Action } from 'solana-agent-kit';
import { AgentMemory } from 'agentmemory';
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
  
  // Example for agent to learn from
  examples: [
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
    },
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
  ],

  // Input parameter schema
  parameters: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content to store in memory (max 10,000 characters)",
        minLength: 1,
        maxLength: 10000
      },
      importance: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Importance level - affects retrieval priority and storage duration",
        default: "medium"
      },
      tags: {
        type: "array",
        items: { type: "string", maxLength: 50 },
        description: "Tags for categorization and filtering (max 20 tags)",
        maxItems: 20
      },
      category: {
        type: "string",
        enum: ["conversation", "task", "insight", "context", "user_preference", "system", "custom"],
        description: "Memory category for organization",
        default: "custom"
      },
      metadata: {
        type: "object",
        description: "Additional metadata to store with the memory"
      },
      encrypted: {
        type: "boolean",
        description: "Whether to encrypt the memory content",
        default: false
      },
      expiresAt: {
        type: "number",
        description: "Expiration timestamp in milliseconds"
      }
    },
    required: ["content"]
  },

  // Handler function
  handler: async (agent, input) => {
    try {
      // Validate input
      const validatedInput = MemoryInputSchema.parse(input);

      // Initialize AgentMemory with agent's configuration
      const memory = new AgentMemory({ 
        agentId: agent.agentId,
        network: agent.network || 'devnet',
        // Use agent's wallet for signing if available
        wallet: agent.wallet
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
