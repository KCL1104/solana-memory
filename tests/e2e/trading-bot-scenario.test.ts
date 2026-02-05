import { MemoryStorage } from '../../src/core/storage';
import { IdentityBinding } from '../../src/identity/binding';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Proposal, Vote } from '../../src/core/types';

/**
 * Trading Bot Scenario
 * 
 * Tests an AI trading bot that:
 * 1. Remembers past trades and their outcomes
 * 2. Stores learned strategies
 * 3. Maintains risk parameters
 * 4. Tracks performance across sessions
 */
describe('E2E: Trading Bot Scenario', () => {
  let storage: MemoryStorage;
  let identityBinding: IdentityBinding;
  let botIdentity: any;

  beforeEach(() => {
    storage = new MemoryStorage();
    const connection = new Connection(clusterApiUrl('devnet'));
    identityBinding = new IdentityBinding(connection, {
      requireSignatures: true,
      enableCrossSession: true,
      trustThreshold: 3
    });

    // Create bot identity
    botIdentity = identityBinding.createIdentity('trading-bot-v1');
  });

  afterEach(() => {
    storage.clear();
  });

  describe('Trade Memory', () => {
    it('should store and retrieve trade history', () => {
      const trades = [
        { pair: 'SOL/USDC', side: 'buy', amount: 100, price: 20.5, pnl: 50 },
        { pair: 'SOL/USDC', side: 'sell', amount: 100, price: 21.0, pnl: 50 },
        { pair: 'BONK/SOL', side: 'buy', amount: 1000000, price: 0.000001, pnl: -20 }
      ];

      trades.forEach((trade, i) => {
        const signedMemory = identityBinding.signMemory(botIdentity.id, {
          key: `trade-${Date.now()}-${i}`,
          content: JSON.stringify(trade),
          metadata: {
            memoryType: 'learning',
            importance: Math.abs(trade.pnl) > 30 ? 90 : 50,
            tags: [trade.pair, trade.side, trade.pnl > 0 ? 'profit' : 'loss']
          },
          vault: 'trading-vault'
        });

        // Store in governance format as "proposal" for tracking
        storage.storeProposal({
          id: `trade-${i}`,
          title: `Trade: ${trade.pair} ${trade.side}`,
          description: JSON.stringify(trade),
          category: 'treasury',
          state: trade.pnl > 0 ? 'succeeded' : 'defeated',
          proposer: botIdentity.id,
          realm: 'trading-realm',
          daoName: 'Trading Bot',
          createdAt: Date.now(),
          votingStartsAt: Date.now(),
          votingEndsAt: Date.now(),
          votesYes: trade.pnl > 0 ? 1 : 0,
          votesNo: trade.pnl > 0 ? 0 : 1,
          votesAbstain: 0,
          totalVotingPower: 1,
          quorum: 1,
          threshold: 50
        });

        expect(identityBinding.verifyMemory(signedMemory).valid).toBe(true);
      });

      // Retrieve trade history
      const tradeHistory = storage.getProposals({ proposer: botIdentity.id });
      expect(tradeHistory).toHaveLength(3);
    });

    it('should learn from profitable trades', () => {
      const profitableTrade = {
        pair: 'SOL/USDC',
        strategy: 'momentum',
        entryIndicators: ['rsi_oversold', 'volume_spike'],
        exitIndicators: ['rsi_overbought'],
        holdingPeriod: 3600,
        pnl: 150
      };

      const signedMemory = identityBinding.signMemory(botIdentity.id, {
        key: 'strategy-profit-momentum',
        content: JSON.stringify(profitableTrade),
        metadata: {
          memoryType: 'knowledge',
          importance: 95,
          tags: ['strategy', 'momentum', 'profitable', 'SOL']
        },
        vault: 'strategy-vault'
      });

      const verification = identityBinding.verifyMemory(signedMemory);
      expect(verification.valid).toBe(true);

      // Store as "preference" for future decisions
      storage.storeProposal({
        id: 'strategy-momentum',
        title: 'Momentum Strategy Configuration',
        description: JSON.stringify(profitableTrade),
        category: 'parameter',
        state: 'executed',
        proposer: botIdentity.id,
        realm: 'trading-realm',
        daoName: 'Trading Bot',
        createdAt: Date.now(),
        votingStartsAt: Date.now(),
        votingEndsAt: Date.now(),
        votesYes: 1,
        votesNo: 0,
        votesAbstain: 0,
        totalVotingPower: 1,
        quorum: 1,
        threshold: 50
      });

      const strategies = storage.getProposals({ category: 'parameter' });
      expect(strategies).toHaveLength(1);
    });
  });

  describe('Risk Management', () => {
    it('should maintain risk parameters across sessions', () => {
      const riskParams = {
        maxPositionSize: 10000,
        maxDrawdown: 0.1,
        stopLossPercent: 0.05,
        takeProfitPercent: 0.15,
        maxOpenPositions: 5
      };

      const session = identityBinding.initCrossSession(botIdentity.id);

      // Sign risk parameters
      const signedRiskParams = identityBinding.signMemory(botIdentity.id, {
        key: 'risk-parameters',
        content: JSON.stringify(riskParams),
        metadata: {
          memoryType: 'system',
          importance: 100,
          tags: ['risk', 'parameters', 'critical']
        },
        vault: 'system-vault'
      });

      // Verify in session
      const result = identityBinding.verifyInSession(session.sessionId, signedRiskParams);
      expect(result.valid).toBe(true);

      // Multiple verifications establish trust
      for (let i = 0; i < 2; i++) {
        const mem = identityBinding.signMemory(botIdentity.id, {
          key: `verify-${i}`,
          content: 'verification',
          metadata: { memoryType: 'system', importance: 50, tags: [] },
          vault: 'system-vault'
        });
        identityBinding.verifyInSession(session.sessionId, mem);
      }

      expect(identityBinding.isTrustEstablished(session.sessionId)).toBe(true);
    });

    it('should track daily performance', () => {
      const dailyPerformance = {
        date: new Date().toISOString().split('T')[0],
        trades: 10,
        wins: 7,
        losses: 3,
        totalPnl: 350,
        winRate: 0.7,
        sharpeRatio: 1.8
      };

      storage.storeProposal({
        id: `performance-${dailyPerformance.date}`,
        title: `Daily Performance: ${dailyPerformance.date}`,
        description: JSON.stringify(dailyPerformance),
        category: 'treasury',
        state: dailyPerformance.totalPnl > 0 ? 'succeeded' : 'defeated',
        proposer: botIdentity.id,
        realm: 'trading-realm',
        daoName: 'Trading Bot',
        createdAt: Date.now(),
        votingStartsAt: Date.now(),
        votingEndsAt: Date.now(),
        votesYes: dailyPerformance.wins,
        votesNo: dailyPerformance.losses,
        votesAbstain: 0,
        totalVotingPower: dailyPerformance.trades,
        quorum: 1,
        threshold: 50
      });

      const performance = storage.getProposals({ realm: 'trading-realm' });
      expect(performance).toHaveLength(1);
      expect(JSON.parse(performance[0].description).totalPnl).toBe(350);
    });
  });

  describe('Market Analysis Memory', () => {
    it('should store market analysis with high importance', () => {
      const analysis = {
        timestamp: Date.now(),
        market: 'SOL/USDC',
        trend: 'bullish',
        indicators: {
          rsi: 65,
          macd: 'bullish_crossover',
          volume: 'above_average',
          support: 19.5,
          resistance: 22.0
        },
        recommendation: 'buy'
      };

      const signedAnalysis = identityBinding.signMemory(botIdentity.id, {
        key: `analysis-${analysis.timestamp}`,
        content: JSON.stringify(analysis),
        metadata: {
          memoryType: 'knowledge',
          importance: 85,
          tags: ['analysis', analysis.market, analysis.trend]
        },
        vault: 'analysis-vault'
      });

      expect(identityBinding.verifyMemory(signedAnalysis).valid).toBe(true);
    });
  });
});
