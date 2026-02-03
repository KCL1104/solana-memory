import { Action, SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";
import { storeMemory } from "../tools/memory";

const storeMemoryAction: Action = {
  name: "STORE_MEMORY_ACTION",
  similes: [
    "save memory",
    "remember",
    "store information",
    "save data",
    "create memory",
    "log memory",
    "store thought",
  ],
  description: `Store a memory or information for the agent to remember later.
  The memory can include tags for organization, priority level, and optional expiration.
  Small memories are stored on-chain using the Solana Memo program for transparency and permanence.
  
  Use this when:
  - The user shares important information to remember
  - You need to log a significant event or decision
  - You want to store context for future conversations
  - Recording transaction history or outcomes`,
  examples: [
    [
      {
        input: {
          content: "User prefers USDC over USDT for all transactions",
          tags: ["preferences", "trading"],
          priority: 8,
        },
        output: {
          status: "success",
          memory: {
            id: "mem_1234567890_abc123",
            content: "User prefers USDC over USDT for all transactions",
            timestamp: 1704067200000,
            tags: ["preferences", "trading"],
            priority: 8,
          },
          signature: "5x...abc",
        },
        explanation: "Store a user preference with high priority",
      },
    ],
    [
      {
        input: {
          content: "Successfully swapped 1 SOL for 100 USDC on Jupiter",
          tags: ["transaction", "swap"],
          priority: 5,
          useMemoProgram: true,
        },
        output: {
          status: "success",
          memory: {
            id: "mem_1234567890_def456",
            content: "Successfully swapped 1 SOL for 100 USDC on Jupiter",
            timestamp: 1704067200000,
            tags: ["transaction", "swap"],
            priority: 5,
          },
          signature: "3x...xyz",
        },
        explanation: "Log a successful transaction",
      },
    ],
  ],
  schema: z.object({
    content: z.string().min(1).max(1000).describe("The content to remember"),
    tags: z.array(z.string()).optional().describe("Tags to categorize the memory"),
    priority: z.number().min(1).max(10).optional().describe("Priority level (1-10, higher = more important)"),
    expiresAt: z.number().optional().describe("Expiration timestamp (Unix ms)"),
    useMemoProgram: z.boolean().optional().describe("Use Solana Memo program for on-chain storage"),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const result = await storeMemory(agent, {
      content: input.content,
      tags: input.tags,
      priority: input.priority,
      expiresAt: input.expiresAt,
      useMemoProgram: input.useMemoProgram,
    });

    return result;
  },
};

export default storeMemoryAction;
