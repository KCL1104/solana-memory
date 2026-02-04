# AgentMemory Protocol - Examples

Common usage patterns and integration examples.

## Basic Memory Storage

### Store and Retrieve

```typescript
import { AgentMemory } from 'agentmemory';

const memory = new AgentMemory({
  agentId: 'basic-agent',
  network: 'devnet'
});

// Store a preference
const record = await memory.store({
  content: 'User prefers email notifications over SMS',
  importance: 'medium',
  tags: ['preference', 'notification']
});

// Retrieve it later
const retrieved = await memory.retrieve(record.id);
console.log('Retrieved:', retrieved.content);
```

## Conversation Continuity

### Maintaining Context Across Sessions

```typescript
class ContinuousAgent {
  private memory: AgentMemory;

  constructor(agentId: string) {
    this.memory = new AgentMemory({ agentId });
  }

  async chat(userMessage: string): Promise<string> {
    // Retrieve relevant context
    const context = await this.memory.search({
      query: userMessage,
      limit: 3
    });

    // Generate response with context
    const response = await this.generateResponse(userMessage, context);

    // Store this exchange
    await this.memory.store({
      content: `User: ${userMessage}\nAgent: ${response}`,
      importance: 'medium'
    });

    return response;
  }
}
```

## Trading Bot Example

```typescript
class SmartTradingBot {
  private memory: AgentMemory;

  constructor(botId: string) {
    this.memory = new AgentMemory({
      agentId: botId,
      network: 'devnet'
    });
  }

  async recordTrade(decision: any, result: any) {
    await this.memory.store({
      content: `Trade: ${decision.action} ${decision.symbol}`,
      importance: 'high',
      tags: ['trade', decision.symbol],
      metadata: { result }
    });
  }
}
```

## Best Practices

### 1. Use Appropriate Memory Types

```typescript
// Episodic: Specific events
await memory.store({
  content: 'March 14 crash event',
  type: 'episodic'
});

// Semantic: General knowledge
await memory.store({
  content: 'User is risk-averse',
  type: 'semantic'
});
```

### 2. Tag Strategically

```typescript
await memory.store({
  content: 'Important event',
  tags: ['category', 'subcategory', 'entity-id']
});
```
