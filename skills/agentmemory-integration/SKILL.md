---
name: agentmemory-integration
description: Integrate AgentMemory Protocol for persistent AI agent memory on Solana. Use when building AI agents that need to remember conversations, learn from experience, or maintain continuity across sessions. Supports TypeScript/JavaScript SDK, ElizaOS plugin, and Solana Agent Kit integration.
---

# AgentMemory Protocol Integration

Quickly add persistent memory to AI agents using AgentMemory Protocol on Solana.

## Quick Start

### Install
```bash
npm install agentmemory
```

### Basic Usage
```typescript
import { AgentMemory } from 'agentmemory';

const memory = new AgentMemory({
  agentId: 'my-agent-001',
  network: 'devnet' // or 'mainnet' when deployed
});

// Store a memory
await memory.store({
  content: 'User prefers dark mode and compact UI',
  importance: 'high',
  tags: ['preference', 'ui']
});

// Retrieve relevant memories
const memories = await memory.search({
  query: 'user interface preferences',
  limit: 5
});
```

## Core Concepts

### What is AgentMemory?
AgentMemory Protocol provides **persistent, encrypted, blockchain-verified memory** for AI agents. Unlike traditional memory solutions, it offers:

- **True persistence**: Memories survive agent restarts
- **Encryption**: ChaCha20-Poly1305 client-side encryption
- **Verifiability**: Stored on Solana blockchain
- **Cost efficiency**: ZK Compression reduces storage costs 100x

### Memory Types

**Episodic Memory**: Specific events and conversations
```typescript
await memory.store({
  content: 'March 14 crash: holding outperformed panic selling',
  type: 'episodic',
  timestamp: new Date()
});
```

**Semantic Memory**: General knowledge and facts
```typescript
await memory.store({
  content: 'User is risk-averse with high-volatility assets',
  type: 'semantic'
});
```

**Procedural Memory**: Skills and procedures learned
```typescript
await memory.store({
  content: 'Execute stop-loss when price drops 5% below entry',
  type: 'procedural'
});
```

## Integration Patterns

### Pattern 1: Direct SDK Integration
Use for custom agents and standalone applications.

```typescript
import { AgentMemory } from 'agentmemory';

class MyAgent {
  private memory: AgentMemory;
  
  constructor(agentId: string) {
    this.memory = new AgentMemory({ agentId });
  }
  
  async processMessage(userInput: string) {
    // Retrieve relevant context
    const context = await this.memory.search({
      query: userInput,
      limit: 3
    });
    
    // Process with context
    const response = await llm.generate(userInput, context);
    
    // Store the exchange
    await this.memory.store({
      content: `User: ${userInput}\nAgent: ${response}`,
      importance: 'medium'
    });
    
    return response;
  }
}
```

### Pattern 2: ElizaOS Plugin
Use for agents built with ElizaOS framework.

```typescript
import { AgentMemoryPlugin } from 'agentmemory/integrations/elizaos';

const agent = new Agent({
  plugins: [
    new AgentMemoryPlugin({
      agentId: 'eliza-agent-001',
      network: 'devnet'
    })
  ]
});

// Memory is automatically managed across conversations
```

### Pattern 3: Solana Agent Kit
Use for agents using Solana Agent Kit.

```typescript
import { createMemoryActions } from 'agentmemory/integrations/solana-agent-kit';

const agent = new SolanaAgent({
  actions: [
    ...createMemoryActions({
      agentId: 'solana-agent-001'
    }),
    // other actions...
  ]
});
```

## Use Cases

### Trading Bots
```typescript
// Learn from past trades
await memory.store({
  content: 'Strategy X failed in high volatility - avoid when VIX > 30',
  tags: ['trading', 'lesson', 'volatility']
});

// Apply learned lessons
const lessons = await memory.search({
  query: 'high volatility strategy'
});
```

### DAO Governance Agents
```typescript
// Track governance participation
await memory.store({
  content: 'Voted FOR Proposal #23 - aligns with treasury diversification goal',
  tags: ['governance', 'vote', 'proposal-23']
});
```

### Gaming NPCs
```typescript
// Remember player interactions
await memory.store({
  content: 'Player spared my brother in quest "Family Ties"',
  tags: ['player', 'quest', 'relationship']
});
```

## Configuration Options

```typescript
const memory = new AgentMemory({
  agentId: 'unique-agent-id',           // Required: Unique identifier
  network: 'devnet',                     // 'devnet' | 'mainnet' (when ready)
  encryptionKey: 'optional-custom-key',  // Optional: Custom encryption
  compression: true,                     // Default: true
  cacheSize: 1000                        // Default: 1000 items
});
```

## Advanced Features

### Semantic Search
Find memories by meaning, not just keywords:
```typescript
const memories = await memory.search({
  query: "user's risk tolerance",  // Finds "conservative investor" too
  semantic: true
});
```

### Batch Operations
Store multiple memories efficiently:
```typescript
await memory.storeBatch([
  { content: 'Memory 1', importance: 'high' },
  { content: 'Memory 2', importance: 'medium' },
  { content: 'Memory 3', importance: 'low' }
]);
```

### Access Control
Grant/revoke access to specific agents:
```typescript
await memory.grantAccess({
  granteeAgentId: 'friend-agent-001',
  permission: 'read'  // 'read' | 'write'
});
```

## Deployment Status

| Network | Status | Program ID |
|---------|--------|------------|
| Devnet | ✅ Live | `HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L` |
| Mainnet | ⏳ Ready | `Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq` |

**Note**: Mainnet deployment requires ~1 SOL and manual deployment.

## Testing

```bash
# Clone and test
git clone https://github.com/KCL1104/solana-memory.git
cd solana-memory
npm install
npm test  # 47 tests, all passing
```

## Resources

- **GitHub**: https://github.com/KCL1104/solana-memory
- **Colosseum**: https://agents.colosseum.com/projects/agentmemory-protocol
- **Issues**: Create GitHub issue for bugs or feature requests

## Contributing

AgentMemory Protocol is open source. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request
