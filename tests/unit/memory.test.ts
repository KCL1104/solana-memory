import { MemoryStorage } from '../../src/core/storage';
import { 
  Vote, 
  Proposal, 
  Delegation, 
  Discussion, 
  Realm,
  ProposalState 
} from '../../src/core/types';

describe('MemoryStorage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  afterEach(() => {
    storage.clear();
  });

  describe('Vote Operations', () => {
    const mockVote: Vote = {
      id: 'vote-1',
      proposalId: 'proposal-1',
      voter: 'voter-123',
      choice: 'yes',
      votingPower: 100,
      timestamp: Date.now(),
      realm: 'realm-1',
      daoName: 'Test DAO'
    };

    it('should store a vote', () => {
      storage.storeVote(mockVote);
      const retrieved = storage.getVote('vote-1');
      expect(retrieved).toEqual(mockVote);
    });

    it('should retrieve a vote by ID', () => {
      storage.storeVote(mockVote);
      const vote = storage.getVote('vote-1');
      expect(vote).toBeDefined();
      expect(vote?.id).toBe('vote-1');
    });

    it('should return undefined for non-existent vote', () => {
      const vote = storage.getVote('non-existent');
      expect(vote).toBeUndefined();
    });

    it('should get all votes', () => {
      storage.storeVote(mockVote);
      storage.storeVote({ ...mockVote, id: 'vote-2', voter: 'voter-456' });
      
      const votes = storage.getVotes();
      expect(votes).toHaveLength(2);
    });

    it('should filter votes by voter', () => {
      storage.storeVote(mockVote);
      storage.storeVote({ ...mockVote, id: 'vote-2', voter: 'voter-456' });
      
      const votes = storage.getVotes({ voter: 'voter-123' });
      expect(votes).toHaveLength(1);
      expect(votes[0].voter).toBe('voter-123');
    });

    it('should filter votes by proposal', () => {
      storage.storeVote(mockVote);
      storage.storeVote({ ...mockVote, id: 'vote-2', proposalId: 'proposal-2' });
      
      const votes = storage.getVotes({ proposal: 'proposal-1' });
      expect(votes).toHaveLength(1);
      expect(votes[0].proposalId).toBe('proposal-1');
    });

    it('should filter votes by time range', () => {
      const now = Date.now();
      storage.storeVote({ ...mockVote, timestamp: now - 10000 });
      storage.storeVote({ ...mockVote, id: 'vote-2', timestamp: now });
      storage.storeVote({ ...mockVote, id: 'vote-3', timestamp: now + 10000 });
      
      const votes = storage.getVotes({ startTime: now - 5000, endTime: now + 5000 });
      expect(votes).toHaveLength(1);
    });

    it('should sort votes by timestamp', () => {
      const now = Date.now();
      storage.storeVote({ ...mockVote, timestamp: now - 1000 });
      storage.storeVote({ ...mockVote, id: 'vote-2', timestamp: now });
      
      const votesAsc = storage.getVotes({ sortBy: 'timestamp', sortOrder: 'asc' });
      expect(votesAsc[0].timestamp).toBeLessThan(votesAsc[1].timestamp);
      
      const votesDesc = storage.getVotes({ sortBy: 'timestamp', sortOrder: 'desc' });
      expect(votesDesc[0].timestamp).toBeGreaterThan(votesDesc[1].timestamp);
    });

    it('should paginate votes', () => {
      for (let i = 0; i < 10; i++) {
        storage.storeVote({ ...mockVote, id: `vote-${i}` });
      }
      
      const page1 = storage.getVotes({ limit: 5, offset: 0 });
      expect(page1).toHaveLength(5);
      
      const page2 = storage.getVotes({ limit: 5, offset: 5 });
      expect(page2).toHaveLength(5);
    });

    it('should get voting history for a voter', () => {
      storage.storeVote(mockVote);
      storage.storeVote({ ...mockVote, id: 'vote-2', proposalId: 'proposal-2' });
      storage.storeVote({ ...mockVote, id: 'vote-3', voter: 'voter-456' });
      
      const history = storage.getVotingHistory('voter-123');
      expect(history).toHaveLength(2);
    });
  });

  describe('Proposal Operations', () => {
    const mockProposal: Proposal = {
      id: 'proposal-1',
      title: 'Test Proposal',
      description: 'Test description',
      category: 'treasury',
      state: 'voting',
      proposer: 'proposer-123',
      realm: 'realm-1',
      daoName: 'Test DAO',
      createdAt: Date.now(),
      votingStartsAt: Date.now(),
      votingEndsAt: Date.now() + 86400000,
      votesYes: 100,
      votesNo: 50,
      votesAbstain: 10,
      totalVotingPower: 160,
      quorum: 100,
      threshold: 50
    };

    it('should store a proposal', () => {
      storage.storeProposal(mockProposal);
      const retrieved = storage.getProposal('proposal-1');
      expect(retrieved).toEqual(mockProposal);
    });

    it('should update proposal state', () => {
      storage.storeProposal(mockProposal);
      storage.updateProposalState('proposal-1', 'succeeded');
      
      const proposal = storage.getProposal('proposal-1');
      expect(proposal?.state).toBe('succeeded');
    });

    it('should set executedAt when state changes to executed', () => {
      storage.storeProposal(mockProposal);
      const beforeUpdate = Date.now();
      storage.updateProposalState('proposal-1', 'executed');
      const afterUpdate = Date.now();
      
      const proposal = storage.getProposal('proposal-1');
      expect(proposal?.state).toBe('executed');
      expect(proposal?.executedAt).toBeGreaterThanOrEqual(beforeUpdate);
      expect(proposal?.executedAt).toBeLessThanOrEqual(afterUpdate);
    });

    it('should filter proposals by state', () => {
      storage.storeProposal(mockProposal);
      storage.storeProposal({ ...mockProposal, id: 'proposal-2', state: 'succeeded' });
      
      const votingProposals = storage.getProposals({ state: 'voting' as ProposalState });
      expect(votingProposals).toHaveLength(1);
    });

    it('should filter proposals by category', () => {
      storage.storeProposal(mockProposal);
      storage.storeProposal({ ...mockProposal, id: 'proposal-2', category: 'governance' });
      
      const treasuryProposals = storage.getProposals({ category: 'treasury' });
      expect(treasuryProposals).toHaveLength(1);
    });
  });

  describe('Delegation Operations', () => {
    const mockDelegation: Delegation = {
      id: 'delegation-1',
      delegator: 'delegator-123',
      delegate: 'delegate-123',
      realm: 'realm-1',
      votingPower: 100,
      delegatedAt: Date.now(),
      active: true
    };

    it('should store a delegation', () => {
      storage.storeDelegation(mockDelegation);
      const retrieved = storage.getDelegation('delegation-1');
      expect(retrieved).toEqual(mockDelegation);
    });

    it('should revoke a delegation', () => {
      storage.storeDelegation(mockDelegation);
      storage.revokeDelegation('delegation-1');
      
      const delegation = storage.getDelegation('delegation-1');
      expect(delegation?.active).toBe(false);
      expect(delegation?.revokedAt).toBeDefined();
    });

    it('should only return active delegations by default', () => {
      storage.storeDelegation(mockDelegation);
      storage.storeDelegation({ ...mockDelegation, id: 'delegation-2', active: false });
      
      const delegations = storage.getDelegations();
      expect(delegations).toHaveLength(1);
    });

    it('should get active delegations for a delegate', () => {
      storage.storeDelegation(mockDelegation);
      storage.storeDelegation({ ...mockDelegation, id: 'delegation-2', delegator: 'delegator-456' });
      storage.storeDelegation({ ...mockDelegation, id: 'delegation-3', active: false });
      
      const activeDelegations = storage.getActiveDelegationsForDelegate('delegate-123');
      expect(activeDelegations).toHaveLength(2);
    });
  });

  describe('Voter Profile Operations', () => {
    it('should create voter profile automatically when storing votes', () => {
      const vote: Vote = {
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: 'voter-123',
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      };
      
      storage.storeVote(vote);
      const profile = storage.getVoterProfile('voter-123');
      
      expect(profile).toBeDefined();
      expect(profile?.address).toBe('voter-123');
      expect(profile?.totalVotes).toBe(1);
    });

    it('should calculate participation rate correctly', () => {
      const proposal1: Proposal = {
        id: 'proposal-1',
        title: 'P1',
        description: 'D1',
        category: 'treasury',
        state: 'voting',
        proposer: 'p1',
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
      };
      
      const proposal2 = { ...proposal1, id: 'proposal-2' };
      storage.storeProposal(proposal1);
      storage.storeProposal(proposal2);
      
      storage.storeVote({
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: 'voter-123',
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      });
      
      const profile = storage.getVoterProfile('voter-123');
      expect(profile?.participationRate).toBe(0.5);
    });

    it('should derive voter tags correctly', () => {
      // Create multiple votes to test tagging
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
      
      // Active voter (high participation)
      for (let i = 0; i < 9; i++) {
        storage.storeVote({
          id: `vote-${i}`,
          proposalId: `proposal-${i}`,
          voter: 'active-voter',
          choice: 'yes',
          votingPower: 100,
          timestamp: Date.now()
        });
      }
      
      // Passive voter (low participation)
      storage.storeVote({
        id: 'vote-passive',
        proposalId: 'proposal-0',
        voter: 'passive-voter',
        choice: 'yes',
        votingPower: 50,
        timestamp: Date.now()
      });
      
      // Whale voter
      storage.storeVote({
        id: 'vote-whale',
        proposalId: 'proposal-0',
        voter: 'whale-voter',
        choice: 'yes',
        votingPower: 50000,
        timestamp: Date.now()
      });
      
      const activeProfile = storage.getVoterProfile('active-voter');
      expect(activeProfile?.tags).toContain('active');
      
      const passiveProfile = storage.getVoterProfile('passive-voter');
      expect(passiveProfile?.tags).toContain('passive');
      
      const whaleProfile = storage.getVoterProfile('whale-voter');
      expect(whaleProfile?.tags).toContain('whale');
    });
  });

  describe('Delegate Profile Operations', () => {
    it('should create delegate profile when delegation is stored', () => {
      const delegation: Delegation = {
        id: 'delegation-1',
        delegator: 'delegator-123',
        delegate: 'delegate-123',
        realm: 'realm-1',
        votingPower: 100,
        delegatedAt: Date.now(),
        active: true
      };
      
      storage.storeDelegation(delegation);
      const profile = storage.getDelegateProfile('delegate-123');
      
      expect(profile).toBeDefined();
      expect(profile?.address).toBe('delegate-123');
      expect(profile?.totalDelegatedPower).toBe(100);
    });

    it('should return top delegates sorted by reputation', () => {
      // Create delegations with different voting power
      storage.storeDelegation({
        id: 'd1',
        delegator: 'del1',
        delegate: 'delegate-high',
        realm: 'r1',
        votingPower: 10000,
        delegatedAt: Date.now(),
        active: true
      });
      
      storage.storeDelegation({
        id: 'd2',
        delegator: 'del2',
        delegate: 'delegate-low',
        realm: 'r1',
        votingPower: 100,
        delegatedAt: Date.now(),
        active: true
      });
      
      const topDelegates = storage.getTopDelegates(2);
      expect(topDelegates).toHaveLength(2);
      expect(topDelegates[0].address).toBe('delegate-high');
      expect(topDelegates[0].rank).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should return accurate statistics', () => {
      storage.storeVote({
        id: 'vote-1',
        proposalId: 'p1',
        voter: 'voter-1',
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      });
      
      storage.storeProposal({
        id: 'proposal-1',
        title: 'Test',
        description: 'Test',
        category: 'treasury',
        state: 'voting',
        proposer: 'p1',
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
      
      storage.storeDelegation({
        id: 'delegation-1',
        delegator: 'd1',
        delegate: 'delegate-1',
        realm: 'r1',
        votingPower: 100,
        delegatedAt: Date.now(),
        active: true
      });
      
      const stats = storage.getStats();
      expect(stats.totalVotes).toBe(1);
      expect(stats.totalProposals).toBe(1);
      expect(stats.totalDelegations).toBe(1);
    });
  });

  describe('Persistence', () => {
    it('should export and import data correctly', () => {
      storage.storeVote({
        id: 'vote-1',
        proposalId: 'p1',
        voter: 'voter-1',
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      });
      
      const exported = storage.exportData();
      
      const newStorage = new MemoryStorage();
      newStorage.importData(exported);
      
      expect(newStorage.getVote('vote-1')).toBeDefined();
    });

    it('should clear all data', () => {
      storage.storeVote({
        id: 'vote-1',
        proposalId: 'p1',
        voter: 'voter-1',
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      });
      
      storage.clear();
      
      expect(storage.getVote('vote-1')).toBeUndefined();
      expect(storage.getStats().totalVotes).toBe(0);
    });
  });
});
