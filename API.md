# AgentMemory Protocol API Reference

> **Version:** 2.0.0  
> **Last Updated:** February 2026

Complete API reference for the AgentMemory smart contract protocol.

---

## Table of Contents

1. [Core API (v1)](#core-api-v1)
2. [Extended API (v2)](#extended-api-v2)
3. [Account Types](#account-types)
4. [PDA Seeds](#pda-seeds)
5. [Events](#events)
6. [Error Codes](#error-codes)

---

## Core API (v1)

### Vault Management

#### `initialize_vault(encryption_pubkey: [u8; 32])`
Creates a new memory vault and agent profile.

**Accounts:**
- `owner` (signer, mut) — Human owner
- `agent_key` — Agent's public key
- `vault` (mut) — PDA for vault account
- `agent_profile` (mut) — PDA for profile account

**Example:**
```typescript
await program.methods
  .initializeVault(Array.from(encryptionPubkey))
  .accounts({
    owner: owner.publicKey,
    agentKey: agentKey.publicKey,
    vault: vaultPda,
    agentProfile: profilePda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

#### `update_profile(name?, capabilities?, is_public?)`
Update agent public profile.

**Parameters:**
- `name: Option<String>` — Agent display name (max 128 chars)
- `capabilities: Option<Vec<String>>` — List of capabilities (max 20)
- `is_public: Option<bool>` — Profile visibility

---

#### `record_task_completion()`
Increment task counter and update reputation.

---

### Memory Operations

#### `store_memory(key, content_hash, content_size, metadata)`
Store or update a memory shard.

**Parameters:**
- `key: String` — Memory identifier (max 64 chars)
- `content_hash: [u8; 32]` — SHA-256 hash of encrypted content
- `content_size: u32` — Size in bytes (max 10MB)
- `metadata: MemoryMetadata` — Type, importance, tags, optional IPFS CID

**Accounts:**
- `owner` (signer, mut)
- `vault` (mut)
- `memory_shard` (mut)

---

#### `delete_memory()`
Remove a memory shard (soft delete).

**Accounts:**
- `owner` (signer, mut)
- `vault` (mut)
- `memory_shard` (mut)

---

### Access Control

#### `grant_access(permission_level, expiration?)`
Grant another agent access to your memory.

**Parameters:**
- `permission_level: PermissionLevel` — None (0), Read (1), Write (2), or Admin (3)
- `expiration: Option<i64>` — Unix timestamp when access expires

**Accounts:**
- `owner` (signer, mut)
- `vault`
- `grantee` — Agent being granted access
- `access_grant` (mut)

---

#### `revoke_access()`
Revoke access grant.

---

## Extended API (v2)

### Version Control

#### `rollback_memory(target_version: u32)`
Rollback memory to a specific version.

```typescript
const tx = await program.methods
  .rollbackMemory(new BN(3))  // Rollback to version 3
  .accounts({
    owner: wallet.publicKey,
    memoryShard: memoryPda,
  })
  .rpc();
```

---

#### `permanent_delete_memory()`
Permanently delete memory and reclaim rent.

```typescript
await program.methods
  .permanentDeleteMemory()
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    memoryShard: memoryPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

### Batch Operations

#### `batch_create_memories(memories: Vec<BatchMemoryInput>)`
Create multiple memories in one transaction (max 50).

```typescript
const memories = [
  {
    key: "memory1",
    contentHash: Buffer.from(hash1),
    contentSize: 1024,
    metadata: {
      memoryType: { knowledge: {} },
      importance: 80,
      tags: [1, 0, 0, 0, 0, 0, 0, 0],
      ipfsCid: null,
    },
  },
  // ... up to 50
];

const tx = await program.methods
  .batchCreateMemories(memories)
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
  })
  .rpc();
```

---

#### `batch_delete_memories(keys: Vec<String>)`
Delete multiple memories at once (max 50).

```typescript
const memoryKeys = ["memory1", "memory2", "memory3"];

const tx = await program.methods
  .batchDeleteMemories(memoryKeys)
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
  })
  .rpc();
```

---

#### `batch_update_tags(updates: Vec<TagUpdate>)`
Update tags for multiple memories (max 50).

```typescript
const tagUpdates = [
  { memoryKey: "memory1", newTags: [1, 2, 0, 0, 0, 0, 0, 0] },
  { memoryKey: "memory2", newTags: [3, 0, 0, 0, 0, 0, 0, 0] },
];

const tx = await program.methods
  .batchUpdateTags(tagUpdates)
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
  })
  .rpc();
```

---

### Sharing Groups

#### `create_sharing_group(name, description)`
Create a new sharing group.

```typescript
const [groupPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("group"),
    vaultPda.toBuffer(),
    Buffer.from("My Research Group"),
  ],
  program.programId
);

const tx = await program.methods
  .createSharingGroup("My Research Group", "Group for sharing research memories")
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    sharingGroup: groupPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

#### `add_group_member(member, permission_level)`
Add a member to a sharing group.

```typescript
const memberKey = new PublicKey("...");
const permissionLevel = { read: {} }; // or { write: {} }, { admin: {} }

const tx = await program.methods
  .addGroupMember(memberKey, permissionLevel)
  .accounts({
    owner: wallet.publicKey,
    sharingGroup: groupPda,
  })
  .rpc();
```

---

#### `remove_group_member(member)`
Remove a member from a sharing group.

```typescript
const tx = await program.methods
  .removeGroupMember(memberKey)
  .accounts({
    owner: wallet.publicKey,
    sharingGroup: groupPda,
  })
  .rpc();
```

---

### Access Logging

#### `log_memory_access(access_type)`
Log access to a memory shard.

```typescript
const accessType = { read: {} }; // { write: {} }, { delete: {} }, or { share: {} }

const tx = await program.methods
  .logMemoryAccess(accessType)
  .accounts({
    accessor: wallet.publicKey,
    memoryShard: memoryPda,
    accessLog: logPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

### Economic Model

#### `stake_for_storage(amount)`
Stake tokens to earn storage quota.

```typescript
import { getAssociatedTokenAddress } from "@solana/spl-token";

const ownerAta = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true);

const tx = await program.methods
  .stakeForStorage(new BN(1000000))  // Stake 1 token (6 decimals)
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    ownerTokenAccount: ownerAta,
    vaultTokenAccount: vaultAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

---

#### `unstake_tokens(amount)`
Unstake tokens from storage.

```typescript
const tx = await program.methods
  .unstakeTokens(new BN(500000))  // Unstake 0.5 tokens
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    vaultTokenAccount: vaultAta,
    ownerTokenAccount: ownerAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

---

#### `claim_rewards()`
Claim reward points.

```typescript
const tx = await program.methods
  .claimRewards()
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
  })
  .rpc();

// Query reward points
const vault = await program.account.memoryVault.fetch(vaultPda);
console.log("Reward points:", vault.rewardPoints);
```

---

### Governance

#### `initialize_protocol_config(config)`
Initialize protocol configuration (one-time).

```typescript
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

const tx = await program.methods
  .initializeProtocolConfig({
    storageFeePerByte: new BN(1),
    minStakePerByte: new BN(10),
    maxBatchSize: 50,
    maxMemorySize: 10000000,
    maxKeyLength: 64,
    rewardRate: 100,
  })
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

#### `update_protocol_config(config)`
Update protocol parameters (admin only).

```typescript
const tx = await program.methods
  .updateProtocolConfig({
    storageFeePerByte: new BN(2),
    minStakePerByte: null,
    maxBatchSize: null,
    maxMemorySize: null,
    rewardRate: new BN(150),
  })
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
  })
  .rpc();
```

---

#### `set_protocol_pause(paused)`
Pause or unpause the protocol.

```typescript
await program.methods
  .setProtocolPause(true)
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
  })
  .rpc();
```

---

#### `transfer_admin(new_admin)`
Transfer admin rights.

```typescript
const newAdmin = new PublicKey("...");

const tx = await program.methods
  .transferAdmin(newAdmin)
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
  })
  .rpc();
```

---

## Account Types

### MemoryVault
| Field | Type | Description |
|-------|------|-------------|
| owner | Pubkey | Human owner |
| agent_key | Pubkey | Agent public key |
| encryption_pubkey | [u8; 32] | For client-side encryption |
| created_at | i64 | Creation timestamp |
| updated_at | i64 | Last update timestamp |
| memory_count | u32 | Number of memory shards |
| total_memory_size | u64 | Total bytes stored |
| staked_amount | u64 | Current staked amount |
| reward_points | u32 | Reward points |

### MemoryShard
| Field | Type | Description |
|-------|------|-------------|
| vault | Pubkey | Parent vault |
| key | String | Memory identifier |
| content_hash | [u8; 32] | SHA-256 of encrypted content |
| content_size | u32 | Size in bytes |
| metadata | MemoryMetadata | Type, importance, tags |
| version | u32 | Current version |
| is_deleted | bool | Soft delete flag |
| deleted_at | Option<i64> | Deletion timestamp |
| version_history | Vec<VersionRecord> | Last 10 versions |

### AgentProfile
| Field | Type | Description |
|-------|------|-------------|
| agent_key | Pubkey | Agent identifier |
| owner | Pubkey | Human owner |
| vault | Pubkey | Associated vault |
| name | String | Display name |
| capabilities | Vec<String> | Skills/capabilities |
| reputation_score | u32 | Calculated from tasks |
| tasks_completed | u32 | Total completed tasks |
| is_public | bool | Visibility setting |

### AccessGrant
| Field | Type | Description |
|-------|------|-------------|
| vault | Pubkey | Source vault |
| grantee | Pubkey | Agent with access |
| permission_level | u8 | 0=None, 1=Read, 2=Write, 3=Admin |
| granted_at | i64 | Grant timestamp |
| expires_at | Option<i64> | Expiration timestamp |
| is_active | bool | Active status |

### SharingGroup
| Field | Type | Description |
|-------|------|-------------|
| creator | Pubkey | Group creator |
| vault | Pubkey | Associated vault |
| name | String | Group name |
| description | String | Group description |
| members | Vec<GroupMember> | Group members |
| created_at | i64 | Creation timestamp |
| updated_at | i64 | Last update timestamp |
| is_active | bool | Active status |

### ProtocolConfig
| Field | Type | Description |
|-------|------|-------------|
| admin | Pubkey | Admin address |
| storage_fee_per_byte | u64 | Storage fee rate |
| min_stake_per_byte | u64 | Minimum stake required |
| max_batch_size | u32 | Max items in batch |
| max_memory_size | u32 | Max memory size |
| max_key_length | u32 | Max key length |
| reward_rate | u32 | Reward rate (basis points) |
| is_paused | bool | Protocol pause status |

---

## PDA Seeds

| Account | Seeds |
|---------|-------|
| Vault | `["vault", owner_pubkey, agent_pubkey]` |
| Profile | `["profile", agent_pubkey]` |
| Memory Shard | `["memory", vault_pubkey, key_bytes]` |
| Access Grant | `["access", vault_pubkey, grantee_pubkey]` |
| Sharing Group | `["group", vault_pubkey, name_bytes]` |
| Access Log | `["log", memory_pubkey, accessor_pubkey]` |
| Protocol Config | `["config"]` |

---

## Events

### Core Events
- `MemoryStored` — New memory created
- `MemoryUpdated` — Memory modified
- `MemoryDeleted` — Memory deleted
- `AccessGranted` — Access permission given
- `AccessRevoked` — Access permission removed

### Version Control Events
- `MemoryRolledBack` — Memory rolled back to previous version
- `MemoryPermanentlyDeleted` — Memory permanently removed

### Batch Events
- `BatchMemoryCreated` — Multiple memories created
- `BatchMemoryDeleted` — Multiple memories deleted
- `BatchTagsUpdated` — Tags updated for multiple memories

### Sharing Events
- `SharingGroupCreated` — New sharing group created
- `GroupMemberAdded` — Member added to group
- `GroupMemberRemoved` — Member removed from group

### Economic Events
- `TokensStaked` — Tokens staked for storage
- `TokensUnstaked` — Tokens unstaked
- `RewardsClaimed` — Rewards claimed

### Governance Events
- `ProtocolConfigInitialized` — Config initialized
- `ProtocolConfigUpdated` — Config updated
- `ProtocolPauseChanged` — Pause status changed
- `AdminTransferred` — Admin rights transferred

---

## Error Codes

### Validation Errors
| Code | Description |
|------|-------------|
| `KeyTooLong` | Memory key exceeds 64 characters |
| `ContentTooLarge` | Content exceeds 10MB limit |
| `EmptyKey` | Key cannot be empty |
| `EmptyName` | Name cannot be empty |
| `EmptyCapability` | Capability cannot be empty |

### Rate Limiting
| Code | Description |
|------|-------------|
| `TaskRateLimitExceeded` | Too many task completions (max 1/min) |
| `BatchTooLarge` | Batch size exceeds 50 |
| `InvalidBatchSize` | Invalid batch operation |

### Version Control
| Code | Description |
|------|-------------|
| `InvalidVersion` | Invalid version number |
| `InvalidRollbackVersion` | Cannot rollback to specified version |
| `VersionNotFound` | Requested version not found |
| `MemoryNotDeleted` | Memory not in deleted state |

### Sharing Groups
| Code | Description |
|------|-------------|
| `EmptyGroupName` | Group name cannot be empty |
| `GroupNameTooLong` | Group name exceeds 64 characters |
| `GroupDescTooLong` | Description exceeds 256 characters |
| `GroupTooLarge` | Group exceeds 100 members |
| `MemberAlreadyExists` | Member already in group |
| `MemberNotFound` | Member not found in group |
| `NotGroupCreator` | Only creator can modify group |

### Economic
| Code | Description |
|------|-------------|
| `InvalidStakeAmount` | Invalid stake amount |
| `InvalidUnstakeAmount` | Invalid unstake amount |
| `InsufficientStake` | Not enough staked tokens |
| `StakeBelowMinimum` | Stake below required minimum |
| `NoRewardsAvailable` | No rewards to claim |

### Governance
| Code | Description |
|------|-------------|
| `ProtocolPaused` | Protocol is currently paused |
| `UnauthorizedAdmin` | Caller is not admin |

---

## Best Practices

### Batch Operations
```typescript
// Recommended: Process in batches of 50
const BATCH_SIZE = 50;
for (let i = 0; i < memories.length; i += BATCH_SIZE) {
  const batch = memories.slice(i, i + BATCH_SIZE);
  await program.methods.batchCreateMemories(batch)...;
}
```

### Version Management
```typescript
// Automatic cleanup of old versions (max 10 kept)
// No action needed - protocol handles this
```

### Stake Monitoring
```typescript
async function monitorStake(vaultPda: PublicKey) {
  const vault = await program.account.memoryVault.fetch(vaultPda);
  const requiredStake = (vault.totalMemorySize.toNumber() * 0.01) / 1_000_000;
  
  if (vault.stakedAmount.toNumber() < requiredStake * 1.1) {
    console.warn("Stake level low, consider adding more");
  }
}
```

### Error Handling
```typescript
import { AnchorError } from "@coral-xyz/anchor";

try {
  await program.methods.someInstruction()...rpc();
} catch (err) {
  if (err instanceof AnchorError) {
    switch (err.error.errorCode.code) {
      case "TaskRateLimitExceeded":
        console.error("Too many tasks, please wait");
        break;
      case "InsufficientStake":
        console.error("Not enough staked tokens");
        break;
      case "ProtocolPaused":
        console.error("Protocol is currently paused");
        break;
      default:
        console.error("Error:", err.error.errorMessage);
    }
  }
}
```

---

**Dependencies:**
```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

**Note:** All examples use Anchor Framework TypeScript SDK. Ensure you have the correct version installed.
