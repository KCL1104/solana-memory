import { Action } from 'solana-agent-kit';
import { AgentMemory } from 'agentmemory';
import { MemoryUpdateInputSchema } from '../types';
import { z } from 'zod';

/**
 * UPDATE_MEMORY Action
 * 
 * Updates an existing memory with new content or metadata.
 * Supports version control - can either update in place or create a new version.
 * Allows adding/removing tags and updating importance.
 */
export const updateMemoryAction: Action = {
  name: "UPDATE_MEMORY",
  description: "Update an existing memory by ID. Supports updating content, importance, tags, category, and metadata. Can create a version history or update in place. Automatically updates the timestamp.",
  
  examples: [
    {
      input: {
        memoryId: "mem_abc123xyz",
        content: "User prefers dark mode interface and large font size",
        addTags: ["accessibility"],
        createVersion: true
      },
      output: {
        status: "success",
        memoryId: "mem_abc123xyz",
        newVersion: 2,
        previousVersion: 1,
        signature: "5Kupdate...xyz",
        updatedAt: 1704153600000
      },
      explanation: "Update memory content and add a tag, creating a new version"
    },
    {
      input: {
        memoryId: "mem_secret456",
        importance: "high",
        removeTags: ["temporary"],
        expiresAt: 1709241600000
      },
      output: {
        status: "success",
        memoryId: "mem_secret456",
        version: 1,
        updatedFields: ["importance", "tags", "expiresAt"],
        signature: "5Kupdate2...abc"
      },
      explanation: "Update importance and remove a tag without creating a new version"
    }
  ],

  parameters: {
    type: "object",
    properties: {
      memoryId: {
        type: "string",
        description: "The unique ID of the memory to update"
      },
      content: {
        type: "string",
        description: "New content for the memory (optional - leave undefined to keep current)",
        minLength: 1,
        maxLength: 10000
      },
      importance: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "New importance level (optional)"
      },
      addTags: {
        type: "array",
        items: { type: "string", maxLength: 50 },
        description: "Tags to add to the memory"
      },
      removeTags: {
        type: "array",
        items: { type: "string" },
        description: "Tags to remove from the memory"
      },
      category: {
        type: "string",
        enum: ["conversation", "task", "insight", "context", "user_preference", "system", "custom"],
        description: "New category (optional)"
      },
      metadata: {
        type: "object",
        description: "Metadata to merge with existing metadata"
      },
      expiresAt: {
        type: "number",
        description: "New expiration timestamp (optional)"
      },
      createVersion: {
        type: "boolean",
        description: "Whether to create a new version or update in place (default: true)",
        default: true
      }
    },
    required: ["memoryId"]
  },

  handler: async (agent, input) => {
    try {
      // Validate memoryId
      const { memoryId } = z.object({
        memoryId: z.string().min(1)
      }).parse({ memoryId: input.memoryId });

      // Validate update input
      const updateInput = MemoryUpdateInputSchema.parse(input);

      // Initialize AgentMemory
      const memory = new AgentMemory({ 
        agentId: agent.agentId,
        network: agent.network || 'devnet',
        wallet: agent.wallet
      });

      // Update the memory
      const result = await memory.update(memoryId, updateInput);

      return {
        status: "success",
        memoryId: result.id,
        version: result.version,
        previousVersion: result.previousVersion,
        updatedAt: result.updatedAt,
        signature: result.signature,
        updatedFields: [
          ...(updateInput.content ? ['content'] : []),
          ...(updateInput.importance ? ['importance'] : []),
          ...(updateInput.addTags || updateInput.removeTags ? ['tags'] : []),
          ...(updateInput.category ? ['category'] : []),
          ...(updateInput.metadata ? ['metadata'] : []),
          ...(updateInput.expiresAt ? ['expiresAt'] : [])
        ]
      };
    } catch (error: any) {
      console.error("UPDATE_MEMORY error:", error);
      
      // Handle specific errors
      if (error.message?.includes("not found")) {
        return {
          status: "error",
          error: `Memory with ID '${input.memoryId}' not found`,
          code: "NOT_FOUND"
        };
      }

      if (error.message?.includes("permission")) {
        return {
          status: "error",
          error: "Insufficient permissions to update this memory",
          code: "PERMISSION_DENIED"
        };
      }

      return {
        status: "error",
        error: error.message || "Failed to update memory",
        code: error.code || "UPDATE_ERROR",
        details: error.errors || null
      };
    }
  }
};

/**
 * DELETE_MEMORY Action
 * 
 * Soft-deletes a memory (marks as deleted) or hard-deletes if specified.
 */
export const deleteMemoryAction: Action = {
  name: "DELETE_MEMORY",
  description: "Delete a memory by ID. Supports soft delete (mark as deleted) or hard delete (permanent removal). Soft delete allows recovery, hard delete is irreversible.",
  
  examples: [
    {
      input: {
        memoryId: "mem_abc123xyz",
        hardDelete: false
      },
      output: {
        status: "success",
        memoryId: "mem_abc123xyz",
        deleted: true,
        hardDelete: false,
        message: "Memory soft-deleted successfully"
      },
      explanation: "Soft delete a memory (can be recovered)"
    }
  ],

  parameters: {
    type: "object",
    properties: {
      memoryId: {
        type: "string",
        description: "The ID of the memory to delete"
      },
      hardDelete: {
        type: "boolean",
        description: "Whether to permanently delete (true) or soft delete (false)",
        default: false
      }
    },
    required: ["memoryId"]
  },

  handler: async (agent, input) => {
    try {
      const { memoryId, hardDelete } = z.object({
        memoryId: z.string().min(1),
        hardDelete: z.boolean().optional().default(false)
      }).parse(input);

      const memory = new AgentMemory({ 
        agentId: agent.agentId,
        network: agent.network || 'devnet',
        wallet: agent.wallet
      });

      await memory.delete(memoryId, { hardDelete });

      return {
        status: "success",
        memoryId,
        deleted: true,
        hardDelete,
        message: hardDelete 
          ? "Memory permanently deleted" 
          : "Memory soft-deleted (can be recovered)"
      };
    } catch (error: any) {
      console.error("DELETE_MEMORY error:", error);
      
      return {
        status: "error",
        error: error.message || "Failed to delete memory",
        code: error.code || "DELETE_ERROR"
      };
    }
  }
};

/**
 * ARCHIVE_MEMORY Action
 * 
 * Archives a memory (marks as archived for long-term storage).
 */
export const archiveMemoryAction: Action = {
  name: "ARCHIVE_MEMORY",
  description: "Archive a memory to move it from active to archived status. Archived memories are not included in default searches but can still be retrieved by ID.",
  
  parameters: {
    type: "object",
    properties: {
      memoryId: {
        type: "string",
        description: "The ID of the memory to archive"
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

      await memory.archive(memoryId);

      return {
        status: "success",
        memoryId,
        archived: true,
        message: "Memory archived successfully"
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message || "Failed to archive memory",
        code: error.code || "ARCHIVE_ERROR"
      };
    }
  }
};

export default updateMemoryAction;
