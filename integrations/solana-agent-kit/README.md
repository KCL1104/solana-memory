# @solana-agent-kit/plugin-memory

A memory management plugin for Solana Agent Kit that enables AI agents to store, retrieve, and manage memories on the Solana blockchain.

[![npm version](https://badge.fury.io/js/@solana-agent-kit%2Fplugin-memory.svg)](https://badge.fury.io/js/@solana-agent-kit%2Fplugin-memory)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔗 **On-Chain Storage**: Store memories using Solana's Memo program for transparency and permanence
- 🏷️ **Tagging System**: Organize memories with customizable tags
- ⭐ **Priority Levels**: Assign importance levels (1-10) to memories
- ⏰ **Expiration**: Set optional expiration dates for temporary memories
- 🔍 **Full-Text Search**: Search through memory content
- 📊 **Statistics**: Monitor memory usage and storage metrics
- 🧹 **Auto-Cleanup**: Remove expired memories automatically

## Installation

```bash
npm install @solana-agent-kit/plugin-memory
```

### Peer Dependencies

```bash
npm install solana-agent-kit @solana/web3.js zod
```

## Quick Start

```typescript
import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
import MemoryPlugin from "@solana-agent-kit/plugin-memory";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// Initialize wallet
const keyPair = Keypair.fromSecretKey(bs58.decode("YOUR_SECRET_KEY"));
const wallet = new KeypairWallet(keyPair);

// Create agent with memory plugin
const agent = new SolanaAgentKit(
  wallet,
  "https://api.mainnet-beta.solana.com",
  {
    OPENAI_API_KEY: "YOUR_OPENAI_API_KEY",
  }
).use(MemoryPlugin);

// Store a memory
const result = await agent.methods.storeMemory(agent, {
  content: "User prefers USDC over USDT for all transactions",
  tags: ["preferences", "trading"],
  priority: 8,
  useMemoProgram: true,
});

console.log("Memory stored:", result.memory?.id);
console.log("Transaction:", result.signature);
```

## Usage Examples

### Store a Memory

```typescript
// Simple memory
await agent.methods.storeMemory(agent, {
  content: "User is based in Hong Kong",
  tags: ["location"],
});

// High priority memory with expiration
await agent.methods.storeMemory(agent, {
  content: "Limited time offer: 50% off trading fees",
  tags: ["promotion", "trading"],
  priority: 9,
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  useMemoProgram: true,
});
```

### Retrieve Memories

```typescript
// Get all memories
const allMemories = await agent.methods.retrieveMemories(agent, {
  limit: 10,
});

// Filter by tag
const preferences = await agent.methods.retrieveMemories(agent, {
  tag: "preferences",
  limit: 5,
});

// High priority only
const important = await agent.methods.retrieveMemories(agent, {
  minPriority: 8,
});
```

### Search Memories

```typescript
const results = await agent.methods.searchMemories(agent, "USDC", {
  tags: ["trading"],
  priorityMin: 5,
});
```

### Update a Memory

```typescript
await agent.methods.updateMemory(agent, {
  id: "mem_1234567890_abc123",
  content: "Updated information",
  priority: 10,
  tags: ["preferences", "updated"],
});
```

### Delete a Memory

```typescript
await agent.methods.deleteMemory(agent, "mem_1234567890_abc123");
```

### Get Statistics

```typescript
const stats = await agent.methods.getMemoryStats(agent);
console.log(stats);
// {
//   status: "success",
//   stats: {
//     totalMemories: 42,
//     totalSize: "15.2 KB",
//     byTag: { preferences: 5, transactions: 20 },
//     expiredCount: 3
//   }
// }
```

### Cleanup Expired Memories

```typescript
const cleanup = await agent.methods.cleanupExpiredMemories(agent);
console.log(`Removed ${cleanup.deletedCount} expired memories`);
```

## AI Actions

This plugin provides the following actions for AI frameworks:

| Action | Similes | Description |
|--------|---------|-------------|
| `STORE_MEMORY_ACTION` | save, remember, store | Store a new memory |
| `RETRIEVE_MEMORY_ACTION` | get, recall, fetch | Retrieve stored memories |
| `UPDATE_MEMORY_ACTION` | update, modify, edit | Update existing memory |
| `DELETE_MEMORY_ACTION` | delete, remove, forget | Delete a memory |
| `SEARCH_MEMORY_ACTION` | search, find, query | Search memory content |
| `MEMORY_STATS_ACTION` | stats, info, summary | Get memory statistics |
| `CLEANUP_MEMORY_ACTION` | cleanup, purge, clear | Remove expired memories |

### Using with Vercel AI SDK

```typescript
import { createVercelAITools } from "solana-agent-kit";

const tools = createVercelAITools(agent, agent.actions);
// AI can now use memory actions
```

### Using with LangChain

```typescript
import { createLangchainTools } from "solana-agent-kit";

const tools = createLangchainTools(agent, agent.actions);
// Use with LangChain agents
```

## Configuration

### MemoryEntry Structure

```typescript
interface MemoryEntry {
  id: string;              // Unique identifier
  content: string;         // Memory content (max 1000 chars for memo)
  timestamp: number;       // Creation time (Unix ms)
  tags: string[];          // Organization tags
  priority: number;        // 1-10 importance level
  expiresAt?: number;      // Optional expiration
}
```

### Storage Options

```typescript
interface StoreMemoryOptions {
  content: string;                    // Required: memory content
  tags?: string[];                    // Optional: categorization tags
  priority?: number;                  // Optional: 1-10 (default: 5)
  expiresAt?: number;                 // Optional: expiration timestamp
  useMemoProgram?: boolean;           // Optional: use on-chain memo
}
```

## Architecture

### Storage Methods

1. **Memo Program** (default for small memories < 500 bytes)
   - Uses Solana's native Memo program
   - Fully on-chain and transparent
   - Costs ~0.000005 SOL per memo
   - Permanent storage

2. **Account Storage** (for larger memories - future implementation)
   - Dedicated storage accounts
   - Supports larger data sizes
   - Requires custom program deployment

### Memory Lifecycle

```
Create → Store → Retrieve → [Update] → [Delete]
                ↓
            [Expire] → Cleanup
```

## API Reference

### Methods

#### `storeMemory(agent, options)`
Store a new memory on Solana.

**Returns:** `Promise<MemoryResponse>`

#### `retrieveMemories(agent, options?)`
Retrieve memories with optional filtering.

**Returns:** `Promise<MemoryResponse>`

#### `updateMemory(agent, options)`
Update an existing memory by ID.

**Returns:** `Promise<MemoryResponse>`

#### `deleteMemory(agent, memoryId)`
Delete a memory by ID.

**Returns:** `Promise<MemoryResponse>`

#### `searchMemories(agent, query, filter?)`
Search memories by content.

**Returns:** `Promise<MemoryResponse>`

#### `getMemoryStats(agent)`
Get memory statistics.

**Returns:** `Promise<MemoryResponse>`

#### `cleanupExpiredMemories(agent)`
Remove all expired memories.

**Returns:** `Promise<MemoryResponse>`

#### `exportMemories(agent, filter?)`
Export all memories to JSON string.

**Returns:** `Promise<string>`

#### `importMemories(agent, jsonData)`
Import memories from JSON string.

**Returns:** `Promise<MemoryResponse>`

## Limitations

- **Memo Program**: Limited to ~500 bytes per memory
- **Indexing**: Full retrieval/search requires external indexing (marked as TODO)
- **Privacy**: Memo program data is public on-chain

## Future Enhancements

- [ ] Dedicated storage program for larger memories
- [ ] Encryption support for sensitive data
- [ ] Integration with IPFS for large content
- [ ] Memory compression
- [ ] Cross-agent memory sharing
- [ ] Memory versioning

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 🐦 Twitter: [@example](https://twitter.com/example)

---

Built with ❤️ for the Solana ecosystem
