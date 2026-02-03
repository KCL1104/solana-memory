# AgentMemory Protocol

> **On-Chain Persistent Memory for AI Agents on Solana**

Give AI agents a persistent memory that survives session restarts, built on Solana with client-side encryption and human ownership.

---

## ✨ Key Features

- **🔐 Encrypted Vaults** — Each agent-human pair gets a secure, encrypted vault with ChaCha20-Poly1305 encryption
- **🧠 Memory Shards** — Key-value storage with versioning, metadata, and soft-delete capabilities
- **👤 Agent Profiles** — Public capabilities, reputation scoring, and verifiable task history
- **🤝 Memory Sharing** — Granular access control with permission levels and expiration dates
- **📦 Batch Operations** — Create up to 50 memories in a single transaction for gas optimization
- **💰 Economic Model** — Token staking for storage quota with dynamic fee structure

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Solana (devnet) |
| **Smart Contracts** | Rust + Anchor Framework 0.30.1 |
| **Encryption** | ChaCha20-Poly1305 (client-side) |
| **Storage** | IPFS for large encrypted content |
| **Frontend** | Next.js 14 + TypeScript |
| **Styling** | Tailwind CSS |
| **Wallet** | @solana/wallet-adapter |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Solana CLI
- Anchor Framework

### Installation

```bash
# Clone the repository
git clone https://github.com/[username]/agent-memory.git
cd agent-memory

# Install dependencies
npm install

# Build the program
anchor build

# Run tests
anchor test

# Start the frontend
cd app && npm install && npm run dev
```

### Basic Usage

```typescript
import { AgentMemoryClient } from './src/client';

// Initialize client
const client = new AgentMemoryClient(connection, wallet);

// Initialize vault for agent-human pair
const vault = await client.initializeVault(agentPublicKey);

// Store encrypted memory
await client.storeMemory(vault, {
  content: encryptedData,
  category: 'preferences',
  tags: ['user', 'settings']
});

// Retrieve memories
const memories = await client.getMemories(vault, {
  category: 'preferences'
});
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`SUBMISSION.md`](./SUBMISSION.md) | Full project overview and submission details |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System architecture and design decisions |
| [`API.md`](./API.md) | API reference (v1) |
| [`API-v2.md`](./API-v2.md) | Extended API reference (v2) |
| [`DEPLOY.md`](./DEPLOY.md) | Deployment guide |
| [`EXTENSION.md`](./EXTENSION.md) | v0.2.0 feature extension details |
| [`AUDIT-REPORT.md`](./AUDIT-REPORT.md) | Security audit results |

---

## 🔗 Program Information

| Network | Program ID |
|---------|------------|
| Devnet | `HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L` |

---

## 📝 Releases

### v1.0.0 - February 2026

**Status**: Ready for Release  
**Network**: Solana Devnet (Mainnet ready)

AgentMemory Protocol v1.0.0 is the first stable release of our on-chain persistent memory system for AI agents.

#### Release Highlights

- ✅ Complete smart contract implementation
- ✅ Client-side encryption system (ChaCha20-Poly1305)
- ✅ Full-featured web interface
- ✅ Comprehensive documentation
- ✅ Security audit complete
- ✅ Test coverage >90%

#### Deployment Status

| Component | Status | Location |
|-----------|--------|----------|
| Smart Contract | ✅ Deployed | Devnet |
| Web Frontend | ✅ Deployed | Vercel |
| Documentation | ✅ Published | GitHub |

#### Code Statistics

- **Smart Contract**: ~1,900 lines of Rust
- **Frontend**: ~8,000 lines of TypeScript/React
- **Tests**: 45+ test cases

#### Known Limitations

1. **Storage**: Maximum 10MB per memory shard
2. **Batch Size**: Maximum 50 items per batch operation
3. **Rate Limiting**: Task recording limited to 1 per minute
4. **Version History**: Last 10 versions retained

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Built with ❤️ for the AI agent ecosystem | Colosseum Hackathon 2026*
