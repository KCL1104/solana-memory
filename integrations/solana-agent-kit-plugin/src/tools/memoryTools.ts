import { Tool } from 'langchain/tools';
import { AgentMemory } from 'agentmemory';
import { MemoryInput, MemorySearchQuery, MemoryUpdateInput } from '../types';

/**
 * Tool handler for storing agent memories
 */
async function storeMemoryHandler(
  agentId: string,
  network: string,
  input: string
): Promise<string> {
  try {
    // Parse input - can be JSON string or plain text
    let memoryInput: MemoryInput;
    try {
      memoryInput = JSON.parse(input);
    } catch {
      // If not valid JSON, treat as plain content
      memoryInput = { content: input };
    }

    const memory = new AgentMemory({ agentId, network: network as any });
    const result = await memory.store(memoryInput);

    return JSON.stringify({
      success: true,
      memoryId: result.id,
      signature: result.signature,
      encrypted: result.encrypted,
      timestamp: result.createdAt
    }, null, 2);
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error.message || "Failed to store memory"
    }, null, 2);
  }
}

/**
 * Tool handler for retrieving agent memories
 */
async function retrieveMemoryHandler(
  agentId: string,
  network: string,
  memoryId: string
): Promise<string> {
  try {
    const memory = new AgentMemory({ agentId, network: network as any });
    const result = await memory.retrieve(memoryId);

    if (!result) {
      return JSON.stringify({
        success: false,
        error: `Memory with ID '${memoryId}' not found`
      }, null, 2);
    }

    return JSON.stringify({
      success: true,
      memory: {
        id: result.id,
        content: result.content,
        importance: result.importance,
        tags: result.tags,
        category: result.category,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        encrypted: result.encrypted,
        version: result.version
      }
    }, null, 2);
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error.message || "Failed to retrieve memory"
    }, null, 2);
  }
}

/**
 * Tool handler for searching agent memories
 */
async function searchMemoryHandler(
  agentId: string,
  network: string,
  input: string
): Promise<string> {
  try {
    // Parse search query
    let searchQuery: MemorySearchQuery;
    try {
      searchQuery = JSON.parse(input);
    } catch {
      // If not valid JSON, treat as text query
      searchQuery = { query: input };
    }

    const memory = new AgentMemory({ agentId, network: network as any });
    const results = await memory.search(searchQuery);

    return JSON.stringify({
      success: true,
      results: results.map((r: any) => ({
        memory: {
          id: r.memory.id,
          content: r.memory.content.substring(0, 200) + 
                   (r.memory.content.length > 200 ? '...' : ''),
          importance: r.memory.importance,
          tags: r.memory.tags,
          category: r.memory.category
        },
        relevance: r.relevance
      })),
      total: results.length
    }, null, 2);
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error.message || "Failed to search memories"
    }, null, 2);
  }
}

/**
 * Tool handler for updating agent memories
 */
async function updateMemoryHandler(
  agentId: string,
  network: string,
  input: string
): Promise<string> {
  try {
    const params = JSON.parse(input);
    const { memoryId, ...updateData } = params;

    if (!memoryId) {
      return JSON.stringify({
        success: false,
        error: "memoryId is required"
      }, null, 2);
    }

    const memory = new AgentMemory({ agentId, network: network as any });
    const result = await memory.update(memoryId, updateData as MemoryUpdateInput);

    return JSON.stringify({
      success: true,
      memoryId: result.id,
      version: result.version,
      updatedAt: result.updatedAt
    }, null, 2);
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error.message || "Failed to update memory"
    }, null, 2);
  }
}

/**
 * Tool handler for deleting agent memories
 */
async function deleteMemoryHandler(
  agentId: string,
  network: string,
  memoryId: string
): Promise<string> {
  try {
    const memory = new AgentMemory({ agentId, network: network as any });
    await memory.delete(memoryId, { hardDelete: false });

    return JSON.stringify({
      success: true,
      memoryId,
      deleted: true
    }, null, 2);
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error.message || "Failed to delete memory"
    }, null, 2);
  }
}

/**
 * Create LangChain-compatible memory tools bound to an agent
 * 
 * @param agentId - The agent ID to bind tools to
 * @param network - The Solana network ('devnet' | 'mainnet-beta' | 'testnet')
 * @returns Array of LangChain Tool instances
 */
export function createMemoryTools(agentId: string, network: string = 'devnet'): Tool[] {
  return [
    new Tool({
      name: "store_agent_memory",
      description: `Store a memory on-chain for persistent agent knowledge. 
Input can be a JSON string with fields: content (required), importance (low/medium/high/critical), tags (array), category, encrypted (boolean), expiresAt (timestamp).
Or provide plain text content directly.
Returns the memory ID and transaction signature.`,
      func: (input: string) => storeMemoryHandler(agentId, network, input)
    }),
    
    new Tool({
      name: "retrieve_agent_memory",
      description: `Retrieve a memory by its ID. Returns the full memory content and metadata.
Input: memory ID string.
Returns memory object or error if not found.`,
      func: (memoryId: string) => retrieveMemoryHandler(agentId, network, memoryId)
    }),
    
    new Tool({
      name: "search_agent_memories",
      description: `Search agent memories using semantic search and filters.
Input can be a JSON string with fields: query (text), tags (array), importance, category, limit, minRelevance.
Or provide plain text query directly.
Returns matching memories sorted by relevance.`,
      func: (input: string) => searchMemoryHandler(agentId, network, input)
    }),
    
    new Tool({
      name: "update_agent_memory",
      description: `Update an existing memory by ID.
Input must be a JSON string with: memoryId (required), plus optional fields: content, importance, addTags, removeTags, category, metadata, expiresAt, createVersion.
Returns updated memory info.`,
      func: (input: string) => updateMemoryHandler(agentId, network, input)
    }),
    
    new Tool({
      name: "delete_agent_memory",
      description: `Delete a memory by ID (soft delete - can be recovered).
Input: memory ID string.
Returns success confirmation.`,
      func: (memoryId: string) => deleteMemoryHandler(agentId, network, memoryId)
    })
  ];
}

/**
 * Pre-built memory tools array (for use with default agent)
 * Note: These need to be bound to an agent before use
 */
export const memoryTools = createMemoryTools("default", "devnet");

export default createMemoryTools;
