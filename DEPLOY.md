# Deployment Guide

Complete guide for deploying AgentMemory to Solana devnet and mainnet.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Generate Program Keypair](#generate-program-keypair)
- [Configure Program ID](#configure-program-id)
- [Build](#build)
- [Deploy to Devnet](#deploy-to-devnet)
- [Verify Deployment](#verify-deployment)
- [Update Frontend Config](#update-frontend-config)
- [Mainnet Deployment](#mainnet-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
```

Verify installation:
```bash
solana --version
```

### 2. Install Anchor Framework

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1
```

Verify installation:
```bash
anchor --version
```

### 3. Install Node.js (v18+)

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 4. Install Dependencies

```bash
cd app
npm install
cd ../programs/agent_memory
cargo build
```

---

## Environment Setup

### 1. Configure Solana CLI for Devnet

```bash
solana config set --url devnet
```

### 2. Create/Load Wallet

```bash
# Generate new keypair (save the output!)
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# Or use existing keypair
solana-keygen pubkey ~/.config/solana/devnet-wallet.json
```

### 3. Set as Default Wallet

```bash
solana config set --keypair ~/.config/solana/devnet-wallet.json
```

### 4. Get Devnet SOL

```bash
# Request 2 SOL (run multiple times if needed)
solana airdrop 2 $(solana address)

# Check balance
solana balance
```

> **Note:** If airdrop fails due to rate limits, use the [Solana Faucet](https://faucet.solana.com/)

---

## Generate Program Keypair

Generate a unique program ID for your deployment:

```bash
cd programs/agent_memory

# Generate program keypair
solana-keygen new --outfile target/deploy/agent_memory-keypair.json --force

# Get the program ID
solana address -k target/deploy/agent_memory-keypair.json
```

**Save this address!** You'll need it for configuration.

---

## Configure Program ID

### 1. Update lib.rs

Edit `programs/agent_memory/src/lib.rs`:

```rust
// Replace with your program ID
declare_id!("YOUR_PROGRAM_ID_HERE");
```

Example:
```rust
declare_id!("Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq");
```

### 2. Create/Update Anchor.toml

Create `programs/agent_memory/Anchor.toml`:

```toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
agent_memory = "YOUR_PROGRAM_ID_HERE"

[programs.mainnet]
agent_memory = "YOUR_PROGRAM_ID_HERE"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/devnet-wallet.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### 3. Update IDL (if needed)

The IDL in `idl.json` should have the correct `metadata.address` field:

```json
{
  "version": "0.1.0",
  "name": "agent_memory",
  "metadata": {
    "address": "YOUR_PROGRAM_ID_HERE"
  },
  ...
}
```

---

## Build

```bash
cd programs/agent_memory
anchor build
```

Successful build output:
```
Compiling agent_memory v0.1.0
    Finished release [optimized] target(s) in XXs
```

---

## Deploy to Devnet

### Method 1: Using Anchor CLI

```bash
anchor deploy --provider.cluster devnet
```

### Method 2: Using Deploy Script

```bash
# Make sure you're in the programs/agent_memory directory
npx ts-node deploy.ts
```

### Expected Output

```
Deploying AgentMemory program...
Program ID: YOUR_PROGRAM_ID
Cluster: https://api.devnet.solana.com

✅ Program deployed successfully!
Program ID saved to app/.env.local
```

### Deployment Cost

- Devnet: Free (funded by airdrop)
- ~0.5-1 SOL for program account rent exemption

---

## Verify Deployment

### 1. Check Program Account

```bash
solana account YOUR_PROGRAM_ID --url devnet
```

Should show executable: true and program data.

### 2. Run Tests

```bash
anchor test --provider.cluster devnet
```

### 3. Verify on Explorer

Open in Solana Explorer:
```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

---

## Update Frontend Config

After deployment, update the frontend environment:

### 1. Create .env.local

```bash
cd app
cat > .env.local << EOF
NEXT_PUBLIC_AGENT_MEMORY_PROGRAM_ID=YOUR_PROGRAM_ID
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=devnet
EOF
```

### 2. Verify Configuration

```bash
# Check the file was created
cat .env.local

# Make sure it's in .gitignore
echo ".env.local" >> .gitignore
```

### 3. Restart Development Server

```bash
npm run dev
```

---

## Mainnet Deployment

⚠️ **WARNING:** Mainnet deployment costs real SOL and is irreversible. Test thoroughly on devnet first!

### 1. Switch to Mainnet

```bash
solana config set --url mainnet-beta
solana config set --keypair ~/.config/solana/mainnet-wallet.json
```

### 2. Fund Wallet

You'll need ~0.5 SOL for deployment. Transfer from an exchange or existing wallet.

```bash
# Check balance
solana balance
```

### 3. Update Anchor.toml

```toml
[provider]
cluster = "mainnet"
wallet = "~/.config/solana/mainnet-wallet.json"
```

### 4. Build for Mainnet

```bash
anchor build -- --features mainnet
```

### 5. Deploy

```bash
anchor deploy --provider.cluster mainnet
```

### 6. Verify

```bash
solana account YOUR_PROGRAM_ID --url mainnet-beta
```

View on explorer:
```
https://explorer.solana.com/address/YOUR_PROGRAM_ID
```

---

## Troubleshooting

### "Insufficient funds" error

```bash
# Request more devnet SOL
solana airdrop 2 $(solana address) --url devnet

# Or try the web faucet: https://faucet.solana.com/
```

### "Blockhash not found" error

```bash
# Network congestion, retry after a few seconds
anchor deploy --provider.cluster devnet
```

### "Program ID mismatch" error

Make sure:
1. `declare_id!` in lib.rs matches your keypair
2. `Anchor.toml` has the correct program ID
3. You're deploying with the correct keypair

### "Account already in use" error

The program ID is already deployed. Use a new keypair:
```bash
solana-keygen new --outfile target/deploy/agent_memory-keypair.json --force
```

### Build fails

```bash
# Clean and rebuild
anchor clean
anchor build
```

---

## Deployment Checklist

- [ ] Solana CLI installed
- [ ] Anchor installed
- [ ] Wallet configured
- [ ] Devnet SOL received
- [ ] Program keypair generated
- [ ] Program ID configured in lib.rs
- [ ] Anchor.toml created/updated
- [ ] Build successful
- [ ] Deployed to devnet
- [ ] Verified on explorer
- [ ] Frontend .env.local updated
- [ ] Tests passing

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `solana config get` | Show current config |
| `solana balance` | Check wallet balance |
| `solana address` | Show wallet address |
| `anchor build` | Build the program |
| `anchor deploy` | Deploy to configured cluster |
| `anchor test` | Run tests |

---

## Support

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Documentation](https://anchor-lang.com/)
- [Solana StackExchange](https://solana.stackexchange.com/)
