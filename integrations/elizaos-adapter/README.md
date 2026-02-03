# AgentMemory Adapter for ElizaOS

[![npm version](https://img.shields.io/npm/v/@agent-memory/elizaos-adapter.svg)](https://www.npmjs.com/package/@agent-memory/elizaos-adapter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready database adapter for [ElizaOS](https://elizaos.ai) that provides persistent memory storage using the **AgentMemory** protocol on **Solana blockchain**.

## 🚀 Features

- **Blockchain-Backed Storage** - All memories persist on Solana for permanent, censorship-resistant storage
- **ElizaOS Native** - Full implementation of `IDatabaseAdapter` interface
- **Local LRU Cache** - High-performance caching with configurable TTL
- **Vector Search** - Semantic memory search with embedding support
- **Multi-Agent Ready** - Share memory across multiple agents
- **TypeScript First** - Fully typed with excellent IDE support

## 📦 Installation

```bash
npm install @agent-memory/elizaos-adapter
# or
yarn add @agent-memory/elizaos-adapter
# or
pnpm add @agent-memory/elizaos-adapter
```

## 🔧 Quick Start

```typescript
import { AgentRuntime } from "@elizaos/core";
import { AgentMemoryAdapter } from "@agent-memory/elizaos-adapter";

// Create adapter instance
const adapter = new AgentMemoryAdapter({
  solanaEndpoint: "https://api.devnet.solana.com",
  walletPrivateKey: process.env.SOLANA_PRIVATE_KEY, // Optional
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  debug: true,
  embeddingDimension: 384,
});

// Initialize
await adapter.init();

// Create ElizaOS runtime
const runtime = new AgentRuntime({
  character: {
    name: "MyAgent",
    bio: ["A helpful AI assistant"],
    system: "You are a helpful assistant.",
  },
  databaseAdapter: adapter,
});

// Use normally - memories persist on Solana!
```

## 📋 Supported Operations

### Memory Management
- ✅ `createMemory()` - Store with embedding support
- ✅ `getMemoryById()` - Retrieve by ID
- ✅ `getMemories()` - List with filtering
- ✅ `getMemoriesByIds()` - Batch retrieval
- ✅ `searchMemories()` - Vector similarity search
- ✅ `removeMemory()` - Delete memory
- ✅ `countMemories()` - Count with filters

### Account & Identity
- ✅ `createAccount()` - User registration
- ✅ `getAccountById()` - Profile retrieval

### Rooms & Participants
- ✅ `createRoom()` - Conversation spaces
- ✅ `addParticipant()` / `removeParticipant()`
- ✅ `getParticipantsForRoom()`

### Goals & Tasks
- ✅ `createGoal()` - Task creation
- ✅ `getGoals()` - List with status filter
- ✅ `updateGoal()` / `updateGoalStatus()`

### Knowledge (RAG)
- ✅ `createKnowledge()` - Document storage
- ✅ `searchKnowledge()` - Semantic search
- ✅ `getKnowledge()` - Retrieve documents

### Cache
- ✅ `getCache()` / `setCache()` / `deleteCache()`

## ⚙️ Configuration Options

```typescript
interface AgentMemoryAdapterConfig {
  /** Solana RPC endpoint (default: devnet) */
  solanaEndpoint?: string;
  
  /** Wallet private key for transactions */
  walletPrivateKey?: string;
  
  /** Cache TTL in milliseconds (default: 300000) */
  cacheTTL?: number;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Embedding vector size (default: 384) */
  embeddingDimension?: number;
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ElizaOS Runtime                          │
│                    (Agent, Memory, Goals)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 AgentMemoryAdapter                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Local Cache │  │  Memory     │  │  Account Manager    │  │
│  │  (LRU)      │  │  Manager    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   AgentMemory SDK                            │
│         (Solana Program Interface)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Solana Blockchain                         │
│    (Permanent, Decentralized, Censorship-Resistant)         │
└─────────────────────────────────────────────────────────────┘
```

## 📚 Examples

### Basic Agent

```typescript
import { AgentMemoryAdapter } from "@agent-memory/elizaos-adapter";

const adapter = new AgentMemoryAdapter({ debug: true });
await adapter.init();

// Store memory
await adapter.createMemory({
  id: "mem-1",
  entityId: "user-1",
  agentId: "agent-1",
  roomId: "room-1",
  content: { text: "Hello world!" },
  createdAt: Date.now(),
}, "messages");

// Retrieve
const memories = await adapter.getMemories({
  roomId: "room-1",
  tableName: "messages",
  agentId: "agent-1",
  count: 10,
});
```

### Multi-Agent System

```typescript
// Share adapter across agents
const sharedAdapter = new AgentMemoryAdapter();
await sharedAdapter.init();

const researcher = new AgentRuntime({ 
  character: researcherChar, 
  databaseAdapter: sharedAdapter 
});

const writer = new AgentRuntime({ 
  character: writerChar, 
  databaseAdapter: sharedAdapter 
});

// Both agents share the same memory!
```

### Vector Search

```typescript
// Search with embedding
const results = await adapter.searchMemories({
  tableName: "memories",
  roomId: "room-1",
  embedding: [0.1, 0.2, ...], // 384-dim vector
  match_threshold: 0.85,
  match_count: 5,
  unique: true,
});
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run examples
npx tsx examples/basic-agent.ts
npx tsx examples/multi-agent.ts
```

## 🔗 Dependencies

- `@elizaos/core` - ElizaOS runtime
- `agent-memory` - Solana storage SDK
- `uuid` - ID generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT © AgentMemory Team

## 🔗 Links

- [ElizaOS Documentation](https://docs.elizaos.ai)
- [AgentMemory Protocol](https://github.com/agent-memory/agent-memory)
- [Solana Documentation](https://docs.solana.com)

---

<p align="center">
  Built with ❤️ for the ElizaOS ecosystem
</p>
