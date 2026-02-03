import { Action, SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";
import { searchMemories, getMemoryStats, cleanupExpiredMemories } from "../tools/memory";

export const searchMemoryAction: Action = {
  name: "SEARCH_MEMORY_ACTION",
  similes: [
    "search memories",
    "find memory",
    "query memories",
    "lookup memory",
    "search information",
  ],
  description: `Search through stored memories using full-text search.
  Returns memories that match the search query in their content or tags.
  
  Use this when:
  - You need to find specific information but don't know the exact tag
  - Looking for memories containing specific keywords
  - Searching across all memory content`,
  examples: [
    [
      {
        input: {
          query: "USDC preference",
          tags: ["trading"],
        },
        output: {
          status: "success",
          memories: [
            {
              id: "mem_1234567890_abc123",
              content: "User prefers USDC over USDT for all transactions",
              timestamp: 1704067200000,
              tags: ["preferences", "trading"],
              priority: 8,
            },
          ],
        },
        explanation: "Search for memories about USDC preferences",
      },
    ],
  ],
  schema: z.object({
    query: z.string().min(1).describe("Search query string"),
    tags: z.array(z.string()).optional().describe("Optional tags to filter by"),
    priorityMin: z.number().min(1).max(10).optional().describe("Minimum priority"),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const result = await searchMemories(agent, input.query, {
      tags: input.tags,
      priorityMin: input.priorityMin,
    });
    return result;
  },
};

export const memoryStatsAction: Action = {
  name: "MEMORY_STATS_ACTION",
  similes: [
    "memory stats",
    "memory statistics",
    "get memory info",
    "memory count",
    "memory summary",
  ],
  description: `Get statistics about stored memories including total count, storage used,
  breakdown by tags, and expiration information.
  
  Use this when:
  - Monitoring memory usage
  - Planning cleanup operations
  - Getting an overview of stored information`,
  examples: [
    [
      {
        input: {},
        output: {
          status: "success",
          stats: {
            totalMemories: 42,
            totalSize: "15.2 KB",
            byTag: {
              preferences: 5,
              transactions: 20,
              system: 17,
            },
            expiredCount: 3,
          },
        },
        explanation: "Get memory statistics",
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const result = await getMemoryStats(agent);
    return result;
  },
};

export const cleanupMemoryAction: Action = {
  name: "CLEANUP_MEMORY_ACTION",
  similes: [
    "cleanup memories",
    "clear expired memories",
    "purge old memories",
    "memory cleanup",
    "remove expired",
  ],
  description: `Remove all expired memories from storage.
  This helps maintain storage efficiency by deleting outdated information.
  
  Use this when:
  - Performing maintenance
  - Freeing up storage space
  - Removing temporary or time-sensitive information`,
  examples: [
    [
      {
        input: {},
        output: {
          status: "success",
          deletedCount: 5,
          message: "Successfully removed 5 expired memories",
        },
        explanation: "Clean up expired memories",
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const result = await cleanupExpiredMemories(agent);
    return result;
  },
};
