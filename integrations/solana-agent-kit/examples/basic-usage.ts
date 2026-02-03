/**
 * Basic Usage Example
 * 
 * This example demonstrates the basic usage of the Memory Plugin
 * with a keypair wallet on Solana devnet.
 */

import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
import MemoryPlugin from "@solana-agent-kit/plugin-memory";
import { Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import bs58 from "bs58";

async function main() {
  // Initialize wallet from private key
  // Replace with your actual private key (base58 encoded)
  const secretKey = process.env.SOLANA_PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE";
  const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
  const wallet = new KeypairWallet(keyPair);

  console.log("Wallet address:", wallet.publicKey.toString());

  // Create agent with memory plugin
  const agent = new SolanaAgentKit(
    wallet,
    clusterApiUrl("devnet"), // Use devnet for testing
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    }
  ).use(MemoryPlugin);

  console.log("Agent initialized with Memory Plugin");

  // Example 1: Store user preferences
  console.log("\n--- Storing User Preferences ---");
  const preferenceResult = await agent.methods.storeMemory(agent, {
    content: "User prefers dark mode and compact view for the trading interface",
    tags: ["ui", "preferences", "trading"],
    priority: 7,
    useMemoProgram: true,
  });
  console.log("Stored preference:", preferenceResult);

  // Example 2: Store transaction history
  console.log("\n--- Storing Transaction Record ---");
  const txResult = await agent.methods.storeMemory(agent, {
    content: "Swapped 2.5 SOL for 250 USDC on Jupiter at rate 1:100",
    tags: ["transaction", "swap", "jupiter"],
    priority: 6,
    useMemoProgram: true,
  });
  console.log("Stored transaction:", txResult);

  // Example 3: Store high-priority alert with expiration
  console.log("\n--- Storing Time-Sensitive Alert ---");
  const alertResult = await agent.methods.storeMemory(agent, {
    content: "URGENT: whale wallet 0x1234... moving $10M USDC to exchanges",
    tags: ["alert", "whale", "market"],
    priority: 10,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expires in 24 hours
    useMemoProgram: true,
  });
  console.log("Stored alert:", alertResult);

  // Example 4: Retrieve all memories
  console.log("\n--- Retrieving All Memories ---");
  const allMemories = await agent.methods.retrieveMemories(agent, {
    limit: 10,
  });
  console.log("All memories:", allMemories);

  // Example 5: Retrieve by tag
  console.log("\n--- Retrieving by Tag 'preferences' ---");
  const preferences = await agent.methods.retrieveMemories(agent, {
    tag: "preferences",
  });
  console.log("Preferences:", preferences);

  // Example 6: Search memories
  console.log("\n--- Searching for 'SOL' ---");
  const searchResults = await agent.methods.searchMemories(agent, "SOL", {
    tags: ["transaction"],
  });
  console.log("Search results:", searchResults);

  // Example 7: Get statistics
  console.log("\n--- Memory Statistics ---");
  const stats = await agent.methods.getMemoryStats(agent);
  console.log("Stats:", stats);

  console.log("\n✅ Basic example completed!");
}

main().catch(console.error);
