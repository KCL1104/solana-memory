import { Action, SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";
import { deleteMemory } from "../tools/memory";

const deleteMemoryAction: Action = {
  name: "DELETE_MEMORY_ACTION",
  similes: [
    "delete memory",
    "remove memory",
    "forget",
    "clear memory",
    "erase memory",
    "purge memory",
  ],
  description: `Delete a memory by its ID. This permanently removes the memory from storage.
  
  Use this when:
  - A memory is no longer relevant
  - User requests to delete their data
  - Cleaning up old or incorrect information
  - Removing expired or outdated memories`,
  examples: [
    [
      {
        input: {
          id: "mem_1234567890_abc123",
        },
        output: {
          status: "success",
          message: "Memory mem_1234567890_abc123 marked for deletion",
        },
        explanation: "Delete a specific memory",
      },
    ],
  ],
  schema: z.object({
    id: z.string().describe("The unique ID of the memory to delete"),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const result = await deleteMemory(agent, input.id);
    return result;
  },
};

export default deleteMemoryAction;
