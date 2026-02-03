/**
 * LangChain Integration Example
 * 
 * This example demonstrates using the Memory Plugin with LangChain
 * for more complex agent workflows.
 */

import { SolanaAgentKit, KeypairWallet, createLangchainTools } from "solana-agent-kit";
import MemoryPlugin from "@solana-agent-kit/plugin-memory";
import { Keypair } from "@solana/web3.js";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import bs58 from "bs58";

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

  // Create LangChain tools
  const tools = createLangchainTools(agent, agent.actions);

  // Initialize LangChain model
  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  // Create React agent
  const reactAgent = createReactAgent({
    llm: model,
    tools,
    messageModifier: `
You are a helpful Solana assistant with memory capabilities.

Your responsibilities:
1. Remember user preferences and important information
2. Recall previous conversations when relevant
3. Execute blockchain operations when requested
4. Be helpful and accurate

Use the memory tools to store and retrieve information as needed.
    `,
  });

  // Helper to run agent
  const runAgent = async (input: string) => {
    const response = await reactAgent.invoke({
      messages: [new HumanMessage(input)],
    });
    return response.messages[response.messages.length - 1].content;
  };

  // Example interactions
  console.log("=== LangChain Memory Agent Demo ===\n");

  console.log("User: Remember that I only invest in eco-friendly tokens");
  const response1 = await runAgent("Remember that I only invest in eco-friendly tokens");
  console.log("Agent:", response1);

  console.log("\nUser: What are my investment criteria?");
  const response2 = await runAgent("What are my investment criteria?");
  console.log("Agent:", response2);

  console.log("\nUser: Show me all memories about my preferences");
  const response3 = await runAgent("Show me all memories about my preferences");
  console.log("Agent:", response3);

  console.log("\n✅ LangChain example completed!");
}

main().catch(console.error);
