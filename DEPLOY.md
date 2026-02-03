# Deployment Guide

Complete guide for deploying AgentMemory to Solana devnet and mainnet.

> 📅 Last Updated: February 2026  
> 🎯 Target: Solana Devnet  
> ⚓ Anchor Version: 0.30.1

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Environment Setup](#environment-setup)
- [Generate Program Keypair](#generate-program-keypair)
- [Configure Program ID](#configure-program-id)
- [Build](#build)
- [Deploy to Devnet](#deploy-to-devnet)
- [Alternative Deployment Method](#alternative-deployment-method)
- [Verify Deployment](#verify-deployment)
- [Program ID Management](#program-id-management)
- [Update Frontend Config](#update-frontend-config)
- [Mainnet Deployment](#mainnet-deployment)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Deployment Checklist](#deployment-checklist)
- [Next Steps](#next-steps)
- [Quick Reference](#quick-reference)
- [Support](#support)

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | 1.79.0+ | Build programs |
| Solana CLI | 1.18.0+ | Interact with Solana |
| Anchor | 0.30.1 | Framework for Solana |
| Node.js | 18+ | Frontend/tests |

### 1. Install Rust

```bash
# Using rustup (official installer)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verify installation
rustc --version  # Should show 1.79.0 or higher
cargo --version
```

**Troubleshooting:**
- If `cargo` not found after installation, restart your terminal or run `source ~/.cargo/env`
- Windows users: Use WSL2 or Git Bash

### 2. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Add to PATH (add this to your ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

Verify installation:
```bash
solana --version
```

### 3. Install Anchor Framework

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1
```

Verify installation:
```bash
anchor --version
```

**Troubleshooting:**
- If compilation fails, ensure you have the latest Rust version: `rustup update`
- On macOS, you may need Xcode command line tools: `xcode-select --install`

### 4. Install Node.js (v18+)

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 5. Install Dependencies

```bash
cd app
npm install
cd ../programs/agent_memory
cargo build
```

---

## System Requirements

- **OS**: macOS 12+, Ubuntu 22.04+, or Windows 10+ with WSL2
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 10GB free space
- **Network**: Stable internet connection

---

## Environment Setup

### 1. Configure Solana CLI for Devnet

```bash
# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Or use the shorthand
solana config set -u d

# Verify configuration
solana config get

# Expected output:
# Config File: /Users/yourname/.config/solana/cli/config.yml
# RPC URL: https://api.devnet.solana.com
# WebSocket URL: wss://api.devnet.solana.com/ (computed)
# Keypair Path: /Users/yourname/.config/solana/id.json
# Commitment: confirmed
```

### 2. Create/Load Wallet

```bash
# Option A: Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Option B: Import existing wallet
solana-keygen recover --outfile ~/.config/solana/id.json

# Option C: Use existing keypair file
solana config set --keypair /path/to/your/keypair.json

# Verify your wallet address
solana address
```

### 3. Set as Default Wallet

```bash
solana config set --keypair ~/.config/solana/devnet-wallet.json
```

### 4. Fund Your Devnet Wallet

```bash
# Request airdrop (2 SOL per request, max 2 requests per day)
solana airdrop 2

# Check balance
solana balance

# If airdrop fails, use the web faucet: https://faucet.solana.com/ (select Devnet)
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

# Or with explicit keypair
anchor deploy --provider.cluster devnet --program-keypair target/deploy/agent_memory-keypair.json
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

Or using anchor deploy:

```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: YOUR_WALLET_ADDRESS
Deploying program "agent_memory"...
Program path: .../target/deploy/agent_memory.so...
Program Id: YOUR_PROGRAM_ID
Signature: YOUR_TRANSACTION_SIGNATURE
```

### Deployment Cost

- Devnet: Free (funded by airdrop)
- ~0.5-1 SOL for program account rent exemption

---

## Alternative Deployment Method

### Using Deploy Script

For automated deployment, use the provided script:

```bash
cd programs/agent_memory
./deploy.sh
```

This script will:
1. Check prerequisites
2. Generate program keypair if needed
3. Build the program
4. Deploy to devnet
5. Update configuration files
6. Run tests

---

## Verify Deployment

### 1. Check Program Account

```bash
solana account YOUR_PROGRAM_ID --url devnet
```

Should show executable: true and program data.

Or use:
```bash
solana program show YOUR_PROGRAM_ID

# Expected output:
# Program Id: YOUR_PROGRAM_ID
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: ...
# Authority: YOUR_WALLET_ADDRESS
# Last Deployed In Slot: XXXXXXX
# Data Length: XXXX (0xXXXX) bytes
# Balance: X.XXXX SOL
```

### 2. Run Tests

```bash
anchor test --provider.cluster devnet
```

### 3. Verify on Explorer

Open in Solana Explorer:
```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

Verify:
- ✅ Program is marked as "Executable"
- ✅ Upgrade authority is your wallet
- ✅ Balance is > 0 (deployment fee paid)

### 4. IDL Verification

```bash
# Verify IDL was uploaded
anchor idl fetch YOUR_PROGRAM_ID --provider.cluster devnet

# Should output the complete IDL JSON
```

---

## Program ID Management

### Understanding Program IDs

- **Program ID**: A unique public key that identifies your program on-chain
- **Upgrade Authority**: The wallet that can upgrade the program (should be your wallet)
- **Keypair**: The secret key that controls the program ID (keep secure!)

### Best Practices

1. **Backup your keypair:**
   ```bash
   cp target/deploy/agent_memory-keypair.json ~/secure-backup/
   ```

2. **Document your program ID:**
   Add to your project's `.env` or documentation

3. **Version control considerations:**
   - ✅ DO commit: The program ID in code comments
   - ❌ DON'T commit: The keypair file (add to `.gitignore`)

### Switching Between Networks

```bash
# Check current network
solana config get

# Switch to devnet
solana config set --url devnet

# Switch to mainnet (for production)
solana config set --url mainnet-beta

# Switch to localnet (for testing)
solana config set --url localhost
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

## Security Checklist

Before deploying to mainnet, verify:

- [ ] Program ID is correctly set in all files
- [ ] Keypair is backed up securely (offline storage)
- [ ] Upgrade authority is a secure multisig or hardware wallet
- [ ] Program has been thoroughly tested on devnet
- [ ] IDL is correctly generated and verified
- [ ] No hardcoded secrets in the code
- [ ] All tests pass
- [ ] Code has been audited (for production)

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

### "Account already in use" error / "Program already deployed"

The program ID is already deployed. 

- If you want to upgrade: Use `anchor upgrade` instead:
  ```bash
  anchor upgrade target/deploy/agent_memory.so --program-id YOUR_PROGRAM_ID --provider.cluster devnet
  ```
- If you want fresh deployment: Generate new keypair:
  ```bash
  solana-keygen new --outfile target/deploy/agent_memory-keypair.json --force
  ```

### Build fails

```bash
# Clean and rebuild
anchor clean
anchor build
```

### "Instruction unpacked is not valid"

**Cause:** IDL mismatch between client and program

**Solution:**
```bash
# Rebuild and redeploy
anchor build
anchor deploy --provider.cluster devnet

# Update IDL
anchor idl upgrade YOUR_PROGRAM_ID --filepath target/idl/agent_memory.json --provider.cluster devnet
```

### "Signature verification failed"

**Cause:** Wrong keypair or wallet not configured

**Solution:**
```bash
# Verify your wallet
solana address
solana config get

# Ensure keypair exists
ls -la ~/.config/solana/id.json
```

### "cannot find value `INIT_SPACE`"

**Cause:** Old Anchor version

**Solution:**
```bash
# Update Anchor
avm use 0.30.1

# Or reinstall
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
```

### "linking with `cc` failed"

**Cause:** Missing build tools

**Solution:**
```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install build-essential

# Fedora
sudo dnf install gcc gcc-c++ make
```

### Slow or Unresponsive Devnet

```bash
# Check devnet status
curl https://api.devnet.solana.com/health

# Try alternative endpoints:
# - https://devnet.helius-rpc.com/?api-key=YOUR_KEY
# - https://rpc.ankr.com/solana_devnet
```

---

## Project Structure

```
agent-memory/
├── Anchor.toml              # Anchor configuration
├── programs/
│   └── agent_memory/
│       ├── Cargo.toml       # Rust dependencies
│       └── src/
│           └── lib.rs       # Program code
├── target/
│   └── deploy/
│       ├── agent_memory.so       # Compiled program
│       └── agent_memory-keypair.json  # Program keypair
├── app/
│   └── src/
│       └── idl/
│           └── agent_memory.json # IDL for frontend
└── tests/
    └── agent_memory.ts      # Test suite
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

## Next Steps

1. ✅ Deploy to Devnet (this guide)
2. 🧪 Test thoroughly with the test suite
3. 📚 Read [VERIFICATION.md](./VERIFICATION.md) for verification steps
4. 🚀 Use [deploy-local.sh](./deploy-local.sh) for automated deployment
5. 🌐 Deploy frontend and connect to devnet program

---

## Quick Reference

### Essential Commands

```bash
# Check versions
solana --version
anchor --version
rustc --version

# Check wallet and balance
solana address
solana balance

# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Upgrade program
anchor upgrade target/deploy/agent_memory.so --program-id YOUR_PROGRAM_ID --provider.cluster devnet

# Fetch IDL
anchor idl fetch YOUR_PROGRAM_ID --provider.cluster devnet

# Close program (recover SOL)
solana program close YOUR_PROGRAM_ID
```

### Command Reference Table

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

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Solana StackExchange](https://solana.stackexchange.com/)
- [Devnet Faucet](https://faucet.solana.com/)

---

*Happy Building on Solana! 🚀*
