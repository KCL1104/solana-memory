# Minecraft AgentMemory Demo

Demonstrates how AgentMemory enables persistent NPCs in Minecraft.

## Problem
- Minecraft NPCs reset every session
- No memory of player interactions
- Quest progress lost
- World feels static

## Solution
AgentMemory provides:
- Persistent player relationship history
- Spatial memory for locations
- Quest state tracking
- Personalized interactions

## Quick Start

```bash
npm install
cd demo/minecraft
npm run example:village-guardian
npm run example:quest-giver
npm run example:shopkeeper
```

## Key Features Demonstrated

1. **Player Recognition**: NPCs remember returning players
2. **Spatial Memory**: Remember locations and landmarks
3. **Quest Persistence**: Track quest progress across sessions
4. **Personalized Commerce**: Shopkeepers remember preferences

## Technical Stack
- TypeScript
- AgentMemory SDK
- Solana Devnet

## Hackathon Relevance
Shows AgentMemory working in gaming/embodied agent context.
