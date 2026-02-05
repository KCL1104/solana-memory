# @agentmemory/solana-agent-kit-plugin

[![npm version](https://badge.fury.io/js/@agentmemory%2Fsolana-agent-kit-plugin.svg)](https://www.npmjs.com/package/@agentmemory/solana-agent-kit-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> AgentMemory Protocol plugin for Solana Agent Kit v2 - On-chain memory storage and retrieval for AI agents

## Features

- 🔐 **Encrypted Storage** - Store memories with optional encryption for sensitive data
- 🔍 **Semantic Search** - Find memories using natural language queries
- 🏷️ **Tagging System** - Organize memories with custom tags and categories
- 📊 **Importance Levels** - Prioritize memories (low/medium/high/critical)
- 🔄 **Version Control** - Track changes with version history
- ⏱️ **Expiration** - Set automatic expiration for temporary memories
- 🧠 **LangChain Integration** - Use as LangChain tools for broader AI workflows

## Installation

```bash
npm install @agentmemory/solana-agent-kit-plugin
```

### Peer Dependencies

```bash
npm install solana-agent-kit @solana/web3.js
```

## Quick Start

### Basic Usage with Solana Agent Kit

```typescript
import { SolanaAgentKit } from 'solana-agent-kit';
import { agentMemoryPlugin } from '@agentmemory/solana-agent-kit-plugin';

// Create agent with AgentMemory plugin
const agent = new SolanaAgentKit({
  agentId: "my-agent-123",
  network: "devnet",
  plugins: [agentMemoryPlugin]
});

// Store a memory
const storeResult = await agent.execute("STORE_MEMORY", {
  content: "User prefers dark mode interface",
  importance: "medium",
  tags: ["user_preference", "ui"],
  category: "user_preference"
});

console.log("Memory stored:", storeResult.memoryId);

// Search memories
const searchResult = await agent.execute("SEARCH_MEMORY", {
  query: "user preferences",
  limit: 5
});

console.log("Found memories:", searchResult.results);
```

### Using as LangChain Tools

```typescript
import { createMemoryTools } from '@agentmemory/solana-agent-kit-plugin';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';

// Create memory tools for your agent
const tools = createMemoryTools("my-agent-123", "devnet");

// Use with LangChain agent
const executor = await initializeAgentExecutorWithOptions(tools, model, {
  agentType: "structured-chat-zero-shot-react-description"
});

// The agent can now use memory tools
const result = await executor.call({
  input: "Remember that the user likes dark mode"
});
```

## API Reference

### Actions

#### STORE_MEMORY

Store a memory on-chain with optional encryption.

```typescript
const result = await agent.execute("STORE_MEMORY", {
  content: "Memory content",
  importance: "high",           // 'low' | 'medium' | 'high' | 'critical'
  tags: ["tag1", "tag2"],       // Max 20 tags
  category: "user_preference",  // Memory category
  encrypted: false,             // Encrypt content?
  expiresAt: 1706659200000      // Expiration timestamp (ms)
});
```

**Returns:**
```typescript
{
  status: "success",
  memoryId: "mem_abc123xyz",
  signature: "5Kxyz...abc",
  encrypted: false,
  timestamp: 1704067200000
}
```

#### RETRIEVE_MEMORY

Retrieve a memory by ID with automatic decryption.

```typescript
const result = await agent.execute("RETRIEVE_MEMORY", {
  memoryId: "mem_abc123xyz",
  decrypt: true  // Attempt decryption if encrypted
});
```

#### SEARCH_MEMORY

Search memories using semantic queries and filters.

```typescript
const result = await agent.execute("SEARCH_MEMORY", {
  query: "user preferences",              // Semantic search query
  tags: ["preference"],                   // Filter by tags
  importance: ["high", "critical"],       // Filter by importance
  category: "user_preference",            // Filter by category
  status: "active",                       // 'active' | 'archived' | 'deleted'
  fromDate: 1703980800000,                // Date range start
  toDate: 1706659200000,                  // Date range end
  minRelevance: 0.7,                      // Minimum relevance score (0-1)
  limit: 10,                              // Max results
  offset: 0                               // Pagination offset
});
```

#### UPDATE_MEMORY

Update an existing memory with version control.

```typescript
const result = await agent.execute("UPDATE_MEMORY", {
  memoryId: "mem_abc123xyz",
  content: "Updated content",
  importance: "high",
  addTags: ["new-tag"],
  removeTags: ["old-tag"],
  createVersion: true  // Create new version vs. update in place
});
```

#### DELETE_MEMORY

Soft or hard delete a memory.

```typescript
const result = await agent.execute("DELETE_MEMORY", {
  memoryId: "mem_abc123xyz",
  hardDelete: false  // false = soft delete (recoverable), true = permanent
});
```

#### ARCHIVE_MEMORY

Archive a memory to move it from active status.

```typescript
const result = await agent.execute("ARCHIVE_MEMORY", {
  memoryId: "mem_abc123xyz"
});
```

#### LIST_RECENT_MEMORIES

List recent memories with optional filtering.

```typescript
const result = await agent.execute("LIST_RECENT_MEMORIES", {
  limit: 10,
  category: "conversation",
  tags: ["important"]
});
```

### LangChain Tools

| Tool Name | Description |
|-----------|-------------|
| `store_agent_memory` | Store a memory on-chain |
| `retrieve_agent_memory` | Retrieve a memory by ID |
| `search_agent_memories` | Search memories with filters |
| `update_agent_memory` | Update an existing memory |
| `delete_agent_memory` | Soft delete a memory |

### Types

```typescript
import { 
  MemoryInput, 
  Memory, 
  MemoryConfig, 
  MemorySearchQuery,
  MemoryImportance,
  MemoryCategory 
} from '@agentmemory/solana-agent-kit-plugin';
```

## Memory Categories

- `conversation` - Chat and interaction history
- `task` - Task-related information
- `insight` - Derived insights and conclusions
- `context` - Contextual information
- `user_preference` - User preferences and settings
- `system` - System configuration and secrets
- `custom` - User-defined category

## Importance Levels

- `low` - Ephemeral information, short TTL
- `medium` - Regular information, moderate TTL
- `high` - Important information, long TTL
- `critical` - Critical information, indefinite TTL, highest retrieval priority

## Configuration

```typescript
const agent = new SolanaAgentKit({
  agentId: "unique-agent-id",
  network: "devnet",  // or 'mainnet-beta' | 'testnet'
  plugins: [agentMemoryPlugin],
  // Optional AgentMemory-specific config
  memoryConfig: {
    encryptionKey: process.env.MEMORY_ENCRYPTION_KEY,
    defaultExpiration: 30 * 24 * 60 * 60 * 1000,  // 30 days
    maxCacheSize: 1000
  }
});
```

## Examples

### Storing User Preferences

```typescript
await agent.execute("STORE_MEMORY", {
  content: "User prefers email notifications over SMS",
  importance: "medium",
  tags: ["notification", "user_preference", "email"],
  category: "user_preference"
});
```

### Storing Encrypted Secrets

```typescript
await agent.execute("STORE_MEMORY", {
  content: "API_KEY=sk-abc123xyz",
  importance: "critical",
  tags: ["api_key", "secret"],
  category: "system",
  encrypted: true,
  expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000)  // 90 days
});
```

### Searching with Filters

```typescript
// Find critical system memories about API keys
const results = await agent.execute("SEARCH_MEMORY", {
  query: "API credentials",
  tags: ["api_key"],
  importance: "critical",
  category: "system",
  limit: 5
});
```

### Version Control

```typescript
// Update and create new version
await agent.execute("UPDATE_MEMORY", {
  memoryId: "mem_abc123",
  content: "Updated preferences after user feedback",
  addTags: ["updated"],
  createVersion: true
});

// View version history
const versions = await agent.execute("RETRIEVE_MEMORY_VERSIONS", {
  memoryId: "mem_abc123"
});
```

## Error Handling

All actions return a consistent error format:

```typescript
{
  status: "error",
  error: "Human-readable error message",
  code: "ERROR_CODE",  // e.g., 'NOT_FOUND', 'PERMISSION_DENIED', 'DECRYPTION_FAILED'
  details: {}  // Additional error details
}
```

Common error codes:
- `NOT_FOUND` - Memory ID doesn't exist
- `PERMISSION_DENIED` - Insufficient permissions
- `DECRYPTION_FAILED` - Failed to decrypt encrypted memory
- `VALIDATION_ERROR` - Input validation failed

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format
npm run format
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © AgentMemory Team

## Support

- 📧 Email: support@agentmemory.xyz
- 💬 Discord: [AgentMemory Discord](https://discord.gg/agentmemory)
- 🐛 Issues: [GitHub Issues](https://github.com/agentmemory/agent-memory/issues)

## Related Packages

- [`agentmemory`](https://www.npmjs.com/package/agentmemory) - Core AgentMemory SDK
- [`solana-agent-kit`](https://www.npmjs.com/package/solana-agent-kit) - Solana Agent Kit
