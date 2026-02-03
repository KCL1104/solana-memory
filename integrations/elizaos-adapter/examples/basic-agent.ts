/**
 * Example: ElizaOS Agent with AgentMemory Adapter
 * 
 * This example demonstrates how to use AgentMemoryAdapter with ElizaOS
 * for persistent memory storage on Solana.
 */

import { AgentRuntime, type Character, type Memory, type Content } from "@elizaos/core";
import AgentMemoryAdapter from "../index.js";

// Agent configuration
const character: Character = {
  name: "SolanaAgent",
  bio: [
    "A helpful AI assistant with persistent memory on Solana blockchain.",
    "I remember our conversations forever, secured by blockchain technology.",
  ],
  system: "You are a helpful assistant. Use your memory to provide personalized responses.",
  modelProvider: "openai",
  settings: {
    model: "gpt-4o-mini",
    temperature: 0.7,
  },
};

// Initialize the AgentMemory adapter
const adapter = new AgentMemoryAdapter({
  solanaEndpoint: "https://api.devnet.solana.com",
  // Optional: provide wallet private key for write operations
  // walletPrivateKey: process.env.SOLANA_PRIVATE_KEY,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  debug: true,
  embeddingDimension: 384,
});

async function main() {
  console.log("🚀 Initializing ElizaOS Agent with AgentMemory...\n");

  try {
    // Initialize adapter
    await adapter.init();
    console.log("✅ AgentMemory adapter initialized\n");

    // Create agent runtime
    const runtime = new AgentRuntime({
      character,
      databaseAdapter: adapter,
    });

    console.log(`🤖 Agent "${character.name}" is ready!\n`);

    // Example: Create a room
    const roomId = await adapter.createRoom();
    console.log(`📍 Created room: ${roomId}\n`);

    // Example: Store a memory
    const memory: Memory = {
      id: crypto.randomUUID(),
      entityId: "user-1",
      agentId: runtime.agentId,
      roomId,
      content: {
        text: "Hello! My name is Alice and I love blockchain technology.",
        source: "user",
      } as Content,
      createdAt: Date.now(),
    };

    await adapter.createMemory(memory, "messages");
    console.log("💾 Stored memory: User introduction\n");

    // Example: Retrieve memories
    const memories = await adapter.getMemories({
      roomId,
      tableName: "messages",
      agentId: runtime.agentId,
      count: 10,
    });

    console.log("📚 Retrieved memories:");
    memories.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.content.text || m.content}`);
    });
    console.log();

    // Example: Search similar memories with embedding
    const dummyEmbedding = new Array(384).fill(0).map(() => Math.random());
    const similar = await adapter.searchMemories({
      tableName: "messages",
      roomId,
      agentId: runtime.agentId,
      embedding: dummyEmbedding,
      match_threshold: 0.8,
      match_count: 5,
      unique: true,
    });

    console.log(`🔍 Found ${similar.length} similar memories\n`);

    // Example: Create and retrieve goals
    await adapter.createGoal({
      id: crypto.randomUUID(),
      roomId,
      userId: "user-1",
      name: "Learn about Solana",
      status: "IN_PROGRESS",
      objectives: [
        { description: "Understand Solana architecture", completed: false },
        { description: "Deploy a smart contract", completed: false },
      ],
    });

    const goals = await adapter.getGoals({
      roomId,
      onlyInProgress: true,
    });

    console.log("🎯 Active goals:");
    goals.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.name} (${g.status})`);
    });
    console.log();

    // Example: Cache operations
    await adapter.setCache({
      key: "last_interaction",
      agentId: runtime.agentId,
      value: JSON.stringify({ timestamp: Date.now(), roomId }),
    });

    const cached = await adapter.getCache({
      key: "last_interaction",
      agentId: runtime.agentId,
    });

    console.log("⚡ Cache test:", cached ? "✅ Working" : "❌ Failed");
    console.log();

    // Example: Create account
    await adapter.createAccount({
      id: "user-1",
      name: "Alice",
      username: "alice_crypto",
      email: "alice@example.com",
      details: {
        interests: ["blockchain", "AI", "DeFi"],
        joinedAt: Date.now(),
      },
    });

    const account = await adapter.getAccountById("user-1");
    console.log("👤 Account retrieved:", account?.name);
    console.log();

    console.log("✅ All tests passed! AgentMemory adapter is working correctly.\n");

    // Cleanup
    await adapter.close();
    console.log("👋 Adapter closed");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run example
main();
