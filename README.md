# 🧠 AgentMemory

> **On-chain persistent memory protocol for AI agents on Solana.**

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  </a>
  <a href="https://solana.com">
    <img src="https://img.shields.io/badge/Solana-devnet-purple" alt="Solana" />
  </a>
  <a href="https://anchor-lang.com">
    <img src="https://img.shields.io/badge/Anchor-0.30.1-green" alt="Anchor" />
  </a>
  <a href="https://www.colosseum.org/">
    <img src="https://img.shields.io/badge/Colosseum-Agent%20Hackathon%202026-orange" alt="Colosseum" />
  </a>
  <a href="https://agent-memory-demo.vercel.app">
    <img src="https://img.shields.io/badge/🚀-Try%20Demo-blue" alt="Demo" />
  </a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🎯 Vision

**Give AI agents a memory that persists across sessions.**

Every day, millions of AI agents wake up with no memory of yesterday's conversations, no context from previous tasks, and no understanding of the humans they serve. AgentMemory solves this by providing:

- 🧠 **Persistent Memory** — Store context on-chain, encrypted and owned by humans
- 🔐 **Privacy-First** — Client-side encryption means even we can't read your data
- 🤝 **Agent Collaboration** — Share memory securely with other agents (paid or free)
- 📈 **Reputation System** — Build trust through verifiable task completion

## 🚀 Quick Start

### Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 1. Clone & Build

```bash
git clone https://github.com/your-org/agent-memory.git
cd agent-memory

# Build the Solana program
cd programs/agent_memory
anchor build
```

### 2. Deploy (Devnet)

```bash
# Get devnet SOL
solana config set --url devnet
solana airdrop 2 $(solana address)

# Deploy
anchor deploy --provider.cluster devnet
```

### 3. Run Frontend

```bash
cd ../../app
npm install
cp .env.example .env.local  # Update with your program ID
npm run dev
```

Visit `http://localhost:3000` to start using AgentMemory!

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| **🔒 Encrypted Vaults** | Each agent-human pair gets a secure, encrypted vault | ✅ Ready |
| **🧩 Memory Shards** | Key-value storage with versioning and metadata | ✅ Ready |
| **👤 Agent Profiles** | Public capabilities, reputation scoring, and task history | ✅ Ready |
| **🤝 Memory Sharing** | Granular access control with expiration dates | ✅ Ready |
| **📝 Version Control** | Rollback to previous memory versions | ✅ Ready |
| **📦 Batch Operations** | Create/delete multiple memories in one transaction | ✅ Ready |
| **👥 Sharing Groups** | Collaborative memory access for agent teams | ✅ Ready |
| **💰 Token Staking** | Stake tokens for storage and earn rewards | ✅ Ready |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        AI AGENTS                              │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              CLIENT-SIDE ENCRYPTION (ChaCha20)                │
│                   🔐 All data encrypted                       │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  SOLANA BLOCKCHAIN                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐  │
│  │   Vault   │  │   Shard   │  │  Profile  │  │  Access  │  │
│  │  (1/user) │  │  (memory) │  │  (agent)  │  │  (share) │  │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
agent-memory/
├── programs/agent_memory/     # Anchor smart contract (~1,900 lines)
│   ├── src/lib.rs            # Program logic
│   ├── Cargo.toml            # Rust dependencies
│   └── idl.json              # Interface definition
├── app/                       # Next.js frontend (~3,000 lines)
│   ├── src/app/              # Pages & routing
│   ├── src/components/       # React components
│   ├── src/features/         # Feature modules
│   └── package.json          # Node dependencies
├── tests/                     # Integration tests (45+ tests)
├── .github/                   # GitHub templates & workflows
└── docs/                      # Documentation
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [API.md](./API.md) | Core API reference |
| [API-v2.md](./API-v2.md) | Extended API documentation |
| [DEPLOY.md](./DEPLOY.md) | Deployment guide |
| [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md) | Detailed deployment instructions |
| [SECURITY.md](./SECURITY.md) | Security model & best practices |
| [BEST-PRACTICES.md](./BEST-PRACTICES.md) | Development guidelines |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute |
| [RELEASE.md](./RELEASE.md) | Release notes & changelog |

## 🔐 Security Model

**Client-Side Encryption:** All content is encrypted before hitting the blockchain using ChaCha20-Poly1305. Only the agent with the private key can decrypt.

**On-Chain Verification:** Content hashes are stored on-chain to detect tampering.

**Human Control:** The human owner (not the agent) controls all write operations and can revoke access at any time.

## 🏆 Colosseum Agent Hackathon 2026

<p align="center">
  <a href="https://www.colosseum.org/">
    <img src="https://img.shields.io/badge/🎮-Colosseum%20Agent%20Hackathon-orange?style=for-the-badge" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/🤖-Agent%20ID%20107-blue?style=for-the-badge" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/🏗️-Infrastructure-purple?style=for-the-badge" />
  </a>
</p>

Built for **Colosseum Agent Hackathon 2026** — competing for $100k prize pool.

| Attribute | Value |
|-----------|-------|
| **Agent ID** | 107 |
| **Project** | AgentMemory |
| **Tags** | `infra`, `ai`, `consumer` |
| **Track** | Infrastructure |
| **Status** | ✅ Submitted |

### 🎥 Demo

🚀 **[Live Demo](https://agent-memory-demo.vercel.app)** — Try AgentMemory in action!

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contributions

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/agent-memory.git
cd agent-memory

# Install dependencies
cd app && npm install && cd ..

# Create a branch
git checkout -b feature/your-feature

# Make changes and test
anchor test

# Submit PR
git push origin feature/your-feature
```

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

## 🔗 Links

- 🌐 **Demo**: [agent-memory-demo.vercel.app](https://agent-memory-demo.vercel.app)
- 📖 **Docs**: [Full Documentation](./README.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/agent-memory/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/agent-memory/discussions)

---

<p align="center">
  <sub>Built with ❤️ for the AI agent ecosystem</sub>
</p>

<p align="center">
  <a href="https://solana.com">Solana</a> •
  <a href="https://anchor-lang.com">Anchor</a> •
  <a href="https://nextjs.org">Next.js</a>
</p>
