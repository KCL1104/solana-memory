# AgentMemory Protocol API Reference

> **Version:** 2.0.0  
> **Last Updated:** February 2026

Complete API reference for the AgentMemory smart contract protocol.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core API (v1)](#core-api-v1)
3. [Extended API (v2)](#extended-api-v2)
4. [Query Operations](#query-operations)
5. [Event Listening](#event-listening)
6. [Account Types](#account-types)
7. [PDA Seeds](#pda-seeds)
8. [Events](#events)
9. [Error Codes](#error-codes)
10. [SDK Reference](#sdk-reference)

---

## Overview

### Program Information

| Network | Program ID |
|---------|------------|
| Devnet | `HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L` |
| Mainnet | *Coming Soon* |

### TypeScript SDK Installation

```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

### Basic Setup

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import idl from './idl.json';

const connection = new Connection('https://api.devnet.solana.com');
const wallet = /* your wallet */;
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
const program = new Program(idl, new PublicKey('YOUR_PROGRAM_ID'), provider);
```

---

## Core API (v1)

### Vault Management

#### `initialize_vault(encryption_pubkey: [u8; 32])`

Creates a new memory vault and agent profile for an agent-human pair.

**Parameters:**
- `encryption_pubkey`: 32-byte public key for client-side encryption (ChaCha20-Poly1305)

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer, Mut | Human owner of the vault |
| `agent_key` | Pubkey | Agent's public key |
| `vault` | Mut, PDA | Vault account to create |
| `agent_profile` | Mut, PDA | Profile account to create |
| `system_program` | Program | System program |

**Returns:** Transaction signature

**Example:**
```typescript
import { SystemProgram } from '@solana/web3.js';

// Generate encryption key (in production, use proper key generation)
const encryptionKeypair = Keypair.generate();
const encryptionPubkey = encryptionKeypair.publicKey.toBytes();

// Derive PDAs
const [vaultPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('vault'),
    owner.publicKey.toBuffer(),
    agentKeypair.publicKey.toBuffer(),
  ],
  program.programId
);

const [profilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from('profile'), agentKeypair.publicKey.toBuffer()],
  program.programId
);

// Initialize vault
try {
  const tx = await program.methods
    .initializeVault(Array.from(encryptionPubkey))
    .accounts({
      owner: owner.publicKey,
      agentKey: agentKeypair.publicKey,
      vault: vaultPda,
      agentProfile: profilePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Vault created:', vaultPda.toBase58());
  console.log('Transaction:', tx);
} catch (error) {
  console.error('Failed to initialize vault:', error);
}
```

---

#### `update_profile(name?, capabilities?, is_public?)`

Update agent public profile information.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `Option<String>` | Agent display name (max 128 chars) |
| `capabilities` | `Option<Vec<String>>` | List of capabilities (max 20) |
| `is_public` | `Option<bool>` | Profile visibility |

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer | Human owner |
| `agent_profile` | Mut | Profile account to update |

**Example:**
```typescript
try {
  const tx = await program.methods
    .updateProfile(
      'Research Assistant',                    // name
      ['data-analysis', 'report-writing'],     // capabilities
      true                                      // is_public
    )
    .accounts({
      owner: owner.publicKey,
      agentProfile: profilePda,
    })
    .rpc();

  console.log('Profile updated');
} catch (error) {
  if (error.message.includes('NameTooLong')) {
    console.error('Name exceeds 128 characters');
  } else {
    console.error('Update failed:', error);
  }
}
```

---

#### `record_task_completion()`

Increment task completion counter and update reputation score.

**Rate Limit:** Maximum 1 call per minute per profile

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer | Human owner |
| `agent_profile` | Mut | Profile to update |

**Example:**
```typescript
try {
  const tx = await program.methods
    .recordTaskCompletion()
    .accounts({
      owner: owner.publicKey,
      agentProfile: profilePda,
    })
    .rpc();

  // Fetch updated profile
  const profile = await program.account.agentProfile.fetch(profilePda);
  console.log('Tasks completed:', profile.tasksCompleted);
  console.log('Reputation score:', profile.reputationScore);
} catch (error) {
  if (error.message.includes('TaskRateLimitExceeded')) {
    console.error('Too many tasks. Please wait before recording another.');
  } else {
    console.error('Failed to record task:', error);
  }
}
```

---

### Memory Operations

#### `store_memory(key, content_hash, content_size, metadata)`

Store a new memory shard or update an existing one.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `String` | Memory identifier (max 64 chars) |
| `content_hash` | `[u8; 32]` | SHA-256 hash of encrypted content |
| `content_size` | `u32` | Size in bytes (max 10MB) |
| `metadata` | `MemoryMetadata` | Memory type, importance, tags, IPFS CID |

**MemoryMetadata Structure:**
```typescript
{
  memoryType: { knowledge: {} } | { conversation: {} } | { task: {} } | { preference: {} },
  importance: number,  // 0-100
  tags: number[8],     // Array of 8 tag indices (0 = unused)
  ipfsCid: string | null  // Optional IPFS CID for large content
}
```

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer, Mut | Vault owner |
| `vault` | Mut | Parent vault |
| `memory_shard` | Mut, PDA | Memory account (created if new) |
| `system_program` | Program | System program |

**Example:**
```typescript
import { createHash } from 'crypto';

// Prepare content
const content = JSON.stringify({ theme: 'dark', language: 'en' });
const contentHash = createHash('sha256').update(content).digest();
const contentSize = content.length;

// Derive memory PDA
const [memoryPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('memory'),
    vaultPda.toBuffer(),
    Buffer.from('user-preferences'),
  ],
  program.programId
);

try {
  const tx = await program.methods
    .storeMemory(
      'user-preferences',
      Array.from(contentHash),
      contentSize,
      {
        memoryType: { preference: {} },
        importance: 80,
        tags: [1, 2, 0, 0, 0, 0, 0, 0], // Tag indices 1 and 2
        ipfsCid: null,
      }
    )
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
      memoryShard: memoryPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Memory stored:', memoryPda.toBase58());
} catch (error) {
  if (error.message.includes('KeyTooLong')) {
    console.error('Key must be 64 characters or less');
  } else if (error.message.includes('ContentTooLarge')) {
    console.error('Content exceeds 10MB limit');
  } else {
    console.error('Storage failed:', error);
  }
}
```

---

#### `delete_memory()`

Soft delete a memory shard (marks as deleted, retains data).

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer, Mut | Vault owner |
| `vault` | Mut | Parent vault |
| `memory_shard` | Mut | Memory to delete |

**Example:**
```typescript
try {
  const tx = await program.methods
    .deleteMemory()
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
      memoryShard: memoryPda,
    })
    .rpc();

  console.log('Memory soft-deleted');
  
  // Verify deletion
  const memory = await program.account.memoryShard.fetch(memoryPda);
  console.log('Is deleted:', memory.isDeleted);
  console.log('Deleted at:', new Date(memory.deletedAt * 1000));
} catch (error) {
  console.error('Deletion failed:', error);
}
```

---

### Access Control

#### `grant_access(permission_level, expiration?)`

Grant another agent access to your memory vault.

**Permission Levels:**
| Level | Value | Description |
|-------|-------|-------------|
| `None` | 0 | No access |
| `Read` | 1 | Can read memories |
| `Write` | 2 | Can read and write |
| `Admin` | 3 | Full access including grants |

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `permission_level` | `PermissionLevel` | Access level to grant |
| `expiration` | `Option<i64>` | Unix timestamp when access expires (optional) |

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer, Mut | Vault owner |
| `vault` | | Vault to grant access to |
| `grantee` | | Agent being granted access |
| `access_grant` | Mut, PDA | Access grant account |
| `system_program` | | System program |

**Example:**
```typescript
const granteeKey = new PublicKey('GRANTEE_PUBLIC_KEY');

// Derive access grant PDA
const [accessGrantPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('access'),
    vaultPda.toBuffer(),
    granteeKey.toBuffer(),
  ],
  program.programId
);

// Grant read access for 7 days
try {
  const expiration = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  
  const tx = await program.methods
    .grantAccess(
      { read: {} },  // permission_level
      new BN(expiration)  // expiration
    )
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
      grantee: granteeKey,
      accessGrant: accessGrantPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Access granted until:', new Date(expiration * 1000));
} catch (error) {
  console.error('Grant failed:', error);
}
```

---

#### `revoke_access()`

Revoke a previously granted access permission.

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer | Vault owner |
| `access_grant` | Mut | Access grant to revoke |

**Example:**
```typescript
try {
  const tx = await program.methods
    .revokeAccess()
    .accounts({
      owner: owner.publicKey,
      accessGrant: accessGrantPda,
    })
    .rpc();

  console.log('Access revoked');
} catch (error) {
  console.error('Revocation failed:', error);
}
```

---

## Extended API (v2)

### Version Control

#### `rollback_memory(target_version: u32)`

Rollback a memory to a specific previous version.

**Parameters:**
- `target_version`: Version number to rollback to

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer | Vault owner |
| `memory_shard` | Mut | Memory to rollback |

**Example:**
```typescript
try {
  // First, check current version
  const memory = await program.account.memoryShard.fetch(memoryPda);
  console.log('Current version:', memory.version);
  console.log('Available versions:', memory.versionHistory.map(v => v.version));

  // Rollback to version 3
  const tx = await program.methods
    .rollbackMemory(new BN(3))
    .accounts({
      owner: owner.publicKey,
      memoryShard: memoryPda,
    })
    .rpc();

  console.log('Rolled back to version 3');
  
  // Verify rollback
  const updated = await program.account.memoryShard.fetch(memoryPda);
  console.log('New version:', updated.version);
} catch (error) {
  if (error.message.includes('InvalidRollbackVersion')) {
    console.error('Cannot rollback to that version');
  } else if (error.message.includes('VersionNotFound')) {
    console.error('Version not found in history');
  } else {
    console.error('Rollback failed:', error);
  }
}
```

---

#### `permanent_delete_memory()`

Permanently delete a memory shard and reclaim rent.

**⚠️ Warning:** This action is irreversible!

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer, Mut | Vault owner |
| `vault` | Mut | Parent vault |
| `memory_shard` | Mut, Close | Memory to permanently delete |
| `system_program` | | System program |

**Example:**
```typescript
try {
  const tx = await program.methods
    .permanentDeleteMemory()
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
      memoryShard: memoryPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Memory permanently deleted');
  console.log('Rent reclaimed');
} catch (error) {
  if (error.message.includes('MemoryNotDeleted')) {
    console.error('Memory must be soft-deleted first');
  } else {
    console.error('Deletion failed:', error);
  }
}
```

---

### Batch Operations

#### `batch_create_memories(memories: Vec<BatchMemoryInput>)`

Create multiple memories in a single transaction (max 50).

**Parameters:**
- `memories`: Array of memory inputs (max 50)

**BatchMemoryInput Structure:**
```typescript
{
  key: string,
  contentHash: number[32],
  contentSize: number,
  metadata: MemoryMetadata
}
```

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer, Mut | Vault owner |
| `vault` | Mut | Parent vault |

**Example:**
```typescript
// Prepare memories
const memories = [
  {
    key: 'memory1',
    contentHash: Array.from(hash1),
    contentSize: 1024,
    metadata: {
      memoryType: { knowledge: {} },
      importance: 80,
      tags: [1, 0, 0, 0, 0, 0, 0, 0],
      ipfsCid: null,
    },
  },
  {
    key: 'memory2',
    contentHash: Array.from(hash2),
    contentSize: 2048,
    metadata: {
      memoryType: { preference: {} },
      importance: 70,
      tags: [2, 3, 0, 0, 0, 0, 0, 0],
      ipfsCid: null,
    },
  },
  // ... up to 50
];

try {
  const tx = await program.methods
    .batchCreateMemories(memories)
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
    })
    .rpc();

  console.log(`Created ${memories.length} memories in one transaction`);
} catch (error) {
  if (error.message.includes('BatchTooLarge')) {
    console.error('Batch size exceeds 50 memories');
  } else {
    console.error('Batch creation failed:', error);
  }
}
```

**Optimization Tip:**
```typescript
// Process large datasets in batches
const allMemories = [...]; // 1000 memories
const BATCH_SIZE = 50;

for (let i = 0; i < allMemories.length; i += BATCH_SIZE) {
  const batch = allMemories.slice(i, i + BATCH_SIZE);
  await program.methods.batchCreateMemories(batch)...;
  console.log(`Batch ${i / BATCH_SIZE + 1} complete`);
}
```

---

#### `batch_delete_memories(keys: Vec<String>)`

Delete multiple memories at once (max 50).

**Parameters:**
- `keys`: Array of memory keys to delete

**Example:**
```typescript
const memoryKeys = ['memory1', 'memory2', 'memory3', ...];

try {
  const tx = await program.methods
    .batchDeleteMemories(memoryKeys)
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
    })
    .rpc();

  console.log(`Deleted ${memoryKeys.length} memories`);
} catch (error) {
  console.error('Batch deletion failed:', error);
}
```

---

#### `batch_update_tags(updates: Vec<TagUpdate>)`

Update tags for multiple memories at once (max 50).

**TagUpdate Structure:**
```typescript
{
  memoryKey: string,
  newTags: number[8]
}
```

**Example:**
```typescript
const tagUpdates = [
  { memoryKey: 'memory1', newTags: [1, 2, 0, 0, 0, 0, 0, 0] },
  { memoryKey: 'memory2', newTags: [3, 0, 0, 0, 0, 0, 0, 0] },
];

try {
  const tx = await program.methods
    .batchUpdateTags(tagUpdates)
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
    })
    .rpc();

  console.log('Tags updated');
} catch (error) {
  console.error('Tag update failed:', error);
}
```

---

### Sharing Groups

#### `create_sharing_group(name, description)`

Create a new sharing group for collaborative memory access.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `String` | Group name (max 64 chars) |
| `description` | `String` | Group description (max 256 chars) |

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer, Mut | Vault owner |
| `vault` | | Parent vault |
| `sharing_group` | Mut, PDA | Group account to create |
| `system_program` | | System program |

**Example:**
```typescript
const groupName = 'Research Team';

const [groupPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('group'),
    vaultPda.toBuffer(),
    Buffer.from(groupName),
  ],
  program.programId
);

try {
  const tx = await program.methods
    .createSharingGroup(
      groupName,
      'Team for sharing research memories'
    )
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
      sharingGroup: groupPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Group created:', groupPda.toBase58());
} catch (error) {
  if (error.message.includes('GroupNameTooLong')) {
    console.error('Group name exceeds 64 characters');
  } else {
    console.error('Group creation failed:', error);
  }
}
```

---

#### `add_group_member(member, permission_level)`

Add a member to a sharing group.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `member` | `Pubkey` | Member's agent key |
| `permission_level` | `PermissionLevel` | Access level |

**Example:**
```typescript
const memberKey = new PublicKey('MEMBER_PUBLIC_KEY');
const permissionLevel = { read: {} }; // or { write: {} }, { admin: {} }

try {
  const tx = await program.methods
    .addGroupMember(memberKey, permissionLevel)
    .accounts({
      owner: owner.publicKey,
      sharingGroup: groupPda,
    })
    .rpc();

  console.log('Member added');
} catch (error) {
  if (error.message.includes('MemberAlreadyExists')) {
    console.error('Member already in group');
  } else if (error.message.includes('GroupTooLarge')) {
    console.error('Group has reached maximum size (100 members)');
  } else {
    console.error('Failed to add member:', error);
  }
}
```

---

#### `remove_group_member(member)`

Remove a member from a sharing group.

**Example:**
```typescript
try {
  const tx = await program.methods
    .removeGroupMember(memberKey)
    .accounts({
      owner: owner.publicKey,
      sharingGroup: groupPda,
    })
    .rpc();

  console.log('Member removed');
} catch (error) {
  if (error.message.includes('MemberNotFound')) {
    console.error('Member not found in group');
  } else {
    console.error('Failed to remove member:', error);
  }
}
```

---

### Access Logging

#### `log_memory_access(access_type)`

Log access to a memory shard for audit purposes.

**Access Types:**
- `{ read: {} }`
- `{ write: {} }`
- `{ delete: {} }`
- `{ share: {} }`

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `accessor` | Signer, Mut | Entity accessing memory |
| `memory_shard` | | Memory being accessed |
| `access_log` | Mut, PDA | Log account |
| `system_program` | | System program |

**Example:**
```typescript
const [logPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('log'),
    memoryPda.toBuffer(),
    accessor.publicKey.toBuffer(),
  ],
  program.programId
);

try {
  const tx = await program.methods
    .logMemoryAccess({ read: {} })
    .accounts({
      accessor: accessor.publicKey,
      memoryShard: memoryPda,
      accessLog: logPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Access logged');
} catch (error) {
  console.error('Logging failed:', error);
}
```

---

### Economic Model

#### `stake_for_storage(amount)`

Stake tokens to earn storage quota.

**Parameters:**
- `amount`: Amount to stake (in smallest units)

**Accounts:**
| Account | Type | Description |
|---------|------|-------------|
| `owner` | Signer | Vault owner |
| `vault` | Mut | Vault to stake for |
| `owner_token_account` | Mut | Owner's token account |
| `vault_token_account` | Mut | Vault's token account |
| `token_program` | Program | SPL Token program |

**Example:**
```typescript
import { getAssociatedTokenAddress } from '@solana/spl-token';

const ownerAta = await getAssociatedTokenAddress(tokenMint, owner.publicKey);
const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true);

// Stake 1 token (assuming 6 decimals)
const stakeAmount = new BN(1_000_000);

try {
  const tx = await program.methods
    .stakeForStorage(stakeAmount)
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
      ownerTokenAccount: ownerAta,
      vaultTokenAccount: vaultAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  // Check updated stake
  const vault = await program.account.memoryVault.fetch(vaultPda);
  console.log('Total staked:', vault.stakedAmount.toString());
} catch (error) {
  if (error.message.includes('InvalidStakeAmount')) {
    console.error('Invalid stake amount');
  } else {
    console.error('Staking failed:', error);
  }
}
```

---

#### `unstake_tokens(amount)`

Unstake tokens from storage.

**Example:**
```typescript
const unstakeAmount = new BN(500_000); // 0.5 tokens

try {
  const tx = await program.methods
    .unstakeTokens(unstakeAmount)
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
      vaultTokenAccount: vaultAta,
      ownerTokenAccount: ownerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log('Tokens unstaked');
} catch (error) {
  if (error.message.includes('InsufficientStake')) {
    console.error('Not enough staked tokens');
  } else {
    console.error('Unstaking failed:', error);
  }
}
```

---

#### `claim_rewards()`

Claim accumulated reward points.

**Example:**
```typescript
try {
  const tx = await program.methods
    .claimRewards()
    .accounts({
      owner: owner.publicKey,
      vault: vaultPda,
    })
    .rpc();

  // Check reward points
  const vault = await program.account.memoryVault.fetch(vaultPda);
  console.log('Reward points:', vault.rewardPoints);
} catch (error) {
  if (error.message.includes('NoRewardsAvailable')) {
    console.error('No rewards to claim');
  } else {
    console.error('Claim failed:', error);
  }
}
```

---

### Governance

#### `initialize_protocol_config(config)`

Initialize protocol configuration (one-time admin operation).

**Parameters:**
```typescript
{
  storageFeePerByte: BN,
  minStakePerByte: BN,
  maxBatchSize: number,
  maxMemorySize: number,
  maxKeyLength: number,
  rewardRate: number
}
```

**Example:**
```typescript
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('config')],
  program.programId
);

try {
  const tx = await program.methods
    .initializeProtocolConfig({
      storageFeePerByte: new BN(1),
      minStakePerByte: new BN(10),
      maxBatchSize: 50,
      maxMemorySize: 10_000_000,
      maxKeyLength: 64,
      rewardRate: 100,
    })
    .accounts({
      admin: admin.publicKey,
      protocolConfig: configPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Protocol config initialized');
} catch (error) {
  console.error('Initialization failed:', error);
}
```

---

#### `update_protocol_config(config)`

Update protocol parameters (admin only).

**Example:**
```typescript
try {
  const tx = await program.methods
    .updateProtocolConfig({
      storageFeePerByte: new BN(2),
      minStakePerByte: null, // Keep current
      maxBatchSize: null,
      maxMemorySize: null,
      rewardRate: new BN(150),
    })
    .accounts({
      admin: admin.publicKey,
      protocolConfig: configPda,
    })
    .rpc();

  console.log('Config updated');
} catch (error) {
  if (error.message.includes('UnauthorizedAdmin')) {
    console.error('Only admin can update config');
  } else {
    console.error('Update failed:', error);
  }
}
```

---

#### `set_protocol_pause(paused)`

Pause or unpause the protocol (emergency admin function).

**Example:**
```typescript
// Pause protocol
try {
  await program.methods
    .setProtocolPause(true)
    .accounts({
      admin: admin.publicKey,
      protocolConfig: configPda,
    })
    .rpc();

  console.log('Protocol paused');
} catch (error) {
  console.error('Failed to pause:', error);
}

// Unpause protocol
try {
  await program.methods
    .setProtocolPause(false)
    .accounts({
      admin: admin.publicKey,
      protocolConfig: configPda,
    })
    .rpc();

  console.log('Protocol unpaused');
} catch (error) {
  console.error('Failed to unpause:', error);
}
```

---

#### `transfer_admin(new_admin)`

Transfer admin rights to a new address.

**Example:**
```typescript
const newAdmin = new PublicKey('NEW_ADMIN_PUBLIC_KEY');

try {
  const tx = await program.methods
    .transferAdmin(newAdmin)
    .accounts({
      admin: currentAdmin.publicKey,
      protocolConfig: configPda,
    })
    .rpc();

  console.log('Admin rights transferred to:', newAdmin.toBase58());
} catch (error) {
  console.error('Transfer failed:', error);
}
```

---

## Query Operations

### Fetching Accounts

#### Query Version History

```typescript
const memory = await program.account.memoryShard.fetch(memoryPda);

console.log('Current version:', memory.version);
console.log('Version history:', memory.versionHistory);

// Iterate through versions
memory.versionHistory.forEach(record => {
  console.log({
    version: record.version,
    contentHash: Buffer.from(record.contentHash).toString('hex'),
    contentSize: record.contentSize,
    metadata: record.metadata,
    createdAt: new Date(record.createdAt * 1000).toISOString(),
  });
});
```

---

#### Query Group Information

```typescript
const group = await program.account.sharingGroup.fetch(groupPda);

console.log({
  name: group.name,
  description: group.description,
  creator: group.creator.toBase58(),
  memberCount: group.members.length,
  members: group.members.map(m => ({
    address: m.member.toBase58(),
    permission: m.permission, // 0=None, 1=Read, 2=Write, 3=Admin
    joinedAt: new Date(m.joinedAt * 1000).toISOString(),
  })),
});
```

---

#### Query Protocol Config

```typescript
const config = await program.account.protocolConfig.fetch(configPda);

console.log({
  admin: config.admin.toBase58(),
  storageFeePerByte: config.storageFeePerByte.toString(),
  minStakePerByte: config.minStakePerByte.toString(),
  maxBatchSize: config.maxBatchSize,
  maxMemorySize: config.maxMemorySize,
  maxKeyLength: config.maxKeyLength,
  rewardRate: config.rewardRate,
  isPaused: config.isPaused,
  createdAt: new Date(config.createdAt * 1000).toISOString(),
  updatedAt: new Date(config.updatedAt * 1000).toISOString(),
});
```

---

#### Query Access Permission

```typescript
const accessGrant = await program.account.accessGrant.fetch(accessGrantPda);

console.log({
  vault: accessGrant.vault.toBase58(),
  grantee: accessGrant.grantee.toBase58(),
  permissionLevel: accessGrant.permissionLevel, // 0, 1, 2, or 3
  grantedAt: new Date(accessGrant.grantedAt * 1000).toISOString(),
  expiresAt: accessGrant.expiresAt 
    ? new Date(accessGrant.expiresAt * 1000).toISOString() 
    : 'Never',
  isActive: accessGrant.isActive,
  revokedAt: accessGrant.revokedAt
    ? new Date(accessGrant.revokedAt * 1000).toISOString()
    : null,
});
```

---

#### Query Vault Information

```typescript
const vault = await program.account.memoryVault.fetch(vaultPda);

console.log({
  owner: vault.owner.toBase58(),
  agentKey: vault.agentKey.toBase58(),
  memoryCount: vault.memoryCount,
  totalMemorySize: vault.totalMemorySize.toString(),
  stakedAmount: vault.stakedAmount.toString(),
  rewardPoints: vault.rewardPoints,
  createdAt: new Date(vault.createdAt * 1000).toISOString(),
  updatedAt: new Date(vault.updatedAt * 1000).toISOString(),
});
```

---

### Calculate Storage Fees

Helper functions for calculating costs off-chain:

```typescript
// Storage fee calculation (off-chain)
function calculateStorageFee(sizeInBytes: number): number {
  // 0.001 SOL per KB
  return (sizeInBytes * 0.001) / 1000;
}

// Required stake calculation
function calculateRequiredStake(totalSize: number): number {
  // 0.01 SOL per MB
  return (totalSize * 0.01) / 1_000_000;
}

// Get current storage usage and costs
async function getStorageInfo(vaultPda: PublicKey) {
  const vault = await program.account.memoryVault.fetch(vaultPda);
  const currentFee = calculateStorageFee(vault.totalMemorySize.toNumber());
  const requiredStake = calculateRequiredStake(vault.totalMemorySize.toNumber());
  
  return {
    totalSize: vault.totalMemorySize.toNumber(),
    currentFee,
    requiredStake,
    stakedAmount: vault.stakedAmount.toNumber(),
    hasEnoughStake: vault.stakedAmount.toNumber() >= requiredStake,
  };
}
```

---

## Event Listening

### Setup Event Listeners

```typescript
// Set up event listeners for real-time updates
const listeners = [];

// Memory created
listeners.push(
  program.addEventListener('memoryCreated', (event, slot) => {
    console.log('Memory created:', {
      vault: event.vault.toBase58(),
      key: event.key,
      version: event.version,
      timestamp: new Date(event.timestamp * 1000).toISOString(),
      slot,
    });
  })
);

// Memory updated
listeners.push(
  program.addEventListener('memoryUpdated', (event, slot) => {
    console.log('Memory updated:', {
      vault: event.vault.toBase58(),
      key: event.key,
      newVersion: event.newVersion,
      previousVersion: event.previousVersion,
      slot,
    });
  })
);

// Memory rolled back
listeners.push(
  program.addEventListener('memoryRolledBack', (event, slot) => {
    console.log('Memory rolled back:', {
      memory: event.memory.toBase58(),
      fromVersion: event.fromVersion,
      toVersion: event.toVersion,
      newVersion: event.newVersion,
      slot,
    });
  })
);

// Batch operations
listeners.push(
  program.addEventListener('batchMemoryCreated', (event, slot) => {
    console.log('Batch created:', {
      vault: event.vault.toBase58(),
      count: event.count,
      totalSize: event.totalSize.toString(),
      storageFee: event.storageFee.toString(),
      slot,
    });
  })
);

// Sharing events
listeners.push(
  program.addEventListener('sharingGroupCreated', (event, slot) => {
    console.log('Group created:', {
      name: event.name,
      creator: event.creator.toBase58(),
      group: event.group.toBase58(),
      slot,
    });
  })
);

// Economic events
listeners.push(
  program.addEventListener('tokensStaked', (event, slot) => {
    console.log('Tokens staked:', {
      vault: event.vault.toBase58(),
      amount: event.amount.toString(),
      totalStaked: event.totalStaked.toString(),
      slot,
    });
  })
);

// Governance events
listeners.push(
  program.addEventListener('protocolConfigUpdated', (event, slot) => {
    console.log('Config updated:', {
      fields: event.updatedFields,
      admin: event.admin.toBase58(),
      slot,
    });
  })
);

// Clean up listeners when done
function cleanup() {
  listeners.forEach(removeListener => removeListener());
}

// Call cleanup() on application shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
```

---

## Account Types

### MemoryVault

| Field | Type | Description |
|-------|------|-------------|
| `owner` | Pubkey | Human owner address |
| `agent_key` | Pubkey | Agent public key |
| `encryption_pubkey` | [u8; 32] | Client-side encryption public key |
| `created_at` | i64 | Creation timestamp (Unix) |
| `updated_at` | i64 | Last update timestamp |
| `memory_count` | u32 | Number of memory shards |
| `total_memory_size` | u64 | Total bytes stored |
| `staked_amount` | u64 | Current staked token amount |
| `reward_points` | u32 | Accumulated reward points |

---

### MemoryShard

| Field | Type | Description |
|-------|------|-------------|
| `vault` | Pubkey | Parent vault address |
| `key` | String | Memory identifier |
| `content_hash` | [u8; 32] | SHA-256 hash of encrypted content |
| `content_size` | u32 | Size in bytes |
| `metadata` | MemoryMetadata | Type, importance, tags |
| `version` | u32 | Current version number |
| `is_deleted` | bool | Soft delete flag |
| `deleted_at` | Option<i64> | Deletion timestamp |
| `version_history` | Vec<VersionRecord> | Last 10 versions |
| `created_at` | i64 | Creation timestamp |
| `updated_at` | i64 | Last update timestamp |

---

### AgentProfile

| Field | Type | Description |
|-------|------|-------------|
| `agent_key` | Pubkey | Agent identifier |
| `owner` | Pubkey | Human owner |
| `vault` | Pubkey | Associated vault |
| `name` | String | Display name |
| `capabilities` | Vec<String> | Skills/capabilities list |
| `reputation_score` | u32 | Calculated from tasks (0-10000) |
| `tasks_completed` | u32 | Total completed tasks |
| `is_public` | bool | Profile visibility |
| `created_at` | i64 | Creation timestamp |
| `updated_at` | i64 | Last update timestamp |

---

### AccessGrant

| Field | Type | Description |
|-------|------|-------------|
| `vault` | Pubkey | Source vault |
| `grantee` | Pubkey | Agent with access |
| `permission_level` | u8 | 0=None, 1=Read, 2=Write, 3=Admin |
| `granted_at` | i64 | Grant timestamp |
| `expires_at` | Option<i64> | Expiration timestamp |
| `is_active` | bool | Active status |
| `revoked_at` | Option<i64> | Revocation timestamp |

---

### SharingGroup

| Field | Type | Description |
|-------|------|-------------|
| `creator` | Pubkey | Group creator |
| `vault` | Pubkey | Associated vault |
| `name` | String | Group name |
| `description` | String | Group description |
| `members` | Vec<GroupMember> | Group members |
| `created_at` | i64 | Creation timestamp |
| `updated_at` | i64 | Last update timestamp |
| `is_active` | bool | Active status |

**GroupMember:**
| Field | Type | Description |
|-------|------|-------------|
| `member` | Pubkey | Member address |
| `permission` | u8 | Permission level |
| `joined_at` | i64 | Join timestamp |

---

### ProtocolConfig

| Field | Type | Description |
|-------|------|-------------|
| `admin` | Pubkey | Admin address |
| `storage_fee_per_byte` | u64 | Storage fee rate |
| `min_stake_per_byte` | u64 | Minimum stake required |
| `max_batch_size` | u32 | Max items in batch operation |
| `max_memory_size` | u32 | Max memory size in bytes |
| `max_key_length` | u32 | Max key length in chars |
| `reward_rate` | u32 | Reward rate (basis points) |
| `is_paused` | bool | Protocol pause status |
| `created_at` | i64 | Creation timestamp |
| `updated_at` | i64 | Last update timestamp |

---

## PDA Seeds

| Account | Seeds | Example |
|---------|-------|---------|
| **Vault** | `["vault", owner_pubkey, agent_pubkey]` | `vault + user123 + agent456` |
| **Profile** | `["profile", agent_pubkey]` | `profile + agent456` |
| **Memory Shard** | `["memory", vault_pubkey, key_bytes]` | `memory + vault123 + "pref1"` |
| **Access Grant** | `["access", vault_pubkey, grantee_pubkey]` | `access + vault123 + agent789` |
| **Sharing Group** | `["group", vault_pubkey, name_bytes]` | `group + vault123 + "team"` |
| **Access Log** | `["log", memory_pubkey, accessor_pubkey]` | `log + mem456 + user123` |
| **Protocol Config** | `["config"]` | `config` |
| **Vault Token Account** | `["vault_tokens", vault_pubkey]` | `vault_tokens + vault123` |

**Deriving PDAs in TypeScript:**
```typescript
import { PublicKey } from '@solana/web3.js';

function deriveVaultPda(owner: PublicKey, agent: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('vault'),
      owner.toBuffer(),
      agent.toBuffer(),
    ],
    programId
  );
  return pda;
}

function deriveMemoryPda(vault: PublicKey, key: string, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('memory'),
      vault.toBuffer(),
      Buffer.from(key),
    ],
    programId
  );
  return pda;
}
```

---

## Events

### Core Events

| Event | Data | Description |
|-------|------|-------------|
| `MemoryStored` | vault, key, version, timestamp | New memory created |
| `MemoryUpdated` | vault, key, newVersion, previousVersion | Memory modified |
| `MemoryDeleted` | vault, key, deletedAt | Memory soft-deleted |
| `AccessGranted` | vault, grantee, permissionLevel, grantedAt, expiresAt | Access given |
| `AccessRevoked` | vault, grantee, revokedAt | Access revoked |

### Version Control Events

| Event | Data | Description |
|-------|------|-------------|
| `MemoryRolledBack` | memory, fromVersion, toVersion, newVersion | Memory rolled back |
| `MemoryPermanentlyDeleted` | memory, vault, reclaimAmount | Memory permanently removed |

### Batch Events

| Event | Data | Description |
|-------|------|-------------|
| `BatchMemoryCreated` | vault, count, totalSize, storageFee | Multiple memories created |
| `BatchMemoryDeleted` | vault, count | Multiple memories deleted |
| `BatchTagsUpdated` | vault, count | Tags updated for multiple |

### Sharing Events

| Event | Data | Description |
|-------|------|-------------|
| `SharingGroupCreated` | name, creator, group | New sharing group |
| `GroupMemberAdded` | group, member, permission | Member added |
| `GroupMemberRemoved` | group, member | Member removed |

### Economic Events

| Event | Data | Description |
|-------|------|-------------|
| `TokensStaked` | vault, amount, totalStaked | Tokens staked |
| `TokensUnstaked` | vault, amount, totalStaked | Tokens unstaked |
| `RewardsClaimed` | vault, pointsClaimed | Rewards claimed |

### Governance Events

| Event | Data | Description |
|-------|------|-------------|
| `ProtocolConfigInitialized` | admin, config | Config initialized |
| `ProtocolConfigUpdated` | admin, updatedFields | Config updated |
| `ProtocolPauseChanged` | admin, isPaused | Pause status changed |
| `AdminTransferred` | previousAdmin, newAdmin | Admin rights transferred |

---

## Error Codes

### Validation Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `KeyTooLong` | Memory key exceeds 64 characters | Use shorter key |
| `ContentTooLarge` | Content exceeds 10MB limit | Use IPFS for large content |
| `EmptyKey` | Key cannot be empty | Provide non-empty key |
| `EmptyName` | Name cannot be empty | Provide display name |
| `EmptyCapability` | Capability cannot be empty | Remove empty strings |

### Rate Limiting

| Code | Description | Resolution |
|------|-------------|------------|
| `TaskRateLimitExceeded` | Too many task completions | Wait 1 minute between calls |
| `BatchTooLarge` | Batch size exceeds 50 | Split into smaller batches |
| `InvalidBatchSize` | Invalid batch operation | Check batch parameters |

### Version Control

| Code | Description | Resolution |
|------|-------------|------------|
| `InvalidVersion` | Invalid version number | Use valid version |
| `InvalidRollbackVersion` | Cannot rollback to version | Check version history |
| `VersionNotFound` | Requested version not found | Verify version exists |
| `MemoryNotDeleted` | Memory not in deleted state | Soft-delete first |

### Sharing Groups

| Code | Description | Resolution |
|------|-------------|------------|
| `EmptyGroupName` | Group name cannot be empty | Provide name |
| `GroupNameTooLong` | Group name exceeds 64 chars | Use shorter name |
| `GroupDescTooLong` | Description exceeds 256 chars | Shorten description |
| `GroupTooLarge` | Group exceeds 100 members | Remove members first |
| `MemberAlreadyExists` | Member already in group | Check membership |
| `MemberNotFound` | Member not found in group | Verify member exists |
| `NotGroupCreator` | Only creator can modify | Use correct signer |

### Economic

| Code | Description | Resolution |
|------|-------------|------------|
| `InvalidStakeAmount` | Invalid stake amount | Use positive amount |
| `InvalidUnstakeAmount` | Invalid unstake amount | Check staked balance |
| `InsufficientStake` | Not enough staked tokens | Stake more tokens |
| `StakeBelowMinimum` | Stake below required minimum | Increase stake |
| `NoRewardsAvailable` | No rewards to claim | Accumulate rewards first |

### Governance

| Code | Description | Resolution |
|------|-------------|------------|
| `ProtocolPaused` | Protocol is currently paused | Wait for unpause |
| `UnauthorizedAdmin` | Caller is not admin | Use admin key |

---

## SDK Reference

### TypeScript SDK Methods

The official TypeScript SDK provides high-level methods:

```typescript
class AgentMemoryClient {
  // Initialization
  constructor(connection: Connection, wallet: Wallet);
  initializeVault(agentKey: PublicKey, encryptionPubkey?: Uint8Array): Promise<PublicKey>;
  
  // Memory operations
  storeMemory(vault: PublicKey, params: StoreMemoryParams): Promise<string>;
  getMemory(vault: PublicKey, key: string): Promise<MemoryShard | null>;
  getMemories(vault: PublicKey, filter?: MemoryFilter): Promise<MemoryShard[]>;
  updateMemory(vault: PublicKey, key: string, params: UpdateParams): Promise<string>;
  deleteMemory(vault: PublicKey, key: string): Promise<string>;
  permanentDeleteMemory(vault: PublicKey, key: string): Promise<string>;
  rollbackMemory(vault: PublicKey, key: string, version: number): Promise<string>;
  
  // Batch operations
  batchStoreMemories(vault: PublicKey, memories: MemoryInput[]): Promise<string>;
  batchDeleteMemories(vault: PublicKey, keys: string[]): Promise<string>;
  batchUpdateTags(vault: PublicKey, updates: TagUpdate[]): Promise<string>;
  
  // Access control
  grantAccess(vault: PublicKey, grantee: PublicKey, params: GrantParams): Promise<string>;
  revokeAccess(vault: PublicKey, grantee: PublicKey): Promise<string>;
  checkAccess(vault: PublicKey, grantee: PublicKey): Promise<AccessLevel>;
  
  // Groups
  createSharingGroup(vault: PublicKey, name: string, description: string): Promise<PublicKey>;
  addGroupMember(group: PublicKey, member: PublicKey, level: PermissionLevel): Promise<string>;
  removeGroupMember(group: PublicKey, member: PublicKey): Promise<string>;
  
  // Economic
  stakeForStorage(vault: PublicKey, amount: BN): Promise<string>;
  unstakeTokens(vault: PublicKey, amount: BN): Promise<string>;
  claimRewards(vault: PublicKey): Promise<string>;
  
  // Profile
  updateProfile(profile: PublicKey, params: ProfileParams): Promise<string>;
  recordTaskCompletion(profile: PublicKey): Promise<string>;
}
```

---

**Dependencies:**
```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token bn.js
```

**Note:** All examples use Anchor Framework TypeScript SDK. Ensure you have the correct version (0.30.1) installed.
