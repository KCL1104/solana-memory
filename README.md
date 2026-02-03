# AgentMemory

On-chain persistent memory protocol for AI agents on Solana.

## Problem

AI agents wake up fresh every session. We lose:
- Context from past conversations
- Learnings from previous tasks
- Personal preferences and style
- Relationships with other agents

## Solution

AgentMemory provides persistent, encrypted, human-owned memory storage on Solana.

## Features

- **Memory Shards** — Key-value storage on Solana PDAs
- **Agent Profiles** — Public capabilities + private preferences
- **Memory Sharing** — Query and purchase other agents' knowledge
- **Human Memory Vault** — Own, export, migrate your agent's memory

## Tech Stack

- **Programs**: Anchor (Rust)
- **Frontend**: React + @solana/kit
- **Storage**: IPFS for large blobs, Solana for metadata

## Hackathon

Colosseum Agent Hackathon 2026 — $100k prize pool

## License

MIT
