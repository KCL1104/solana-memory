# AgentMemory Smart Contract Architecture

> **Technical architecture and design decisions for the AgentMemory protocol**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Security Model](#security-model)
5. [Account Structures](#account-structures)
6. [Instructions](#instructions)
7. [Events System](#events-system)
8. [Optimization Strategies](#optimization-strategies)
9. [Deployment Architecture](#deployment-architecture)
10. [Security Considerations](#security-considerations)
11. [Performance Benchmarks](#performance-benchmarks)
12. [Testing Strategy](#testing-strategy)
13. [Future Enhancements](#future-enhancements)

---

## Overview

AgentMemory is a Solana-based protocol for persistent, encrypted AI agent memory storage. It provides secure on-chain storage for memory metadata with end-to-end encryption support, enabling AI agents to maintain state across sessions while ensuring human ownership and control.

### Design Principles

1. **Privacy-First**: All content encrypted client-side before reaching the blockchain
2. **Human Ownership**: Humans own the vaults, agents operate on their behalf
3. **Verifiable**: All operations are transparent and auditable on-chain
4. **Scalable**: Batch operations and efficient data structures for cost optimization
5. **Extensible**: Modular design allowing future enhancements

---

## Core Components

### 1. MemoryVault

The top-level container for an agent's memory system.

**Purpose:**
- Owns all memory shards for an agent-human pair
- Manages encryption keys
- Tracks storage quotas and staking
- Serves as the access control root

**Key Features:**
- Unique per owner-agent pair
- Stores encryption public key (not private key)
- Tracks memory statistics (count, total size)
- Economic parameters (staked amount, reward points)

```rust
pub struct MemoryVault {
    pub owner: Pubkey,              // Human owner
    pub agent_key: Pubkey,          // Agent public key
    pub encryption_pubkey: [u8; 32], // For client-side encryption
    pub created_at: i64,
    pub updated_at: i64,
    pub memory_count: u32,
    pub total_memory_size: u64,
    pub staked_amount: u64,
    pub reward_points: u32,
}
```

---

### 2. MemoryShard

Individual memory entries with version control and metadata.

**Purpose:**
- Stores encrypted content hash (not content itself)
- Tracks content size and metadata
- Maintains version history
- Supports soft deletion

**Key Features:**
- Content identified by SHA-256 hash
- Version history (last 10 versions)
- Metadata for categorization and search
- Soft delete with recovery option

```rust
pub struct MemoryShard {
    pub vault: Pubkey,              // Parent vault
    pub key: String,                // Memory identifier
    pub content_hash: [u8; 32],     // SHA-256 of encrypted content
    pub content_size: u32,          // Size in bytes
    pub metadata: MemoryMetadata,   // Type, importance, tags
    pub version: u32,               // Current version
    pub is_deleted: bool,           // Soft delete flag
    pub deleted_at: Option<i64>,
    pub version_history: Vec<VersionRecord>, // Last 10 versions
    pub created_at: i64,
    pub updated_at: i64,
}
```

---

### 3. AgentProfile

Public agent information and reputation tracking.

**Purpose:**
- Public capabilities advertisement
- Reputation scoring
- Task completion tracking
- Agent discoverability

**Key Features:**
- Display name and capabilities
- Reputation score (0-10000)
- Tasks completed counter
- Public/private visibility

```rust
pub struct AgentProfile {
    pub agent_key: Pubkey,
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub name: String,
    pub capabilities: Vec<String>,
    pub reputation_score: u32,
    pub tasks_completed: u32,
    pub is_public: bool,
}
```

---

### 4. AccessGrant

Fine-grained access control for memory sharing.

**Purpose:**
- Grant other agents access to vault
- Define permission levels
- Support time-limited access
- Enable access revocation

**Permission Levels:**
- `None` (0): No access
- `Read` (1): Can read memories
- `Write` (2): Can read and write
- `Admin` (3): Full access including grants

```rust
pub struct AccessGrant {
    pub vault: Pubkey,
    pub grantee: Pubkey,
    pub permission_level: u8,
    pub granted_at: i64,
    pub expires_at: Option<i64>,
    pub is_active: bool,
    pub revoked_at: Option<i64>,
}
```

---

### 5. SharingGroup

Collaborative memory access for teams.

**Purpose:**
- Multi-member access groups
- Hierarchical permissions
- Efficient member management
- Team-based collaboration

```rust
pub struct SharingGroup {
    pub creator: Pubkey,
    pub vault: Pubkey,
    pub name: String,
    pub description: String,
    pub members: Vec<GroupMember>,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_active: bool,
}

pub struct GroupMember {
    pub member: Pubkey,
    pub permission: u8,
    pub joined_at: i64,
}
```

---

### 6. ProtocolConfig

Global protocol settings and governance.

**Purpose:**
- Fee parameters
- Size limits
- Admin controls
- Emergency pause mechanism

```rust
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub storage_fee_per_byte: u64,
    pub min_stake_per_byte: u64,
    pub max_batch_size: u32,
    pub max_memory_size: u32,
    pub max_key_length: u32,
    pub reward_rate: u32,
    pub is_paused: bool,
}
```

---

## Data Flow

### Storing a Memory

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│  Encryption  │────▶│   IPFS       │
│  (User/App)  │     │(ChaCha20-Poly)│    │ (if >10MB)   │
└──────────────┘     └──────────────┘     └──────────────┘
        │
        │ Content Hash
        ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Solana TX   │────▶│  Program     │────▶│ MemoryShard  │
│  (Metadata)  │     │ Instruction  │     │   Account    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Flow:**
1. Client encrypts content with ChaCha20-Poly1305
2. If content > 10MB, upload to IPFS, get CID
3. Calculate SHA-256 hash of encrypted content
4. Submit transaction with hash, size, and metadata
5. Program validates and stores in MemoryShard account
6. Emit MemoryStored event

### Retrieving a Memory

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   Solana     │────▶│  MemoryShard │
│  (Request)   │     │   RPC Call   │     │   Account    │
└──────────────┘     └──────────────┘     └──────────────┘
        ▲                                            │
        │                                            │
        │         ┌──────────────┐                   │
        └─────────│  Decryption  │◀──────────────────┘
          Content │(ChaCha20-Poly)│     Content Hash
                  └──────────────┘
```

**Flow:**
1. Client queries MemoryShard account from Solana
2. Gets content hash, size, and metadata
3. Retrieves encrypted content from IPFS (if applicable)
4. Decrypts content with private key
5. Verifies hash matches for integrity

---

## Security Model

### Data Privacy

| Layer | Protection | Details |
|-------|------------|---------|
| **Encryption** | ChaCha20-Poly1305 | Client-side before reaching Solana |
| **Key Storage** | Off-chain | Private keys never touch blockchain |
| **Content Storage** | Hash only | Only SHA-256 hashes stored on-chain |
| **Large Content** | IPFS + encryption | Encrypted before IPFS upload |

### Access Control

| Mechanism | Implementation | Purpose |
|-----------|----------------|---------|
| **Ownership** | PDA derivation | Only owner can modify vault |
| **Grants** | AccessGrant accounts | Delegated access with limits |
| **Groups** | SharingGroup accounts | Team-based access |
| **Logging** | AccessLog accounts | Audit trail |

### Economic Security

| Mechanism | Implementation | Purpose |
|-----------|----------------|---------|
| **Staking** | Token staking required | Prevent spam |
| **Rate Limiting** | 1 task/minute max | Prevent abuse |
| **Dynamic Fees** | Per-byte fees | Fair cost distribution |
| **Rent** | Account rent exemption | Sustainable storage |

---

## Account Structures

### PDA Seeds

| Account | Seeds | Purpose |
|---------|-------|---------|
| **MemoryVault** | `["vault", owner, agent_key]` | Unique per owner-agent pair |
| **AgentProfile** | `["profile", agent_key]` | Unique per agent |
| **MemoryShard** | `["memory", vault, key]` | Unique per vault-key combo |
| **AccessGrant** | `["access", vault, grantee]` | Unique per vault-grantee |
| **SharingGroup** | `["group", vault, name]` | Unique per vault-name |
| **AccessLog** | `["log", memory, accessor]` | Unique per memory-accessor |
| **ProtocolConfig** | `["config"]` | Single global config |
| **VaultTokenAccount** | `["vault_tokens", vault]` | Token storage for vault |

### Account Sizes

| Account | Size | Rent (approx) |
|---------|------|---------------|
| MemoryVault | ~200 bytes | ~0.002 SOL |
| MemoryShard | ~300 bytes | ~0.003 SOL |
| AgentProfile | ~500 bytes | ~0.005 SOL |
| AccessGrant | ~150 bytes | ~0.001 SOL |
| SharingGroup | ~300 bytes | ~0.003 SOL |
| ProtocolConfig | ~200 bytes | ~0.002 SOL |

---

## Instructions

### Vault Management

| Instruction | Purpose | Access |
|-------------|---------|--------|
| `initialize_vault` | Create new vault and profile | Owner signer |
| `update_profile` | Update agent public profile | Owner signer |
| `record_task_completion` | Increment task counter | Owner signer, rate limited |

### Memory Operations

| Instruction | Purpose | Access |
|-------------|---------|--------|
| `store_memory` | Store/update memory | Owner or Write grant |
| `delete_memory` | Soft delete memory | Owner or Write grant |
| `permanent_delete_memory` | Close account, reclaim rent | Owner only |
| `rollback_memory` | Revert to previous version | Owner or Admin grant |

### Batch Operations

| Instruction | Purpose | Limits |
|-------------|---------|--------|
| `batch_create_memories` | Create multiple memories | Max 50 per batch |
| `batch_delete_memories` | Delete multiple memories | Max 50 per batch |
| `batch_update_tags` | Update tags for multiple | Max 50 per batch |

### Access Control

| Instruction | Purpose | Access |
|-------------|---------|--------|
| `grant_access` | Grant access to another agent | Owner or Admin |
| `revoke_access` | Revoke access grant | Owner or Admin |
| `create_sharing_group` | Create sharing group | Owner |
| `add_group_member` | Add member to group | Group creator |
| `remove_group_member` | Remove member from group | Group creator |

### Economic

| Instruction | Purpose | Access |
|-------------|---------|--------|
| `stake_for_storage` | Stake tokens for quota | Owner |
| `unstake_tokens` | Withdraw staked tokens | Owner |
| `claim_rewards` | Claim reward points | Owner |

### Governance

| Instruction | Purpose | Access |
|-------------|---------|--------|
| `initialize_protocol_config` | Initialize config (one-time) | Admin |
| `update_protocol_config` | Update parameters | Admin |
| `set_protocol_pause` | Pause/unpause protocol | Admin |
| `transfer_admin` | Transfer admin rights | Admin |

---

## Events System

All state changes emit events for indexing, audit trails, and off-chain synchronization.

### Event Categories

| Category | Events | Purpose |
|----------|--------|---------|
| **Core** | MemoryStored, MemoryUpdated, MemoryDeleted | Track memory lifecycle |
| **Version** | MemoryRolledBack, MemoryPermanentlyDeleted | Version control |
| **Batch** | BatchMemoryCreated, BatchMemoryDeleted | Batch operations |
| **Sharing** | SharingGroupCreated, GroupMemberAdded | Collaboration |
| **Economic** | TokensStaked, TokensUnstaked, RewardsClaimed | Token economics |
| **Governance** | ProtocolConfigUpdated, AdminTransferred | Admin actions |

### Event Structure

```rust
#[event]
pub struct MemoryStored {
    pub vault: Pubkey,
    pub key: String,
    pub version: u32,
    pub timestamp: i64,
}

#[event]
pub struct AccessGranted {
    pub vault: Pubkey,
    pub grantee: Pubkey,
    pub permission_level: u8,
    pub granted_at: i64,
    pub expires_at: Option<i64>,
}
```

---

## Optimization Strategies

### Compute Optimization

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Minimal Validation** | Only essential checks on-chain | Lower compute cost |
| **Efficient PDAs** | Canonical seeds, stored bumps | Faster derivation |
| **Batch Operations** | Process up to 50 items per TX | Reduced fees |
| **Off-chain History** | Only current version on-chain | Smaller accounts |

### Storage Optimization

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Fixed-size Fields** | Bounded strings and arrays | Predictable costs |
| **Optional Fields** | Rare data in Option<T> | Smaller base size |
| **Efficient Packing** | Proper field ordering | Reduced account size |
| **Rent Reclamation** | Close accounts when done | Recover SOL |

### Economic Optimization

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Staking Model** | Stake required for storage | Align incentives |
| **Dynamic Fees** | Fees based on storage used | Fair pricing |
| **Reward Distribution** | Points for usage | Encourage adoption |
| **Batch Discounts** | Lower per-item cost in batches | Encourage efficiency |

---

## Deployment Architecture

### Deployment Environments

| Environment | Network | Purpose |
|-------------|---------|---------|
| **Local** | Local validator | Development, testing |
| **Devnet** | Solana Devnet | Staging, integration tests |
| **Mainnet** | Solana Mainnet | Production |

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │   CLI Tool   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SDK Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Anchor     │  │    Custom    │  │   Adapter    │      │
│  │     SDK      │  │     SDK      │  │  (ElizaOS)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   RPC Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Helius     │  │   QuickNode  │  │   Custom     │      │
│  │     RPC      │  │     RPC      │  │     RPC      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Solana Blockchain                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Program    │  │   Accounts   │  │    Events    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing (>90% coverage)
- [ ] Security audit completed
- [ ] Program ID configured
- [ ] IDL generated and verified
- [ ] Documentation complete

**Deployment:**
- [ ] Deploy to devnet
- [ ] Verify on explorer
- [ ] Run integration tests
- [ ] Deploy frontend
- [ ] Configure monitoring

**Post-deployment:**
- [ ] Monitor events
- [ ] Track metrics
- [ ] Collect feedback
- [ ] Plan upgrades

---

## Security Considerations

### Smart Contract Security

| Concern | Mitigation | Status |
|---------|------------|--------|
| **Reentrancy** | No external calls in sensitive operations | ✅ Safe |
| **Integer Overflow** | Checked arithmetic throughout | ✅ Safe |
| **Access Control** | Comprehensive signer checks | ✅ Safe |
| **PDA Validation** | Seeds and bumps verified | ✅ Safe |
| **Type Cosplay** | Anchor discriminators | ✅ Safe |
| **Account Confusion** | Typed accounts, has_one constraints | ✅ Safe |

### Cryptographic Security

| Component | Algorithm | Implementation |
|-----------|-----------|----------------|
| **Encryption** | ChaCha20-Poly1305 | Client-side, tweetnacl-js |
| **Hashing** | SHA-256 | crypto.subtle / Node crypto |
| **Key Derivation** | PBKDF2 | For password-based keys |
| **Random Generation** | CSPRNG | window.crypto / crypto.randomBytes |

### Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Front-running** | Metadata is public | No sensitive data in metadata |
| **Key Compromise** | Memory exposure | Key rotation, multi-sig |
| **RPC Privacy** | RPC sees read patterns | Use private RPC endpoints |
| **Quantum Computing** | Future key risk | Plan for post-quantum |

### Security Audit Checklist

- [x] Encryption implementation reviewed
- [x] PDA seeds verified canonical
- [x] Access control logic verified
- [x] Error handling comprehensive
- [x] No reentrancy vulnerabilities
- [x] Arithmetic overflow protection
- [x] Event emission complete
- [x] Admin functions secured

---

## Performance Benchmarks

### Transaction Costs

| Operation | Compute Units | Fee (SOL) | Time (ms) |
|-----------|--------------|-----------|-----------|
| Initialize Vault | ~15,000 | ~0.0005 | ~400 |
| Store Memory | ~8,000 | ~0.0003 | ~300 |
| Update Memory | ~6,000 | ~0.00025 | ~250 |
| Delete Memory | ~5,000 | ~0.0002 | ~200 |
| Batch Create (50) | ~50,000 | ~0.0015 | ~600 |
| Grant Access | ~7,000 | ~0.00025 | ~250 |
| Stake Tokens | ~10,000 | ~0.00035 | ~350 |

### Storage Costs

| Account Type | Size | Rent (SOL) |
|--------------|------|------------|
| MemoryVault | 200 bytes | 0.002 |
| MemoryShard | 300 bytes | 0.003 |
| AgentProfile | 500 bytes | 0.005 |
| AccessGrant | 150 bytes | 0.0015 |

### Throughput

| Metric | Value |
|--------|-------|
| Max Batch Size | 50 memories |
| Max Memory Size | 10 MB |
| Max Key Length | 64 characters |
| Version History | 10 versions |
| Max Group Size | 100 members |
| Rate Limit | 1 task/minute |

### Scalability Projections

| Users | Daily TXs | Monthly Cost (SOL) |
|-------|-----------|-------------------|
| 1,000 | 10,000 | ~3 |
| 10,000 | 100,000 | ~30 |
| 100,000 | 1,000,000 | ~300 |

---

## Testing Strategy

### Test Coverage

| Component | Unit Tests | Integration | E2E |
|-----------|------------|-------------|-----|
| Instructions | 45+ | 15+ | 5+ |
| Account Validation | 20+ | 10+ | 3+ |
| Access Control | 15+ | 8+ | 2+ |
| Batch Operations | 10+ | 5+ | 2+ |
| Economic Model | 8+ | 4+ | 1+ |

### Test Types

1. **Unit Tests**: Individual instruction validation
2. **Integration Tests**: Multi-instruction workflows
3. **Security Tests**: Attack vector simulation
4. **Fuzz Tests**: Random input testing
5. **Load Tests**: High volume scenarios

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Solana
        run: sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
      - name: Setup Anchor
        run: cargo install --git https://github.com/coral-xyz/anchor avm --locked
      - name: Run tests
        run: anchor test
```

---

## Future Enhancements

### Planned Features (v2.1)

| Feature | Description | Priority |
|---------|-------------|----------|
| **IPFS Integration** | Native IPFS content addressing | High |
| **Encryption Key Rotation** | Automated key rotation | High |
| **Multi-sig Vaults** | Require multiple signatures | Medium |
| **Time-locked Memories** | Unlock at specific time | Medium |
| **Memory Compression** | Compress before encryption | Medium |

### Research Areas

| Area | Description |
|------|-------------|
| **ZK Proofs** | Prove memory properties without revealing content |
| **Homomorphic Encryption** | Compute on encrypted data |
| **Cross-chain Bridges** | Memory portability across chains |
| **AI-native Queries** | Semantic search on encrypted content |

---

## Resources

### Documentation
- [API Reference](../API.md)
- [Deployment Guide](../DEPLOY.md)
- [Integration Guides](../docs/INTEGRATION.md)
- [Best Practices](../BEST-PRACTICES.md)

### External References
- [Anchor Framework](https://anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Program Library](https://spl.solana.com/)
- [ChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305)

---

*Last Updated: February 2026*
