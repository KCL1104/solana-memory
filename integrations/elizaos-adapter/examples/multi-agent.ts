/**
 * Example: Multi-Agent System with Shared Memory
 * 
 * Demonstrates multiple agents sharing memory via AgentMemory on Solana.
 */

import { AgentRuntime, type Character } from "@elizaos/core";
import AgentMemoryAdapter from "../index.js";

// Shared adapter instance
const sharedAdapter = new AgentMemoryAdapter({
  solanaEndpoint: "https://api.devnet.solana.com",
  debug: true,
});

// Define multiple agent characters
const characters: Character[] = [
  {
    name: "Researcher",
    bio: ["I research blockchain technology and gather information."],
    system: "You are a research specialist. Gather and store facts.",
    modelProvider: "openai",
  },
  {
    name: "Writer",
    bio: ["I write content based on research findings."],
    system: "You are a content writer. Create engaging content from research.",
    modelProvider: "openai",
  },
  {
    name: "Reviewer",
    bio: ["I review and fact-check content."],
    system: "You are a quality reviewer. Verify accuracy of information.",
    modelProvider: "openai",
  },
];

async function multiAgentDemo() {
  console.log("🚀 Starting Multi-Agent System Demo\n");

  await sharedAdapter.init();

  const roomId = await sharedAdapter.createRoom();
  console.log(`📍 Collaboration room: ${roomId}\n`);

  // Create agents
  const agents: AgentRuntime[] = [];
  for (const character of characters) {
    const runtime = new AgentRuntime({
      character,
      databaseAdapter: sharedAdapter,
    });
    agents.push(runtime);
    console.log(`🤖 Agent "${character.name}" initialized`);
  }

  console.log("\n📤 Researcher stores knowledge...");
  const researcher = agents[0];
  await sharedAdapter.createMemory(
    {
      id: crypto.randomUUID(),
      entityId: researcher.agentId,
      agentId: researcher.agentId,
      roomId,
      content: {
        text: "Solana can process 65,000 transactions per second with sub-second finality.",
        metadata: { topic: "performance", source: "research" },
      },
      createdAt: Date.now(),
    },
    "knowledge"
  );

  console.log("📤 Writer retrieves and uses knowledge...");
  const knowledge = await sharedAdapter.getMemories({
    roomId,
    tableName: "knowledge",
    agentId: researcher.agentId,
    count: 10,
  });

  console.log(`   Found ${knowledge.length} knowledge items\n`);

  console.log("📤 Reviewer validates...");
  await sharedAdapter.createMemory(
    {
      id: crypto.randomUUID(),
      entityId: agents[2].agentId,
      agentId: agents[2].agentId,
      roomId,
      content: {
        text: "Verified: Solana's theoretical max is 65,000 TPS, actual varies by network conditions.",
        metadata: { verified: true, confidence: 0.95 },
      },
      createdAt: Date.now(),
    },
    "verification"
  );

  // Demonstrate relationship tracking
  console.log("🔗 Tracking agent relationships...");
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      await sharedAdapter.createRelationship({
        userA: agents[i].agentId,
        userB: agents[j].agentId,
      });
      console.log(`   Linked: ${characters[i].name} ↔ ${characters[j].name}`);
    }
  }

  const relationships = await sharedAdapter.getRelationships({
    userId: agents[0].agentId,
  });
  console.log(`\n   Researcher has ${relationships.length} connections\n`);

  console.log("✅ Multi-agent collaboration demo complete!\n");

  await sharedAdapter.close();
}

multiAgentDemo().catch(console.error);
