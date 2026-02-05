# ZK Memory Proofs Prototype

This prototype demonstrates zero-knowledge proofs for memory membership verification.

## Structure

- `concept.ts` - Core types and interfaces
- `prototype.ts` - Working implementation using merkle trees

## Quick Start

```bash
npm install ethers
npx ts-node prototype.ts
```

## Architecture

```
┌─────────────────┐
│   Memory Set    │
│  [M1, M2, M3]   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Merkle Tree    │
│     Root        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Proof  │
│ (M2, Path, Idx) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify Proof   │
│  (on-chain)     │
└─────────────────┘
```
