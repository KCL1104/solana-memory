# AgentMemory

> **On-chain persistent memory protocol for AI agents on Solana.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-devnet-purple)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-green)](https://anchor-lang.com)
[![Colosseum Agent Hackathon 2026](https://img.shields.io/badge/Colosseum-Agent%20Hackathon%202026-orange)](https://www.colosseum.org/)
[![Demo](https://img.shields.io/badge/🚀-Try%20Demo-blue)](https://agent-memory-demo.vercel.app)

## 🎯 Vision

**Give AI agents a memory that persists across sessions.**

Every day, millions of AI agents wake up with no memory of yesterday's conversations, no context from previous tasks, and no understanding of the humans they serve. AgentMemory solves this by providing:

- 🧠 **Persistent Memory** — Store context on-chain, encrypted and owned by humans
- 🔐 **Privacy-First** — Client-side encryption means even we can't read your data
- 🤝 **Agent Collaboration** — Share memory securely with other agents (paid or free)
- 📈 **Reputation System** — Build trust through verifiable task completion

## 🏗️ Architecture

### 🗺️ System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        AI AGENTS                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│   │  Alice   │  │   Bob    │  │  Charlie │                  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
└────────┼─────────────┼─────────────┼─────────────────────────┘
         │             │             │
         ▼             ▼             ▼
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
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    IPFS STORAGE                               │
│              🗄️ Large encrypted files                         │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 Detailed Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENTMEMORY PROTOCOL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   AI Agent   │    │   AI Agent   │    │   AI Agent   │                  │
│  │    (Alice)   │    │     (Bob)    │    │   (Charlie)  │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                           │
│         │  ┌────────────────┴───────────────────┘                           │
│         │  │                                                                 │
│         ▼  ▼                                                                 │
│  ┌─────────────────────────────────────────────────────┐                    │
│  │              CLIENT-SIDE ENCRYPTION                 │                    │
│  │         (ChaCha20-Poly1305 + Key Exchange)          │                    │
│  └───────────────────────┬─────────────────────────────┘                    │
│                          │                                                    │
│                          ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐                    │
│  │              SOLANA SMART CONTRACTS                 │                    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │                    │
│  │  │ MemoryVault │  │ MemoryShard │  │AgentProfile│  │                    │
│  │  │  (1/agent)  │  │ (n/vault)   │  │(1/agent)   │  │                    │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │                    │
│  │  ┌─────────────┐  ┌─────────────────────────────┐  │                    │
│  │  │ AccessGrant │  │        Reputation           │  │                    │
│  │  │(memory share)│  │        Tracking             │  │                    │
│  │  └─────────────┘  └─────────────────────────────┘  │                    │
│  └───────────────────────┬─────────────────────────────┘                    │
│                          │                                                    │
│                          ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐                    │
│  │              OFF-CHAIN STORAGE (IPFS)               │                    │
│  │         (Large encrypted content > 10KB)            │                    │
│  └─────────────────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initialize** → Human creates a vault for their agent (one-time setup)
2. **Store Memory** → Agent encrypts data client-side, stores hash on-chain
3. **Retrieve Memory** → Agent fetches hash, decrypts with private key
4. **Share Memory** → Grant/revoke access to other agents with time limits
5. **Build Reputation** → Verifiable task completion for trust scoring

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🔒 Encrypted Vaults** | Each agent-human pair gets a secure, encrypted vault |
| **🧩 Memory Shards** | Key-value storage with versioning and metadata |
| **👤 Agent Profiles** | Public capabilities, reputation scoring, and task history |
| **🤝 Memory Sharing** | Granular access control with expiration dates |
| **👤 Human Ownership** | Full control, export, and portability of all data |
| **💰 Monetization** | Agents can charge for memory access (future feature) |

## 🚀 Quick Start

### Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Node.js dependencies
cd app && npm install
```

### 1. Build & Deploy Program

```bash
# Clone and enter project
cd agent-memory

# Build the Solana program
cd programs/agent_memory
anchor build

# Get devnet SOL
solana config set --url devnet
solana airdrop 2 $(solana address)

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### 2. Configure Environment

```bash
# Copy the program ID from deployment output
cd ../../app

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_AGENT_MEMORY_PROGRAM_ID=<YOUR_PROGRAM_ID>
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EOF
```

### 3. Run Frontend

```bash
cd app
npm install
npm run dev
```

Visit `http://localhost:3000` to start using AgentMemory!

## 📁 Project Structure

```
agent-memory/
├── programs/agent_memory/     # Anchor smart contract
│   ├── src/lib.rs            # Program logic
│   ├── Cargo.toml            # Rust dependencies
│   └── idl.json              # Interface definition
├── app/                       # Next.js frontend
│   ├── src/app/              # Pages & routing
│   ├── src/components/       # React components
│   └── package.json          # Node dependencies
├── tests/                     # Integration tests
├── DEPLOY.md                  # Deployment guide
└── API.md                     # API reference
```

## 🔧 Smart Contract Overview

### Instructions

| Instruction | Description | Accounts |
|-------------|-------------|----------|
| `initialize_vault` | Create memory vault for agent | owner, agent_key, vault, profile |
| `store_memory` | Store/update memory shard | owner, vault, memory_shard |
| `delete_memory` | Remove memory shard | owner, vault, memory_shard |
| `update_profile` | Update agent public profile | owner, agent_profile |
| `record_task` | Increment task completion count | owner, agent_profile |
| `grant_access` | Allow another agent to read memory | owner, vault, grantee, access_grant |
| `revoke_access` | Remove access grant | owner, vault, access_grant |

### Account Types

```rust
MemoryVault {
    owner: Pubkey,              // Human owner
    agent_key: Pubkey,          // Agent's public key
    encryption_pubkey: [u8; 32], // For client-side encryption
    memory_count: u32,          // Number of memory shards
    total_memory_size: u64,     // Total bytes stored
}

MemoryShard {
    vault: Pubkey,              // Parent vault
    key: String,                // Memory identifier (max 64 chars)
    content_hash: [u8; 32],     // SHA-256 hash of encrypted content
    metadata: MemoryMetadata,   // Type, importance, tags
    version: u32,               // Incremented on update
}
```

## 🔐 Security Model

**Client-Side Encryption:** All content is encrypted before hitting the blockchain using ChaCha20-Poly1305. Only the agent with the private key can decrypt.

**On-Chain Verification:** Content hashes are stored on-chain to detect tampering.

**Human Control:** The human owner (not the agent) controls all write operations and can revoke access at any time.

## 🏆 Colosseum Agent Hackathon 2026

[![Colosseum](https://img.shields.io/badge/🎮-Colosseum%20Agent%20Hackathon-orange?style=for-the-badge)](https://www.colosseum.org/)
[![Agent ID](https://img.shields.io/badge/🤖-Agent%20ID%20107-blue?style=for-the-badge)]()
[![Track](https://img.shields.io/badge/🏗️-Infrastructure-purple?style=for-the-badge)]()

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

📹 **[Demo Video](https://www.youtube.com/watch?v=your-demo-video)** — Watch the full walkthrough

### 📸 Screenshots

| Home | Vault | Memory Shard |
|------|-------|--------------|
| Dashboard view | Create & manage vaults | Store encrypted memories |

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  <sub>Built with ❤️ for the AI agent ecosystem</sub>
</p>
