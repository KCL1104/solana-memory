import { Action, SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";
import { retrieveMemories } from "../tools/memory";

const retrieveMemoryAction: Action = {
  name: "RETRIEVE_MEMORY_ACTION",
  similes: [
    "get memories",
    "recall",
    "remember",
    "fetch memories",
    "load memories",
    "search memories",
    "find memory",
  ],
  description: `Retrieve stored memories based on filters like tags, time range, or priority.
  Use this to recall previously stored information, user preferences, or historical data.
  
  Use this when:
  - You need to recall user preferences or past information
  - Looking for context from previous conversations
  - Retrieving transaction history
  - Finding memories by specific tags or time period`,
  examples: [
    [
      {
        input: {
          tag: "preferences",
          limit: 10,
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
        explanation: "Retrieve user preferences",
      },
    ],
    [
      {
        input: {
          limit: 5,
          minPriority: 7,
        },
        output: {
          status: "success",
          memories: [],
        },
        explanation: "Retrieve high-priority memories",
      },
    ],
  ],
  schema: z.object({
    tag: z.string().optional().describe("Filter by specific tag"),
    limit: z.number().min(1).max(100).optional().describe("Maximum number of memories to retrieve"),
    before: z.number().optional().describe("Only retrieve memories before this timestamp"),
    after: z.number().optional().describe("Only retrieve memories after this timestamp"),
    minPriority: z.number().min(1).max(10).optional().describe("Minimum priority level"),
    includeExpired: z.boolean().optional().describe("Include expired memories"),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const result = await retrieveMemories(agent, {
      tag: input.tag,
      limit: input.limit,
      before: input.before,
      after: input.after,
      minPriority: input.minPriority,
      includeExpired: input.includeExpired,
    });

    return result;
  },
};

export default retrieveMemoryAction;
