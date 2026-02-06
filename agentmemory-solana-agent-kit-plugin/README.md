# @agentmemory/solana-agent-kit-plugin

AgentMemory Protocol plugin for [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit) — enabling persistent, encrypted, on-chain memory for AI agents on Solana.

## Overview

This plugin integrates the AgentMemory Protocol with Solana Agent Kit v2, allowing AI agents to:

- **Store memories** on-chain with cryptographic provenance
- **Retrieve memories** with semantic search capabilities  
- **Encrypt sensitive data** using agent-specific keys
- **Maintain identity** across sessions and model switches
- **Share memories** securely with other agents (opt-in)

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
  rpcUrl: process.env.SOLANA_RPC_URL,
});

// Initialize AgentMemory Plugin
const memoryPlugin = new AgentMemoryPlugin({
  programId: "Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq",
  encryptionKey: process.env.AGENT_ENCRYPTION_KEY, // Optional: for E2E encryption
  defaultTTL: 86400 * 30, // 30 days default memory lifetime
});

// Register plugin
await agent.use(memoryPlugin);

// Store a memory
const memoryId = await agent.memory.store({
  content: "User prefers detailed technical explanations",
  tags: ["preferences", "communication_style"],
  importance: 0.9,
});

// Retrieve relevant memories
const memories = await agent.memory.retrieve({
  query: "How should I explain things to the user?",
  limit: 5,
});

// Update memory with new context
await agent.memory.update(memoryId, {
  content: "User prefers detailed technical explanations with examples",
  importance: 0.95,
});
```

## Configuration Options

```typescript
interface AgentMemoryConfig {
  /** AgentMemory program ID on Solana */
  programId: string;
  
  /** Optional encryption key for E2E encryption */
  encryptionKey?: string;
  
  /** Default time-to-live for memories (seconds) */
  defaultTTL?: number;
  
  /** Hot/Warm/Cold tier configuration */
  tierConfig?: {
    hot: { maxSize: number; ttl: number };    // Recent, frequently accessed
    warm: { maxSize: number; ttl: number };   // Compressed summaries
    cold: { ttl: number };                     // Archive on-chain
  };
  
  /** Enable memory sharing with other agents */
  allowSharing?: boolean;
  
  /** Agents allowed to access shared memories */
  trustedAgents?: string[];
}
```

## Available Tools

### Memory Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `memory_store` | Store new memory | `content`, `tags`, `importance`, `ttl` |
| `memory_retrieve` | Search memories | `query`, `limit`, `tags`, `timeRange` |
| `memory_update` | Update existing memory | `memoryId`, `content`, `importance` |
| `memory_delete` | Remove memory | `memoryId`, `permanent` |
| `memory_compress` | Compress old memories | `threshold`, `strategy` |
| `memory_share` | Share with other agent | `memoryId`, `recipient`, `permissions` |

### Identity Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `identity_export` | Export agent identity bundle | `format` |
| `identity_import` | Import identity from bundle | `bundle`, `verificationKey` |
| `identity_verify` | Verify agent identity | `agentId`, `challenge` |

## Hot/Warm/Cold Architecture

AgentMemory implements a three-tier storage system:

```
┌─────────────────────────────────────────────────────────────┐
│                         HOT TIER                            │
│  • Recent conversations (last 24h)                         │
│  • High-importance memories (importance > 0.8)             │
│  • Frequently accessed (last 1h)                           │
│  Storage: Agent local state                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        WARM TIER                            │
│  • Compressed summaries of conversations                   │
│  • Aggregated preference profiles                          │
│  • Weekly/monthly pattern extractions                      │
│  Storage: Solana compressed accounts (rent-efficient)      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        COLD TIER                            │
│  • Full conversation history                               │
│  • Raw memory transactions                                 │
│  • Cryptographic provenance chain                          │
│  Storage: Solana mainnet with compression                  │
└─────────────────────────────────────────────────────────────┘
```

## Example: Conversation Memory

```typescript
// Agent processes user message
const userMessage = "I'm planning a trip to Tokyo next month";

// Store with context
await agent.memory.store({
  content: userMessage,
  tags: ["travel", "tokyo", "planning"],
  importance: 0.85,
  context: {
    sessionId: "session_abc123",
    timestamp: Date.now(),
    userId: "user_xyz789",
  },
});

// Later in conversation...
const relevantMemories = await agent.memory.retrieve({
  query: "What travel plans did the user mention?",
  limit: 3,
});

// Returns: [{ content: "I'm planning a trip to Tokyo next month", ... }]
// Agent can now respond with context
```

## Example: Cross-Session Identity

```typescript
// End of session - export identity bundle
const identityBundle = await agent.memory.identity.export({
  format: "encrypted_json",
});

// Store bundle securely (IPFS, Arweave, or encrypted storage)
await saveToSecureStorage(identityBundle);

// New session - import identity
const savedBundle = await loadFromSecureStorage();
await agent.memory.identity.import({
  bundle: savedBundle,
  verificationKey: process.env.AGENT_VERIFICATION_KEY,
});

// Agent now has full memory of previous sessions
```

## Security Considerations

1. **Encryption**: All sensitive data is encrypted client-side before on-chain storage
2. **Provenance**: Every memory operation is signed and timestamped on-chain
3. **Access Control**: Fine-grained permissions for memory sharing
4. **Key Management**: Support for hardware wallets and MPC key shares

## Integration with ElizaOS

For ElizaOS agents, use the companion adapter:

```typescript
import { ElizaOSAdapter } from "@agentmemory/elizaos-adapter";

const memoryAdapter = new ElizaOSAdapter({
  solanaAgentKit: agent,
  memoryPlugin: memoryPlugin,
});

// Use with ElizaOS runtime
runtime.registerAdapter("memory", memoryAdapter);
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

## License

MIT

## Related

- [AgentMemory Protocol](https://github.com/openclaw/agentmemory)
- [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit)
- [ElizaOS](https://github.com/ai16z/eliza)