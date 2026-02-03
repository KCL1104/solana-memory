# AgentMemory Protocol - Devnet Deployment Guide

> 📅 Last Updated: February 2026  
> 🎯 Target: Solana Devnet  
> ⚓ Anchor Version: 0.30.1

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Steps](#deployment-steps)
4. [Program ID Management](#program-id-management)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Security Checklist](#security-checklist)

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | 1.79.0+ | Build programs |
| Solana CLI | 1.18.0+ | Interact with Solana |
| Anchor | 0.30.1 | Framework for Solana |
| Node.js | 18+ | Frontend/tests |

### System Requirements

- **OS**: macOS 12+, Ubuntu 22.04+, or Windows 10+ with WSL2
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 10GB free space
- **Network**: Stable internet connection

---

## Environment Setup

### Step 1: Install Rust

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

### Step 2: Install Solana CLI

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Add to PATH (add this to your ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version  # Should show 1.18.0 or higher
```

### Step 3: Install Anchor

```bash
# Install Anchor using avm (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install and use Anchor 0.30.1
avm install 0.30.1
avm use 0.30.1

# Verify installation
anchor --version  # Should show anchor-cli 0.30.1
```

**Troubleshooting:**
- If compilation fails, ensure you have the latest Rust version: `rustup update`
- On macOS, you may need Xcode command line tools: `xcode-select --install`

### Step 4: Configure Solana CLI for Devnet

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

### Step 5: Create/Load Wallet

```bash
# Option A: Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Option B: Import existing wallet
solana-keygen recover --outfile ~/.config/solana/id.json

# Option C: Use existing keypair file
solana config set --keypair /path/to/your/keypair.json

# Verify your wallet address
solana address

# Check balance
solana balance
```

### Step 6: Fund Your Devnet Wallet

```bash
# Request airdrop (2 SOL per request, max 2 requests per day)
solana airdrop 2

# Check balance
solana balance

# If airdrop fails, use the web faucet:
# https://faucet.solana.com/ (select Devnet)
```

---

## Deployment Steps

### Step 1: Clone and Navigate to Project

```bash
cd /home/node/.openclaw/workspace/agent-memory
# Or wherever your project is located
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies (for tests)
yarn install
# or
npm install
```

### Step 3: Build the Program

```bash
# Build the program
anchor build

# The compiled .so file will be at:
# target/deploy/agent_memory.so
```

**Expected output:**
```
   Compiling agent_memory v0.1.0
    Finished release [optimized] target(s) in XXs
```

### Step 4: Generate Program Keypair (First Time Only)

```bash
# Generate a new keypair for the program
solana-keygen new --outfile target/deploy/agent_memory-keypair.json --force

# Get the program ID
solana address -k target/deploy/agent_memory-keypair.json

# Example output: 7a7G... (save this!)
```

### Step 5: Update Program ID

You need to update the program ID in two places:

#### A. Update `programs/agent_memory/src/lib.rs`

```rust
// Replace the declare_id! macro with your new program ID
declare_id!("YOUR_PROGRAM_ID_HERE");
```

Example:
```rust
declare_id!("7a7G...your_program_id...");
```

#### B. Update `Anchor.toml`

```toml
[programs.devnet]
agent_memory = "YOUR_PROGRAM_ID_HERE"
```

#### C. Update `app/src/idl/agent_memory.json`

Update the `metadata.address` field with your program ID.

### Step 6: Rebuild with New Program ID

```bash
# Must rebuild after changing program ID
anchor build
```

### Step 7: Deploy to Devnet

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Or with explicit keypair
anchor deploy --provider.cluster devnet --program-keypair target/deploy/agent_memory-keypair.json
```

**Expected output:**
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: YOUR_WALLET_ADDRESS
Deploying program "agent_memory"...
Program path: .../target/deploy/agent_memory.so...
Program Id: YOUR_PROGRAM_ID
Signature: YOUR_TRANSACTION_SIGNATURE
```

### Step 8: Verify Deployment

```bash
# Check program account
solana account YOUR_PROGRAM_ID

# Should show executable: true and lamports balance
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

## Verification

### On-Chain Verification

#### Method 1: Solana Explorer

1. Visit: https://explorer.solana.com/?cluster=devnet
2. Enter your program ID in the search bar
3. Verify:
   - ✅ Program is marked as "Executable"
   - ✅ Upgrade authority is your wallet
   - ✅ Balance is > 0 (deployment fee paid)

#### Method 2: Command Line

```bash
# Get program info
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

### IDL Verification

```bash
# Verify IDL was uploaded
anchor idl fetch YOUR_PROGRAM_ID --provider.cluster devnet

# Should output the complete IDL JSON
```

### Test Deployment

```bash
# Run the test suite
anchor test --provider.cluster devnet

# Or run specific test file
anchor test tests/agent_memory.ts --provider.cluster devnet
```

---

## Troubleshooting

### Common Errors

#### Error: "Insufficient funds"

```
Error: Insufficient funds
```

**Solution:**
```bash
# Request more devnet SOL
solana airdrop 2

# Or use web faucet: https://faucet.solana.com/
```

#### Error: "Program already deployed"

```
Error: Program account already exists
```

**Solution:**
- If you want to upgrade: Use `anchor upgrade` instead
- If you want fresh deployment: Generate new keypair (Step 4)

#### Error: "Blockhash not found"

```
Error: Blockhash not found
```

**Solution:**
```bash
# Try again - this is usually a temporary network issue
anchor deploy --provider.cluster devnet
```

#### Error: "Instruction unpacked is not valid"

**Cause:** IDL mismatch between client and program

**Solution:**
```bash
# Rebuild and redeploy
anchor build
anchor deploy --provider.cluster devnet

# Update IDL
anchor idl upgrade YOUR_PROGRAM_ID --filepath target/idl/agent_memory.json --provider.cluster devnet
```

#### Error: "Signature verification failed"

**Cause:** Wrong keypair or wallet not configured

**Solution:**
```bash
# Verify your wallet
solana address
solana config get

# Ensure keypair exists
ls -la ~/.config/solana/id.json
```

### Build Errors

#### Error: "cannot find value `INIT_SPACE`"

**Cause:** Old Anchor version

**Solution:**
```bash
# Update Anchor
avm use 0.30.1

# Or reinstall
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
```

#### Error: "linking with `cc` failed"

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

### Network Issues

#### Slow or Unresponsive Devnet

```bash
# Check devnet status
curl https://api.devnet.solana.com/health

# Try alternative endpoints:
# - https://devnet.helius-rpc.com/?api-key=YOUR_KEY
# - https://rpc.ankr.com/solana_devnet
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

### Project Structure

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

## Next Steps

1. ✅ Deploy to Devnet (this guide)
2. 🧪 Test thoroughly with the test suite
3. 📚 Read [VERIFICATION.md](./VERIFICATION.md) for verification steps
4. 🚀 Use [deploy-local.sh](./deploy-local.sh) for automated deployment
5. 🌐 Deploy frontend and connect to devnet program

---

## Support

- **Anchor Documentation**: https://www.anchor-lang.com/
- **Solana Documentation**: https://docs.solana.com/
- **Devnet Faucet**: https://faucet.solana.com/
- **Solana StackExchange**: https://solana.stackexchange.com/

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

*Happy Building on Solana! 🚀*
