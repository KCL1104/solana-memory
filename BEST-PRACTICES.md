# Solana Smart Contract Best Practices

This document outlines the security best practices applied to the AgentMemory protocol, based on research from Anchor documentation, Helius security guides, and Neodyme audit reports.

## Table of Contents
1. [Core Security Principles](#core-security-principles)
2. [Account Validation Patterns](#account-validation-patterns)
3. [PDA Best Practices](#pda-best-practices)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Event Emission](#event-emission)
6. [Patterns Used in This Project](#patterns-used-in-this-project)
7. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
8. [Security Checklist](#security-checklist)

---

## Core Security Principles

### 1. Assume Attacker Control
Solana's programming model is inherently attacker-controlled:
- Every account passed into an instruction could be malicious
- Every instruction argument can be crafted by attackers
- Transaction ordering can be manipulated
- CPI call graphs can be exploited via composability

### 2. Data Validation is Critical
**Key Rule**: Never trust, always verify.
- Validate account ownership
- Validate account types (discriminators)
- Validate signer requirements
- Validate data relationships (`has_one` constraints)

### 3. Fail Closed
When in doubt, reject the transaction. It's better to be overly restrictive than allow exploits.

---

## Account Validation Patterns

### ✅ DO: Use Typed Accounts
```rust
// Anchor automatically validates ownership and discriminator
pub vault: Account<'info, MemoryVault>,
```

### ✅ DO: Use `has_one` for Ownership Relationships
```rust
#[account(
    mut,
    has_one = owner,  // Ensures vault.owner == owner.key()
)]
pub vault: Account<'info, MemoryVault>,
pub owner: Signer<'info>,
```

### ✅ DO: Validate PDA Seeds and Bumps
```rust
#[account(
    seeds = [b"vault", owner.key().as_ref(), agent_key.key().as_ref()],
    bump = vault.bump,
)]
pub vault: Account<'info, MemoryVault>,
```

### ❌ DON'T: Use `init_if_needed`
**Risk**: Reinitialization attacks - allows overwriting existing accounts.

**Vulnerable**:
```rust
#[account(
    init_if_needed,  // DANGEROUS!
    payer = owner,
    space = 8 + MemoryShard::INIT_SPACE,
)]
pub memory_shard: Account<'info, MemoryShard>,
```

**Secure Alternative**:
Use separate instructions for `create` and `update`, or explicitly check if account exists.

### ✅ DO: Use `Signer<'info>` for Authorization
```rust
pub owner: Signer<'info>,  // Automatically validates signature
```

### ❌ DON'T: Use `AccountInfo` Without Validation
```rust
/// CHECK: Only use when necessary and always document validation
pub agent_key: AccountInfo<'info>,  // Requires manual validation
```

---

## PDA Best Practices

### ✅ DO: Use Canonical Seeds
PDA seeds must be deterministic and unique:
```rust
// GOOD: Unique per user-agent pair
seeds = [b"vault", owner.key().as_ref(), agent_key.key().as_ref()]

// GOOD: Unique per vault + key combination
seeds = [b"memory", vault.key().as_ref(), key.as_bytes()]
```

### ✅ DO: Include User-Specific Identifiers
**Prevents PDA sharing vulnerabilities**:
```rust
// BAD: Only mint in seeds - all vaults for same token share authority
seeds = [b"pool", pool.mint.as_ref()]

// GOOD: Include user-specific identifiers
seeds = [b"pool", vault.key().as_ref(), owner.key().as_ref()]
```

### ✅ DO: Store Bump in Account
```rust
#[account]
pub struct MemoryVault {
    // ... other fields
    pub bump: u8,  // Store for validation
}
```

### ✅ DO: Validate Bump in Context
```rust
#[account(
    seeds = [b"vault", owner.key().as_ref(), agent_key.key().as_ref()],
    bump = vault.bump,  // Validates stored bump matches
)]
pub vault: Account<'info, MemoryVault>,
```

---

## Error Handling Patterns

### ✅ DO: Use Custom Error Codes
```rust
#[error_code]
pub enum AgentMemoryError {
    #[msg("Memory key too long (max 64 characters)")]
    KeyTooLong,
    #[msg("Content too large (max 10MB)")]
    ContentTooLarge,
}
```

### ✅ DO: Use `require!` Macro
```rust
require!(key.len() <= 64, AgentMemoryError::KeyTooLong);
require!(content_size <= 10_000_000, AgentMemoryError::ContentTooLarge);
```

### ✅ DO: Use Checked Arithmetic
```rust
// GOOD: Prevents overflow/underflow
vault.memory_count = vault.memory_count.checked_add(1).ok_or(AgentMemoryError::Overflow)?;

// BAD: Can overflow
vault.memory_count += 1;
```

### ✅ DO: Use `saturating_sub` for Decrements
```rust
// GOOD: Never goes below zero
vault.memory_count = vault.memory_count.saturating_sub(1);

// BAD: Can underflow in theory (though u32 would panic in debug)
vault.memory_count -= 1;
```

---

## Event Emission

### ✅ DO: Emit Events for State Changes
Events enable:
- Off-chain indexing
- Audit trails
- Monitoring and alerting
- Frontend synchronization

```rust
#[event]
pub struct MemoryStored {
    pub vault: Pubkey,
    pub key: String,
    pub version: u32,
    pub timestamp: i64,
}

// In instruction:
emit!(MemoryStored {
    vault: vault.key(),
    key: key.clone(),
    version: memory_shard.version,
    timestamp: clock.unix_timestamp,
});
```

### ✅ DO: Include Relevant Data in Events
```rust
#[event]
pub struct AccessGranted {
    pub vault: Pubkey,
    pub grantee: Pubkey,
    pub granted_at: i64,
    pub expires_at: Option<i64>,
}
```

---

## Patterns Used in This Project

### 1. Separate Create/Update Instructions
Instead of `init_if_needed`, we use:
- `store_memory` with `init` for new memories
- Same instruction checks if memory exists and updates instead

### 2. Comprehensive Account Constraints
Every account context uses:
- `seeds` and `bump` for PDA validation
- `has_one` for ownership relationships
- `mut` only when modification is needed

### 3. Client-Side Encryption
- Content is encrypted before reaching the chain
- Only hashes stored on-chain
- Encryption keys never touch the blockchain

### 4. Reputation System with Caps
```rust
profile.reputation_score = (profile.tasks_completed * 10).min(10000);
```

### 5. Input Validation
All inputs validated:
- String length limits
- Numeric bounds
- Vector size limits

---

## Anti-Patterns to Avoid

### ❌ `init_if_needed`
**Why**: Allows reinitialization attacks.
**Solution**: Separate create/update instructions or explicit existence checks.

### ❌ Unchecked Arithmetic
**Why**: Can cause overflow/underflow.
**Solution**: Use `checked_add`, `checked_sub`, `saturating_sub`.

### ❌ Missing Signer Checks
**Why**: Anyone can call privileged instructions.
**Solution**: Use `Signer<'info>` or explicit `is_signer` checks.

### ❌ Missing Owner Checks
**Why**: Fake accounts with same data structure can pass validation.
**Solution**: Use typed accounts (`Account<'info, T>`).

### ❌ Shared PDAs Without User Identifiers
**Why**: Same PDA across users = unauthorized access.
**Solution**: Always include user-specific identifiers in seeds.

### ❌ Type Cosplay
**Why**: Accounts with identical structures can be substituted.
**Solution**: Use discriminators (automatic in Anchor).

### ❌ Duplicate Mutable Accounts
**Why**: Passing same account twice cancels changes.
**Solution**: Explicit duplicate checks.

### ❌ Arbitrary CPI
**Why**: Program calls attacker-controlled program.
**Solution**: Use `Program<'info, T>` or hardcode program IDs.

### ❌ Missing Events
**Why**: Can't monitor or index state changes.
**Solution**: Emit events for all significant operations.

### ❌ Unsafe Account Closure
**Why**: Revival attacks within same transaction.
**Solution**: Use Anchor's `close` constraint or mark discriminator as closed.

---

## Security Checklist

### Before Deployment

#### Account Validation
- [ ] All accounts use typed validation where possible
- [ ] PDA seeds are canonical and unique
- [ ] Bumps are stored and validated
- [ ] Signer requirements are explicit
- [ ] Ownership relationships use `has_one`
- [ ] No `init_if_needed` usage
- [ ] No unchecked `AccountInfo` without validation

#### Arithmetic
- [ ] All arithmetic uses checked operations
- [ ] No unchecked casts
- [ ] Value caps applied where appropriate

#### Access Control
- [ ] All privileged functions require signer
- [ ] Authority checks are comprehensive
- [ ] No missing owner validations

#### Events
- [ ] All state changes emit events
- [ ] Events include relevant metadata
- [ ] Events are indexable

#### Error Handling
- [ ] Custom errors for all failure cases
- [ ] Error messages are descriptive
- [ ] No silent failures

#### CPI Safety
- [ ] Program IDs validated before CPI
- [ ] No arbitrary CPI targets
- [ ] Privileges not passed to callees unnecessarily

#### Testing
- [ ] Unit tests for all instructions
- [ ] Integration tests for complete flows
- [ ] Negative test cases (unauthorized access, invalid inputs)
- [ ] Fuzz testing where applicable

### Post-Deployment
- [ ] Program ID declared correctly
- [ ] IDL published and versioned
- [ ] Events monitored
- [ ] Bug bounty program considered

---

## Resources

- [Anchor Security Guide](https://www.anchor-lang.com/docs)
- [Helius Solana Security Guide](https://www.helius.dev/blog/a-hitchhikers-guide-to-solana-program-security)
- [Neodyme Security Blog](https://neodyme.io/blog/)
- [Solana Stack Exchange - Security Tag](https://solana.stackexchange.com/questions/tagged/security)

---

## Changelog

### v1.0.0 (2025-02-03)
- Initial best practices documentation
- Applied security improvements to AgentMemory protocol
- Added event emission for all state changes
- Replaced potential arithmetic issues with checked operations
- Enhanced documentation throughout codebase
