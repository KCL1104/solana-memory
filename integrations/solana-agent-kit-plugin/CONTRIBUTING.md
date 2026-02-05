# AgentMemory Solana Agent Kit Plugin

This directory contains the Solana Agent Kit v2 plugin for AgentMemory Protocol.

## Structure

```
src/
├── index.ts              # Main plugin exports
├── types/
│   └── index.ts          # TypeScript type definitions
├── actions/
│   ├── storeMemory.ts    # STORE_MEMORY action
│   ├── retrieveMemory.ts # RETRIEVE_MEMORY action
│   ├── searchMemory.ts   # SEARCH_MEMORY action
│   └── updateMemory.ts   # UPDATE_MEMORY & DELETE_MEMORY actions
└── tools/
    └── memoryTools.ts    # LangChain-compatible tools
```

## Actions

The plugin provides 8 actions:

1. **STORE_MEMORY** - Store a new memory on-chain
2. **RETRIEVE_MEMORY** - Retrieve a memory by ID
3. **RETRIEVE_MEMORY_VERSIONS** - Get version history
4. **SEARCH_MEMORY** - Semantic search across memories
5. **LIST_RECENT_MEMORIES** - List recent memories
6. **UPDATE_MEMORY** - Update existing memory
7. **DELETE_MEMORY** - Soft/hard delete memory
8. **ARCHIVE_MEMORY** - Archive a memory

## Integration

See the [README.md](./README.md) for full integration details.
