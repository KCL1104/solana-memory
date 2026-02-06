# Solana Agent Kit Plugin for AgentMemory

Official plugin enabling AI agents using Solana Agent Kit to persist memory on-chain via the AgentMemory Protocol.

## Overview

This plugin provides seamless integration between Solana Agent Kit and AgentMemory Protocol, allowing AI agents to:
- Store encrypted memories on Solana
- Retrieve memories with cryptographic provenance
- Manage identity across sessions
- Share memories with other agents (optional)

## Installation

```bash
npm install @agentmemory/solana-agent-kit-plugin
```

## Quick Start

```typescript
import { SolanaAgentKit } from "solana-agent-kit";
import { AgentMemoryPlugin } from "@agentmemory/solana-agent-kit-plugin";

// Initialize Solana Agent Kit
const agentKit = new SolanaAgentKit({
  privateKey: process.env.SOLANA_PRIVATE_KEY,
  rpcUrl: process.env.SOLANA_RPC_URL,
  // ... other config
});

// Add AgentMemory plugin
const memoryPlugin = new AgentMemoryPlugin({
  programId: "AGMEM...", // AgentMemory program ID
  encryptionKey: process.env.MEMORY_ENCRYPTION_KEY,
  defaultExpiryDays: 30,
});

agentKit.use(memoryPlugin);

// Store a memory
await memoryPlugin.storeMemory({
  content: "User prefers concise responses about technical topics",
  tags: ["preference", "user-profile"],
  priority: "high",
});

// Retrieve memories
const memories = await memoryPlugin.retrieveMemories({
  tags: ["preference"],
  limit: 10,
});
```

## API Reference

### `AgentMemoryPlugin`

#### Constructor Options

```typescript
interface AgentMemoryPluginConfig {
  programId: string;           // AgentMemory protocol program ID
  encryptionKey?: string;      // Optional: encryption key derivation seed
  defaultExpiryDays?: number;  // Default memory expiration (default: 30)
  cluster?: "mainnet-beta" | "devnet" | "testnet" | "localnet";
  rpcUrl?: string;             // Override RPC endpoint
  confirmOptions?: ConfirmOptions; // Transaction confirmation options
}
```

#### Methods

##### `storeMemory(options: StoreMemoryOptions): Promise<MemoryEntry>`

Store encrypted memory on-chain.

```typescript
interface StoreMemoryOptions {
  content: string;             // Content to store (encrypted before on-chain)
  tags?: string[];             // Searchable tags
  priority?: "low" | "medium" | "high" | "critical";
  expiresAt?: Date;            // Optional expiration
  metadata?: Record<string, any>; // Additional metadata
}

interface MemoryEntry {
  id: string;                  // Unique memory identifier
  contentHash: string;         // SHA-256 hash (verification)
  createdAt: Date;
  expiresAt?: Date;
  tags: string[];
  provenance: ProvenanceEntry[];
}
```

##### `retrieveMemories(options: RetrieveOptions): Promise<MemoryEntry[]>`

Retrieve memories matching criteria.

```typescript
interface RetrieveOptions {
  tags?: string[];             // Filter by tags
  query?: string;              // Semantic search query (requires indexer)
  limit?: number;              // Max results (default: 10)
  before?: Date;               // Time filter
  after?: Date;
  includeExpired?: boolean;    // Include decayed memories
}
```

##### `updateMemory(id: string, options: UpdateOptions): Promise<MemoryEntry>`

Update existing memory.

```typescript
interface UpdateOptions {
  content?: string;            // New content
  tags?: string[];             // Replace tags
  priority?: "low" | "medium" | "high" | "critical";
  expiresAt?: Date;
}
```

##### `deleteMemory(id: string): Promise<void>`

Permanently remove a memory.

##### `getAgentIdentity(): Promise<AgentIdentity>`

Get or create agent identity on-chain.

```typescript
interface AgentIdentity {
  agentId: string;
  pubkey: string;
  registeredAt: Date;
  lastActive: Date;
  memoryCount: number;
}
```

##### `shareMemory(id: string, recipientAgentId: string, options?: ShareOptions): Promise<void>`

Share memory with another agent.

```typescript
interface ShareOptions {
  accessLevel: "read" | "write";
  expiresAt?: Date;
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent (ElizaOS / Custom)               │
├─────────────────────────────────────────────────────────────┤
│                 Solana Agent Kit Core                        │
├─────────────────────────────────────────────────────────────┤
│              AgentMemory Plugin (this package)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Encryption │  │   Memory    │  │  Identity Manager   │  │
│  │   Module    │  │   Manager   │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│              AgentMemory Protocol (Solana)                   │
│         ┌──────────────────────────────────────┐             │
│         │  Memory Store | Ownership | Governance │             │
│         └──────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core Plugin Structure | 🚧 In Progress | Base class and interfaces |
| Encryption Module | ⏳ Pending | AES-256-GCM implementation |
| Memory Store Client | ⏳ Pending | Anchor IDL integration |
| Identity Management | ⏳ Pending | Agent registration |
| Tag Indexing | ⏳ Pending | Off-chain indexer optional |
| Semantic Search | ⏳ Pending | Vector DB integration |
| Tests | ⏳ Pending | Unit + integration |

## Development

```bash
# Clone and setup
git clone https://github.com/agentmemory/solana-agent-kit-plugin
cd solana-agent-kit-plugin
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## Security Considerations

1. **Encryption Keys:** Never commit encryption keys. Use environment variables or secure key management.
2. **RPC Security:** Use private RPC endpoints for production (Helius, QuickNode, etc.).
3. **Transaction Signing:** Plugin never exposes private keys; uses Solana Agent Kit's signer.
4. **Memory Content:** Sensitive data is encrypted client-side before on-chain storage.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT

---

**Maintained by:** AgentMemory Protocol Team  
**Support:** [Discord](https://discord.gg/agentmemory) | [GitHub Issues](https://github.com/agentmemory/solana-agent-kit-plugin/issues)
