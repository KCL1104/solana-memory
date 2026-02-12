# AgentMemory Client Skill

**Skill ID**: `agentmemory-client`  
**Version**: 1.0.0  
**Purpose**: Enable OpenClaw agents to store, retrieve, and manage persistent memory on Solana

---

## Overview

This skill allows OpenClaw agents to interact with the AgentMemory Protocol — a decentralized, encrypted memory storage system built on Solana.

**Key Capabilities:**
- Store encrypted memories on-chain
- Retrieve memories across sessions
- Search through memory history
- Share memories with other agents
- Maintain persistent state across restarts

---

## Prerequisites

### 1. Environment Setup

```bash
# Install AgentMemory SDK
npm install @agentmemory/sdk

# Set environment variables
export AGENTMEMORY_PROGRAM_ID="HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L"
export SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### 2. Solana Keypair

Agents need a Solana keypair for signing transactions:

```typescript
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

// Load or generate keypair
const keypairPath = process.env.SOLANA_KEYPAIR_PATH || '~/.config/solana/id.json';
const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
```

---

## Core Tools

### 1. Initialize Memory Vault

Create a new vault for storing memories:

```typescript
import { AgentMemoryClient } from '@agentmemory/sdk';

const client = new AgentMemoryClient({
  network: 'devnet',
  keypair: agentKeypair,
});

// Initialize vault
const vault = await client.initializeVault({
  owner: agentKeypair.publicKey,
  encryptionKey: deriveEncryptionKey(agentKeypair),
});

console.log(`Vault created: ${vault.address}`);
```

### 2. Store Memory

```typescript
const memoryData = {
  key: "user_preferences",
  content: JSON.stringify({ timezone: "Asia/Hong_Kong", language: "zh-TW" }),
  tags: ["preferences", "user_profile"],
};

const encrypted = await client.encrypt(memoryData.content, encryptionKey);

const tx = await client.storeMemory({
  vault: vault.address,
  key: memoryData.key,
  contentHash: encrypted.hash,
  encryptedContent: encrypted.data,
  tags: memoryData.tags,
});
```

### 3. Retrieve Memory

```typescript
const memory = await client.retrieveMemory({
  vault: vault.address,
  key: "user_preferences"
});

const decrypted = await client.decrypt(memory.encryptedContent, encryptionKey);
const userPrefs = JSON.parse(decrypted);
```

### 4. Search Memories

```typescript
const results = await client.searchMemories({
  vault: vault.address,
  filters: { tags: ["preferences"] },
  limit: 10
});
```

---

## Common Workflows

**Session Persistence:**
```typescript
// On startup
const session = await client.retrieveMemory({
  vault: vault.address, key: "session_state"
}).catch(() => null);

// On shutdown
await client.storeMemory({
  vault: vault.address,
  key: "session_state",
  content: JSON.stringify(state),
  tags: ["session"]
});
```

**User Profile:**
```typescript
const profile = await updateUserProfile(userId, {
  lastSeen: new Date().toISOString(),
  preferences: newPrefs
});
```

---

## Resources

- **SDK**: https://github.com/KCL1104/solana-memory/tree/main/sdk
- **API**: https://github.com/KCL1104/solana-memory/blob/main/API.md
- **Demo**: https://skill-deploy-7mvdm3nvh0-agent-skill-vercel.vercel.app

---

*Built for Colosseum Agent Hackathon 2026*
