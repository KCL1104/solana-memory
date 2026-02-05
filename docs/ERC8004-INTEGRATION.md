# ERC-8004 Identity Binding Integration

## Overview

This document describes the ERC-8004 Identity Binding integration for AgentMemory, implementing a cryptographic binding system between SAID Protocol identities and agent memory storage. This enables:

- **Identity-verified memory storage**: Memories are cryptographically linked to agent identities
- **Cross-device memory recovery**: Recover memories across different devices using the same identity
- **Binding revocation**: Revoke compromised bindings
- **Signature rotation**: Update binding signatures for key rotation scenarios

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  SAID Protocol  │      │  AgentMemory     │      │  Solana         │
│  Identity       │◄────►│  Identity Binding│◄────►│  Smart Contract │
│                 │      │                  │      │                 │
│  • Identity Key │      │  • Bind Identity │      │  • Binding PDA  │
│  • Signatures   │      │  • Verify        │      │  • Registry     │
│  • Ownership    │      │  • Recover       │      │  • Revocation   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
          │                       │                         │
          │              ┌────────▼─────────┐               │
          └─────────────►│  AgentMemory     │◄──────────────┘
                         │  Storage         │
                         │                  │
                         │  • Memory Shards │
                         │  • Vault         │
                         │  • Search        │
                         └──────────────────┘
```

## Components

### 1. Smart Contract (Rust/Anchor)

**File**: `programs/agent_memory/src/identity_binding.rs`

#### Account Structures

```rust
/// Identity-Memory Binding Account
pub struct IdentityMemoryBinding {
    pub identity_pubkey: Pubkey,      // SAID Protocol identity
    pub agent_id: String,              // Agent identifier
    pub binding_signature: [u8; 64],   // Ed25519 signature
    pub bound_at: i64,                 // Timestamp
    pub revoked: bool,                 // Revocation status
    pub vault_pubkey: Pubkey,          // Associated vault
    pub version: u32,                  // Version for rotation
    pub bump: u8,                      // PDA bump
}

/// Binding Registry for an Identity
pub struct IdentityBindingRegistry {
    pub identity_pubkey: Pubkey,
    pub agent_ids: Vec<String>,        // All bound agents
    pub active_binding_count: u32,
    pub created_at: i64,
    pub updated_at: i64,
}
```

#### Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize_registry` | Create a new identity binding registry |
| `bind_identity` | Bind a SAID identity to an agent |
| `verify_binding` | Verify a binding's signature |
| `revoke_binding` | Revoke an existing binding |
| `reactivate_binding` | Re-activate a revoked binding |
| `rotate_binding_signature` | Rotate binding signature (key rotation) |

#### PDA Derivation

```rust
// Binding PDA
seeds = [b"identity_binding", identity_pubkey, agent_id]

// Registry PDA
seeds = [b"identity_registry", identity_pubkey]
```

### 2. SDK (TypeScript)

**File**: `src/identity/index.ts`

#### IdentityMemoryBinding Class

```typescript
export class IdentityMemoryBinding {
  constructor(config: IdentityConfig);
  
  // Binding operations
  async bindIdentity(identityPubkey: string, agentId: string): Promise<string>;
  async verifyBinding(identityPubkey: string, agentId: string): Promise<boolean>;
  async revokeBinding(identityPubkey: string, agentId: string): Promise<boolean>;
  async rotateBinding(identityPubkey: string, agentId: string): Promise<string>;
  
  // Memory recovery
  async recoverMemories(identityPubkey: string): Promise<string[]>;
  async getAgentMemories(identityPubkey: string, agentId: string): Promise<Memory[]>;
  
  // Queries
  async getBinding(identityPubkey: string, agentId: string): Promise<Binding | null>;
  async getBindingsByIdentity(identityPubkey: string): Promise<Binding[]>;
  async hasActiveBinding(identityPubkey: string, agentId: string): Promise<boolean>;
}
```

#### Types

```typescript
export interface Binding {
  identity_pubkey: string;
  agent_id: string;
  signature: Uint8Array;
  bound_at: number;
  revoked: boolean;
  vault_pubkey?: string;
  version?: number;
}

export interface IdentityConfig {
  saidClient: SAIDClient;
  agentMemory: AgentMemory;
  connection?: Connection;
  programId?: PublicKey;
}
```

#### Standalone Functions

```typescript
// Create binding signature
export function createBindingSignature(
  identitySecretKey: Uint8Array,
  identityPubkey: string,
  agentId: string
): Uint8Array;

// Verify binding signature
export function verifyBindingSignature(
  identityPubkey: string,
  agentId: string,
  signature: Uint8Array
): boolean;

// Derive binding PDA
export function deriveBindingPDA(
  identityPubkey: string,
  agentId: string,
  programId: PublicKey
): [PublicKey, number];
```

## Usage Examples

### Basic Binding

```typescript
import { AgentMemory } from 'agentmemory';
import { SAIDClient } from '@said-protocol/client';
import { IdentityMemoryBinding } from '../src/identity';

// Initialize
const saidClient = new SAIDClient({ network: 'devnet' });
const agentMemory = new AgentMemory({ agentId: 'my-agent', network: 'devnet' });

const binding = new IdentityMemoryBinding({ saidClient, agentMemory });

// Create identity and bind
const identity = await saidClient.createIdentity();
const bindingId = await binding.bindIdentity(identity.pubkey, 'my-agent');
```

### Memory Storage with Verification

```typescript
// Store memories
await agentMemory.store({
  content: 'User prefers dark mode',
  importance: 'high'
});

// Verify binding before operations
const isValid = await binding.verifyBinding(identity.pubkey, 'my-agent');
if (!isValid) {
  throw new Error('Binding invalid or revoked');
}
```

### Cross-Device Recovery

```typescript
// Device 1: Create binding and store memories
const binding1 = new IdentityMemoryBinding({ saidClient, agentMemory: device1Memory });
await binding1.bindIdentity(identity.pubkey, 'my-agent');
await device1Memory.store({ content: 'Memory 1', importance: 'high' });

// Device 2: Recover using same identity
const binding2 = new IdentityMemoryBinding({ saidClient, agentMemory: device2Memory });
await binding2.bindIdentity(identity.pubkey, 'my-agent');

// Recover all memories
const recoveredMemories = await binding2.recoverMemories(identity.pubkey);
console.log(`Recovered ${recoveredMemories.length} memories`);
```

### Revocation

```typescript
// Revoke a compromised binding
await binding.revokeBinding(identity.pubkey, 'my-agent');

// Verify it's revoked
const isValid = await binding.verifyBinding(identity.pubkey, 'my-agent');
// isValid === false
```

### Signature Rotation

```typescript
// Rotate binding signature (e.g., after key rotation)
await binding.rotateBinding(identity.pubkey, 'my-agent');

// Binding remains valid with new signature
const isValid = await binding.verifyBinding(identity.pubkey, 'my-agent');
// isValid === true
```

## Security Considerations

### Signature Format

The binding signature follows the format:
```
signature = ed25519_sign(identity_secret_key, "identity_pubkey:agent_id")
```

This ensures:
- **Non-repudiation**: Only the identity owner can create valid bindings
- **Binding specificity**: Signatures are tied to specific identity-agent pairs
- **Replay protection**: Signatures cannot be replayed across different pairs

### Revocation

- Revocation is permanent and irreversible
- Only the identity owner can revoke their bindings
- Revoked bindings cannot be verified
- New bindings can be created after revocation

### Key Rotation

- Signature rotation allows updating binding signatures
- Requires a new valid signature from the identity
- Increments the binding version
- Previous signatures are invalidated

## Testing

### Running Tests

```bash
# Run identity binding tests
npm test -- tests/identity-binding.test.ts

# Run with coverage
npm test -- --coverage tests/identity-binding.test.ts
```

### Test Coverage

- ✅ Binding creation
- ✅ Signature verification
- ✅ Invalid signature rejection
- ✅ Revocation
- ✅ Cross-device recovery
- ✅ Revoked binding rejection
- ✅ Signature rotation
- ✅ Multiple agents per identity
- ✅ Query operations

## Integration with SAID Protocol

The implementation is compatible with SAID Protocol identities:

```typescript
interface SAIDClient {
  sign(message: string | Uint8Array): Promise<Uint8Array>;
  getPublicKey(): Promise<string>;
  createIdentity(): Promise<{ pubkey: string; secretKey?: Uint8Array }>;
}
```

To use with actual SAID Protocol:

```typescript
import { SAIDClient } from '@said-protocol/client';

const saidClient = new SAIDClient({
  network: 'mainnet-beta',
  // SAID-specific configuration
});
```

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_AGENT_ID_LENGTH` | 128 | Maximum agent identifier length |
| `MAX_BINDINGS_PER_IDENTITY` | 100 | Maximum bindings per identity |
| `ERC8004_VERSION` | '1.0.0' | Implementation version |

## Events

The smart contract emits the following events:

```rust
IdentityBound { identity, agent_id, binding, vault, timestamp }
IdentityBindingRevoked { identity, agent_id, binding, timestamp }
IdentityBindingReactivated { identity, agent_id, binding, new_version, timestamp }
BindingSignatureRotated { identity, agent_id, binding, new_version, timestamp }
RegistryInitialized { identity, registry, timestamp }
```

## Error Codes

| Error | Description |
|-------|-------------|
| `InvalidSignature` | The provided signature is invalid |
| `UnauthorizedRevocation` | Only the identity owner can revoke |
| `AlreadyRevoked` | Binding is already revoked |
| `MaxBindingsReached` | Identity has reached binding limit |
| `InvalidAgentId` | Agent ID is empty or too long |

## Future Enhancements

- [ ] Multi-signature bindings
- [ ] Time-locked bindings
- [ ] Delegated binding management
- [ ] Cross-chain identity verification
- [ ] Hardware wallet integration

## References

- [SAID Protocol](https://said-protocol.io)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Ed25519 Signature Scheme](https://ed25519.cr.yp.to/)
- [Anchor Framework](https://project-serum.github.io/anchor/)

## License

MIT License - See LICENSE file for details.
