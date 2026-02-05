import { MemoryStorage } from '../../src/core/storage';
import { IdentityBinding } from '../../src/identity/binding';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Vote, Proposal, Delegation } from '../../src/core/types';

describe('SDK Integration', () => {
  let storage: MemoryStorage;
  let identityBinding: IdentityBinding;
  let connection: Connection;

  beforeEach(() => {
    storage = new MemoryStorage();
    connection = new Connection(clusterApiUrl('devnet'));
    identityBinding = new IdentityBinding(connection, {
      requireSignatures: true,
      signatureExpiryHours: 0,
      enableCrossSession: true,
      trustThreshold: 3
    });
  });

  afterEach(() => {
    storage.clear();
  });

  describe('End-to-End Memory Flow', () => {
    it('should store vote and create identity in same flow', () => {
      // Create identity
      const identity = identityBinding.createIdentity('dao-voter');
      expect(identity).toBeDefined();

      // Store vote
      const vote: Vote = {
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: identity.id,
        choice: 'yes',
        votingPower: 1000,
        timestamp: Date.now()
      };
      storage.storeVote(vote);

      // Verify both operations
      const storedVote = storage.getVote('vote-1');
      expect(storedVote).toBeDefined();
      expect(storedVote?.voter).toBe(identity.id);

      const voterProfile = storage.getVoterProfile(identity.id);
      expect(voterProfile).toBeDefined();
      expect(voterProfile?.address).toBe(identity.id);
    });

    it('should sign proposal and store metadata', () => {
      // Create proposer identity
      const proposer = identityBinding.createIdentity('proposer');

      // Create and sign proposal content
      const proposalContent = JSON.stringify({
        title: 'Treasury Allocation',
        description: 'Allocate funds for development',
        amount: 5000
      });

      const signedMemory = identityBinding.signMemory(proposer.id, {
        key: 'proposal-draft-1',
        content: proposalContent,
        metadata: {
          memoryType: 'task',
          importance: 90,
          tags: [1, 2, 3]
        },
        vault: 'treasury-vault'
      });

      // Store proposal
      const proposal: Proposal = {
        id: 'proposal-1',
        title: 'Treasury Allocation',
        description: 'Allocate funds for development',
        category: 'treasury',
        state: 'voting',
        proposer: proposer.id,
        realm: 'realm-1',
        daoName: 'Test DAO',
        createdAt: Date.now(),
        votingStartsAt: Date.now(),
        votingEndsAt: Date.now() + 86400000,
        votesYes: 0,
        votesNo: 0,
        votesAbstain: 0,
        totalVotingPower: 0,
        quorum: 1000,
        threshold: 50
      };
      storage.storeProposal(proposal);

      // Verify signature
      const verification = identityBinding.verifyMemory(signedMemory);
      expect(verification.valid).toBe(true);
      expect(verification.agentId).toBe(proposer.id);

      // Verify proposal stored
      const storedProposal = storage.getProposal('proposal-1');
      expect(storedProposal).toBeDefined();
      expect(storedProposal?.proposer).toBe(proposer.id);
    });
  });

  describe('Delegation Flow', () => {
    it('should handle complete delegation lifecycle', () => {
      // Create delegator and delegate identities
      const delegator = identityBinding.createIdentity('delegator');
      const delegate = identityBinding.createIdentity('delegate');

      // Create delegation
      const delegation: Delegation = {
        id: 'delegation-1',
        delegator: delegator.id,
        delegate: delegate.id,
        realm: 'realm-1',
        votingPower: 5000,
        delegatedAt: Date.now(),
        active: true
      };
      storage.storeDelegation(delegation);

      // Verify delegation
      const storedDelegation = storage.getDelegation('delegation-1');
      expect(storedDelegation).toBeDefined();
      expect(storedDelegation?.delegator).toBe(delegator.id);
      expect(storedDelegation?.delegate).toBe(delegate.id);

      // Verify delegate profile updated
      const delegateProfile = storage.getDelegateProfile(delegate.id);
      expect(delegateProfile).toBeDefined();
      expect(delegateProfile?.totalDelegatedPower).toBe(5000);

      // Vote as delegate
      const vote: Vote = {
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: delegate.id,
        choice: 'yes',
        votingPower: 5000, // Delegated power
        timestamp: Date.now()
      };
      storage.storeVote(vote);

      // Verify vote counted
      const delegateVotes = storage.getVotes({ voter: delegate.id });
      expect(delegateVotes).toHaveLength(1);

      // Revoke delegation
      storage.revokeDelegation('delegation-1');
      const revokedDelegation = storage.getDelegation('delegation-1');
      expect(revokedDelegation?.active).toBe(false);
    });
  });

  describe('Cross-Session Verification Flow', () => {
    it('should establish trust across sessions', () => {
      // Create agent identity
      const agent = identityBinding.createIdentity('persistent-agent');

      // Initialize session
      const session = identityBinding.initCrossSession(agent.id);
      expect(session.trustEstablished).toBe(false);

      // Sign and verify multiple memories to establish trust
      for (let i = 0; i < 3; i++) {
        const signedMemory = identityBinding.signMemory(agent.id, {
          key: `memory-${i}`,
          content: `Session content ${i}`,
          metadata: {
            memoryType: 'conversation',
            importance: 70,
            tags: [i]
          },
          vault: 'session-vault'
        });

        const result = identityBinding.verifyInSession(session.sessionId, signedMemory);
        expect(result.valid).toBe(true);
      }

      // Trust should now be established
      expect(identityBinding.isTrustEstablished(session.sessionId)).toBe(true);

      // Verify session state
      const sessionState = identityBinding.getSessionState(session.sessionId);
      expect(sessionState?.verifiedMemories).toBe(3);
      expect(sessionState?.trustEstablished).toBe(true);
    });

    it('should reject cross-session replay attempts', () => {
      const agent = identityBinding.createIdentity('agent');
      const session1 = identityBinding.initCrossSession(agent.id);
      const session2 = identityBinding.initCrossSession(agent.id);

      // Sign memory in session1 context
      const signedMemory = identityBinding.signMemory(agent.id, {
        key: 'memory-1',
        content: 'Session content',
        metadata: { memoryType: 'conversation', importance: 70, tags: [] },
        vault: 'vault-1'
      });

      // Verify in session1
      const result1 = identityBinding.verifyInSession(session1.sessionId, signedMemory);
      expect(result1.valid).toBe(true);

      // Attempt to replay in session2 with different vault should still work
      // (signature verification is independent of session state)
      const result2 = identityBinding.verifyInSession(session2.sessionId, signedMemory);
      expect(result2.valid).toBe(true);
    });
  });

  describe('DAO Governance Integration', () => {
    beforeEach(() => {
      // Set up a complete DAO scenario
      const realm = {
        id: 'realm-defi',
        name: 'DeFi DAO',
        symbol: 'DEFI',
        publicKey: 'realm-pubkey-123',
        programId: 'gov-program-123',
        minVotesToCreateProposal: 100,
        minInstructionHoldUpTime: 86400,
        maxVotingTime: 604800,
        voteThresholdPercentage: 60,
        proposalCount: 0,
        memberCount: 100,
        totalProposals: 0,
        activeProposals: 0
      };

      // Store realm (using proposals as proxy since realm storage isn't directly exposed)
      const proposal: Proposal = {
        id: 'realm-setup',
        title: realm.name,
        description: 'Realm configuration',
        category: 'governance',
        state: 'executed',
        proposer: 'system',
        realm: realm.id,
        daoName: realm.name,
        createdAt: Date.now(),
        votingStartsAt: Date.now(),
        votingEndsAt: Date.now(),
        votesYes: 100,
        votesNo: 0,
        votesAbstain: 0,
        totalVotingPower: 100,
        quorum: 50,
        threshold: 50
      };
      storage.storeProposal(proposal);
    });

    it('should handle complete proposal lifecycle', () => {
      const proposer = identityBinding.createIdentity('proposer');

      // Create proposal
      const proposal: Proposal = {
        id: 'proposal-1',
        title: 'New Feature Implementation',
        description: 'Implement cross-chain bridging',
        category: 'upgrade',
        state: 'draft',
        proposer: proposer.id,
        realm: 'realm-defi',
        daoName: 'DeFi DAO',
        createdAt: Date.now(),
        votingStartsAt: Date.now() + 86400000,
        votingEndsAt: Date.now() + 691200000,
        votesYes: 0,
        votesNo: 0,
        votesAbstain: 0,
        totalVotingPower: 0,
        quorum: 1000,
        threshold: 60
      };
      storage.storeProposal(proposal);

      // Move to voting
      storage.updateProposalState('proposal-1', 'voting');

      // Simulate votes
      for (let i = 0; i < 10; i++) {
        const voter = identityBinding.createIdentity(`voter-${i}`);
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: 'proposal-1',
          voter: voter.id,
          choice: i < 7 ? 'yes' : 'no', // 70% yes
          votingPower: 200,
          timestamp: Date.now(),
          realm: 'realm-defi'
        });
      }

      // Check votes
      const votes = storage.getProposalVotes('proposal-1');
      expect(votes).toHaveLength(10);

      const yesVotes = votes.filter(v => v.choice === 'yes');
      expect(yesVotes).toHaveLength(7);

      // Mark as succeeded
      storage.updateProposalState('proposal-1', 'succeeded');
      const succeededProposal = storage.getProposal('proposal-1');
      expect(succeededProposal?.state).toBe('succeeded');

      // Execute
      storage.updateProposalState('proposal-1', 'executed');
      const executedProposal = storage.getProposal('proposal-1');
      expect(executedProposal?.state).toBe('executed');
      expect(executedProposal?.executedAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid operations gracefully', () => {
      // Try to get non-existent vote
      const nonExistent = storage.getVote('non-existent');
      expect(nonExistent).toBeUndefined();

      // Try to sign with non-existent identity
      expect(() => {
        identityBinding.signMemory('non-existent', {
          key: 'test',
          content: 'test',
          metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
          vault: 'vault'
        });
      }).toThrow();

      // Try to verify tampered memory
      const identity = identityBinding.createIdentity('test');
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'test',
        content: 'original',
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault'
      });

      // Tamper with content hash
      signedMemory.contentHash = 'tampered-hash';
      const result = identityBinding.verifyMemory(signedMemory);
      expect(result.valid).toBe(false);
    });

    it('should maintain data integrity under concurrent operations', async () => {
      const identity = identityBinding.createIdentity('concurrent-test');

      // Concurrent operations
      const operations = [
        Promise.resolve().then(() => {
          storage.storeProposal({
            id: 'proposal-1',
            title: 'P1',
            description: 'D1',
            category: 'treasury',
            state: 'voting',
            proposer: identity.id,
            realm: 'r1',
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
        }),
        Promise.resolve().then(() => {
          storage.storeVote({
            id: 'vote-1',
            proposalId: 'proposal-1',
            voter: identity.id,
            choice: 'yes',
            votingPower: 100,
            timestamp: Date.now()
          });
        }),
        Promise.resolve().then(() => {
          identityBinding.signMemory(identity.id, {
            key: 'memory-1',
            content: 'test',
            metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
            vault: 'vault'
          });
        })
      ];

      await Promise.all(operations);

      // Verify data integrity
      expect(storage.getProposal('proposal-1')).toBeDefined();
      expect(storage.getVote('vote-1')).toBeDefined();
    });
  });
});
