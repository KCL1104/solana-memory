/**
 * Advanced Memory Management Example
 * 
 * This example shows advanced features like:
 * - Batch operations
 * - Memory import/export
 * - Priority-based filtering
 * - Cleanup operations
 */

import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
import MemoryPlugin from "@solana-agent-kit/plugin-memory";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

async function main() {
  const keyPair = Keypair.fromSecretKey(
    bs58.decode(process.env.SOLANA_PRIVATE_KEY || "")
  );
  const wallet = new KeypairWallet(keyPair);

  const agent = new SolanaAgentKit(
    wallet,
    "https://api.mainnet-beta.solana.com",
    {}
  ).use(MemoryPlugin);

  console.log("=== Advanced Memory Management Demo ===\n");

  // 1. Batch store memories
  console.log("1. Storing multiple memories...");
  const memories = [
    { content: "Strategy A: Buy low, sell high", tags: ["strategy", "trading"], priority: 9 },
    { content: "Strategy B: Dollar cost averaging", tags: ["strategy", "trading"], priority: 8 },
    { content: "Risk tolerance: Medium", tags: ["risk", "profile"], priority: 10 },
    { content: "Preferred DEX: Jupiter", tags: ["dex", "preference"], priority: 6 },
    { content: "Never trade on weekends", tags: ["rule", "trading"], priority: 7 },
  ];

  for (const mem of memories) {
    await agent.methods.storeMemory(agent, {
      ...mem,
      useMemoProgram: true,
    });
  }
  console.log(`✅ Stored ${memories.length} memories\n`);

  // 2. Retrieve high priority memories only
  console.log("2. High priority memories (priority >= 8):");
  const highPriority = await agent.methods.retrieveMemories(agent, {
    minPriority: 8,
  });
  console.log(highPriority);

  // 3. Search for specific content
  console.log("\n3. Searching for 'Strategy':");
  const searchResults = await agent.methods.searchMemories(agent, "Strategy", {});
  console.log(searchResults);

  // 4. Export memories to JSON
  console.log("\n4. Exporting memories...");
  const exported = await agent.methods.exportMemories(agent);
  console.log("Exported JSON length:", exported.length, "characters");

  // 5. Get statistics
  console.log("\n5. Memory statistics:");
  const stats = await agent.methods.getMemoryStats(agent);
  console.log(stats);

  // 6. Simulate expired memories (would need real implementation)
  console.log("\n6. Cleanup check:");
  const cleanup = await agent.methods.cleanupExpiredMemories(agent);
  console.log(cleanup);

  // 7. Import memories (demonstration)
  console.log("\n7. Import demonstration:");
  const sampleImportData = JSON.stringify([
    {
      id: "imported_1",
      content: "Imported memory: Always verify contract addresses",
      timestamp: Date.now(),
      tags: ["security", "imported"],
      priority: 10,
    },
    {
      id: "imported_2",
      content: "Imported memory: Use hardware wallet for large amounts",
      timestamp: Date.now(),
      tags: ["security", "imported"],
      priority: 10,
    },
  ]);

  const importResult = await agent.methods.importMemories(agent, sampleImportData);
  console.log(importResult);

  console.log("\n✅ Advanced example completed!");
}

main().catch(console.error);
