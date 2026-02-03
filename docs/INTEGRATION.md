# AgentMemory Integration Guides

> **Connect AgentMemory with your favorite AI frameworks and tools**

This guide covers integrating AgentMemory with various AI frameworks, platforms, and use cases.

---

## 📋 Table of Contents

- [Quick Integration](#quick-integration)
- [ElizaOS](#elizaos)
- [Solana Agent Kit](#solana-agent-kit)
- [Vercel AI SDK](#vercel-ai-sdk)
- [LangChain](#langchain)
- [Custom Integration](#custom-integration)
- [Multi-Agent Systems](#multi-agent-systems)
- [Best Practices](#best-practices)

---

## 🚀 Quick Integration

### Installation

```bash
# Core SDK
npm install agent-memory-sdk

# For ElizaOS
npm install @agent-memory/elizaos-adapter

# For Solana Agent Kit
npm install @solana-agent-kit/plugin-memory
```

### Basic Setup

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { AgentMemoryClient } from 'agent-memory-sdk';

// Initialize
const connection = new Connection('https://api.devnet.solana.com');
const client = new AgentMemoryClient(connection, wallet);

// Create vault
const vault = await client.initializeVault(agentPublicKey);
```

---

## 🤖 ElizaOS

The ElizaOS adapter provides a complete `IDatabaseAdapter` implementation for ElizaOS agents.

### Installation

```bash
npm install @agent-memory/elizaos-adapter
```

### Basic Usage

```typescript
import { AgentRuntime } from "@elizaos/core";
import { AgentMemoryAdapter } from "@agent-memory/elizaos-adapter";

// Create adapter
const adapter = new AgentMemoryAdapter({
  solanaEndpoint: "https://api.devnet.solana.com",
  walletPrivateKey: process.env.SOLANA_PRIVATE_KEY,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  debug: true,
});

// Initialize
await adapter.init();

// Create runtime
const runtime = new AgentRuntime({
  character: {
    name: "MyAgent",
    bio: ["A helpful AI assistant with persistent memory"],
    system: "You are a helpful assistant.",
  },
  databaseAdapter: adapter,
  modelProvider: "openai",
});
```

### Memory Operations

```typescript
// Store memory with embedding
await adapter.createMemory({
  id: crypto.randomUUID(),
  entityId: "user-123",
  agentId: "agent-1",
  roomId: "room-1",
  content: { 
    text: "User prefers dark mode",
    metadata: { category: "preferences" }
  },
  embedding: [0.1, 0.2, 0.3, ...], // 384-dim vector
  createdAt: Date.now(),
}, "messages");

// Search memories
const results = await adapter.searchMemories({
  tableName: "messages",
  roomId: "room-1",
  embedding: queryEmbedding,
  match_threshold: 0.85,
  match_count: 5,
});

// Retrieve by ID
const memory = await adapter.getMemoryById("memory-id");

// Count memories
const count = await adapter.countMemories("room-1", false, "messages");
```

### Advanced Configuration

```typescript
const adapter = new AgentMemoryAdapter({
  solanaEndpoint: process.env.SOLANA_RPC_URL,
  walletPrivateKey: process.env.SOLANA_PRIVATE_KEY,
  cacheTTL: 5 * 60 * 1000,
  debug: process.env.NODE_ENV === 'development',
  embeddingDimension: 384,
  
  // Custom encryption
  encryption: {
    enabled: true,
    algorithm: 'chacha20-poly1305',
    keyRotation: true,
  },
  
  // Batch settings
  batchSize: 50,
  batchTimeout: 5000,
});
```

### Multi-Agent Setup

```typescript
// Shared adapter for multiple agents
const sharedAdapter = new AgentMemoryAdapter(config);
await sharedAdapter.init();

const researcher = new AgentRuntime({
  character: researcherChar,
  databaseAdapter: sharedAdapter,
});

const writer = new AgentRuntime({
  character: writerChar,
  databaseAdapter: sharedAdapter,
});

// Both agents share memories!
```

---

## 🔗 Solana Agent Kit

The Solana Agent Kit plugin provides memory capabilities for agents built with the Solana Agent Kit.

### Installation

```bash
npm install @solana-agent-kit/plugin-memory
```

### Basic Setup

```typescript
import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
import MemoryPlugin from "@solana-agent-kit/plugin-memory";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// Initialize wallet
const keyPair = Keypair.fromSecretKey(
  bs58.decode(process.env.SOLANA_PRIVATE_KEY)
);
const wallet = new KeypairWallet(keyPair);

// Create agent with memory plugin
const agent = new SolanaAgentKit(
  wallet,
  "https://api.devnet.solana.com",
  { OPENAI_API_KEY: process.env.OPENAI_API_KEY }
).use(MemoryPlugin);
```

### Store Memory

```typescript
// Simple memory
await agent.methods.storeMemory(agent, {
  content: "User prefers USDC over USDT",
  tags: ["preferences", "trading"],
  priority: 8,
});

// With expiration
await agent.methods.storeMemory(agent, {
  content: "Limited time offer active",
  tags: ["promotion"],
  priority: 9,
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
});

// On-chain memo
await agent.methods.storeMemory(agent, {
  content: "Important transaction record",
  tags: ["transaction"],
  priority: 10,
  useMemoProgram: true,
});
```

### Retrieve & Search

```typescript
// Get all memories
const all = await agent.methods.retrieveMemories(agent, { limit: 10 });

// Filter by tag
const prefs = await agent.methods.retrieveMemories(agent, {
  tag: "preferences",
  limit: 5,
});

// Search by content
const results = await agent.methods.searchMemories(agent, "USDC", {
  tags: ["trading"],
  priorityMin: 5,
});

// Get statistics
const stats = await agent.methods.getMemoryStats(agent);
console.log(`Total memories: ${stats.stats.totalMemories}`);
```

### AI Actions

The plugin provides actions that AI frameworks can use:

```typescript
// AI can use these actions naturally
const actions = [
  'STORE_MEMORY_ACTION',      // "save", "remember", "store"
  'RETRIEVE_MEMORY_ACTION',   // "get", "recall", "fetch"
  'UPDATE_MEMORY_ACTION',     // "update", "modify"
  'DELETE_MEMORY_ACTION',     // "delete", "remove", "forget"
  'SEARCH_MEMORY_ACTION',     // "search", "find"
  'MEMORY_STATS_ACTION',      // "stats", "summary"
  'CLEANUP_MEMORY_ACTION',    // "cleanup", "purge"
];

// Example AI interactions:
// User: "Remember that I like dark mode"
// AI: Uses STORE_MEMORY_ACTION

// User: "What were my trading preferences?"
// AI: Uses SEARCH_MEMORY_ACTION with "trading" tag
```

---

## ▲ Vercel AI SDK

Integrate AgentMemory with the Vercel AI SDK for streaming AI responses with persistent memory.

### Installation

```bash
npm install ai agent-memory-sdk
```

### Setup

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText, createDataStreamResponse } from 'ai';
import { AgentMemoryClient } from 'agent-memory-sdk';

const client = new AgentMemoryClient(connection, wallet);

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();
  
  // Load conversation history
  const history = await loadConversationHistory(sessionId);
  
  // Combine with new messages
  const allMessages = [...history, ...messages];
  
  const result = streamText({
    model: openai('gpt-4'),
    messages: allMessages,
    onFinish: async ({ text }) => {
      // Store the conversation
      await storeConversation(sessionId, messages, text);
    },
  });

  return result.toDataStreamResponse();
}

async function loadConversationHistory(sessionId: string) {
  const vault = await getVault(sessionId);
  const memories = await client.getMemories(vault, {
    category: 'conversations',
    tags: ['conversation', sessionId],
    limit: 20,
  });
  
  return memories.map(m => ({
    role: m.content.role,
    content: m.content.message,
  }));
}

async function storeConversation(sessionId: string, messages: any[], response: string) {
  const vault = await getVault(sessionId);
  
  // Store user message
  await client.storeMemory(vault, {
    content: JSON.stringify({
      role: 'user',
      message: messages[messages.length - 1].content,
      timestamp: Date.now(),
    }),
    category: 'conversations',
    tags: ['conversation', sessionId],
  });
  
  // Store AI response
  await client.storeMemory(vault, {
    content: JSON.stringify({
      role: 'assistant',
      message: response,
      timestamp: Date.now(),
    }),
    category: 'conversations',
    tags: ['conversation', sessionId],
  });
}
```

### With Tools

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const storePreferenceTool = tool({
  description: 'Store a user preference',
  parameters: z.object({
    key: z.string(),
    value: z.string(),
  }),
  execute: async ({ key, value }) => {
    const vault = await getCurrentUserVault();
    await client.storeMemory(vault, {
      content: JSON.stringify({ key, value }),
      category: 'preferences',
      tags: ['preference', key],
      importance: 80,
    });
    return `Stored preference: ${key} = ${value}`;
  },
});

const result = streamText({
  model: openai('gpt-4'),
  messages,
  tools: {
    storePreference: storePreferenceTool,
    getPreference: getPreferenceTool,
    searchMemories: searchMemoriesTool,
  },
});
```

---

## 🦜 LangChain

Integrate AgentMemory with LangChain for agent workflows with persistent memory.

### Installation

```bash
npm install langchain agent-memory-sdk
```

### Memory Integration

```typescript
import { BufferMemory } from 'langchain/memory';
import { AgentMemoryClient } from 'agent-memory-sdk';

class AgentMemory extends BufferMemory {
  private client: AgentMemoryClient;
  private vault: PublicKey;
  private sessionId: string;

  constructor(client: AgentMemoryClient, vault: PublicKey, sessionId: string) {
    super();
    this.client = client;
    this.vault = vault;
    this.sessionId = sessionId;
  }

  async loadMemoryVariables(inputs: Record<string, any>) {
    // Load recent conversation history
    const memories = await this.client.getMemories(this.vault, {
      category: 'conversations',
      tags: ['conversation', this.sessionId],
      limit: 10,
    });

    return {
      history: memories.map(m => {
        const data = JSON.parse(m.content);
        return `${data.role}: ${data.message}`;
      }).join('\n'),
    };
  }

  async saveContext(
    inputs: Record<string, any>,
    outputs: Record<string, string>
  ) {
    const input = inputs[this.inputKey ?? 'input'];
    const output = outputs[this.outputKey ?? 'output'];

    // Store both input and output
    await this.client.storeMemory(this.vault, {
      content: JSON.stringify({
        role: 'user',
        message: input,
        timestamp: Date.now(),
      }),
      category: 'conversations',
      tags: ['conversation', this.sessionId],
    });

    await this.client.storeMemory(this.vault, {
      content: JSON.stringify({
        role: 'assistant',
        message: output,
        timestamp: Date.now(),
      }),
      category: 'conversations',
      tags: ['conversation', this.sessionId],
    });
  }
}

// Use with an agent
const memory = new AgentMemory(client, vault, sessionId);

const executor = await initializeAgentExecutorWithOptions(tools, model, {
  agentType: 'structured-chat-zero-shot-react-description',
  memory,
  verbose: true,
});
```

### Vector Store Integration

```typescript
import { VectorStore } from 'langchain/vectorstores/base';
import { Document } from 'langchain/document';

class AgentMemoryVectorStore extends VectorStore {
  private client: AgentMemoryClient;
  private vault: PublicKey;

  async addDocuments(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      await this.client.storeMemory(this.vault, {
        content: JSON.stringify({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        }),
        category: 'documents',
        tags: ['document', doc.metadata.category],
      });
    }
  }

  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    // Store with embeddings
    for (let i = 0; i < documents.length; i++) {
      await this.client.storeMemory(this.vault, {
        content: JSON.stringify({
          pageContent: documents[i].pageContent,
          metadata: documents[i].metadata,
          embedding: vectors[i],
        }),
        category: 'documents',
        tags: ['document', 'embedding'],
      });
    }
  }

  async similaritySearch(
    query: string,
    k: number = 4
  ): Promise<Document[]> {
    // Get all documents and do similarity search
    const memories = await this.client.getMemories(this.vault, {
      category: 'documents',
      limit: 100, // Adjust as needed
    });

    // Implement similarity search
    // ...
  }
}
```

---

## 🔧 Custom Integration

Building a custom integration? Here's the pattern:

### Core Interface

```typescript
interface AgentMemoryIntegration {
  // Initialize connection
  init(): Promise<void>;
  
  // Store memory
  store(data: MemoryData): Promise<string>;
  
  // Retrieve memory
  retrieve(id: string): Promise<MemoryData>;
  
  // Search memories
  search(query: string): Promise<MemoryData[]>;
  
  // Delete memory
  delete(id: string): Promise<void>;
}
```

### Example: Python Integration

```python
# agent_memory.py
import requests
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class Memory:
    id: str
    content: str
    category: str
    tags: List[str]
    importance: int

class AgentMemoryClient:
    def __init__(self, rpc_url: str, program_id: str, wallet_key: str):
        self.rpc_url = rpc_url
        self.program_id = program_id
        self.wallet_key = wallet_key
    
    async def store_memory(
        self,
        vault: str,
        content: str,
        category: str = "general",
        tags: List[str] = None,
        importance: int = 50
    ) -> str:
        """Store a memory on Solana."""
        # Implementation using solana-py
        pass
    
    async def get_memories(
        self,
        vault: str,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 10
    ) -> List[Memory]:
        """Retrieve memories from vault."""
        pass

# Usage
client = AgentMemoryClient(
    rpc_url="https://api.devnet.solana.com",
    program_id="YOUR_PROGRAM_ID",
    wallet_key="YOUR_KEY"
)

memory_id = await client.store_memory(
    vault="VAULT_ADDRESS",
    content="User preference: dark mode",
    category="preferences",
    tags=["ui", "theme"]
)
```

### Example: Rust Integration

```rust
// agent_memory.rs
use solana_client::rpc_client::RpcClient;
use solana_sdk::{pubkey::Pubkey, signature::Keypair};

pub struct AgentMemoryClient {
    rpc_client: RpcClient,
    program_id: Pubkey,
    payer: Keypair,
}

impl AgentMemoryClient {
    pub fn new(
        rpc_url: &str,
        program_id: Pubkey,
        payer: Keypair,
    ) -> Self {
        Self {
            rpc_client: RpcClient::new(rpc_url.to_string()),
            program_id,
            payer,
        }
    }
    
    pub async fn store_memory(
        &self,
        vault: &Pubkey,
        key: &str,
        content: &[u8],
        category: &str,
    ) -> Result<Signature, Box<dyn std::error::Error>> {
        // Implementation
        todo!()
    }
}
```

---

## 👥 Multi-Agent Systems

### Shared Memory Pattern

```typescript
// Shared memory across multiple agents
class SharedMemoryPool {
  private client: AgentMemoryClient;
  private vault: PublicKey;
  private accessGrants: Map<string, PublicKey>;

  constructor(client: AgentMemoryClient, ownerVault: PublicKey) {
    this.client = client;
    this.vault = ownerVault;
    this.accessGrants = new Map();
  }

  async registerAgent(agentId: string, agentKey: PublicKey) {
    // Grant access to the vault
    await this.client.grantAccess(this.vault, agentKey, {
      permissionLevel: 'read',
    });
    this.accessGrants.set(agentId, agentKey);
  }

  async shareMemory(agentId: string, memoryKey: string, data: any) {
    await this.client.storeMemory(this.vault, {
      content: JSON.stringify({
        from: agentId,
        data,
        sharedAt: Date.now(),
      }),
      category: 'shared',
      tags: ['shared', agentId, memoryKey],
    });
  }

  async getSharedMemories(agentId?: string) {
    const filter = agentId ? ['shared', agentId] : ['shared'];
    return await this.client.getMemories(this.vault, {
      category: 'shared',
      tags: filter,
    });
  }
}

// Usage
const pool = new SharedMemoryPool(client, ownerVault);

// Register agents
await pool.registerAgent('researcher', researcherKey);
await pool.registerAgent('writer', writerKey);

// Share insights
await pool.shareMemory('researcher', 'findings', {
  topic: 'AI trends',
  summary: '...',
});

// Other agents can read
const insights = await pool.getSharedMemories('researcher');
```

### Agent Swarm Pattern

```typescript
// Coordinator agent manages memory for the swarm
class AgentSwarm {
  private coordinator: AgentMemoryClient;
  private agents: Map<string, AgentWorker>;

  async distributeTask(task: Task) {
    // Store task in shared memory
    await this.coordinator.storeMemory(this.vault, {
      content: JSON.stringify(task),
      category: 'tasks',
      tags: ['task', task.id, 'pending'],
    });

    // Notify agents
    for (const [id, agent] of this.agents) {
      if (agent.canHandle(task)) {
        await agent.assignTask(task);
      }
    }
  }

  async reportResult(agentId: string, taskId: string, result: any) {
    await this.coordinator.storeMemory(this.vault, {
      content: JSON.stringify({
        agentId,
        taskId,
        result,
        completedAt: Date.now(),
      }),
      category: 'results',
      tags: ['result', taskId, agentId],
    });
  }
}
```

---

## ✅ Best Practices

### 1. Encryption

Always encrypt sensitive content client-side:

```typescript
import { encrypt, decrypt } from './encryption';

// Before storing
const encrypted = await encrypt(JSON.stringify(sensitiveData), key);
await client.storeMemory(vault, { content: encrypted, ... });

// After retrieving
const decrypted = await decrypt(memory.content, key);
const data = JSON.parse(decrypted);
```

### 2. Caching

Cache frequently accessed memories:

```typescript
import LRU from 'lru-cache';

const cache = new LRU({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

async function getMemoryWithCache(vault, key) {
  const cacheKey = `${vault.toBase58()}-${key}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const memory = await client.getMemory(vault, key);
  cache.set(cacheKey, memory);
  return memory;
}
```

### 3. Batching

Batch operations to save on transaction fees:

```typescript
// ❌ Bad - Many transactions
for (const item of items) {
  await client.storeMemory(vault, item); // N transactions
}

// ✅ Good - Batched
const BATCH_SIZE = 50;
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await client.batchStoreMemories(vault, batch); // N/50 transactions
}
```

### 4. Error Handling

Always handle errors gracefully:

```typescript
try {
  await client.storeMemory(vault, data);
} catch (error) {
  if (error.message.includes('Insufficient funds')) {
    // Notify user to add SOL
  } else if (error.message.includes('Rate limit')) {
    // Retry with backoff
    await delay(60000);
    await client.storeMemory(vault, data);
  } else {
    // Log and alert
    console.error('Memory storage failed:', error);
  }
}
```

### 5. Memory Lifecycle

Implement proper memory lifecycle management:

```typescript
// Store with expiration
await client.storeMemory(vault, {
  content: data,
  category: 'temporary',
  importance: 30,
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day
});

// Periodic cleanup
setInterval(async () => {
  const expired = await client.getExpiredMemories(vault);
  for (const memory of expired) {
    await client.deleteMemory(vault, memory.key);
  }
}, 60 * 60 * 1000); // Hourly
```

---

## 📚 Additional Resources

- [ElizaOS Documentation](https://docs.elizaos.ai)
- [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [LangChain Documentation](https://js.langchain.com/)

---

<p align="center">
  <strong>Need help with integration?</strong>
  <br>
  <a href="../README.md#-support">Contact our support team</a>
</p>
