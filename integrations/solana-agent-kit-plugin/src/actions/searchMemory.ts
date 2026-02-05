import { Action } from 'solana-agent-kit';
import { AgentMemory } from 'agentmemory';
import { MemorySearchQuerySchema } from '../types';

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
  
  examples: [
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
    },
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
  ],

  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Text query for semantic search (optional if using filters)"
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Filter by tags - memories must have all specified tags"
      },
      importance: {
        oneOf: [
          { type: "string", enum: ["low", "medium", "high", "critical"] },
          { type: "array", items: { type: "string", enum: ["low", "medium", "high", "critical"] } }
        ],
        description: "Filter by importance level(s)"
      },
      category: {
        oneOf: [
          { type: "string", enum: ["conversation", "task", "insight", "context", "user_preference", "system", "custom"] },
          { type: "array", items: { type: "string", enum: ["conversation", "task", "insight", "context", "user_preference", "system", "custom"] } }
        ],
        description: "Filter by category or categories"
      },
      status: {
        type: "string",
        enum: ["active", "archived", "deleted"],
        description: "Filter by memory status",
        default: "active"
      },
      fromDate: {
        type: "number",
        description: "Start timestamp for date range filter (milliseconds)"
      },
      toDate: {
        type: "number",
        description: "End timestamp for date range filter (milliseconds)"
      },
      minRelevance: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Minimum relevance score threshold (0-1)",
        default: 0.5
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 100,
        description: "Maximum number of results",
        default: 10
      },
      offset: {
        type: "number",
        minimum: 0,
        description: "Offset for pagination",
        default: 0
      }
    }
  },

  handler: async (agent, input) => {
    try {
      // Validate and parse search query
      const searchQuery = MemorySearchQuerySchema.parse(input);

      // Initialize AgentMemory
      const memory = new AgentMemory({ 
        agentId: agent.agentId,
        network: agent.network || 'devnet',
        wallet: agent.wallet
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
  
  examples: [
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
      }
    }
  ],

  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        minimum: 1,
        maximum: 100,
        default: 10
      },
      category: {
        type: "string",
        enum: ["conversation", "task", "insight", "context", "user_preference", "system", "custom"]
      },
      tags: {
        type: "array",
        items: { type: "string" }
      }
    }
  },

  handler: async (agent, input) => {
    try {
      const memory = new AgentMemory({ 
        agentId: agent.agentId,
        network: agent.network || 'devnet',
        wallet: agent.wallet
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
