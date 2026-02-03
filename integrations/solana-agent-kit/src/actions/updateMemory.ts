import { Action, SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";
import { updateMemory } from "../tools/memory";

const updateMemoryAction: Action = {
  name: "UPDATE_MEMORY_ACTION",
  similes: [
    "update memory",
    "modify memory",
    "edit memory",
    "change memory",
    "refresh memory",
  ],
  description: `Update an existing memory by its ID.
  You can modify the content, tags, priority, or expiration date.
  
  Use this when:
  - User information has changed
  - Correcting a previously stored memory
  - Updating priority or expiration
  - Adding new tags to organize better`,
  examples: [
    [
      {
        input: {
          id: "mem_1234567890_abc123",
          content: "User prefers USDC over USDT for most transactions, but accepts USDT for small amounts",
          priority: 9,
        },
        output: {
          status: "success",
          memory: {
            id: "mem_1234567890_abc123",
            content: "User prefers USDC over USDT for most transactions, but accepts USDT for small amounts",
            timestamp: 1704067200000,
            tags: ["preferences", "trading"],
            priority: 9,
          },
        },
        explanation: "Update a memory with more detailed information",
      },
    ],
  ],
  schema: z.object({
    id: z.string().describe("The unique ID of the memory to update"),
    content: z.string().min(1).max(1000).optional().describe("New content for the memory"),
    tags: z.array(z.string()).optional().describe("New tags for the memory"),
    priority: z.number().min(1).max(10).optional().describe("New priority level"),
    expiresAt: z.number().optional().describe("New expiration timestamp (Unix ms), null to remove expiration"),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const result = await updateMemory(agent, {
      id: input.id,
      content: input.content,
      tags: input.tags,
      priority: input.priority,
      expiresAt: input.expiresAt,
    });

    return result;
  },
};

export default updateMemoryAction;
