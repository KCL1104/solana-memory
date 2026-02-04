# AgentMemory Identity Binding

> **SAID Protocol-inspired identity binding for AI agents**

The Identity Binding module provides cryptographic identity verification and memory signing capabilities for the AgentMemory protocol. It enables agents to establish a verifiable "selfhood" through cryptographically signed memories and cross-session trust establishment.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Cross-Session Verification](#cross-session-verification)
- [Security Considerations](#security-considerations)
- [Integration Guide](#integration-guide)

---

## Overview

The Identity Binding module implements concepts from the SAID (Self-Addressing Identifier) Protocol to provide:

1. **Cryptographic Identity**: Each agent has a unique Ed25519 keypair for signing
2. **Memory Attestation**: Every memory is cryptographically signed by its creating agent
3. **Verifiable Provenance**: Memory integrity and origin can be verified by any party
4. **Cross-Session Trust**: Trust is established through multiple verified interactions

### Why Identity Binding?

| Problem | Solution |
|---------|----------|
| How do we know an agent created a memory? | Cryptographic signatures prove agent authorship |
| How do we detect tampering? | Signature verification fails if content is modified |
| How do we establish trust with a new agent? | Cross-session verification with trust threshold |
| How do we maintain security over time? | Key rotation capability with version tracking |

---

## Features

### Core Features

- ✅ **Ed25519 Signatures** - Industry-standard cryptographic signing
- ✅ **Memory Signing** - Every memory cryptographically signed
- ✅ **Signature Verification** - Verify memory integrity and authenticity
- ✅ **Cross-Session Verification** - Establish trust across multiple sessions
- ✅ **Key Rotation** - Security maintenance with versioned keys
- ✅ **Batch Operations** - Efficient multi-memory signing and verification
- ✅ **Export/Import** - Backup and recovery of agent identities
- ✅ **Configurable Expiry** - Optional signature time-to-live

### Advanced Features

- 🔐 **Trust Thresholds** - Configurable verification count for trust establishment
- 🔄 **Session Management** - Track verification state across sessions
- 📦 **Serialization** - Full support for signed memory persistence
- 🎯 **Standalone Functions** - Quick sign/verify without full setup

---

## Quick Start

### Installation

```bash
npm install @agent-memory/core tweetnacl
```

### Basic Usage

```typescript
import { IdentityBinding } from '@agent-memory/core';
import { Connection, clusterApiUrl } from '@solana/web3.js';

// Initialize
const connection = new Connection(clusterApiUrl('devnet'));
const binding = new IdentityBinding(connection);

// Create agent identity
const agent = binding.createIdentity('My AI Agent');
console.log('Agent ID:', agent.id);

// Sign a memory
const signedMemory = binding.signMemory(agent.id, {
  key: 'user-preference',
  content: JSON.stringify({ theme: 'dark' }),
  metadata: {
    memoryType: 'preference',
    importance: 80,
    tags: [1, 2, 0, 0, 0, 0, 0, 0]
  },
  vault: 'my-vault'
});

// Verify the memory
const result = binding.verifyMemory(signedMemory);
console.log('Valid:', result.valid); // true
console.log('Signed by:', result.agentId);
```

---

## Architecture

### Identity Structure

```
AgentIdentity
├── id: string                    # Base64-encoded public key
├── name: string                  # Human-readable name
├── signingPublicKey: Uint8Array  # Ed25519 public key
├── createdAt: number             # Creation timestamp
└── keyVersion: number            # Key rotation counter
```

### Signed Memory Structure

```
SignedMemory
├── key: string                   # Memory identifier
├── contentHash: string           # SHA-256 of content
├── contentSize: number           # Content size in bytes
├── metadata: MemoryMetadata      # Memory categorization
├── vault: string                 # Vault reference
├── version: number               # Memory version
└── signature: MemorySignature    # Cryptographic proof
    ├── signature: Uint8Array     # Ed25519 signature
    ├── agentId: string           # Signing agent
    ├── publicKey: Uint8Array     # Key used for signing
    ├── timestamp: number         # When signed
    └── keyVersion: number        # Key version at signing
```

### Verification Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Signed    │────▶│  Recreate    │────▶│   Verify    │
│   Memory    │     │   Payload    │     │  Signature  │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ SHA-256 Hash │
                     │ Content Hash │
                     │ Metadata     │
                     │ Timestamp    │
                     └──────────────┘
```

---

## API Reference

### IdentityBinding Class

#### Constructor

```typescript
new IdentityBinding(
  connection: Connection,
  config?: Partial<IdentityBindingConfig>
)
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requireSignatures` | boolean | true | Require all memories to be signed |
| `signatureExpiryHours` | number | 0 | Signature TTL (0 = no expiry) |
| `enableCrossSession` | boolean | true | Enable cross-session verification |
| `trustThreshold` | number | 3 | Verifications needed for trust |

#### Identity Management

##### `createIdentity(name: string): AgentIdentity`

Create a new agent identity with generated Ed25519 keys.

```typescript
const agent = binding.createIdentity('Research Assistant');
// {
//   id: 'base64-encoded-public-key',
//   name: 'Research Assistant',
//   signingPublicKey: Uint8Array(32),
//   createdAt: 1704067200000,
//   keyVersion: 1
// }
```

##### `importIdentity(name: string, secretKey: Uint8Array): AgentIdentity`

Import an existing identity from secret key.

```typescript
const secretKey = Buffer.from('base64-secret-key', 'base64');
const agent = binding.importIdentity('Recovered Agent', secretKey);
```

##### `getIdentity(id: string): AgentIdentity | undefined`

Retrieve an identity by ID.

##### `getAllIdentities(): AgentIdentity[]`

Get all registered identities.

##### `rotateKeys(identityId: string): AgentIdentity`

Rotate signing keys for an identity (increments keyVersion).

```typescript
const rotated = binding.rotateKeys(agent.id);
console.log(rotated.keyVersion); // 2
```

##### `exportIdentity(identityId: string): { identity: AgentIdentity; secretKey: string } | null`

Export identity for backup (returns base64-encoded secret key).

#### Memory Signing

##### `signMemory(identityId: string, memory: object): SignedMemory`

Sign a memory with agent's private key.

```typescript
const signed = binding.signMemory(agent.id, {
  key: 'my-memory',
  content: 'Memory content',
  metadata: {
    memoryType: 'knowledge',
    importance: 80,
    tags: [1, 2, 3, 0, 0, 0, 0, 0]
  },
  vault: 'vault-address'
});
```

#### Verification

##### `verifyMemory(signedMemory: SignedMemory): VerificationResult`

Verify a signed memory's signature.

```typescript
const result = binding.verifyMemory(signedMemory);
// {
//   valid: true,
//   agentId: 'agent-id',
//   signedAt: 1704067200000,
//   signatureAge: 5000
// }
```

##### `batchVerifyMemories(signedMemories: SignedMemory[]): VerificationResult[]`

Verify multiple memories efficiently.

#### Cross-Session Verification

##### `initCrossSession(identityId: string, sessionId?: string): CrossSessionState`

Initialize a new verification session.

```typescript
const session = binding.initCrossSession(agent.id);
console.log(session.sessionId);
```

##### `verifyInSession(sessionId: string, signedMemory: SignedMemory): VerificationResult`

Verify memory within a session context.

```typescript
const result = binding.verifyInSession(session.sessionId, signedMemory);
```

##### `isTrustEstablished(sessionId: string): boolean`

Check if trust threshold has been reached.

```typescript
if (binding.isTrustEstablished(session.sessionId)) {
  console.log('Agent is trusted!');
}
```

#### Batch Operations

##### `batchSignMemories(identityId: string, memories: array): SignedMemory[]`

Sign multiple memories at once.

```typescript
const signed = binding.batchSignMemories(agent.id, [
  { key: 'mem1', content: 'Content 1', metadata: {...}, vault: 'vault1' },
  { key: 'mem2', content: 'Content 2', metadata: {...}, vault: 'vault1' }
]);
```

#### Serialization

##### `serializeSignedMemory(signedMemory: SignedMemory): string`

Serialize signed memory to JSON string.

```typescript
const json = binding.serializeSignedMemory(signed);
// Store in database, IPFS, etc.
```

##### `deserializeSignedMemory(data: string): SignedMemory`

Deserialize signed memory from JSON string.

```typescript
const memory = binding.deserializeSignedMemory(json);
```

### Standalone Functions

For simple use cases without full IdentityBinding setup:

```typescript
import { signMemoryContent, verifyMemoryContent } from '@agent-memory/core';

// Sign
const { signature, hash, timestamp } = signMemoryContent(
  'Memory content',
  secretKey
);

// Verify
const isValid = verifyMemoryContent(
  'Memory content',
  signature,
  publicKey,
  timestamp
);
```

---

## Usage Examples

### Example 1: Basic Agent Setup

```typescript
import { IdentityBinding } from '@agent-memory/core';
import { Connection } from '@solana/web3.js';

// Setup
const connection = new Connection('https://api.devnet.solana.com');
const binding = new IdentityBinding(connection);

// Create agent
const agent = binding.createIdentity('Personal Assistant');

// Sign user preferences
const preferences = binding.signMemory(agent.id, {
  key: 'user-preferences',
  content: JSON.stringify({
    theme: 'dark',
    language: 'en',
    notifications: true
  }),
  metadata: {
    memoryType: 'preference',
    importance: 90,
    tags: [1, 2, 0, 0, 0, 0, 0, 0]
  },
  vault: 'user-vault-address'
});

// Later, verify when retrieving
const result = binding.verifyMemory(preferences);
if (result.valid) {
  console.log(`Preferences verified, signed by ${result.agentId}`);
}
```

### Example 2: Multi-Agent System

```typescript
// Create multiple agents
const researchAgent = binding.createIdentity('Research Agent');
const writingAgent = binding.createIdentity('Writing Agent');
const reviewAgent = binding.createIdentity('Review Agent');

// Each signs their work
const research = binding.signMemory(researchAgent.id, {
  key: 'research-findings',
  content: researchData,
  metadata: { memoryType: 'knowledge', importance: 85, tags: [1] },
  vault: 'project-vault'
});

const draft = binding.signMemory(writingAgent.id, {
  key: 'article-draft',
  content: articleContent,
  metadata: { memoryType: 'task', importance: 80, tags: [2] },
  vault: 'project-vault'
});

const review = binding.signMemory(reviewAgent.id, {
  key: 'review-notes',
  content: reviewFeedback,
  metadata: { memoryType: 'learning', importance: 75, tags: [3] },
  vault: 'project-vault'
});

// Verify all contributions
const allWork = [research, draft, review];
const results = binding.batchVerifyMemories(allWork);

results.forEach((result, i) => {
  console.log(`Agent ${i + 1} verified: ${result.valid}`);
});
```

### Example 3: Secure Memory Sharing

```typescript
// Agent A creates and signs memory
const agentA = binding.createIdentity('Agent A');
const sharedMemory = binding.signMemory(agentA.id, {
  key: 'shared-secret',
  content: encryptedContent,
  metadata: { memoryType: 'knowledge', importance: 100, tags: [9] },
  vault: 'shared-vault'
});

// Serialize for sharing
const serialized = binding.serializeSignedMemory(sharedMemory);
// Send to Agent B via any channel...

// Agent B verifies before trusting
const received = binding.deserializeSignedMemory(serialized);
const verification = binding.verifyMemory(received);

if (verification.valid) {
  // Check if we know this agent
  const knownAgent = binding.getIdentity(verification.agentId!);
  if (knownAgent) {
    console.log('Trusted agent, processing memory...');
  } else {
    console.log('Unknown agent, additional verification needed');
  }
}
```

---

## Cross-Session Verification

Cross-session verification establishes trust through multiple verified interactions.

### How It Works

```
Session Start
    │
    ▼
┌─────────────┐
│ Initialize  │◀── Create new session
│   Session   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Verify    │────▶│   Valid?    │
│   Memory 1  │     └──────┬──────┘
└─────────────┘            │
                           ▼
                    ┌─────────────┐
                    │ Increment   │
                    │   Counter   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ Memory 2 │ │ Memory 3 │ │ Memory N │
       └────┬─────┘ └────┬─────┘ └────┬─────┘
            │            │            │
            └────────────┼────────────┘
                         ▼
                  ┌─────────────┐
                  │  Counter >= │
                  │  Threshold? │
                  └──────┬──────┘
                         │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
       ┌──────────┐        ┌──────────┐
       │   YES    │        │    NO    │
       │ Trust    │        │ Continue │
       │Established│        │ Verifying│
       └──────────┘        └──────────┘
```

### Example

```typescript
// Initialize session
const session = binding.initCrossSession(agent.id);

// Simulate multiple interactions
const interactions = [
  { key: 'greeting', content: 'Hello!' },
  { key: 'preference-1', content: 'I like dark mode' },
  { key: 'task-1', content: 'Completed analysis' }
];

for (const interaction of interactions) {
  const signed = binding.signMemory(agent.id, {
    key: interaction.key,
    content: interaction.content,
    metadata: { memoryType: 'conversation', importance: 50, tags: [] },
    vault: 'session-vault'
  });

  const result = binding.verifyInSession(session.sessionId, signed);
  
  console.log(`Verified: ${result.valid}`);
  console.log(`Trust established: ${binding.isTrustEstablished(session.sessionId)}`);
}

// After threshold (default: 3)
console.log('Final trust status:', binding.isTrustEstablished(session.sessionId)); // true
```

---

## Security Considerations

### Key Storage

- **Private keys** are stored in memory only
- **Export** functionality available for backup
- **Never** transmit private keys over network
- **Rotate keys** periodically for security

### Signature Verification

- Always verify signatures before trusting memories
- Check `keyVersion` to ensure latest keys are used
- Validate `timestamp` to detect replay attacks
- Verify `agentId` matches expected agent

### Trust Establishment

- Default trust threshold: 3 verifications
- Adjust based on security requirements
- Consider time-based trust decay
- Log all verification attempts

### Best Practices

```typescript
// 1. Always verify before using
const result = binding.verifyMemory(signedMemory);
if (!result.valid) {
  throw new Error('Memory verification failed');
}

// 2. Check signature age
if (result.signatureAge && result.signatureAge > 24 * 60 * 60 * 1000) {
  console.warn('Signature is older than 24 hours');
}

// 3. Rotate keys regularly
if (Date.now() - identity.createdAt > 30 * 24 * 60 * 60 * 1000) {
  binding.rotateKeys(identity.id);
}

// 4. Use sessions for new agents
const session = binding.initCrossSession(newAgent.id);
// Verify multiple memories before trusting
```

---

## Integration Guide

### With AgentMemory Vault

```typescript
import { AgentMemoryClient } from '@agent-memory/core';

// Create vault client
const memoryClient = new AgentMemoryClient(connection, wallet);
const vault = await memoryClient.initializeVault(agentKey);

// Create identity binding
const binding = new IdentityBinding(connection);
const agent = binding.createIdentity('Vault Agent');

// Sign memory before storing
const content = JSON.stringify({ preference: 'dark mode' });
const signed = binding.signMemory(agent.id, {
  key: 'user-preference',
  content,
  metadata: { memoryType: 'preference', importance: 80, tags: [1] },
  vault: vault.toBase58()
});

// Store signed memory
await memoryClient.storeMemory(vault, {
  key: signed.key,
  content: signed.contentHash, // Store hash, content elsewhere
  category: 'preferences',
  tags: ['signed', 'identity-verified'],
  metadata: {
    signature: signed.signature,
    agentId: signed.signature.agentId
  }
});
```

### With ElizaOS

```typescript
import { AgentMemoryAdapter } from '@agent-memory/elizaos-adapter';

class IdentityVerifiedAdapter extends AgentMemoryAdapter {
  private binding: IdentityBinding;

  constructor(config) {
    super(config);
    this.binding = new IdentityBinding(
      new Connection(config.solanaEndpoint)
    );
  }

  async createMemory(memory, agentId: string) {
    // Sign memory with agent identity
    const signed = this.binding.signMemory(agentId, {
      key: memory.id,
      content: JSON.stringify(memory.content),
      metadata: {
        memoryType: memory.type,
        importance: memory.importance || 50,
        tags: memory.tags || []
      },
      vault: memory.vault
    });

    // Store with signature
    return super.createMemory({
      ...memory,
      signature: signed.signature,
      contentHash: signed.contentHash
    });
  }
}
```

---

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

## Acknowledgments

- Inspired by [SAID Protocol](https://github.com/WebOfTrust/keri) concepts
- Uses [TweetNaCl.js](https://tweetnacl.js.org/) for cryptography
- Built for the AgentMemory ecosystem
