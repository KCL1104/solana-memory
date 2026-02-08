import { MemoryStorage } from '../../src/core/storage';
import { IdentityBinding } from '../../src/identity/binding';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Proposal, Vote, Delegation, ProposalCategory } from '../../src/core/types';

/**
 * DAO Governance Scenario
 * 
 * Tests a complete DAO governance flow:
 * 1. Proposal creation and discussion
 * 2. Voting and delegation
 * 3. Vote counting and result calculation
 * 4. Execution tracking
 * 5. Historical analysis
 */
describe('E2E: DAO Governance Scenario', () => {
  let storage: MemoryStorage;
  let identityBinding: IdentityBinding;
  
  // DAO participants
  let daoCreator: any;
  let proposer: any;
  let voters: any[] = [];
  let delegates: any[] = [];

  beforeEach(() => {
    storage = new MemoryStorage();
    const connection = new Connection(clusterApiUrl('devnet'));
    identityBinding = new IdentityBinding(connection, {
      requireSignatures: true,
      enableCrossSession: true,
      trustThreshold: 3
    });

    // Create DAO participants
    daoCreator = identityBinding.createIdentity('dao-creator');
    proposer = identityBinding.createIdentity('proposal-author');
    
    // Create 20 voters with varying power
    for (let i = 0; i < 20; i++) {
      voters.push(identityBinding.createIdentity(`voter-${i}`));
    }

    // Create 5 delegates
    for (let i = 0; i < 5; i++) {
      delegates.push(identityBinding.createIdentity(`delegate-${i}`));
    }

    // Create DAO realm
    storage.storeProposal({
      id: 'realm-dao-launch',
      title: 'DeFi DAO Launch',
      description: 'Initial DAO configuration and setup',
      category: 'governance',
      state: 'executed',
      proposer: daoCreator.id,
      realm: 'realm-defi-dao',
      daoName: 'DeFi DAO',
      createdAt: Date.now() - 86400000 * 30, // 30 days ago
      votingStartsAt: Date.now() - 86400000 * 30,
      votingEndsAt: Date.now() - 86400000 * 29,
      executedAt: Date.now() - 86400000 * 29,
      votesYes: 100,
      votesNo: 0,
      votesAbstain: 0,
      totalVotingPower: 100,
      quorum: 50,
      threshold: 50
    });
  });

  afterEach(() => {
    storage.clear();
    voters = [];
    delegates = [];
  });

  describe('Proposal Lifecycle', () => {
    it('should handle complete proposal lifecycle from draft to execution', () => {
      // 1. Create proposal (draft)
      const proposal: Proposal = {
        id: 'proposal-treasury-001',
        title: 'Treasury Allocation Q1 2026',
        description: 'Allocate 50,000 USDC for Q1 development grants, marketing initiatives, and community events',
        category: 'treasury',
        state: 'draft',
        proposer: proposer.id,
        realm: 'realm-defi-dao',
        daoName: 'DeFi DAO',
        createdAt: Date.now(),
        votingStartsAt: Date.now() + 86400000, // Starts in 1 day
        votingEndsAt: Date.now() + 604800000,  // Ends in 7 days
        votesYes: 0,
        votesNo: 0,
        votesAbstain: 0,
        totalVotingPower: 0,
        quorum: 10000,
        threshold: 66
      };
      storage.storeProposal(proposal);

      // Sign proposal
      const signedProposal = identityBinding.signMemory(proposer.id, {
        key: 'proposal-treasury-001',
        content: JSON.stringify(proposal),
        metadata: {
          memoryType: 'task',
          importance: 90,
          tags: [1, 2, 3]
        },
        vault: 'dao-vault'
      });
      expect(identityBinding.verifyMemory(signedProposal).valid).toBe(true);

      // 2. Move to voting
      storage.updateProposalState('proposal-treasury-001', 'voting');
      let currentProposal = storage.getProposal('proposal-treasury-001');
      expect(currentProposal?.state).toBe('voting');

      // 3. Simulate voting period
      // Votes: 15 yes (12,000 power), 3 no (2,000 power), 2 abstain (1,000 power)
      const voteDistribution = [
        ...Array(12).fill('yes'),
        ...Array(3).fill('no'),
        ...Array(2).fill('abstain'),
        ...Array(3).fill(null) // Non-voters
      ];

      let yesPower = 0;
      let noPower = 0;
      let abstainPower = 0;

      voters.forEach((voter, i) => {
        const choice = voteDistribution[i];
        if (!choice) return; // Non-voter

        const power = 500 + Math.floor(Math.random() * 1000);
        
        if (choice === 'yes') yesPower += power;
        if (choice === 'no') noPower += power;
        if (choice === 'abstain') abstainPower += power;

        const vote: Vote = {
          id: `vote-treasury-001-${i}`,
          proposalId: 'proposal-treasury-001',
          voter: voter.id,
          choice: choice as any,
          votingPower: power,
          timestamp: Date.now(),
          realm: 'realm-defi-dao',
          daoName: 'DeFi DAO'
        };
        storage.storeVote(vote);
      });

      // Update proposal with vote counts
      currentProposal = storage.getProposal('proposal-treasury-001');
      if (currentProposal) {
        currentProposal.votesYes = yesPower;
        currentProposal.votesNo = noPower;
        currentProposal.votesAbstain = abstainPower;
        currentProposal.totalVotingPower = yesPower + noPower + abstainPower;
      }

      // 4. Count votes
      const votes = storage.getProposalVotes('proposal-treasury-001');
      expect(votes.length).toBeGreaterThanOrEqual(12); // At least the yes voters

      // 5. Calculate result
      const totalVoted = yesPower + noPower;
      const yesPercentage = (yesPower / totalVoted) * 100;
      const quorumReached = (yesPower + noPower + abstainPower) >= (currentProposal?.quorum || 0);
      const thresholdReached = yesPercentage >= (currentProposal?.threshold || 0);

      expect(quorumReached).toBe(true);

      // 6. Mark as succeeded or defeated
      if (quorumReached && thresholdReached) {
        storage.updateProposalState('proposal-treasury-001', 'succeeded');
      } else {
        storage.updateProposalState('proposal-treasury-001', 'defeated');
      }

      currentProposal = storage.getProposal('proposal-treasury-001');
      expect(['succeeded', 'defeated']).toContain(currentProposal?.state);

      // 7. Execute if succeeded
      if (currentProposal?.state === 'succeeded') {
        storage.updateProposalState('proposal-treasury-001', 'executed');
        currentProposal = storage.getProposal('proposal-treasury-001');
        expect(currentProposal?.state).toBe('executed');
        expect(currentProposal?.executedAt).toBeDefined();
      }
    });
  });

  describe('Delegation System', () => {
    it('should handle vote delegation flow', () => {
      // Create delegations
      const delegators = voters.slice(0, 10); // First 10 voters delegate
      
      delegators.forEach((delegator, i) => {
        const delegate = delegates[i % delegates.length]; // Distribute among delegates
        const power = 1000 + Math.floor(Math.random() * 2000);

        const delegation: Delegation = {
          id: `delegation-${i}`,
          delegator: delegator.id,
          delegate: delegate.id,
          realm: 'realm-defi-dao',
          votingPower: power,
          delegatedAt: Date.now(),
          active: true
        };
        storage.storeDelegation(delegation);
      });

      // Verify delegations
      delegates.forEach(delegate => {
        const activeDelegations = storage.getActiveDelegationsForDelegate(delegate.id);
        expect(activeDelegations.length).toBeGreaterThanOrEqual(1);
      });

      // Delegate votes on behalf of delegators
      delegates.forEach((delegate, i) => {
        const delegatedPower = storage.getActiveDelegationsForDelegate(delegate.id)
          .reduce((sum, d) => sum + d.votingPower, 0);

        const vote: Vote = {
          id: `delegate-vote-${i}`,
          proposalId: 'proposal-delegation-test',
          voter: delegate.id,
          choice: i % 2 === 0 ? 'yes' : 'no',
          votingPower: delegatedPower,
          timestamp: Date.now(),
          realm: 'realm-defi-dao',
          daoName: 'DeFi DAO'
        };
        storage.storeVote(vote);
      });

      // Verify delegate profiles
      delegates.forEach(delegate => {
        const profile = storage.getDelegateProfile(delegate.id);
        expect(profile).toBeDefined();
        expect(profile?.totalDelegatedPower).toBeGreaterThan(0);
      });

      // Get top delegates
      const topDelegates = storage.getTopDelegates(3);
      expect(topDelegates).toHaveLength(3);
      expect(topDelegates[0].reputationScore).toBeGreaterThanOrEqual(topDelegates[1]?.reputationScore || 0);
    });

    it('should handle delegation revocation', () => {
      // Create and then revoke delegation
      const delegator = voters[0];
      const delegate = delegates[0];

      const delegation: Delegation = {
        id: 'delegation-revoke-test',
        delegator: delegator.id,
        delegate: delegate.id,
        realm: 'realm-defi-dao',
        votingPower: 5000,
        delegatedAt: Date.now(),
        active: true
      };
      storage.storeDelegation(delegation);

      // Verify active
      let activeDelegations = storage.getActiveDelegationsForDelegate(delegate.id);
      expect(activeDelegations).toHaveLength(1);

      // Revoke
      storage.revokeDelegation('delegation-revoke-test');

      // Verify revoked
      activeDelegations = storage.getActiveDelegationsForDelegate(delegate.id);
      expect(activeDelegations).toHaveLength(0);

      const revoked = storage.getDelegation('delegation-revoke-test');
      expect(revoked?.active).toBe(false);
      expect(revoked?.revokedAt).toBeDefined();
    });
  });

  describe('Governance Analytics', () => {
    beforeEach(() => {
      // Create historical proposals
      const categories: ProposalCategory[] = ['treasury', 'governance', 'parameter', 'upgrade'];
      const states = ['succeeded', 'defeated', 'executed'];

      for (let i = 0; i < 30; i++) {
        storage.storeProposal({
          id: `historical-proposal-${i}`,
          title: `Historical Proposal ${i}`,
          description: `Description ${i}`,
          category: categories[i % categories.length],
          state: states[i % states.length] as any,
          proposer: proposer.id,
          realm: 'realm-defi-dao',
          daoName: 'DeFi DAO',
          createdAt: Date.now() - (i * 86400000),
          votingStartsAt: Date.now() - (i * 86400000),
          votingEndsAt: Date.now() - ((i - 1) * 86400000),
          executedAt: i % 3 === 2 ? Date.now() - ((i - 1) * 86400000) : undefined,
          votesYes: Math.floor(Math.random() * 5000),
          votesNo: Math.floor(Math.random() * 3000),
          votesAbstain: Math.floor(Math.random() * 1000),
          totalVotingPower: 8000,
          quorum: 4000,
          threshold: 50
        });
      }
    });

    it('should calculate governance statistics', () => {
      const stats = storage.getStats();
      expect(stats.totalProposals).toBe(31); // 30 historical + 1 realm launch

      const succeededProposals = storage.getProposals({ state: 'succeeded' });
      const executedProposals = storage.getProposals({ state: 'executed' });
      
      // Success rate
      const successRate = (succeededProposals.length + executedProposals.length) / stats.totalProposals;
      expect(successRate).toBeGreaterThan(0);
      expect(successRate).toBeLessThanOrEqual(1);
    });

    it('should filter proposals by category', () => {
      const treasuryProposals = storage.getProposals({ category: 'treasury' });
      const governanceProposals = storage.getProposals({ category: 'governance' });

      expect(treasuryProposals.length).toBeGreaterThan(0);
      expect(governanceProposals.length).toBeGreaterThan(0);

      treasuryProposals.forEach(p => expect(p.category).toBe('treasury'));
      governanceProposals.forEach(p => expect(p.category).toBe('governance'));
    });

    it('should analyze voter participation', () => {
      // Create votes for participation analysis
      for (let i = 0; i < 50; i++) {
        storage.storeVote({
          id: `analytics-vote-${i}`,
          proposalId: `historical-proposal-${i % 20}`,
          voter: voters[i % voters.length].id,
          choice: i % 3 === 0 ? 'abstain' : i % 2 === 0 ? 'yes' : 'no',
          votingPower: 100 + Math.floor(Math.random() * 900),
          timestamp: Date.now() - (i * 3600000),
          realm: 'realm-defi-dao'
        });
      }

      // Check voter profiles
      voters.forEach(voter => {
        const profile = storage.getVoterProfile(voter.id);
        if (profile) {
          expect(profile.totalVotes).toBeGreaterThanOrEqual(0);
          expect(profile.participationRate).toBeGreaterThanOrEqual(0);
          expect(profile.participationRate).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('Cross-Session Governance', () => {
    it('should maintain governance state across sessions', () => {
      const session = identityBinding.initCrossSession(daoCreator.id);

      // Sign governance actions
      for (let i = 0; i < 5; i++) {
        const signedAction = identityBinding.signMemory(daoCreator.id, {
          key: `gov-action-${i}`,
          content: JSON.stringify({
            action: 'create_proposal',
            proposalId: `cross-session-proposal-${i}`,
            timestamp: Date.now()
          }),
          metadata: {
            memoryType: 'task',
            importance: 80,
            tags: ['voting', 'active']
          },
          vault: 'dao-vault'
        });

        identityBinding.verifyInSession(session.sessionId, signedAction);
      }

      expect(identityBinding.isTrustEstablished(session.sessionId)).toBe(true);

      // Export and reimport state (simulating session persistence)
      const exported = storage.exportData();
      storage.clear();
      storage.importData(exported);

      expect(storage.getStats().totalProposals).toBe(1); // Original realm proposal
    });
  });
});
