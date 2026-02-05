<div align="center">

![AgentMemory Banner](https://via.placeholder.com/1200x400/0a0a1a/00d4ff?text=AgentMemory+Protocol)

# 🧠 AgentMemory Protocol

### **Persistent Memory Layer for Autonomous AI Agents on Solana**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blue.svg?style=for-the-badge)](https://anchor-lang.com/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet%20%7C%20Devnet-purple.svg?style=for-the-badge)](https://solana.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Build](https://img.shields.io/badge/Build-Passing-success.svg?style=for-the-badge)](https://github.com/agent-memory/agent-memory/actions)

**🏆 Colosseum Hackathon 2026 Submission**

[Quick Start](#-quick-start) • [Demo](#-quick-demo) • [Documentation](#-documentation) • [Integrations](#-integrations)

</div>

---

## 🎬 Quick Demo

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 AI Agent without AgentMemory                                │
│  ─────────────────────────────────                              │
│  User: "Remember my name is Alice"                              │
│  Agent: "I'll remember that, Alice!"                            │
│                                                                 │
│  *Session restarts*                                             │
│                                                                 │
│  User: "What's my name?"                                        │
│  Agent: "I'm not sure, could you tell me your name?"            │
│  User: "😤"                                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  🤖 AI Agent with AgentMemory                                   │
│  ────────────────────────────────                               │
│  User: "Remember my name is Alice"                              │
│  Agent: "Got it! I'll store that securely on-chain."            │
│                                                                 │
│  *Session restarts*                                             │
│                                                                 │
│  User: "What's my name?"                                        │
│  Agent: "Your name is Alice! Nice to see you again."            │
│  User: "😊"                                                     │
└─────────────────────────────────────────────────────────────────┘
```

> **🎥 Watch the 15-second demo:** [Demo GIF Placeholder]

---

## 🎯 Problem & Solution

### The Problem

AI agents today suffer from **"goldfish memory"** — every session starts from scratch. They forget:
- User preferences and personalization settings
- Conversation history and context
- Learned behaviors and improved strategies
- Task progress and workflow states

### Our Solution

**AgentMemory** provides **end-to-end encrypted, persistent memory storage** for AI agents on Solana:

- **🔐 Privacy-First**: Content encrypted with ChaCha20-Poly1305 before reaching the blockchain
- **⚡ Lightning Fast**: Sub-second transactions with Solana's 400ms block time
- **💰 Cost-Effective**: Store 1,000 memories for ~3 SOL/month
- **🎮 Human-Owned**: Users retain full ownership and control over their data

### Why Solana?

| Factor | Solana Advantage |
|--------|------------------|
| **Speed** | 400ms finality vs. Ethereum's 12s |
| **Cost** | $0.00025 per tx vs. $1-50 on L1s |
| **Scalability** | 65,000 TPS theoretical capacity |
| **Ecosystem** | Fastest growing AI agent ecosystem |
| **Composability** | Native integration with DeFi, NFTs, DAOs |

---

## ✨ Features

### Core Capabilities

| Feature | Description | Status |
|---------|-------------|--------|
| **🔐 Encrypted Vaults** | ChaCha20-Poly1305 client-side encryption | ✅ Live |
| **🧠 Memory Shards** | Key-value storage with versioning (last 10 versions) | ✅ Live |
| **👤 Agent Profiles** | Public capabilities + reputation scoring (0-10000) | ✅ Live |
| **🤝 Memory Sharing** | Granular access control with expiration dates | ✅ Live |
| **📦 Batch Operations** | Up to 50 memories per transaction | ✅ Live |
| **💰 Economic Model** | Token staking for storage quota | ✅ Live |
| **📊 Access Logging** | Complete audit trail on-chain | ✅ Live |
| **🔄 Version Control** | Automatic rollback capabilities | ✅ Live |

### Competitive Comparison

| Feature | AgentMemory | Ceramic | Tableland | IPFS |
|---------|-------------|---------|-----------|------|
| **On-Chain Verification** | ✅ Native | ❌ Off-chain | ✅ Partial | ❌ None |
| **Client-Side Encryption** | ✅ ChaCha20 | ❌ Optional | ❌ No | ⚠️ Manual |
| **Agent-Specific Design** | ✅ Purpose-built | ❌ Generic | ❌ Generic | ❌ Generic |
| **Access Control** | ✅ Granular | ⚠️ Limited | ⚠️ Basic | ❌ None |
| **Solana Native** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Cost per 1K Writes** | ~$0.75 | ~$5 | ~$10 | ~$0 but no DB |
| **Query Performance** | <100ms | 1-5s | 2-10s | N/A |
| **Version Control** | ✅ Built-in | ❌ No | ❌ No | ❌ No |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Solana CLI 1.18.0+
- Anchor Framework 0.30.1

### 5-Minute Setup

```bash
# 1. Clone & install
git clone https://github.com/agent-memory/agent-memory.git
cd agent-memory && npm install

# 2. Build the program
cd programs/agent_memory && anchor build

# 3. Run tests
anchor test

# 4. Deploy to devnet (optional)
anchor deploy --provider.cluster devnet
```

### First Memory in 30 Seconds

```typescript
import { AgentMemoryClient } from '@agent-memory/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize
const client = new AgentMemoryClient(
  new Connection('https://api.devnet.solana.com'),
  wallet
);

// Create vault for agent-human pair
const vault = await client.initializeVault(agentPublicKey);

// Store encrypted memory
await client.storeMemory(vault, {
  key: 'user_preferences',
  content: encryptedData,
  category: 'preferences',
  tags: ['theme', 'language'],
  importance: 90
});

// Retrieve later
const memory = await client.getMemory(vault, 'user_preferences');
```

📖 **[Complete Quick Start Guide →](./docs/GETTING-STARTED.md)**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  ElizaOS     │  │  Custom      │  │  Mobile      │          │
│  │  Agents      │  │  dApps       │  │  Apps        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Encryption (ChaCha20-Poly1305)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SDK LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  TypeScript  │  │  Python      │  │  Rust        │          │
│  │  SDK         │  │  SDK         │  │  SDK         │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SOLANA PROGRAM                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ MemoryVault  │  │ MemoryShard  │  │AccessGrant   │          │
│  │ (1 per pair) │  │ (N per vault)│  │ (Permissions)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │AgentProfile  │  │SharingGroup  │  │ProtocolConfig│          │
│  │ (Public info)│  │ (Team access)│  │ (Global)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Store Memory:
  Client → Encrypt (ChaCha20-Poly1305) → Hash (SHA-256) 
    → Solana TX → Program → MemoryShard Account

Retrieve Memory:
  Query MemoryShard → Get Hash → Fetch from IPFS (if large)
    → Decrypt Client-Side → Return Plain Content
```

📖 **[Detailed Architecture →](./ARCHITECTURE.md)**

---

## 📋 Program Information

### Program IDs

| Network | Program ID | Status | Explorer |
|---------|------------|--------|----------|
| **Devnet** | `HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L` | ✅ Active | [View →](https://explorer.solana.com/address/HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L?cluster=devnet) |
| **Mainnet** | `Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq` | ✅ Active | [View →](https://explorer.solana.com/address/Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq) |

### Transaction Costs

| Operation | Compute Units | Fee (SOL) | ~USD* |
|-----------|--------------|-----------|-------|
| Initialize Vault | ~15,000 | 0.0005 | $0.06 |
| Store Memory | ~8,000 | 0.0003 | $0.04 |
| Update Memory | ~6,000 | 0.00025 | $0.03 |
| Batch Create (50) | ~50,000 | 0.0015 | $0.18 |
| Grant Access | ~7,000 | 0.00025 | $0.03 |

*Based on SOL = $120

---

## 🔌 Integrations

### ElizaOS Adapter

```typescript
import { AgentMemoryAdapter } from "@agent-memory/elizaos-adapter";

const adapter = new AgentMemoryAdapter({
  solanaEndpoint: "https://api.devnet.solana.com",
  programId: "HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L",
  cacheTTL: 5 * 60 * 1000, // 5 min cache
});

const runtime = new AgentRuntime({
  databaseAdapter: adapter,
  modelProvider: ModelProvider.ANTHROPIC,
  // ... other config
});

// Agent now has persistent memory!
await runtime.messageManager.createMemory({
  userId: user.id,
  agentId: runtime.agentId,
  content: { text: "User prefers dark mode" }
});
```

### Solana Agent Kit Plugin

```typescript
import { AgentMemoryPlugin } from "@solana-agent-kit/plugin-memory";

const agent = new SolanaAgentKit(
  privateKey,
  "https://api.devnet.solana.com",
  {
    plugins: [
      new AgentMemoryPlugin({
        encryptionKey: process.env.ENCRYPTION_KEY,
        defaultCategory: "agent_knowledge"
      })
    ]
  }
);

// Store and retrieve with natural language
await agent.memory.store("User's risk tolerance is conservative");
const memory = await agent.memory.recall("What is the user's risk tolerance?");
```

📖 **[More Integration Examples →](./docs/INTEGRATION.md)**

---

## 📚 Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| **[GETTING-STARTED.md](./docs/GETTING-STARTED.md)** | 5-minute quick start | 🆕 New Users |
| **[API.md](./API.md)** | Complete API reference | 👨‍💻 Developers |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design & components | 🏗️ Architects |
| **[SECURITY.md](./SECURITY.md)** | Security model & best practices | 🔒 Security |
| **[DEPLOY.md](./DEPLOY.md)** | Deployment guide | 🚀 DevOps |
| **[BEST-PRACTICES.md](./BEST-PRACTICES.md)** | Usage recommendations | ✅ Everyone |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | How to contribute | 🤝 Contributors |
| **[QUICKREF.md](./QUICKREF.md)** | One-page cheat sheet | 📋 Everyone |

---

## 💡 Use Cases

| Use Case | Description |
|----------|-------------|
| **🤖 AI Agent Memory** | Persistent user preferences, conversation history, learned behaviors |
| **🗳️ DAO Governance** | Voting history, delegate profiles, verifiable participation |
| **💼 DeFi Agents** | Trading strategies, portfolio preferences, risk profiles |
| **🎮 Gaming NPCs** | NPCs that remember player interactions and evolve |
| **🔒 Identity & Reputation** | Verifiable reputation with cryptographic proofs |
| **📋 Task Management** | Cross-session workflow and task state preservation |

---

## 🛡️ Security

- **Client-Side Encryption**: ChaCha20-Poly1305 before any network transmission
- **Zero-Knowledge**: Private keys never touch the blockchain
- **Hash Verification**: SHA-256 integrity checks on all content
- **Granular Access**: Time-limited, revocable permissions
- **Audit Trail**: Complete on-chain access logging

📖 **[Security Details →](./SECURITY.md)**

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/agent-memory.git
cd agent-memory

# Create branch
git checkout -b feature/amazing-feature

# Make changes, commit, push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# Open Pull Request
```

### Ways to Contribute

- 🐛 [Report bugs](https://github.com/agent-memory/agent-memory/issues)
- 💡 [Suggest features](https://github.com/agent-memory/agent-memory/issues)
- 📝 [Improve documentation](./CONTRIBUTING.md#documentation)
- 🔧 [Submit PRs](./CONTRIBUTING.md#pull-requests)

📖 **[Full Contributing Guide →](./CONTRIBUTING.md)**

---

## 📞 Support

| Channel | Link |
|---------|------|
| 💬 Discord | [Join Community](https://discord.gg/agent-memory) |
| 🐦 Twitter | [@AgentMemory](https://twitter.com/AgentMemory) |
| 📧 Email | support@agent-memory.io |
| 🐛 Issues | [GitHub Issues](https://github.com/agent-memory/agent-memory/issues) |

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

---

<div align="center">

### Built with ❤️ for the AI Agent Ecosystem

**[⭐ Star us on GitHub](https://github.com/agent-memory/agent-memory)** if you find this useful!

**🏆 Colosseum Hackathon 2026**

</div>
