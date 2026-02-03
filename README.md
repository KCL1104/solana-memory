# DAO Governance Memory Module

A comprehensive memory system for DAO governance data, integrated with Realms (Solana) and supporting multi-DAO analytics.

## Features

### Core Memory Features
- **Voting History Storage**: Track all votes with voter, choice, power, and timestamp
- **Proposal Outcome Tracking**: Monitor proposal lifecycle from draft to execution
- **Delegate Preferences**: Remember delegation patterns and preferences
- **Discussion Summaries**: Store and retrieve discussion context

### UI Components
- **DAO Memory Browser**: Search and filter through governance history
- **Voting History Visualization**: Charts and analytics for voting patterns
- **Proposal Tracker**: Real-time proposal status monitoring
- **Delegate Reputation View**: Delegate performance and history

### Integrations
- **Realms API**: Direct integration with Solana's leading DAO platform
- **Snapshot Support**: Multi-chain governance data
- **Export System**: JSON/CSV export for analysis

## Quick Start

```typescript
import { DAOGovernanceMemory } from './features/dao-governance';

const daoMemory = new DAOGovernanceMemory();

// Initialize with Realms connection
await daoMemory.initialize({
  realmsEndpoint: 'https://api.realms.today',
  daoPublicKey: 'your-dao-pubkey'
});

// Store a vote
await daoMemory.storeVote({
  proposalId: 'prop-123',
  voter: 'voter-pubkey',
  choice: 'yes',
  votingPower: 1500,
  timestamp: Date.now()
});

// Query voting history
const history = await daoMemory.getVotingHistory({
  voter: 'voter-pubkey',
  limit: 50
});
```

## Structure

```
features/dao-governance/
├── core/
│   ├── types.ts          # TypeScript interfaces
│   ├── storage.ts        # Memory storage engine
│   └── indexer.ts        # Blockchain indexer
├── integrations/
│   ├── realms.ts         # Realms API client
│   ├── snapshot.ts       # Snapshot integration
│   └── exporters.ts      # Data export utilities
├── ui/
│   ├── components/       # React/Vue components
│   ├── visualizations/   # Charts and graphs
│   └── dashboard/        # Main dashboard
└── analytics/
    ├── patterns.ts       # Voting pattern analysis
    ├── reputation.ts     # Delegate scoring
    └── predictions.ts    # Outcome predictions
```

## API Reference

See `docs/API.md` for complete API documentation.
