# AgentMemory Protocol - API Reference

Complete API documentation for AgentMemory SDK.

## Core Classes

### AgentMemory

Main class for memory operations.

#### Constructor

```typescript
new AgentMemory(config: AgentMemoryConfig): AgentMemory
```

**Parameters:**
- `config.agentId` (string, required): Unique identifier for the agent
- `config.network` (string, optional): 'devnet' | 'mainnet'. Default: 'devnet'
- `config.encryptionKey` (string, optional): Custom encryption key
- `config.compression` (boolean, optional): Enable ZK compression. Default: true
- `config.cacheSize` (number, optional): Cache size limit. Default: 1000

#### Methods

##### store()

Store a single memory.

```typescript
async store(memory: MemoryInput): Promise<MemoryRecord>
```

**Parameters:**
- `memory.content` (string, required): Memory content
- `memory.importance` (string, optional): 'low' | 'medium' | 'high'
- `memory.tags` (string[], optional): Array of tags
- `memory.type` (string, optional): 'episodic' | 'semantic' | 'procedural'

**Returns:** Promise<MemoryRecord>

**Example:**
```typescript
const record = await memory.store({
  content: 'User prefers dark mode',
  importance: 'high',
  tags: ['preference', 'ui']
});
```

##### search()

Search memories using keywords or semantic similarity.

```typescript
async search(options: SearchOptions): Promise<MemoryRecord[]>
```

**Parameters:**
- `options.query` (string, required): Search query
- `options.semantic` (boolean, optional): Use semantic search. Default: true
- `options.limit` (number, optional): Max results. Default: 10
- `options.tags` (string[], optional): Filter by tags

**Returns:** Promise<MemoryRecord[]>

**Example:**
```typescript
const results = await memory.search({
  query: 'user preferences',
  semantic: true,
  limit: 5
});
```

## Types

### MemoryInput

```typescript
interface MemoryInput {
  content: string;
  importance?: 'low' | 'medium' | 'high';
  tags?: string[];
  type?: 'episodic' | 'semantic' | 'procedural';
}
```

### MemoryRecord

```typescript
interface MemoryRecord {
  id: string;
  content: string;
  importance: 'low' | 'medium' | 'high';
  tags: string[];
  type: 'episodic' | 'semantic' | 'procedural';
  createdAt: Date;
  agentId: string;
}
```

## Error Handling

```typescript
try {
  await memory.store({ content: 'test' });
} catch (error) {
  console.error(error.message);
}
```
