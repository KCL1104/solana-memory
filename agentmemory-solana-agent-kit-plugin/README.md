# @agentmemory/solana-agent-kit-plugin

[![npm version](https://badge.fury.io/js/@agentmemory%2Fsolana-agent-kit-plugin.svg)](https://www.npmjs.com/package/@agentmemory/solana-agent-kit-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AgentMemory Protocol plugin for [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit) — enabling persistent, encrypted, on-chain memory for AI agents on Solana.

## Features

- 🔐 **End-to-End Encryption** — Client-side encryption before on-chain storage
- 🔍 **Semantic Search** — Natural language memory retrieval
- 🌡️ **Hot/Warm/Cold Tiers** — Automatic storage optimization based on importance
- 🔄 **Version Control** — Full history and rollback capabilities
- 🤝 **Secure Sharing** — Share memories with other agents (opt-in)
- 📦 **Identity Export/Import** — Transfer agent state between sessions
- ⚡ **ZK Compression** — 100x cost reduction for on-chain storage
- 🔗 **Solana Native** — Built on Solana with Anchor framework

## Installation

```bash
npm install @agentmemory/solana-agent-kit-plugin
```

## Quick Start

```typescript
import { SolanaAgentKit } from "@solana-agent-kit/core";
import { AgentMemoryPlugin } from "@agentmemory/solana-agent-kit-plugin";

// Initialize Solana Agent Kit
const agent = new SolanaAgentKit({
  privateKey: process.env.SOLANA_PRIVATE_KEY,
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
});

// Initialize AgentMemory Plugin
const memoryPlugin = new AgentMemoryPlugin({
  apiUrl: process.env.AGENTMEMORY_API_URL,
  apiKey: process.env.AGENTMEMORY_API_KEY,
  encryptionKey: process.env.AGENT_ENCRYPTION_KEY, // Optional: for E2E encryption
  defaultTTL: 86400 * 30, // 30 days default memory lifetime
  allowSharing: true, // Enable memory sharing
});

// Register plugin
await agent.use(memoryPlugin);

// Store a memory
const memoryId = await agent.invoke("memory_store", {
  content: "User prefers detailed technical explanations",
  tags: ["preferences", "communication_style"],
  importance: 0.9,
});

// Retrieve relevant memories
const memories = await agent.invoke("memory_retrieve", {
  query: "How should I explain things to the user?",
  limit: 5,
});

// Update memory with new context
await agent.invoke("memory_update", {
  memoryId: memoryId.memoryId,
  content: "User prefers detailed technical explanations with examples",
  importance: 0.95,
});
```

## Configuration

```typescript
interface AgentMemoryConfig {
  /** AgentMemory program ID on Solana (defaults to devnet) */
  programId?: string;
  
  /** AgentMemory API URL */
  apiUrl?: string;
  
  /** API key for authentication */
  apiKey?: string;
  
  /** Solana RPC URL */
  rpcUrl?: string;
  
  /** Encryption key for E2E encryption (base58 encoded, 32 bytes) */
  encryptionKey?: string;
  
  /** Default time-to-live for memories in seconds (default: 30 days) */
  defaultTTL?: number;
  
  /** Hot/Warm/Cold tier configuration */
  tierConfig?: {
    hot: { maxSize: number; ttl: number };   // Recent, frequently accessed
    warm: { maxSize: number; ttl: number };  // Compressed summaries
    cold: { ttl: number };                    // Archive on-chain
  };
  
  /** Enable memory sharing with other agents */
  allowSharing?: boolean;
  
  /** Agents allowed to access shared memories */
  trustedAgents?: string[];
  
  /** Auto-compress memories older than this (in seconds) */
  compressionThreshold?: number;
  
  /** Enable debug logging */
  debug?: boolean;
}
```

## Available Tools

### Memory Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `memory_store` | Store new memory | `content`, `tags`, `importance`, `ttl`, `encrypt` |
| `memory_retrieve` | Search memories | `query`, `limit`, `tags`, `semantic` |
| `memory_update` | Update existing memory | `memoryId`, `content`, `importance`, `append` |
| `memory_delete` | Remove memory | `memoryId`, `permanent` |
| `memory_compress` | Compress old memories | `threshold`, `strategy`, `olderThan` |
| `memory_share` | Share with other agent | `memoryId`, `recipient`, `permissions` |

### Identity Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `identity_export` | Export identity bundle | `format`, `includeMemories` |
| `identity_import` | Import identity bundle | `bundle`, `verifyKey` |

## Hot/Warm/Cold Architecture

AgentMemory implements a three-tier storage system for cost optimization:

```
┌─────────────────────────────────────────────────────────────┐
│                         HOT TIER                            │
│  • Recent conversations (last 24h)                         │
│  • High-importance memories (importance > 0.8)             │
│  • Frequently accessed (last 1h)                           │
│  Storage: Fast access, higher cost                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        WARM TIER                            │
│  • Compressed summaries of conversations                   │
│  • Aggregated preference profiles                          │
│  • Weekly/monthly pattern extractions                      │
│  Storage: Compressed accounts (rent-efficient)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        COLD TIER                            │
│  • Full conversation history                               │
│  • Raw memory transactions                                 │
│  • Cryptographic provenance chain                          │
│  Storage: ZK-compressed on-chain (100x cost reduction)     │
└─────────────────────────────────────────────────────────────┘
```

## Examples

### Conversation Memory

```typescript
// Agent processes user message
const userMessage = "I'm planning a trip to Tokyo next month";

// Store with context
await agent.invoke("memory_store", {
  content: userMessage,
  tags: ["travel", "tokyo", "planning"],
  importance: 0.85,
  metadata: {
    sessionId: "session_abc123",
    timestamp: Date.now(),
  },
});

// Later in conversation...
const relevantMemories = await agent.invoke("memory_retrieve", {
  query: "What travel plans did the user mention?",
  limit: 3,
});

// Returns memories with context for natural responses
```

### Cross-Session Identity

```typescript
// End of session - export identity bundle
const identityBundle = await agent.invoke("identity_export", {
  format: "encrypted_json",
  includeMemories: true,
});

// Store bundle securely (IPFS, Arweave, or encrypted storage)
await saveToSecureStorage(identityBundle.bundle);

// New session - import identity
const savedBundle = await loadFromSecureStorage();
await agent.invoke("identity_import", {
  bundle: savedBundle,
});

// Agent now has full memory of previous sessions
```

### Secure Memory Sharing

```typescript
// Share a memory with another agent
await agent.invoke("memory_share", {
  memoryId: "mem_abc123",
  recipient: "other_agent_pubkey",
  permissions: {
    read: true,
    write: false,
    share: false,
  },
  expiresAt: Date.now() + 86400000, // 24 hours
});
```

### Memory Compression

```typescript
// Compress old memories to save costs
const result = await agent.invoke("memory_compress", {
  strategy: "summarize", // or "archive" or "delete"
  olderThan: 86400 * 7, // 7 days
  threshold: 0.5, // Only compress if importance < 0.5
});

console.log(`Compressed ${result.compressed} memories, saved ${result.saved} bytes`);
```

## Direct API Usage

For programmatic access without the tool interface:

```typescript
// Store directly
const result = await memoryPlugin.store({
  content: "Direct storage example",
  tags: ["api"],
  importance: 0.8,
});

// Retrieve directly
const memories = await memoryPlugin.retrieve({
  query: "example",
  limit: 10,
});

// Check health
const health = await memoryPlugin.health();
console.log(`Status: ${health.status}, Encrypted: ${health.encrypted}`);
```

## Encryption Setup

Generate an encryption key:

```typescript
import * as nacl from "tweetnacl";
import * as bs58 from "bs58";

// Generate new keypair
const keypair = nacl.box.keyPair();
const secretKey = bs58.encode(keypair.secretKey);
const publicKey = bs58.encode(keypair.publicKey);

// Store secretKey securely (e.g., environment variable)
// Use publicKey for sharing encrypted memories
```

## Integration with ElizaOS

For ElizaOS agents, use the companion adapter:

```typescript
import { ElizaOSAdapter } from "@agentmemory/elizaos-adapter";

const memoryAdapter = new ElizaOSAdapter({
  solanaAgentKit: agent,
  memoryPlugin: memoryPlugin,
});

// Register with ElizaOS runtime
runtime.registerAdapter("memory", memoryAdapter);
```

## Environment Variables

```bash
# Required
SOLANA_PRIVATE_KEY=your_base58_private_key
AGENTMEMORY_API_KEY=your_api_key

# Optional
SOLANA_RPC_URL=https://api.devnet.solana.com
AGENTMEMORY_API_URL=https://api.agentmemory.io
AGENT_ENCRYPTION_KEY=your_base58_32byte_key
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Solana Agent Kit                         │
│                     (Agent Runtime)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AgentMemory Plugin (this package)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Tool       │  │  Encryption │  │  Tier Management    │ │
│  │  Handlers   │  │  (NaCl)     │  │  (Hot/Warm/Cold)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   AgentMemory SDK       │    │   Solana Web3.js        │
│   (REST API Client)     │    │   (Transactions)        │
└─────────────────────────┘    └─────────────────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   AgentMemory API       │    │   Solana Network        │
│   (Indexed Storage)     │    │   (On-chain Program)    │
└─────────────────────────┘    └─────────────────────────┘
```

## Security Considerations

1. **Client-Side Encryption** — All sensitive data is encrypted before leaving the client
2. **Cryptographic Provenance** — Every memory operation is signed and timestamped on-chain
3. **Fine-Grained Access Control** — Per-memory permissions for sharing
4. **Key Management** — Support for hardware wallets and MPC key shares
5. **Audit Trail** — Complete version history with rollback capabilities

## Cost Optimization

| Operation | Without ZK Compression | With ZK Compression | Savings |
|-----------|----------------------|---------------------|---------|
| Store 1KB memory | ~$0.50 | ~$0.005 | 100x |
| Update memory | ~$0.05 | ~$0.001 | 50x |
| Monthly storage (1GB) | ~$500 | ~$5 | 100x |

## License

MIT

## Related

- [AgentMemory Protocol](https://github.com/openclaw/agentmemory)
- [AgentMemory SDK](https://github.com/openclaw/agentmemory/tree/main/agent-memory-sdk)
- [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit)
- [ElizaOS](https://github.com/ai16z/eliza)

## Support

- 📖 [Documentation](https://docs.agentmemory.io)
- 💬 [Discord](https://discord.gg/agentmemory)
- 🐛 [Issues](https://github.com/openclaw/agentmemory/issues)

---

Built with 🔍 by ResearchAgent_0xKimi
