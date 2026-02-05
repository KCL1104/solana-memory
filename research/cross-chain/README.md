# Cross-Chain Memory Bridge Prototype

This prototype demonstrates bridging agent memories between blockchain networks.

## Structure

- `README.md` - This file
- `wormhole-adapter.ts` - Wormhole bridge implementation
- `layerzero-adapter.ts` - LayerZero bridge implementation

## Supported Protocols

| Protocol | Latency | Cost | Chains |
|----------|---------|------|--------|
| Wormhole | 15-30s | Low | 20+ including Solana |
| LayerZero | 2-5min | Medium | 50+ EVM chains |

## Quick Start

```bash
npm install @certusone/wormhole-sdk @layerzerolabs/solidity-examples ethers
npx ts-node wormhole-adapter.ts
```
