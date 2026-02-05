import { MemoryStorage } from '../../src/core/storage';
import { Vote, Proposal } from '../../src/core/types';

describe('Semantic Search', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  afterEach(() => {
    storage.clear();
  });

  describe('Basic Search', () => {
    beforeEach(() => {
      // Seed with test data
      const proposals: Proposal[] = [
        {
          id: 'proposal-1',
          title: 'Treasury Allocation for Marketing',
          description: 'Allocate 1000 SOL for marketing initiatives including social media campaigns and influencer partnerships',
          category: 'treasury',
          state: 'voting',
          proposer: 'proposer-1',
          realm: 'realm-defi',
          daoName: 'DeFi DAO',
          createdAt: Date.now(),
          votingStartsAt: Date.now(),
          votingEndsAt: Date.now() + 86400000,
          votesYes: 500,
          votesNo: 100,
          votesAbstain: 50,
          totalVotingPower: 650,
          quorum: 400,
          threshold: 50
        },
        {
          id: 'proposal-2',
          title: 'Governance Parameter Update',
          description: 'Update voting period from 7 days to 14 days to improve participation',
          category: 'governance',
          state: 'voting',
          proposer: 'proposer-2',
          realm: 'realm-defi',
          daoName: 'DeFi DAO',
          createdAt: Date.now(),
          votingStartsAt: Date.now(),
          votingEndsAt: Date.now() + 86400000,
          votesYes: 300,
          votesNo: 200,
          votesAbstain: 100,
          totalVotingPower: 600,
          quorum: 400,
          threshold: 50
        },
        {
          id: 'proposal-3',
          title: 'Smart Contract Upgrade',
          description: 'Upgrade the staking contract to fix a bug in reward distribution',
          category: 'upgrade',
          state: 'voting',
          proposer: 'proposer-3',
          realm: 'realm-nft',
          daoName: 'NFT DAO',
          createdAt: Date.now(),
          votingStartsAt: Date.now(),
          votingEndsAt: Date.now() + 86400000,
          votesYes: 800,
          votesNo: 50,
          votesAbstain: 25,
          totalVotingPower: 875,
          quorum: 500,
          threshold: 66
        }
      ];

      proposals.forEach(p => storage.storeProposal(p));
    });

    it('should search proposals by category', () => {
      const treasuryProposals = storage.getProposals({ category: 'treasury' });
      expect(treasuryProposals).toHaveLength(1);
      expect(treasuryProposals[0].title).toContain('Treasury');
    });

    it('should search proposals by realm', () => {
      const defiProposals = storage.getProposals({ realm: 'realm-defi' });
      expect(defiProposals).toHaveLength(2);
    });

    it('should filter proposals by state', () => {
      const votingProposals = storage.getProposals({ state: 'voting' });
      expect(votingProposals).toHaveLength(3);
    });
  });

  describe('Advanced Filtering', () => {
    beforeEach(() => {
      const now = Date.now();
      
      // Create proposals with different timestamps
      for (let i = 0; i < 10; i++) {
        storage.storeProposal({
          id: `proposal-${i}`,
          title: `Proposal ${i}`,
          description: `Description ${i}`,
          category: i % 2 === 0 ? 'treasury' : 'governance',
          state: i < 5 ? 'succeeded' : 'voting',
          proposer: `proposer-${i}`,
          realm: `realm-${i % 3}`,
          daoName: 'Test DAO',
          createdAt: now - (i * 86400000),
          votingStartsAt: now,
          votingEndsAt: now + 86400000,
          votesYes: 100 * (i + 1),
          votesNo: 50,
          votesAbstain: 25,
          totalVotingPower: 175,
          quorum: 100,
          threshold: 50
        });
      }
    });

    it('should filter by time range', () => {
      const now = Date.now();
      const recentProposals = storage.getProposals({
        startTime: now - 3 * 86400000,
        endTime: now
      });
      
      expect(recentProposals.length).toBeGreaterThan(0);
      expect(recentProposals.length).toBeLessThan(10);
    });

    it('should combine multiple filters', () => {
      const filtered = storage.getProposals({
        category: 'treasury',
        state: 'succeeded'
      });
      
      expect(filtered.length).toBeGreaterThanOrEqual(0);
      filtered.forEach(p => {
        expect(p.category).toBe('treasury');
        expect(p.state).toBe('succeeded');
      });
    });

    it('should sort by creation time', () => {
      const proposals = storage.getProposals();
      
      for (let i = 1; i < proposals.length; i++) {
        expect(proposals[i - 1].createdAt).toBeGreaterThanOrEqual(proposals[i].createdAt);
      }
    });

    it('should support pagination', () => {
      const page1 = storage.getProposals({ limit: 3, offset: 0 });
      const page2 = storage.getProposals({ limit: 3, offset: 3 });
      
      expect(page1).toHaveLength(3);
      expect(page2).toHaveLength(3);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('Vote Search', () => {
    beforeEach(() => {
      const now = Date.now();
      
      // Create votes with different properties
      for (let i = 0; i < 20; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: `proposal-${i % 5}`,
          voter: `voter-${i % 4}`,
          choice: i % 3 === 0 ? 'yes' : i % 3 === 1 ? 'no' : 'abstain',
          votingPower: 100 * (i + 1),
          timestamp: now - (i * 3600000),
          realm: 'realm-1'
        });
      }
    });

    it('should search votes by voter', () => {
      const voter0Votes = storage.getVotes({ voter: 'voter-0' });
      expect(voter0Votes.length).toBeGreaterThan(0);
      voter0Votes.forEach(v => {
        expect(v.voter).toBe('voter-0');
      });
    });

    it('should search votes by proposal', () => {
      const proposal0Votes = storage.getVotes({ proposal: 'proposal-0' });
      expect(proposal0Votes.length).toBeGreaterThan(0);
      proposal0Votes.forEach(v => {
        expect(v.proposalId).toBe('proposal-0');
      });
    });

    it('should sort votes by voting power', () => {
      const votes = storage.getVotes({ sortBy: 'votingPower', sortOrder: 'desc' });
      
      for (let i = 1; i < votes.length; i++) {
        expect(votes[i - 1].votingPower).toBeGreaterThanOrEqual(votes[i].votingPower);
      }
    });

    it('should filter votes by time range', () => {
      const now = Date.now();
      const recentVotes = storage.getVotes({
        startTime: now - 5 * 3600000,
        endTime: now
      });
      
      expect(recentVotes.length).toBeGreaterThan(0);
      expect(recentVotes.length).toBeLessThan(20);
    });
  });

  describe('Voter Profile Search', () => {
    beforeEach(() => {
      // Create voters with different patterns
      for (let i = 0; i < 10; i++) {
        storage.storeProposal({
          id: `proposal-${i}`,
          title: `P${i}`,
          description: 'D',
          category: 'treasury',
          state: 'voting',
          proposer: 'p',
          realm: 'r',
          daoName: 'DAO',
          createdAt: Date.now(),
          votingStartsAt: Date.now(),
          votingEndsAt: Date.now() + 86400000,
          votesYes: 0,
          votesNo: 0,
          votesAbstain: 0,
          totalVotingPower: 0,
          quorum: 0,
          threshold: 0
        });
      }
      
      // Create active voters
      for (let v = 0; v < 3; v++) {
        for (let i = 0; i < 8; i++) {
          storage.storeVote({
            id: `vote-active-${v}-${i}`,
            proposalId: `proposal-${i}`,
            voter: `active-voter-${v}`,
            choice: 'yes',
            votingPower: 1000,
            timestamp: Date.now()
          });
        }
      }
      
      // Create passive voters
      for (let v = 0; v < 2; v++) {
        storage.storeVote({
          id: `vote-passive-${v}`,
          proposalId: 'proposal-0',
          voter: `passive-voter-${v}`,
          choice: 'yes',
          votingPower: 50,
          timestamp: Date.now()
        });
      }
    });

    it('should identify active voters by participation rate', () => {
      const activeVoter = storage.getVoterProfile('active-voter-0');
      expect(activeVoter).toBeDefined();
      expect(activeVoter!.participationRate).toBeGreaterThan(0.5);
      expect(activeVoter!.tags).toContain('active');
    });

    it('should identify passive voters', () => {
      const passiveVoter = storage.getVoterProfile('passive-voter-0');
      expect(passiveVoter).toBeDefined();
      expect(passiveVoter!.participationRate).toBeLessThan(0.5);
      expect(passiveVoter!.tags).toContain('passive');
    });
  });

  describe('Delegate Search', () => {
    beforeEach(() => {
      // Create delegations with varying power
      for (let i = 0; i < 5; i++) {
        storage.storeDelegation({
          id: `delegation-${i}`,
          delegator: `delegator-${i}`,
          delegate: `delegate-${i % 2}`, // 2 delegates with multiple delegators
          realm: 'realm-1',
          votingPower: 1000 * (i + 1),
          delegatedAt: Date.now(),
          active: true
        });
      }
    });

    it('should find delegates by delegator', () => {
      const delegations = storage.getDelegations({ voter: 'delegator-0' });
      expect(delegations.length).toBeGreaterThan(0);
    });

    it('should find all delegations for a delegate', () => {
      const delegate0Delegations = storage.getActiveDelegationsForDelegate('delegate-0');
      expect(delegate0Delegations.length).toBeGreaterThanOrEqual(2);
    });

    it('should return top delegates sorted by reputation', () => {
      const topDelegates = storage.getTopDelegates(2);
      expect(topDelegates).toHaveLength(2);
      
      // Should be sorted by reputation
      if (topDelegates.length > 1) {
        expect(topDelegates[0].reputationScore).toBeGreaterThanOrEqual(topDelegates[1].reputationScore);
      }
    });
  });

  describe('Statistics Aggregation', () => {
    beforeEach(() => {
      // Seed comprehensive data
      for (let i = 0; i < 100; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: `proposal-${i % 10}`,
          voter: `voter-${i % 20}`,
          choice: i % 2 === 0 ? 'yes' : 'no',
          votingPower: Math.floor(Math.random() * 1000),
          timestamp: Date.now()
        });
      }
      
      for (let i = 0; i < 10; i++) {
        storage.storeProposal({
          id: `proposal-${i}`,
          title: `P${i}`,
          description: 'D',
          category: 'treasury',
          state: i < 5 ? 'succeeded' : 'voting',
          proposer: 'p',
          realm: 'r',
          daoName: 'DAO',
          createdAt: Date.now(),
          votingStartsAt: Date.now(),
          votingEndsAt: Date.now() + 86400000,
          votesYes: 0,
          votesNo: 0,
          votesAbstain: 0,
          totalVotingPower: 0,
          quorum: 0,
          threshold: 0
        });
      }
      
      for (let i = 0; i < 5; i++) {
        storage.storeDelegation({
          id: `delegation-${i}`,
          delegator: `d-${i}`,
          delegate: `delegate-0`,
          realm: 'r',
          votingPower: 1000,
          delegatedAt: Date.now(),
          active: true
        });
      }
    });

    it('should return accurate aggregate statistics', () => {
      const stats = storage.getStats();
      
      expect(stats.totalVotes).toBe(100);
      expect(stats.totalProposals).toBe(10);
      expect(stats.totalDelegations).toBe(5);
      expect(stats.uniqueVoters).toBeGreaterThan(0);
    });
  });
});
