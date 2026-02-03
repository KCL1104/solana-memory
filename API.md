## API Reference

### Instructions

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
Remove a memory shard and reclaim rent.

**Accounts:**
- `owner` (signer, mut)
- `vault` (mut)
- `memory_shard` (mut, close)

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

#### `grant_access(expiration?)`
Grant another agent access to your memory.

**Parameters:**
- `expiration: Option<i64>` — Unix timestamp when access expires

**Accounts:**
- `owner` (signer, mut)
- `vault`
- `grantee` — Agent being granted access
- `access_grant` (mut)

---

#### `revoke_access()`
Revoke access grant.

### Account Types

#### MemoryVault
| Field | Type | Description |
|-------|------|-------------|
| owner | Pubkey | Human owner |
| agent_key | Pubkey | Agent public key |
| encryption_pubkey | [u8; 32] | For client-side encryption |
| created_at | i64 | Creation timestamp |
| updated_at | i64 | Last update timestamp |
| memory_count | u32 | Number of memory shards |
| total_memory_size | u64 | Total bytes stored |

#### MemoryShard
| Field | Type | Description |
|-------|------|-------------|
| vault | Pubkey | Parent vault |
| key | String | Memory identifier |
| content_hash | [u8; 32] | SHA-256 of encrypted content |
| content_size | u32 | Size in bytes |
| metadata | MemoryMetadata | Type, importance, tags |
| version | u32 | Incremented on update |

#### AgentProfile
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

### PDA Seeds

| Account | Seeds |
|---------|-------|
| Vault | `["vault", owner_pubkey, agent_pubkey]` |
| Profile | `["profile", agent_pubkey]` |
| Memory Shard | `["memory", vault_pubkey, key_bytes]` |
| Access Grant | `["access", vault_pubkey, grantee_pubkey]` |
