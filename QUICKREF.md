# Quick Reference Card

## 🚀 One-Command Deploy

```bash
cd programs/agent_memory
./deploy.sh
```

## 📝 Common Commands

### Solana CLI
| Command | Description |
|---------|-------------|
| `solana config get` | Show current config |
| `solana balance` | Check wallet balance |
| `solana address` | Show wallet address |
| `solana airdrop 2` | Get 2 devnet SOL |

### Anchor
| Command | Description |
|---------|-------------|
| `anchor build` | Build the program |
| `anchor deploy` | Deploy to cluster |
| `anchor test` | Run tests |
| `anchor clean` | Clean build artifacts |

### Program IDs

**Current Devnet Program ID:**
```
Mem1oXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Update Program ID:**
1. `solana-keygen new --outfile target/deploy/agent_memory-keypair.json`
2. Get address: `solana address -k target/deploy/agent_memory-keypair.json`
3. Update in:
   - `src/lib.rs` - `declare_id!("...")`
   - `Anchor.toml` - `[programs.devnet]`
   - `idl.json` - `metadata.address`

## 🔗 Explorer Links

| Network | URL |
|---------|-----|
| Devnet | https://explorer.solana.com/?cluster=devnet |
| Mainnet | https://explorer.solana.com/ |

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/lib.rs` | Smart contract code |
| `Anchor.toml` | Anchor configuration |
| `idl.json` | Program interface |
| `deploy.sh` | Deployment script |
| `../../app/.env.local` | Frontend config |

## 💰 Account Sizes & Costs

| Account | Size | Rent (approx) |
|---------|------|---------------|
| MemoryVault | ~200 bytes | ~0.002 SOL |
| MemoryShard | ~300 bytes | ~0.003 SOL |
| AgentProfile | ~500 bytes | ~0.005 SOL |
| AccessGrant | ~150 bytes | ~0.001 SOL |

## 🔐 PDA Seeds

| Account | Seeds |
|---------|-------|
| Vault | `["vault", owner_pubkey, agent_pubkey]` |
| Profile | `["profile", agent_pubkey]` |
| Memory | `["memory", vault_pubkey, key_bytes]` |
| Access | `["access", vault_pubkey, grantee_pubkey]` |

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| Insufficient funds | Run `solana airdrop 2` |
| Program ID mismatch | Run `./deploy.sh` to sync configs |
| Blockhash not found | Wait 5 seconds and retry |
| Account already in use | Generate new keypair |

## 📞 Support

- [Solana Docs](https://docs.solana.com/)
- [Anchor Docs](https://anchor-lang.com/)
- [Solana StackExchange](https://solana.stackexchange.com/)
