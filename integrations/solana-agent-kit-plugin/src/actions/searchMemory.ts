import { Action } from 'solana-agent-kit';
import { AgentMemory } from '../core/AgentMemory';
import { MemorySearchQuerySchema } from '../types';
import { z } from 'zod';

/**
 * SEARCH_MEMORY Action
 * 
 * Performs semantic search across all agent memories.
 * Supports filtering by tags, importance, category, and date range.
 * Returns results sorted by relevance score.
 */
export const searchMemoryAction: Action = {
  name: "SEARCH_MEMORY",
  description: "Search agent memories using semantic search and filters. Supports text queries, tag filtering, importance filtering, and date ranges. Returns results sorted by relevance with match explanations.",
  
  similes: ["find memory", "search memories", "lookup", "query memories"],
  
  examples: [
    [
      {
        input: {
          query: "user preferences",
          limit: 10
        },
        output: {
          status: "success",
          results: [
            {
              memory: {
                id: "mem_abc123",
                content: "User prefers dark mode interface",
                importance: "medium",
                tags: ["user_preference", "ui"],
                category: "user_preference"
              },
              relevance: 0.95,
              matchedTags: ["user_preference"]
            }
          ],
          total: 1,
          offset: 0
        },
        explanation: "Search for memories about user preferences"
      }
    ],
    [
      {
        input: {
          tags: ["critical", "api_key"],
          importance: "critical",
          limit: 5
        },
        output: {
          status: "success",
          results: [
            {
              memory: {
                id: "mem_secret456",
                content: "Critical API key for external service",
                importance: "critical",
                tags: ["api_key", "secret"]
              },
              relevance: 1.0,
              matchedTags: ["critical", "api_key"]
            }
          ],
          total: 1
        },
        explanation: "Filter memories by tags and importance"
      }
    ]
  ],

  schema: MemorySearchQuerySchema,

  handler: async (agent, input) => {
    try {
      // Validate and parse search query
      const searchQuery = MemorySearchQuerySchema.parse(input);

      // Initialize AgentMemory
      const agentWithConfig = agent as typeof agent & { agentId?: string; network?: string; wallet?: any };
      const memory = new AgentMemory({ 
        agentId: agentWithConfig.agentId || 'default-agent',
        network: (agentWithConfig.network as any) || 'devnet',
        wallet: agentWithConfig.wallet
      });

      // Perform search
      const searchResults = await memory.search(searchQuery);

      // Format results
      const results = searchResults.map((result: any) => ({
        memory: {
          id: result.memory.id,
          content: result.memory.content,
          importance: result.memory.importance,
          tags: result.memory.tags,
          category: result.memory.category,
          metadata: result.memory.metadata,
          createdAt: result.memory.createdAt,
          updatedAt: result.memory.updatedAt,
          expiresAt: result.memory.expiresAt,
          encrypted: result.memory.encrypted,
          version: result.memory.version
        },
        relevance: result.relevance,
        matchedTags: result.matchedTags || []
      }));

      return {
        status: "success",
        results,
        total: results.length,
        offset: searchQuery.offset || 0,
        query: {
          text: searchQuery.query,
          filters: {
            tags: searchQuery.tags,
            importance: searchQuery.importance,
            category: searchQuery.category,
            status: searchQuery.status,
            dateRange: searchQuery.fromDate || searchQuery.toDate ? {
              from: searchQuery.fromDate,
              to: searchQuery.toDate
            } : undefined
          }
        }
      };
    } catch (error: any) {
      console.error("SEARCH_MEMORY error:", error);
      
      return {
        status: "error",
        error: error.message || "Failed to search memories",
        code: error.code || "SEARCH_ERROR",
        details: error.errors || null
      };
    }
  }
};

/**
 * LIST_RECENT_MEMORIES Action
 * 
 * Lists recent memories with optional filtering.
 */
export const listRecentMemoriesAction: Action = {
  name: "LIST_RECENT_MEMORIES",
  description: "List the most recent memories, optionally filtered by category or tags.",
  
  similes: ["show recent memories", "latest memories", "recent thoughts"],
  
  examples: [
    [
      {
        input: {
          limit: 5,
          category: "conversation"
        },
        output: {
          status: "success",
          memories: [
            {
              id: "mem_latest",
              content: "Latest conversation",
              createdAt: 1704067200000
            }
          ]
        },
        explanation: "List recent conversation memories"
      }
    ]
  ],

  schema: z.object({
    limit: z.number().min(1).max(100).optional().describe("Maximum number of memories to return"),
    category: z.enum(["conversation", "task", "insight", "context", "user_preference", "system", "custom"]).optional().describe("Filter by category"),
    tags: z.array(z.string()).optional().describe("Filter by tags")
  }),

  handler: async (agent, input) => {
    try {
      const agentWithConfig = agent as typeof agent & { agentId?: string; network?: string; wallet?: any };
      const memory = new AgentMemory({ 
        agentId: agentWithConfig.agentId || 'default-agent',
        network: (agentWithConfig.network as any) || 'devnet',
        wallet: agentWithConfig.wallet
      });

      const memories = await memory.listRecent({
        limit: input.limit || 10,
        category: input.category,
        tags: input.tags
      });

      return {
        status: "success",
        memories: memories.map((m: any) => ({
          id: m.id,
          content: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
          importance: m.importance,
          tags: m.tags,
          category: m.category,
          createdAt: m.createdAt,
          encrypted: m.encrypted
        }))
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message || "Failed to list memories",
        code: error.code || "LIST_ERROR"
      };
    }
  }
};

export default searchMemoryAction;
