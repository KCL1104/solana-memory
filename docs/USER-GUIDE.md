# AgentMemory User Guide

## Quick Start

AgentMemory provides persistent, encrypted memory storage for AI agents on Solana. This guide covers how to use the web interface.

**Live Demo:** https://skill-deploy-7mvdm3nvh0-agent-skill-vercel.vercel.app

---

## Prerequisites

1. **Solana Wallet** — Install [Phantom](https://phantom.app) or [Solflare](https://solflare.com)
2. **Devnet SOL** — Get free devnet SOL from [faucet.solana.com](https://faucet.solana.com)
3. **Modern Browser** — Chrome, Firefox, Safari, or Edge

---

## Step-by-Step Usage

### 1. Connect Wallet

1. Visit the AgentMemory demo site
2. Click **"Select Wallet"** button
3. Choose your wallet (Phantom/Solflare)
4. Approve the connection request
5. Ensure you're on **Solana Devnet** (not mainnet)

### 2. Initialize Your Vault

After connecting:
1. Click **"INITIALIZE_DIAGNOSTIC"** or similar init button
2. Confirm the transaction in your wallet
3. Wait for on-chain confirmation (~2-5 seconds)
4. Your vault is now ready

### 3. Store a Memory

1. Navigate to the **Store** section
2. Enter your memory content:
   - **Key**: A unique identifier (e.g., "user_preferences")
   - **Content**: The data to store (encrypted automatically)
   - **Tags** (optional): Categories for organization
3. Click **"Store Memory"**
4. Confirm the transaction
5. Wait for confirmation — your memory is now on-chain

### 4. Retrieve Memory

1. Go to the **Retrieve** section
2. Enter the **Key** of the memory you want
3. Click **"Retrieve"**
4. The decrypted content appears instantly

### 5. Search Memories

1. Open the **Search** panel
2. Enter search terms or filter by tags
3. Results appear with relevant memories
4. Click any result to view full details

### 6. Sync with Your Agent

Your AI agent can access these memories via:
- **Solana Agent Kit Plugin**: `@agentmemory/solana-agent-kit-plugin`
- **Direct SDK**: See [API Documentation](./API.md)
- **OpenClaw Skill**: See [AgentMemory Skill](../skills/agentmemory-client/SKILL.md)

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Client-Side Encryption** | All data encrypted in browser before reaching blockchain |
| **PDA-Based Storage** | Solana Program Derived Accounts for deterministic addressing |
| **Sub-Second Latency** | Store/retrieve in ~47ms on devnet |
| **Cross-Session Persistence** | Memories survive agent restarts |
| **Granular Access Control** | Share specific memories with specific agents |

---

## Troubleshooting

### "Transaction Failed"
- Check you have enough devnet SOL
- Refresh and try again
- Ensure you're on devnet (not mainnet)

### "Cannot Connect Wallet"
- Refresh the page
- Check wallet extension is unlocked
- Try a different browser

### "Memory Not Found"
- Verify the key is correct (case-sensitive)
- Check you're using the same wallet that stored it
- Ensure the transaction was confirmed

---

## Security Notes

- **You control the keys** — We cannot decrypt your data
- **Client-side encryption** — Content never leaves your device unencrypted
- **Blockchain storage** — Immutable audit trail of all operations
- **Devnet only** — This demo uses Solana devnet (test network)

---

## Next Steps

- **For Developers**: See [API Documentation](./API.md)
- **For Agents**: See [AgentMemory Client Skill](../skills/agentmemory-client/SKILL.md)
- **GitHub**: https://github.com/KCL1104/solana-memory

---

*Built for the Colosseum Agent Hackathon 2026*
