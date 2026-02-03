/**
 * Vercel AI SDK Integration Example
 * 
 * This example shows how to use the Memory Plugin with Vercel AI SDK
 * to create an AI agent that can remember conversations and user preferences.
 */

import { SolanaAgentKit, KeypairWallet, createVercelAITools } from "solana-agent-kit";
import MemoryPlugin from "@solana-agent-kit/plugin-memory";
import { Keypair } from "@solana/web3.js";
import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import bs58 from "bs58";
import { z } from "zod";

async function main() {
  // Initialize agent
  const keyPair = Keypair.fromSecretKey(
    bs58.decode(process.env.SOLANA_PRIVATE_KEY || "")
  );
  const wallet = new KeypairWallet(keyPair);

  const agent = new SolanaAgentKit(
    wallet,
    "https://api.mainnet-beta.solana.com",
    { OPENAI_API_KEY: process.env.OPENAI_API_KEY || "" }
  ).use(MemoryPlugin);

  // Create Vercel AI tools from agent actions
  const tools = createVercelAITools(agent, agent.actions);

  // Example conversation with memory
  const conversation = async (userMessage: string) => {
    const { text } = await generateText({
      model: openai("gpt-4"),
      tools: {
        // Memory tools
        storeMemory: tools.STORE_MEMORY_ACTION,
        retrieveMemory: tools.RETRIEVE_MEMORY_ACTION,
        searchMemory: tools.SEARCH_MEMORY_ACTION,
        
        // Custom trading tool example
        executeTrade: tool({
          description: "Execute a token trade",
          parameters: z.object({
            fromToken: z.string(),
            toToken: z.string(),
            amount: z.number(),
          }),
          execute: async ({ fromToken, toToken, amount }) => {
            // Store the trade in memory
            await agent.methods.storeMemory(agent, {
              content: `Executed trade: ${amount} ${fromToken} to ${toToken}`,
              tags: ["transaction", "trade"],
              priority: 8,
            });
            return { status: "success", txHash: "0x..." };
          },
        }),
      },
      maxSteps: 5,
      prompt: `
You are a Solana trading assistant with memory capabilities.

User message: "${userMessage}"

If the user shares preferences or important information, store it in memory.
If the user asks about previous information, retrieve it from memory.
If the user wants to trade, execute the trade and store the record.

Respond naturally and use the available tools when appropriate.
      `,
    });

    return text;
  };

  // Simulate conversations
  console.log("User: Hi! I prefer to trade in small amounts under $100");
  const response1 = await conversation("Hi! I prefer to trade in small amounts under $100");
  console.log("AI:", response1);

  console.log("\nUser: What's my trading preference?");
  const response2 = await conversation("What's my trading preference?");
  console.log("AI:", response2);

  console.log("\nUser: Swap 0.5 SOL to USDC");
  const response3 = await conversation("Swap 0.5 SOL to USDC");
  console.log("AI:", response3);

  console.log("\n✅ Vercel AI SDK example completed!");
}

main().catch(console.error);
