/**
 * Tool Definitions for AgentMemory Solana Agent Kit Plugin
 * 
 * These are granular tool definitions that can be imported separately
 * for fine-grained control over memory operations.
 */

import { AgentMemoryPlugin } from "./index";

// ============================================================================
// TOOL INTERFACES
// ============================================================================

export interface StoreMemoryTool {
  name: "memory_store";
  description: string;
  parameters: {
    key?: string;
    content: any;
    tags?: string[];
    importance?: number;
    ttl?: number;
    encrypt?: boolean;
  };
  returns: {
    memoryId: string;
    status: string;
    tier: "hot" | "warm" | "cold";
  };
}

export interface RetrieveMemoryTool {
  name: "memory_retrieve";
  description: string;
  parameters: {
    query: string;
    limit?: number;
    tags?: string[];
    minImportance?: number;
    semantic?: boolean;
  };
  returns: {
    memories: Array<{
      id: string;
      key: string;
      content: any;
      tags: string[];
      importance: number;
      timestamp: number;
      encrypted: boolean;
    }>;
    count: number;
  };
}

export interface UpdateMemoryTool {
  name: "memory_update";
  description: string;
  parameters: {
    memoryId: string;
    content?: any;
    importance?: number;
    tags?: string[];
    append?: boolean;
  };
  returns: {
    memoryId: string;
    status: string;
    version: number;
  };
}

export interface DeleteMemoryTool {
  name: "memory_delete";
  description: string;
  parameters: {
    memoryId: string;
    permanent?: boolean;
  };
  returns: {
    memoryId: string;
    status: string;
  };
}

export interface CompressMemoryTool {
  name: "memory_compress";
  description: string;
  parameters: {
    threshold?: number;
    strategy?: "summarize" | "archive" | "delete";
    olderThan?: number;
  };
  returns: {
    compressed: number;
    saved: number;
    strategy: string;
  };
}

export interface ShareMemoryTool {
  name: "memory_share";
  description: string;
  parameters: {
    memoryId: string;
    recipient: string;
    permissions: {
      read: boolean;
      write?: boolean;
      share?: boolean;
    };
    expiresAt?: number;
  };
  returns: {
    shareId: string;
    status: string;
  };
}

export interface ExportIdentityTool {
  name: "identity_export";
  description: string;
  parameters: {
    format?: "json" | "encrypted_json";
    includeMemories?: boolean;
  };
  returns: {
    bundle: string;
    size: number;
    format: string;
  };
}

export interface ImportIdentityTool {
  name: "identity_import";
  description: string;
  parameters: {
    bundle: string;
    verifyKey?: string;
  };
  returns: {
    imported: number;
    status: string;
  };
}

// Union type of all tools
export type AgentMemoryTool =
  | StoreMemoryTool
  | RetrieveMemoryTool
  | UpdateMemoryTool
  | DeleteMemoryTool
  | CompressMemoryTool
  | ShareMemoryTool
  | ExportIdentityTool
  | ImportIdentityTool;

// ============================================================================
// TOOL REGISTRY
// ============================================================================

/**
 * Registry of all available tools with their metadata
 */
export const TOOL_REGISTRY = {
  memory_store: {
    name: "memory_store",
    description: "Store a new memory on-chain with optional encryption. The memory is assigned a tier (hot/warm/cold) based on importance. Returns memory ID.",
    examples: [
      {
        content: "User prefers dark mode interfaces",
        tags: ["preferences", "ui"],
        importance: 0.8,
      },
      {
        content: "Meeting notes: discussed Q4 roadmap",
        tags: ["meetings", "roadmap"],
        importance: 0.9,
        ttl: 86400 * 90, // 90 days
      },
    ],
  },
  memory_retrieve: {
    name: "memory_retrieve",
    description: "Search memories using natural language queries with semantic search support. Returns most relevant memories sorted by relevance score.",
    examples: [
      {
        query: "What are the user's UI preferences?",
        limit: 5,
      },
      {
        query: "roadmap discussion",
        tags: ["meetings"],
        semantic: true,
      },
    ],
  },
  memory_update: {
    name: "memory_update",
    description: "Update an existing memory by ID. Can append to existing content or replace entirely.",
    examples: [
      {
        memoryId: "mem_abc123",
        content: "User prefers dark mode and high contrast",
        importance: 0.85,
      },
    ],
  },
  memory_delete: {
    name: "memory_delete",
    description: "Delete a memory. By default performs soft delete (can be restored). Use permanent=true for irreversible deletion.",
    examples: [
      {
        memoryId: "mem_abc123",
      },
      {
        memoryId: "mem_def456",
        permanent: true,
      },
    ],
  },
  memory_compress: {
    name: "memory_compress",
    description: "Compress old memories to save storage costs. Supports summarize (create summary), archive (move to cold tier), or delete strategies.",
    examples: [
      {
        strategy: "summarize",
        olderThan: 86400 * 30, // 30 days
      },
    ],
  },
  memory_share: {
    name: "memory_share",
    description: "Share a memory with another agent. Requires allowSharing=true in configuration. Supports read/write/share permissions.",
    examples: [
      {
        memoryId: "mem_abc123",
        recipient: "agent_pubkey_xyz",
        permissions: { read: true, write: false },
      },
    ],
  },
  identity_export: {
    name: "identity_export",
    description: "Export agent identity bundle including memories and configuration. Can be encrypted for secure storage or transfer.",
    examples: [
      {
        format: "encrypted_json",
        includeMemories: true,
      },
    ],
  },
  identity_import: {
    name: "identity_import",
    description: "Import agent identity from a bundle. Restores memories and configuration.",
    examples: [
      {
        bundle: "encrypted_identity_string...",
      },
    ],
  },
};

// ============================================================================
// TOOL HELPERS
// ============================================================================

/**
 * Create a memory storage tool bound to a plugin instance
 */
export function createStoreTool(plugin: AgentMemoryPlugin) {
  return {
    name: "memory_store",
    description: TOOL_REGISTRY.memory_store.description,
    handler: (params: any) => plugin.store(params),
  };
}

/**
 * Create a memory retrieval tool bound to a plugin instance
 */
export function createRetrieveTool(plugin: AgentMemoryPlugin) {
  return {
    name: "memory_retrieve",
    description: TOOL_REGISTRY.memory_retrieve.description,
    handler: (params: any) => plugin.retrieve(params),
  };
}

/**
 * Create a memory update tool bound to a plugin instance
 */
export function createUpdateTool(plugin: AgentMemoryPlugin) {
  return {
    name: "memory_update",
    description: TOOL_REGISTRY.memory_update.description,
    handler: (params: any) => plugin.update(params),
  };
}

/**
 * Create a memory delete tool bound to a plugin instance
 */
export function createDeleteTool(plugin: AgentMemoryPlugin) {
  return {
    name: "memory_delete",
    description: TOOL_REGISTRY.memory_delete.description,
    handler: (params: any) => plugin.delete(params.memoryId, params.permanent),
  };
}

/**
 * Get all tool definitions for documentation
 */
export function getAllToolDefinitions() {
  return Object.values(TOOL_REGISTRY);
}

/**
 * Get tool definition by name
 */
export function getToolDefinition(name: keyof typeof TOOL_REGISTRY) {
  return TOOL_REGISTRY[name];
}
