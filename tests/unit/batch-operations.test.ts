import { MemoryStorage } from '../../src/core/storage';
import { IdentityBinding } from '../../src/identity/binding';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Vote, Proposal, Delegation } from '../../src/core/types';

describe('Batch Operations', () => {
  let storage: MemoryStorage;
  let identityBinding: IdentityBinding;

  beforeEach(() => {
    storage = new MemoryStorage();
    const connection = new Connection(clusterApiUrl('devnet'));
    identityBinding = new IdentityBinding(connection, {
      requireSignatures: true,
      enableCrossSession: true,
      trustThreshold: 3
    });
  });

  afterEach(() => {
    storage.clear();
  });

  describe('Batch Vote Operations', () => {
    it('should store multiple votes efficiently', () => {
      const votes: Vote[] = Array.from({ length: 100 }, (_, i) => ({
        id: `vote-${i}`,
        proposalId: `proposal-${i % 10}`,
        voter: `voter-${i % 5}`,
        choice: i % 2 === 0 ? 'yes' : 'no',
        votingPower: 100 * (i + 1),
        timestamp: Date.now()
      }));

      const startTime = Date.now();
      votes.forEach(vote => storage.storeVote(vote));
      const endTime = Date.now();

      expect(storage.getStats().totalVotes).toBe(100);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should retrieve multiple votes in batch', () => {
      // Store votes
      for (let i = 0; i < 50; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: 'proposal-1',
          voter: `voter-${i}`,
          choice: 'yes',
          votingPower: 100,
          timestamp: Date.now()
        });
      }

      const startTime = Date.now();
      const votes = storage.getVotes({ proposal: 'proposal-1' });
      const endTime = Date.now();

      expect(votes).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Batch Proposal Operations', () => {
    it('should store multiple proposals efficiently', () => {
      const proposals: Proposal[] = Array.from({ length: 50 }, (_, i) => ({
        id: `proposal-${i}`,
        title: `Proposal ${i}`,
        description: `Description for proposal ${i}`,
        category: i % 2 === 0 ? 'treasury' : 'governance',
        state: 'voting',
        proposer: `proposer-${i % 5}`,
        realm: `realm-${i % 3}`,
        daoName: 'Test DAO',
        createdAt: Date.now(),
        votingStartsAt: Date.now(),
        votingEndsAt: Date.now() + 86400000,
        votesYes: 0,
        votesNo: 0,
        votesAbstain: 0,
        totalVotingPower: 0,
        quorum: 100,
        threshold: 50
      }));

      const startTime = Date.now();
      proposals.forEach(proposal => storage.storeProposal(proposal));
      const endTime = Date.now();

      expect(storage.getStats().totalProposals).toBe(50);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should batch update proposal states', () => {
      // Create proposals
      for (let i = 0; i < 20; i++) {
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

      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        storage.updateProposalState(`proposal-${i}`, 'succeeded');
      }
      const endTime = Date.now();

      const succeededProposals = storage.getProposals({ state: 'succeeded' });
      expect(succeededProposals).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Batch Delegation Operations', () => {
    it('should store multiple delegations efficiently', () => {
      const delegations: Delegation[] = Array.from({ length: 30 }, (_, i) => ({
        id: `delegation-${i}`,
        delegator: `delegator-${i}`,
        delegate: `delegate-${i % 5}`,
        realm: 'realm-1',
        votingPower: 1000 * (i + 1),
        delegatedAt: Date.now(),
        active: true
      }));

      const startTime = Date.now();
      delegations.forEach(delegation => storage.storeDelegation(delegation));
      const endTime = Date.now();

      expect(storage.getStats().totalDelegations).toBe(30);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should batch revoke delegations', () => {
      // Create delegations
      for (let i = 0; i < 20; i++) {
        storage.storeDelegation({
          id: `delegation-${i}`,
          delegator: `delegator-${i}`,
          delegate: 'delegate-1',
          realm: 'realm-1',
          votingPower: 1000,
          delegatedAt: Date.now(),
          active: true
        });
      }

      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        storage.revokeDelegation(`delegation-${i}`);
      }
      const endTime = Date.now();

      const activeDelegations = storage.getActiveDelegationsForDelegate('delegate-1');
      expect(activeDelegations).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Batch Memory Signing', () => {
    it('should sign multiple memories in batch', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const memories = Array.from({ length: 100 }, (_, i) => ({
        key: `memory-${i}`,
        content: `Content for memory ${i}`,
        metadata: {
          memoryType: 'knowledge' as const,
          importance: 50 + (i % 50),
          tags: [`tag-${i % 10}`]
        },
        vault: 'vault-123'
      }));

      const startTime = Date.now();
      const signedMemories = identityBinding.batchSignMemories(identity.id, memories);
      const endTime = Date.now();

      expect(signedMemories).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(500); // Batch should be fast
      
      // All should be valid
      signedMemories.forEach((memory, i) => {
        expect(memory.key).toBe(`memory-${i}`);
        expect(memory.signature.signature.length).toBe(64);
      });
    });

    it('should verify multiple memories in batch', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const memories = Array.from({ length: 50 }, (_, i) =>
        identityBinding.signMemory(identity.id, {
          key: `memory-${i}`,
          content: `Content ${i}`,
          metadata: { memoryType: 'knowledge' as const, importance: 50, tags: [] },
          vault: 'vault-123'
        })
      );

      const startTime = Date.now();
      const results = identityBinding.batchVerifyMemories(memories);
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      expect(results.every(r => r.valid)).toBe(true);
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Bulk Data Import/Export', () => {
    it('should export all data efficiently', () => {
      // Seed with data
      for (let i = 0; i < 100; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: `proposal-${i % 10}`,
          voter: `voter-${i % 20}`,
          choice: 'yes',
          votingPower: 100,
          timestamp: Date.now()
        });
      }

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

      const startTime = Date.now();
      const exported = storage.exportData();
      const endTime = Date.now();

      expect(exported).toHaveProperty('votes');
      expect(exported).toHaveProperty('proposals');
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should import all data efficiently', () => {
      // Create and export data
      for (let i = 0; i < 50; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: `proposal-${i % 5}`,
          voter: `voter-${i % 10}`,
          choice: 'yes',
          votingPower: 100,
          timestamp: Date.now()
        });
      }

      const exported = storage.exportData();
      storage.clear();

      const startTime = Date.now();
      storage.importData(exported);
      const endTime = Date.now();

      expect(storage.getStats().totalVotes).toBe(50);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent vote storage', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve().then(() => {
          storage.storeVote({
            id: `vote-${i}`,
            proposalId: 'proposal-1',
            voter: `voter-${i}`,
            choice: 'yes',
            votingPower: 100,
            timestamp: Date.now()
          });
        })
      );

      await Promise.all(promises);

      expect(storage.getStats().totalVotes).toBe(50);
    });

    it('should handle concurrent reads and writes', async () => {
      // First, store some data
      for (let i = 0; i < 20; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: 'proposal-1',
          voter: `voter-${i}`,
          choice: 'yes',
          votingPower: 100,
          timestamp: Date.now()
        });
      }

      // Concurrent reads and writes
      const operations = [
        ...Array.from({ length: 10 }, (_, i) =>
          Promise.resolve().then(() => {
            storage.storeVote({
              id: `vote-new-${i}`,
              proposalId: 'proposal-1',
              voter: `voter-new-${i}`,
              choice: 'no',
              votingPower: 50,
              timestamp: Date.now()
            });
          })
        ),
        ...Array.from({ length: 10 }, () =>
          Promise.resolve().then(() => {
            return storage.getVotes({ proposal: 'proposal-1' });
          })
        )
      ];

      await Promise.all(operations);

      // Should have 30 votes (20 original + 10 new)
      expect(storage.getStats().totalVotes).toBe(30);
    });
  });

  describe('Memory-Efficient Operations', () => {
    it('should handle large dataset without memory issues', () => {
      const largeCount = 1000;
      
      const startTime = Date.now();
      for (let i = 0; i < largeCount; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: `proposal-${i % 100}`,
          voter: `voter-${i % 50}`,
          choice: i % 2 === 0 ? 'yes' : 'no',
          votingPower: Math.floor(Math.random() * 1000),
          timestamp: Date.now()
        });
      }
      const endTime = Date.now();

      expect(storage.getStats().totalVotes).toBe(largeCount);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in reasonable time
    });

    it('should efficiently paginate large datasets', () => {
      // Create large dataset
      for (let i = 0; i < 500; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: 'proposal-1',
          voter: `voter-${i}`,
          choice: 'yes',
          votingPower: 100,
          timestamp: Date.now()
        });
      }

      const pageSize = 50;
      const pages = 10;
      
      const startTime = Date.now();
      for (let i = 0; i < pages; i++) {
        const page = storage.getVotes({ limit: pageSize, offset: i * pageSize });
        expect(page).toHaveLength(pageSize);
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
