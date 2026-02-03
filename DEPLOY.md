# Deployment Guide

## Prerequisites

- Solana CLI installed
- Anchor installed
- Devnet SOL for deployment

## Deploy to Devnet

```bash
# Build the program
cd programs/agent_memory
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Run deployment script to save config
npx ts-node deploy.ts
```

## Program ID

After deployment, update the following files with the new program ID:

1. `programs/agent_memory/src/lib.rs` - `declare_id!("...")`
2. `app/.env.local` - `NEXT_PUBLIC_AGENT_MEMORY_PROGRAM_ID`
3. `Anchor.toml` - `[programs.devnet]` section

## Devnet Faucet

Get devnet SOL:
```bash
solana airdrop 2 $(solana address) --url devnet
```

## Verify Deployment

```bash
# Check program account
solana account <PROGRAM_ID> --url devnet

# Run tests against devnet
anchor test --provider.cluster devnet
```

## Mainnet Deployment (After Testing)

```bash
# Build for mainnet
anchor build -- --features mainnet

# Deploy (requires ~0.5 SOL)
anchor deploy --provider.cluster mainnet
```
