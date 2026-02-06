import { SolanaAgentKit } from "@solana-agent-kit/core";
import { AgentMemoryPlugin } from "../src/index";

/**
 * Example 1: Basic memory storage and retrieval
 */
async function basicExample() {
  console.log("=== Basic Memory Example ===\n");

  // Initialize agent (in real usage, use actual private key)
  const agent = new SolanaAgentKit({
    privateKey: process.env.SOLANA_PRIVATE_KEY!,
    rpcUrl: "https://api.devnet.solana.com",
  });

  // Initialize memory plugin
  const memoryPlugin = new AgentMemoryPlugin({
    programId: "Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq",
    encryptionKey: process.env.AGENT_ENCRYPTION_KEY,
    defaultTTL: 86400 * 30, // 30 days
  });

  // Register plugin
  await agent.use(memoryPlugin);

  // Store user preferences
  const preferenceId = await agent.execute("memory_store", {
    content: "User prefers concise answers with code examples",
    tags: ["preferences", "communication"],
    importance: 0.9,
  });

  console.log("Stored preference:", preferenceId);

  // Later: retrieve relevant memories
  const memories = await agent.execute("memory_retrieve", {
    query: "How should I communicate with this user?",
    limit: 3,
  });

  console.log("Retrieved memories:", memories);
}

/**
 * Example 2: Conversation context tracking
 */
async function conversationExample() {
  console.log("\n=== Conversation Context Example ===\n");

  const agent = new SolanaAgentKit({
    privateKey: process.env.SOLANA_PRIVATE_KEY!,
    rpcUrl: "https://api.devnet.solana.com",
  });

  const memoryPlugin = new AgentMemoryPlugin({
    programId: "Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq",
    tierConfig: {
      hot: { maxSize: 50, ttl: 86400 },      // Keep 50 recent in memory
      warm: { maxSize: 500, ttl: 86400 * 7 }, // Week of summaries
      cold: { ttl: 86400 * 365 },             // Archive for a year
    },
  });

  await agent.use(memoryPlugin);

  // Simulate conversation
  const conversation = [
    { role: "user", content: "I'm building a DeFi protocol on Solana" },
    { role: "assistant", content: "Great! Are you using Anchor or native Rust?" },
    { role: "user", content: "Anchor - it's my first project" },
    { role: "assistant", content: "Anchor is excellent for beginners..." },
  ];

  // Store conversation turn
  for (const turn of conversation) {
    await agent.execute("memory_store", {
      content: `${turn.role}: ${turn.content}`,
      tags: ["conversation", "defi", "solana", "anchor"],
      importance: turn.role === "user" ? 0.8 : 0.5,
      context: {
        sessionId: "session_001",
        timestamp: Date.now(),
      },
    });
  }

  // Retrieve context for follow-up
  const context = await agent.execute("memory_retrieve", {
    query: "What is the user building and what's their experience level?",
    tags: ["conversation"],
    limit: 5,
  });

  console.log("Conversation context:", context);
}

/**
 * Example 3: Cross-session identity persistence
 */
async function identityExample() {
  console.log("\n=== Identity Persistence Example ===\n");

  const agent = new SolanaAgentKit({
    privateKey: process.env.SOLANA_PRIVATE_KEY!,
    rpcUrl: "https://api.devnet.solana.com",
  });

  const memoryPlugin = new AgentMemoryPlugin({
    programId: "Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq",
  });

  await agent.use(memoryPlugin);

  // After long conversation, export identity
  const identityBundle = await agent.execute("identity_export", {
    format: "encrypted_json",
  });

  console.log("Identity bundle size:", identityBundle.size, "bytes");

  // Store bundle (in practice: IPFS, Arweave, or encrypted file)
  // await saveToSecureStorage(identityBundle.bundle);

  // In new session:
  // const loadedBundle = await loadFromSecureStorage();
  // await agent.execute("identity_import", { bundle: loadedBundle });
  // Agent now has full memory of previous sessions
}

/**
 * Example 4: Memory compression for cost optimization
 */
async function compressionExample() {
  console.log("\n=== Memory Compression Example ===\n");

  const agent = new SolanaAgentKit({
    privateKey: process.env.SOLANA_PRIVATE_KEY!,
    rpcUrl: "https://api.devnet.solana.com",
  });

  const memoryPlugin = new AgentMemoryPlugin({
    programId: "Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq",
  });

  await agent.use(memoryPlugin);

  // Compress old, low-importance memories
  const result = await agent.execute("memory_compress", {
    threshold: 0.3,              // Compress memories below 0.3 importance
    strategy: "summarize",       // Summarize instead of delete
    olderThan: Date.now() - 86400 * 7, // Older than 7 days
  });

  console.log(`Compressed ${result.compressed} memories, saved ${result.saved} bytes`);
}

// Run examples if executed directly
if (require.main === module) {
  (async () => {
    try {
      // Note: These examples require SOLANA_PRIVATE_KEY environment variable
      // and a connection to Solana devnet/mainnet
      
      // await basicExample();
      // await conversationExample();
      // await identityExample();
      // await compressionExample();
      
      console.log("Examples defined. Uncomment to run with proper environment setup.");
    } catch (error) {
      console.error("Example failed:", error);
    }
  })();
}

export { basicExample, conversationExample, identityExample, compressionExample };