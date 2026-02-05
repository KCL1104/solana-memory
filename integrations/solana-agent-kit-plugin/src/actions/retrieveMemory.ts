import { Action } from 'solana-agent-kit';
import { AgentMemory } from 'agentmemory';
import { z } from 'zod';

/**
 * Retrieve Memory Input Schema
 */
const RetrieveMemoryInputSchema = z.object({
  memoryId: z.string().min(1).describe("The unique ID of the memory to retrieve"),
  decrypt: z.boolean().optional().default(true).describe("Whether to decrypt encrypted memories"),
});

/**
 * RETRIEVE_MEMORY Action
 * 
 * Retrieves a memory by its ID and returns the decrypted content.
 * Supports retrieving specific versions if version history is tracked.
 */
export const retrieveMemoryAction: Action = {
  name: "RETRIEVE_MEMORY",
  description: "Retrieve a memory by its unique ID. Returns the full memory content with metadata. Automatically decrypts encrypted memories if the decryption key is available.",
  
  examples: [
    {
      input: {
        memoryId: "mem_abc123xyz",
        decrypt: true
      },
      output: {
        status: "success",
        memory: {
          id: "mem_abc123xyz",
          content: "User prefers dark mode interface",
          importance: "medium",
          tags: ["user_preference", "ui"],
          category: "user_preference",
          createdAt: 1704067200000,
          updatedAt: 1704067200000,
          encrypted: false,
          version: 1
        }
      },
      explanation: "Retrieve a stored memory by ID"
    },
    {
      input: {
        memoryId: "mem_secret456",
        decrypt: true
      },
      output: {
        status: "success",
        memory: {
          id: "mem_secret456",
          content: "Critical API key for external service",
          importance: "critical",
          tags: ["api_key", "secret"],
          category: "system",
          createdAt: 1704067200000,
          updatedAt: 1704067200000,
          expiresAt: 1706659200000,
          encrypted: true,
          version: 1
        }
      },
      explanation: "Retrieve and decrypt an encrypted memory"
    }
  ],

  parameters: {
    type: "object",
    properties: {
      memoryId: {
        type: "string",
        description: "The unique ID of the memory to retrieve"
      },
      decrypt: {
        type: "boolean",
        description: "Whether to decrypt encrypted memories (default: true)",
        default: true
      }
    },
    required: ["memoryId"]
  },

  handler: async (agent, input) => {
    try {
      // Validate input
      const { memoryId, decrypt } = RetrieveMemoryInputSchema.parse(input);

      // Initialize AgentMemory
      const memory = new AgentMemory({ 
        agentId: agent.agentId,
        network: agent.network || 'devnet',
        wallet: agent.wallet
      });

      // Retrieve the memory
      const result = await memory.retrieve(memoryId, { decrypt });

      if (!result) {
        return {
          status: "error",
          error: "Memory not found",
          code: "NOT_FOUND",
          memoryId
        };
      }

      return {
        status: "success",
        memory: {
          id: result.id,
          content: result.content,
          importance: result.importance,
          tags: result.tags,
          category: result.category,
          metadata: result.metadata,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          expiresAt: result.expiresAt,
          encrypted: result.encrypted,
          version: result.version,
          previousVersion: result.previousVersion,
          signature: result.signature
        }
      };
    } catch (error: any) {
      console.error("RETRIEVE_MEMORY error:", error);
      
      // Handle specific error cases
      if (error.message?.includes("decrypt")) {
        return {
          status: "error",
          error: "Failed to decrypt memory - invalid or missing encryption key",
          code: "DECRYPTION_FAILED",
          memoryId: input.memoryId
        };
      }

      return {
        status: "error",
        error: error.message || "Failed to retrieve memory",
        code: error.code || "RETRIEVAL_ERROR",
        details: error.errors || null
      };
    }
  }
};

/**
 * RETRIEVE_MEMORY_VERSIONS Action
 * 
 * Retrieves version history for a memory that has been updated.
 */
export const retrieveMemoryVersionsAction: Action = {
  name: "RETRIEVE_MEMORY_VERSIONS",
  description: "Retrieve version history for a memory. Returns all previous versions if version tracking is enabled.",
  
  examples: [
    {
      input: {
        memoryId: "mem_abc123xyz"
      },
      output: {
        status: "success",
        versions: [
          {
            version: 2,
            content: "Updated content",
            updatedAt: 1704153600000
          },
          {
            version: 1,
            content: "Original content",
            updatedAt: 1704067200000
          }
        ]
      }
    }
  ],

  parameters: {
    type: "object",
    properties: {
      memoryId: {
        type: "string",
        description: "The memory ID to get version history for"
      }
    },
    required: ["memoryId"]
  },

  handler: async (agent, input) => {
    try {
      const { memoryId } = z.object({
        memoryId: z.string().min(1)
      }).parse(input);

      const memory = new AgentMemory({ 
        agentId: agent.agentId,
        network: agent.network || 'devnet',
        wallet: agent.wallet
      });

      const versions = await memory.getVersions(memoryId);

      return {
        status: "success",
        versions: versions.map((v: any) => ({
          version: v.version,
          content: v.content,
          updatedAt: v.updatedAt,
          signature: v.signature
        }))
      };
    } catch (error: any) {
      console.error("RETRIEVE_MEMORY_VERSIONS error:", error);
      return {
        status: "error",
        error: error.message || "Failed to retrieve memory versions",
        code: error.code || "VERSION_ERROR"
      };
    }
  }
};

export default retrieveMemoryAction;
