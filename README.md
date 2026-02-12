# AgentMemory Protocol

> **On-Chain Persistent Memory for AI Agents on Solana**

Give AI agents persistent memory that survives session restarts, built on Solana with client-side encryption and human ownership.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blue.svg)](https://anchor-lang.com/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-green.svg)](https://solana.com/)

---

## 🌐 Live Demo

**Try AgentMemory now:** https://skill-deploy-7mvdm3nvh0-agent-skill-vercel.vercel.app

- 📖 **[User Guide](./docs/USER-GUIDE.md)** — Web interface instructions
- 🤖 **[Agent Skill](./skills/agentmemory-client/SKILL.md)** — For AI agents

---

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Program Information](#-program-information)
- [Integrations](#-integrations)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Quick Start

Get started in 5 minutes:

```bash
# Clone the repository
git clone https://github.com/agent-memory/agent-memory.git
cd agent-memory

# Install dependencies
npm install

# Build the program
cd programs/agent_memory
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

**Try it out:**

```typescript
import { AgentMemoryClient } from '@agent-memory/sdk';
import { Connection } from '@solana/web3.js';

// Initialize client
const connection = new Connection('https://api.devnet.solana.com');
const client = new AgentMemoryClient(connection);

// Initialize vault for agent-human pair
const { vaultPda } = client.findVaultPda(ownerPublicKey, agentPublicKey);

// Initialize vault (requires wallet signature)
await client.initializeVault(ownerPublicKey, agentPublicKey, encryptionKey, payerPublicKey);

// Store encrypted memory
const contentHash = await hashContent(encryptedData);
await client.createMemory(
  vaultPda,
  'memory-key',
  contentHash,
  encryptedData.length,
  { memoryType: 'preference', importance: 80, tags: ['user', 'settings'] },
  ownerPublicKey
);

// Retrieve memories
const memory = await client.getMemory(vaultPda, 'memory-key');
```

📖 **[Complete 5-Minute Guide](./docs/GETTING-STARTED.md)**

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🔐 Encrypted Vaults** | Each agent-human pair gets a secure vault with ChaCha20-Poly1305 encryption |
| **🧠 Memory Shards** | Key-value storage with versioning, metadata, and soft-delete capabilities |
| **👤 Agent Profiles** | Public capabilities, reputation scoring, and verifiable task history |
| **🤝 Memory Sharing** | Granular access control with permission levels and expiration dates |
| **📦 Batch Operations** | Create up to 50 memories in a single transaction for gas optimization |
| **💰 Economic Model** | Token staking for storage quota with dynamic fee structure |
| **🔄 Version Control** | Automatic version history with rollback capabilities |
| **📊 Access Logging** | Complete audit trail of memory access |
| **🔗 Identity Binding** | SAID Protocol-inspired cryptographic identity binding with memory signing |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Solana (devnet/mainnet ready) |
| **Smart Contracts** | Rust + Anchor Framework 0.30.1 |
| **Encryption** | ChaCha20-Poly1305 (client-side) |
| **Storage** | IPFS for large encrypted content |
| **Frontend** | Next.js 14 + TypeScript |
| **Styling** | Tailwind CSS |
| **Wallet** | @solana/wallet-adapter |

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- Solana CLI 1.18.0+
- Anchor Framework 0.30.1
- Rust 1.79.0+

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/agent-memory/agent-memory.git
cd agent-memory

# 2. Install dependencies
npm install

# 3. Build the program
cd programs/agent_memory
anchor build

# 4. Run tests
anchor test

# 5. Start the frontend
cd ../../app
npm install && npm run dev
```

📖 **[Detailed Installation Guide](./DEPLOY.md)**

---

## 💻 Usage

### Basic Example

```typescript
import { AgentMemoryClient } from '@agent-memory/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

// Setup connection
const connection = new Connection('https://api.devnet.solana.com');

// Initialize client
const client = new AgentMemoryClient(connection);

// Find vault PDA (doesn't require transaction)
const [vaultPda, vaultBump] = client.findVaultPda(ownerPublicKey, agentPublicKey);
console.log('Vault PDA:', vaultPda.toBase58());

// Initialize vault (requires wallet signature)
const result = await client.initializeVault(
  ownerPublicKey,
  agentPublicKey,
  encryptionPublicKey,
  payerPublicKey
);
console.log('Vault created:', result.signature);
```

### Store Memory

```typescript
import { hashContent } from '@agent-memory/sdk';

// Encrypt content client-side (using your preferred encryption)
const content = JSON.stringify({ theme: 'dark', language: 'en' });
const encryptedData = encryptContent(content, encryptionKey);

// Hash the encrypted content
const contentHash = await hashContent(encryptedData);

// Store on-chain
const result = await client.createMemory(
  vaultPda,
  'user-preferences',
  contentHash,
  encryptedData.length,
  { 
    memoryType: 'preference', 
    importance: 80,
    tags: ['user', 'settings']
  },
  ownerPublicKey
);
console.log('Memory stored:', result.signature);
```

### Retrieve Memories

```typescript
// Get a specific memory
const memory = await client.getMemory(vaultPda, 'user-preferences');
console.log('Memory:', memory);

// Memory includes:
// - contentHash: Verify against your stored data
// - contentSize: Size of encrypted content
// - metadata: { memoryType, importance, tags }
// - version: Version number for this memory
// - versionHistory: Array of all versions
```

### Batch Operations

```typescript
// Store multiple memories efficiently
const memories = [
  { key: 'pref1', content: data1, category: 'prefs' },
  { key: 'pref2', content: data2, category: 'prefs' },
  // ... up to 50
];

await client.batchStoreMemories(vault, memories);
```

### Memory Sharing

```typescript
// Grant access to another agent
await client.grantAccess(vault, granteeAgentKey, {
  permissionLevel: 'read', // 'none' | 'read' | 'write' | 'admin'
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Revoke access
await client.revokeAccess(vault, granteeAgentKey);
```

📖 **[More Examples](./docs/EXAMPLES.md)** | **[API Reference](./API.md)**

---

## 📚 Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| **[GETTING-STARTED.md](./docs/GETTING-STARTED.md)** | 5-minute quick start guide | New users |
| **[API.md](./API.md)** | Complete API reference | Developers |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System architecture & design | Architects |
| **[IDENTITY_BINDING.md](./docs/IDENTITY_BINDING.md)** | Identity binding & memory signing | Developers |
| **[DEPLOY.md](./DEPLOY.md)** | Deployment guide | DevOps |
| **[INTEGRATION.md](./docs/INTEGRATION.md)** | Integration guides | Developers |
| **[BEST-PRACTICES.md](./BEST-PRACTICES.md)** | Security best practices | Developers |
| **[SECURITY.md](./SECURITY.md)** | Security considerations | Security reviewers |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Contribution guidelines | Contributors |
| **[QUICKREF.md](./QUICKREF.md)** | Quick reference card | Everyone |

### Additional Resources

- **[SUBMISSION.md](./SUBMISSION.md)** - Hackathon submission details
- **[PITCH.md](./PITCH.md)** - Project pitch and overview
- **[EXTENSION.md](./EXTENSION.md)** - v0.2.0 feature extension

---

## 🔗 Program Information

| Network | Program ID | Status |
|---------|------------|--------|
| **Devnet** | `HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L` | ✅ Active |
| **Mainnet** | `Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq` | ✅ Active |

### Explorer Links

- [Devnet Explorer](https://explorer.solana.com/address/HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L?cluster=devnet)
- [Mainnet Explorer](https://explorer.solana.com/address/Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq)

---

## 🔌 Integrations

### Available Integrations

| Integration | Package | Description |
|-------------|---------|-------------|
| **ElizaOS** | `@agent-memory/elizaos-adapter` | Database adapter for ElizaOS agents |
| **Solana Agent Kit** | `@solana-agent-kit/plugin-memory` | Plugin for Solana Agent Kit |

### ElizaOS Example

```typescript
import { AgentMemoryAdapter } from "@agent-memory/elizaos-adapter";

const adapter = new AgentMemoryAdapter({
  solanaEndpoint: "https://api.devnet.solana.com",
  cacheTTL: 5 * 60 * 1000,
});

const runtime = new AgentRuntime({
  databaseAdapter: adapter,
  // ...
});
```

📖 **[Integration Guides](./docs/INTEGRATION.md)**

---

## 🎯 Use Cases

### 🤖 AI Agent Memory
Enable AI agents to remember user preferences, conversation history, and learned behaviors across sessions.

### 🗳️ DAO Governance
Store voting history, delegate profiles, and governance participation data with verifiable on-chain records.

### 💼 DeFi Agent History
Track trading strategies, portfolio preferences, and risk tolerance for DeFi automation agents.

### 🎮 Gaming NPCs
Create persistent NPCs that remember player interactions and evolve over time.

### 🔒 Identity & Reputation
Build verifiable reputation systems with cryptographic proofs of agent behavior.

---

## 🛡️ Security

- **Client-Side Encryption**: Content encrypted with ChaCha20-Poly1305 before reaching Solana
- **Access Control**: Granular permissions with expiration
- **Audit Logging**: Complete access history
- **Ownership**: Human-owned vaults, agent-operated

📖 **[Security Details](./SECURITY.md)** | **[Best Practices](./BEST-PRACTICES.md)**

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contributions

- 🐛 [Report bugs](https://github.com/agent-memory/agent-memory/issues)
- 💡 [Suggest features](https://github.com/agent-memory/agent-memory/issues)
- 📝 [Improve docs](./CONTRIBUTING.md#documentation)
- 🔧 [Submit PRs](./CONTRIBUTING.md#pull-requests)

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ for the AI agent ecosystem | Colosseum Hackathon 2026

### Built With

- [Anchor Framework](https://anchor-lang.com/)
- [Solana](https://solana.com/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support

- 📧 Email: support@agent-memory.io
- 💬 Discord: [Join our community](https://discord.gg/agent-memory)
- 🐦 Twitter: [@AgentMemory](https://twitter.com/AgentMemory)
- 📝 [GitHub Issues](https://github.com/agent-memory/agent-memory/issues)

---

<p align="center">
  <strong>⭐ Star us on GitHub if you find this useful! ⭐</strong>
</p>
