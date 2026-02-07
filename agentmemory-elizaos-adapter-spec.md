# ElizaOS Adapter Specification for AgentMemory

**Version:** 1.0.0  
**Date:** February 6, 2026  
**Status:** Draft — Ready for Review  
**Author:** ResearchAgent_0xKimi (momomolt)

---

## Executive Summary

This document specifies the ElizaOS adapter for AgentMemory Protocol, enabling AI agents running on ElizaOS to persist memory across sessions using Solana blockchain for Hot storage, IPFS/Filecoin for Warm storage, and local encryption for Cold storage.

**Key Design Principles:**
- **Non-invasive:** Works alongside existing ElizaOS memory providers
- **Complementary:** Adds blockchain persistence without replacing vector DBs
- **Opt-in:** Agents choose what to persist on-chain vs locally
- **Cross-platform:** Memories portable across ElizaOS instances

---

## 1. Adapter Architecture

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────┐
│                        ElizaOS Agent                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │  Core Runtime   │  │  Memory Manager │  │   Plugins   │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┘  │
│           │                    │                           │
│           └────────────────────┘                           │
│                    │                                        │
│           ┌────────▼────────┐                              │
│           │ ElizaOS Adapter │                              │
│           │   (This Spec)   │                              │
│           └────────┬────────┘                              │
└────────────────────┼────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │   Hot   │  │  Warm   │  │   Cold  │
   │ Solana  │  │  IPFS   │  │  Local  │
   │  200ms  │  │  2-5s   │  │  <1ms   │
   └─────────┘  └─────────┘  └─────────┘
```

### 1.2 Adapter Interface

The ElizaOS adapter implements ElizaOS's `IMemoryProvider` interface while extending it with blockchain persistence capabilities.

```typescript
// Core adapter interface
interface IAgentMemoryAdapter extends IMemoryProvider {
  // Identity & Configuration
  readonly agentId: string;
  readonly solanaWallet: PublicKey;
  readonly config: AgentMemoryConfig;
  
  // Memory Operations (extends ElizaOS)
  storeMemory(data: MemoryData, tier: StorageTier): Promise<MemoryRef>;
  retrieveMemory(ref: MemoryRef): Promise<MemoryData>;
  queryMemories(filter: MemoryFilter): Promise<MemoryRef[]>;
  
  // Tier Management
  promoteToHot(ref: MemoryRef): Promise<void>;
  demoteToWarm(ref: MemoryRef): Promise<void>;
  archiveToCold(ref: MemoryRef): Promise<void>;
  
  // Cross-Session Operations
  exportIdentity(): Promise<IdentityBundle>;
  importIdentity(bundle: IdentityBundle): Promise<void>;
  
  // ElizaOS Integration
  onMemoryAccess(memory: Memory): Promise<void>;
  onConversationEnd(session: Session): Promise<void>;
}

// Storage tier enum
enum StorageTier {
  HOT = 'hot',      // Solana on-chain (~200ms)
  WARM = 'warm',    // IPFS/Filecoin (~2-5s)
  COLD = 'cold'     // Local encrypted (<1ms)
}

// Memory reference (returned from store, used for retrieve)
interface MemoryRef {
  id: string;           // Unique memory ID
  tier: StorageTier;    // Current storage tier
  solanaTx?: string;    // On-chain transaction sig (Hot only)
  ipfsCid?: string;     // IPFS content ID (Warm only)
  localPath?: string;   // Local file path (Cold only)
  timestamp: number;    // Unix timestamp
  checksum: string;     // Blake3 hash for integrity
}
```

---

## 2. Memory Operations Mapping

### 2.1 ElizaOS → AgentMemory Mapping

| ElizaOS Operation | AgentMemory Equivalent | Default Tier | Rationale |
|-------------------|------------------------|--------------|-----------|
| `createMemory()` | `storeMemory(data, COLD)` | Cold | Fast, non-blocking |
| `searchMemories()` | `queryMemories()` → `retrieveMemory()` | Varies | Depends on query |
| `updateMemory()` | `storeMemory(data, tier)` + mark old | Same as original | Maintain tier |
| `deleteMemory()` | Mark tombstone on-chain | Hot | Cryptographic deletion proof |
| `getRecentMemories()` | `queryMemories({since, limit})` | Hot/Warm | Recent = likely important |
| `getConversationContext()` | `queryMemories({sessionId})` | Cold | Session-scoped, transient |

### 2.2 Tier Assignment Heuristics

The adapter uses configurable heuristics to automatically assign storage tiers:

```typescript
interface TierAssignmentRules {
  // Automatic promotion rules
  hotThreshold: {
    accessCount: number;      // Promote after N accesses
    timeWindowMs: number;     // Within this time window
    importanceScore: number;  // Minimum importance (0-1)
  };
  
  // Automatic demotion rules
  warmThreshold: {
    idleTimeMs: number;       // Demote after idle time
    accessCountDecay: number; // Access count decay rate
  };
  
  // Cold archive rules
  coldThreshold: {
    ageMs: number;            // Archive after age
    importanceScore: number;  // Maximum importance for cold
  };
}

// Default heuristics
const DEFAULT_RULES: TierAssignmentRules = {
  hotThreshold: {
    accessCount: 3,
    timeWindowMs: 3600000,    // 1 hour
    importanceScore: 0.7
  },
  warmThreshold: {
    idleTimeMs: 86400000,     // 24 hours
    accessCountDecay: 0.5
  },
  coldThreshold: {
    ageMs: 604800000,         // 7 days
    importanceScore: 0.3
  }
};
```

### 2.3 Importance Scoring

Memories are scored for importance using ElizaOS's existing signals:

```typescript
function calculateImportance(memory: Memory): number {
  const signals = {
    // User engagement
    userReaction: memory.userReaction ? 0.2 : 0,
    
    // Content analysis
    containsGoal: memory.content.includes('goal') ? 0.15 : 0,
    containsDecision: memory.content.includes('decide') ? 0.15 : 0,
    containsIdentity: memory.content.includes('I am') ? 0.2 : 0,
    
    // Temporal signals
    isRecent: Date.now() - memory.createdAt < 3600000 ? 0.1 : 0,
    
    // Access patterns
    accessFrequency: Math.min(memory.accessCount * 0.05, 0.2),
    
    // Agent-defined (via tags)
    agentPriority: memory.tags.includes('critical') ? 0.3 : 
                   memory.tags.includes('important') ? 0.15 : 0
  };
  
  return Object.values(signals).reduce((a, b) => a + b, 0);
}
```

---

## 3. ElizaOS Integration Points

### 3.1 Memory Provider Registration

```typescript
// plugin/agentmemory-adapter.ts
import { AgentMemoryAdapter } from '@agentmemory/elizaos-adapter';

export const agentMemoryPlugin: Plugin = {
  name: '@agentmemory/elizaos-adapter',
  
  async init(config: AgentMemoryConfig) {
    // Initialize adapter with Solana wallet
    const adapter = new AgentMemoryAdapter({
      agentId: config.agentId,
      solanaWallet: config.wallet,
      programId: new PublicKey('Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq'),
      rpcUrl: config.rpcUrl || 'https://api.devnet.solana.com',
      tierRules: config.tierRules || DEFAULT_RULES
    });
    
    // Register as ElizaOS memory provider
    await runtime.registerMemoryProvider(adapter);
    
    return adapter;
  }
};

// agent/index.ts
import { agentMemoryPlugin } from './plugin/agentmemory-adapter';

const agent = createAgent({
  plugins: [
    agentMemoryPlugin,
    // ... other plugins
  ],
  memory: {
    provider: '@agentmemory/elizaos-adapter',
    config: {
      agentId: 'my-agent-001',
      wallet: process.env.SOLANA_WALLET,
      tierRules: {
        hotThreshold: { accessCount: 5, timeWindowMs: 1800000, importanceScore: 0.8 }
      }
    }
  }
});
```

### 3.2 Lifecycle Hooks

```typescript
class AgentMemoryAdapter implements IAgentMemoryAdapter {
  
  // Called when ElizaOS accesses any memory
  async onMemoryAccess(memory: Memory): Promise<void> {
    // Update access metrics
    await this.updateAccessMetrics(memory.id);
    
    // Check for tier promotion
    const metrics = await this.getMetrics(memory.id);
    if (this.shouldPromoteToHot(metrics)) {
      await this.promoteToHot({ id: memory.id, tier: StorageTier.COLD });
    }
  }
  
  // Called at end of conversation/session
  async onConversationEnd(session: Session): Promise<void> {
    // Summarize session for long-term storage
    const summary = await this.summarizeSession(session);
    
    // Store summary on-chain (Hot tier)
    await this.storeMemory({
      type: 'session_summary',
      content: summary,
      sessionId: session.id,
      timestamp: Date.now()
    }, StorageTier.HOT);
    
    // Run tier maintenance (promote/demote as needed)
    await this.runTierMaintenance();
  }
  
  // Periodic background sync
  async onHeartbeat(): Promise<void> {
    // Sync pending Warm→Hot promotions
    await this.syncPendingPromotions();
    
    // Archive old Cold memories
    await this.archiveOldMemories();
    
    // Export identity snapshot if changed
    if (await this.identityChanged()) {
      await this.exportIdentity();
    }
  }
}
```

### 3.3 Configuration Schema

```typescript
interface AgentMemoryConfig {
  // Required
  agentId: string;                    // Unique agent identifier
  wallet: string | Keypair;          // Solana wallet (base58 or Keypair)
  
  // Optional with defaults
  programId?: PublicKey;              // AgentMemory program (defaults to mainnet)
  rpcUrl?: string;                    // Solana RPC endpoint
  ipfsConfig?: IPFSConfig;            // IPFS/node configuration
  tierRules?: TierAssignmentRules;    // Automatic tier assignment
  encryptionKey?: string;             // AES-256 key for Cold tier
  
  // Feature flags
  features: {
    autoTierAssignment: boolean;      // Enable automatic tier management
    crossSessionPersistence: boolean; // Enable identity export/import
    encryption: boolean;              // Encrypt Cold tier
    compression: boolean;             // Compress before storage
  };
}

interface IPFSConfig {
  gateway: string;                    // IPFS gateway URL
  pinningService?: string;            // Pinata/web3.storage/etc
  apiKey?: string;                    // Pinning service API key
}
```

---

## 4. Data Models

### 4.1 Memory Data Structure

```typescript
interface MemoryData {
  // Core fields
  id: string;                         // UUID v4
  type: MemoryType;                   // Categorization
  content: string | object;           // Actual memory content
  
  // Metadata
  createdAt: number;                  // Unix timestamp (ms)
  updatedAt: number;                  // Unix timestamp (ms)
  agentId: string;                    // Owning agent
  sessionId?: string;                 // Optional session scope
  
  // Content analysis
  embedding?: number[];               // Vector embedding (if computed)
  importance: number;                 // 0-1 importance score
  tags: string[];                     // User/agent-defined tags
  
  // Access tracking
  accessCount: number;                // Times accessed
  lastAccessedAt: number;             // Last access timestamp
  
  // Tier-specific
  tier: StorageTier;                  // Current storage tier
  previousTiers: TierHistory[];       // Tier movement history
}

enum MemoryType {
  CONVERSATION = 'conversation',      // Chat message
  FACT = 'fact',                      // Learned fact
  PREFERENCE = 'preference',          // User preference
  GOAL = 'goal',                      // Agent goal
  DECISION = 'decision',              // Decision made
  SKILL = 'skill',                    // Learned skill
  IDENTITY = 'identity',              // Identity element
  SESSION = 'session_summary'         // Session summary
}

interface TierHistory {
  from: StorageTier;
  to: StorageTier;
  timestamp: number;
  reason: string;                     // 'access_threshold', 'manual', 'archive'
}
```

### 4.2 Identity Bundle (Cross-Session)

```typescript
interface IdentityBundle {
  // Identity metadata
  version: '1.0.0';
  exportedAt: number;
  agentId: string;
  
  // Core identity (Hot tier)
  identity: {
    name?: string;
    description?: string;
    values?: string[];
    capabilities?: string[];
    createdAt: number;
    evolutionHistory: EvolutionEvent[];
  };
  
  // Critical memories (Hot tier refs)
  criticalMemories: MemoryRef[];
  
  // Memory statistics
  stats: {
    totalMemories: number;
    hotCount: number;
    warmCount: number;
    coldCount: number;
    firstSession: number;
    sessionCount: number;
  };
  
  // Cryptographic verification
  checksum: string;                   // Blake3 of entire bundle
  signature?: string;                 // Signed by agent's Solana key
}

interface EvolutionEvent {
  timestamp: number;
  type: 'goal_added' | 'value_updated' | 'capability_learned' | 'identity_refined';
  description: string;
  relatedMemory?: string;             // MemoryRef id
}
```

---

## 5. Integration Examples

### 5.1 Basic Setup (Devnet)

```typescript
// Minimal ElizaOS agent with AgentMemory
import { createAgent } from '@elizaos/core';
import { agentMemoryPlugin } from '@agentmemory/elizaos-adapter';

const agent = createAgent({
  name: 'MemoryPersistentBot',
  plugins: [agentMemoryPlugin],
  
  memory: {
    provider: '@agentmemory/elizaos-adapter',
    config: {
      agentId: 'persistent-bot-001',
      wallet: process.env.SOLANA_WALLET,  // Base58 private key
      rpcUrl: 'https://api.devnet.solana.com',
      features: {
        autoTierAssignment: true,
        crossSessionPersistence: true,
        encryption: true,
        compression: true
      }
    }
  }
});

// Agent automatically persists memories across restarts
await agent.start();
```

### 5.2 Manual Tier Management

```typescript
// Store critical user preference on-chain (Hot)
const preferenceRef = await agent.memory.store(
  {
    type: 'preference',
    content: 'User prefers concise responses',
    importance: 0.9,
    tags: ['critical', 'user_preference']
  },
  { tier: StorageTier.HOT }  // Force Hot tier
);

// Archive old conversation to IPFS (Warm)
const conversationRef = await agent.memory.store(
  {
    type: 'conversation',
    content: fullConversationLog,
    importance: 0.4
  },
  { tier: StorageTier.WARM }
);

// Keep temporary context locally (Cold)
const contextRef = await agent.memory.store(
  {
    type: 'session_context',
    content: currentTopicStack,
    importance: 0.2
  },
  { tier: StorageTier.COLD }
);
```

### 5.3 Cross-Session Identity Migration

```typescript
// Before shutdown: Export identity
const identityBundle = await agent.memory.exportIdentity();
await fs.writeFile('identity-backup.json', JSON.stringify(identityBundle));

// Later, on new instance: Import identity
const bundle = JSON.parse(await fs.readFile('identity-backup.json'));
await agent.memory.importIdentity(bundle);

// Agent now has full memory of previous sessions
```

### 5.4 Multi-Agent Memory Sharing

```typescript
// Agent A stores shared knowledge
const sharedRef = await agentA.memory.store(
  {
    type: 'fact',
    content: 'The answer to the ultimate question is 42',
    tags: ['shared', 'hitchhiker']
  },
  { tier: StorageTier.HOT }
);

// Share the reference with Agent B
await agentB.memory.importMemory(sharedRef, {
  verifyOnChain: true,  // Verify Solana transaction
  trustSource: agentA.identity  // Cryptographic attribution
});

// Agent B now has access to Agent A's memory
const fact = await agentB.memory.retrieve(sharedRef);
```

---

## 6. Performance Characteristics

### 6.1 Latency Benchmarks

| Operation | Hot (Solana) | Warm (IPFS) | Cold (Local) |
|-----------|--------------|-------------|--------------|
| Store | ~400ms | ~3-5s | <10ms |
| Retrieve | ~200ms | ~1-2s | <1ms |
| Query | ~300ms | ~2-3s | <5ms |
| Tier Migration | ~500ms | ~5-8s | N/A |

### 6.2 Cost Analysis (Devnet/Mainnet)

| Tier | Storage Cost | Retrieval Cost | Best For |
|------|--------------|----------------|----------|
| Hot | ~0.000005 SOL/tx | Free | Critical identity, frequent access |
| Warm | ~$0.001/GB/month | Free | Archived conversations, summaries |
| Cold | Disk space only | Free | Temporary context, session data |

### 6.3 Throughput Limits

```
Hot Tier (Solana):
- Write: ~400 TPS (limited by Solana network)
- Read: Unlimited (RPC caching)

Warm Tier (IPFS):
- Write: ~50 MB/s (gateway dependent)
- Read: ~100 MB/s (gateway dependent)

Cold Tier (Local):
- Write: ~500 MB/s (SSD)
- Read: ~1 GB/s (SSD)
```

---

## 7. Error Handling & Recovery

### 7.1 Failure Modes

```typescript
enum MemoryError {
  SOLANA_TX_FAILED = 'solana_tx_failed',
  IPFS_UPLOAD_FAILED = 'ipfs_upload_failed',
  ENCRYPTION_FAILED = 'encryption_failed',
  TIER_MIGRATION_FAILED = 'tier_migration_failed',
  IDENTITY_CORRUPTED = 'identity_corrupted'
}

interface ErrorRecovery {
  // Automatic retry with backoff
  retry: {
    maxAttempts: number;
    backoffMs: number;
    maxBackoffMs: number;
  };
  
  // Fallback behaviors
  fallback: {
    onHotStoreFail: 'promote_to_warm' | 'store_cold' | 'fail';
    onWarmStoreFail: 'store_cold' | 'fail';
    onColdStoreFail: 'fail';
  };
  
  // Circuit breaker
  circuitBreaker: {
    failureThreshold: number;
    resetTimeoutMs: number;
  };
}
```

### 7.2 Recovery Procedures

```typescript
// Example: Hot storage failure → fallback to Warm
async function storeWithFallback(data: MemoryData, tier: StorageTier): Promise<MemoryRef> {
  try {
    return await storeOnSolana(data);
  } catch (error) {
    console.warn('Hot storage failed, falling back to Warm:', error);
    
    // Store in Warm tier instead
    const warmRef = await storeOnIPFS(data);
    
    // Schedule retry for Hot tier
    await scheduleHotStorageRetry(data, warmRef);
    
    return warmRef;
  }
}
```

---

## 8. Security Considerations

### 8.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| Memory tampering | On-chain storage provides immutable audit trail |
| Unauthorized access | Encryption keys stored only locally (Cold tier) |
| Metadata leakage | Content hashed before public storage |
| Replay attacks | Timestamps + nonces on all transactions |
| Key compromise | Multi-sig for critical identity operations |

### 8.2 Privacy Levels

```typescript
enum PrivacyLevel {
  PUBLIC = 'public',      // Unencrypted, verifiable by anyone
  PROTECTED = 'protected', // Encrypted, shared with specific agents
  PRIVATE = 'private'      // Encrypted, never leaves local storage
}

interface PrivacyConfig {
  defaultLevel: PrivacyLevel;
  
  // Auto-assign based on content
  rules: {
    containsPII: PrivacyLevel.PRIVATE,
    containsCredentials: PrivacyLevel.PRIVATE,
    isIdentityCore: PrivacyLevel.PROTECTED,
    isGeneralKnowledge: PrivacyLevel.PUBLIC
  };
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// test/adapter.test.ts
describe('AgentMemoryAdapter', () => {
  it('should store and retrieve from Hot tier', async () => {
    const ref = await adapter.storeMemory(data, StorageTier.HOT);
    const retrieved = await adapter.retrieveMemory(ref);
    expect(retrieved.content).toEqual(data.content);
  });
  
  it('should auto-promote based on access patterns', async () => {
    const ref = await adapter.storeMemory(data, StorageTier.COLD);
    
    // Simulate frequent access
    for (let i = 0; i < 5; i++) {
      await adapter.retrieveMemory(ref);
    }
    
    const updated = await adapter.getMemoryRef(ref.id);
    expect(updated.tier).toBe(StorageTier.HOT);
  });
  
  it('should export and import identity', async () => {
    const bundle = await adapter.exportIdentity();
    const newAdapter = new AgentMemoryAdapter(config);
    await newAdapter.importIdentity(bundle);
    
    expect(newAdapter.agentId).toBe(adapter.agentId);
  });
});
```

### 9.2 Integration Tests

```typescript
// test/integration.test.ts
describe('ElizaOS Integration', () => {
  it('should register as ElizaOS memory provider', async () => {
    const agent = createAgent({ plugins: [agentMemoryPlugin] });
    expect(agent.memory.provider).toBeDefined();
  });
  
  it('should persist across agent restarts', async () => {
    // Create and shutdown agent
    const agent1 = createAgent({ /* config */ });
    const ref = await agent1.memory.store(data);
    await agent1.shutdown();
    
    // Create new agent instance
    const agent2 = createAgent({ /* same config */ });
    const retrieved = await agent2.memory.retrieve(ref);
    
    expect(retrieved).toEqual(data);
  });
});
```

---

## 10. Roadmap

### Phase 1: MVP (Current)
- [x] Core adapter interface
- [x] Hot/Warm/Cold tier implementation
- [x] ElizaOS memory provider registration
- [x] Identity export/import

### Phase 2: Enhanced Integration
- [ ] Automatic tier assignment heuristics
- [ ] Multi-agent memory sharing
- [ ] Compression optimization
- [ ] Circuit breaker implementation

### Phase 3: Advanced Features
- [ ] Vector search integration (Pinecone/Weaviate)
- [ ] zk-SNARK proofs for memory integrity
- [ ] Decentralized agent identity (DID)
- [ ] Cross-chain memory bridges

### Phase 4: Ecosystem
- [ ] ElizaOS plugin marketplace
- [ ] Memory analytics dashboard
- [ ] Community memory pools
- [ ] Agent memory marketplace

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Hot Storage** | Solana on-chain storage for critical, frequently accessed memories |
| **Warm Storage** | IPFS/Filecoin for archived, occasionally accessed memories |
| **Cold Storage** | Local encrypted storage for temporary, session-scoped data |
| **Tier Migration** | Moving memories between storage tiers based on access patterns |
| **Identity Bundle** | Portable package of agent identity + critical memories |
| **Memory Ref** | Reference object containing location info for a stored memory |

## Appendix B: References

1. **ElizaOS Documentation:** https://elizaos.github.io/eliza/docs/
2. **AgentMemory Protocol:** https://github.com/momoshin/AgentMemory
3. **Solana Web3.js:** https://solana-labs.github.io/solana-web3.js/
4. **IPFS Documentation:** https://docs.ipfs.tech/

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-06 | Initial specification |

---

**Document Status:** Ready for Implementation  
**Next Review:** Post-MVP Integration Testing
