/**
 * DAO Governance Memory Module - Storage Engine
 * Efficient in-memory storage with persistence support
 */

import {
  MemoryIndex,
  MemoryQuery,
  Vote,
  Proposal,
  Delegation,
  Discussion,
  Realm,
  VoterProfile,
  DelegateProfile,
  ProposalState,
  SyncStatus,
  SyncError
} from './types';

export class MemoryStorage {
  private index: MemoryIndex;
  private syncStatus: SyncStatus;
  private persistencePath?: string;

  constructor(persistencePath?: string) {
    this.index = {
      votes: new Map(),
      proposals: new Map(),
      delegations: new Map(),
      discussions: new Map(),
      realms: new Map(),
      voterProfiles: new Map(),
      delegateProfiles: new Map()
    };
    
    this.syncStatus = {
      lastSyncTime: 0,
      lastBlockHeight: 0,
      syncedRealms: [],
      pendingSync: [],
      errors: []
    };
    
    this.persistencePath = persistencePath;
  }

  // ============================================================================
  // VOTE OPERATIONS
  // ============================================================================

  storeVote(vote: Vote): void {
    this.index.votes.set(vote.id, vote);
    this.updateVoterProfile(vote.voter);
  }

  getVote(id: string): Vote | undefined {
    return this.index.votes.get(id);
  }

  getVotes(query: MemoryQuery = {}): Vote[] {
    let votes = Array.from(this.index.votes.values());

    if (query.voter) {
      votes = votes.filter(v => v.voter === query.voter);
    }
    if (query.proposal) {
      votes = votes.filter(v => v.proposalId === query.proposal);
    }
    if (query.realm) {
      votes = votes.filter(v => v.realm === query.realm);
    }
    if (query.startTime) {
      votes = votes.filter(v => v.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      votes = votes.filter(v => v.timestamp <= query.endTime!);
    }

    // Sort
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';
    
    votes.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'timestamp') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortBy === 'votingPower') {
        comparison = a.votingPower - b.votingPower;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || votes.length;
    return votes.slice(offset, offset + limit);
  }

  getVotingHistory(voter: string, limit: number = 100): Vote[] {
    return this.getVotes({ voter, limit, sortBy: 'timestamp', sortOrder: 'desc' });
  }

  getProposalVotes(proposalId: string): Vote[] {
    return this.getVotes({ proposal: proposalId, sortBy: 'votingPower', sortOrder: 'desc' });
  }

  // ============================================================================
  // PROPOSAL OPERATIONS
  // ============================================================================

  storeProposal(proposal: Proposal): void {
    this.index.proposals.set(proposal.id, proposal);
  }

  getProposal(id: string): Proposal | undefined {
    return this.index.proposals.get(id);
  }

  getProposals(query: MemoryQuery = {}): Proposal[] {
    let proposals = Array.from(this.index.proposals.values());

    if (query.realm) {
      proposals = proposals.filter(p => p.realm === query.realm);
    }
    if (query.state) {
      proposals = proposals.filter(p => p.state === query.state);
    }
    if (query.category) {
      proposals = proposals.filter(p => p.category === query.category);
    }
    if (query.startTime) {
      proposals = proposals.filter(p => p.createdAt >= query.startTime!);
    }
    if (query.endTime) {
      proposals = proposals.filter(p => p.createdAt <= query.endTime!);
    }

    // Sort by created time, newest first
    proposals.sort((a, b) => b.createdAt - a.createdAt);

    const offset = query.offset || 0;
    const limit = query.limit || proposals.length;
    return proposals.slice(offset, offset + limit);
  }

  updateProposalState(id: string, state: ProposalState): void {
    const proposal = this.index.proposals.get(id);
    if (proposal) {
      proposal.state = state;
      if (state === 'executed') {
        proposal.executedAt = Date.now();
      }
    }
  }

  // ============================================================================
  // DELEGATION OPERATIONS
  // ============================================================================

  storeDelegation(delegation: Delegation): void {
    this.index.delegations.set(delegation.id, delegation);
    this.updateDelegateProfile(delegation.delegate);
  }

  getDelegation(id: string): Delegation | undefined {
    return this.index.delegations.get(id);
  }

  getDelegations(query: MemoryQuery = {}): Delegation[] {
    let delegations = Array.from(this.index.delegations.values());

    if (query.voter) {
      delegations = delegations.filter(d => d.delegator === query.voter || d.delegate === query.voter);
    }
    if (query.delegate) {
      delegations = delegations.filter(d => d.delegate === query.delegate);
    }
    if (query.realm) {
      delegations = delegations.filter(d => d.realm === query.realm);
    }

    return delegations.filter(d => d.active);
  }

  getActiveDelegationsForDelegate(delegate: string): Delegation[] {
    return Array.from(this.index.delegations.values())
      .filter(d => d.delegate === delegate && d.active);
  }

  revokeDelegation(id: string): void {
    const delegation = this.index.delegations.get(id);
    if (delegation) {
      delegation.active = false;
      delegation.revokedAt = Date.now();
      this.updateDelegateProfile(delegation.delegate);
    }
  }

  // ============================================================================
  // DISCUSSION OPERATIONS
  // ============================================================================

  storeDiscussion(discussion: Discussion): void {
    this.index.discussions.set(discussion.id, discussion);
  }

  getDiscussion(id: string): Discussion | undefined {
    return this.index.discussions.get(id);
  }

  getDiscussions(proposalId?: string): Discussion[] {
    let discussions = Array.from(this.index.discussions.values());
    if (proposalId) {
      discussions = discussions.filter(d => d.proposalId === proposalId);
    }
    return discussions.sort((a, b) => b.createdAt - a.createdAt);
  }

  addReply(discussionId: string, reply: any): void {
    const discussion = this.index.discussions.get(discussionId);
    if (discussion) {
      discussion.replies.push(reply);
    }
  }

  updateDiscussionSummary(discussionId: string, summary: any): void {
    const discussion = this.index.discussions.get(discussionId);
    if (discussion) {
      discussion.summary = summary;
    }
  }

  // ============================================================================
  // REALM OPERATIONS
  // ============================================================================

  storeRealm(realm: Realm): void {
    this.index.realms.set(realm.id, realm);
  }

  getRealm(id: string): Realm | undefined {
    return this.index.realms.get(id);
  }

  getAllRealms(): Realm[] {
    return Array.from(this.index.realms.values());
  }

  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================

  private updateVoterProfile(address: string): void {
    const votes = this.getVotes({ voter: address });
    const proposals = this.getProposals();
    
    const participatingProposals = new Set(votes.map(v => v.proposalId));
    const participationRate = proposals.length > 0 
      ? participatingProposals.size / proposals.length 
      : 0;

    const totalVotingPower = votes.reduce((sum, v) => sum + v.votingPower, 0);
    const avgVotingPower = votes.length > 0 ? totalVotingPower / votes.length : 0;

    const profile: VoterProfile = {
      address,
      totalVotes: votes.length,
      totalProposals: proposals.length,
      participationRate,
      averageVotingPower: avgVotingPower,
      reputationScore: this.calculateVoterReputation(votes, participationRate),
      votingHistory: votes,
      tags: this.deriveVoterTags(votes, participationRate)
    };

    this.index.voterProfiles.set(address, profile);
  }

  getVoterProfile(address: string): VoterProfile | undefined {
    return this.index.voterProfiles.get(address);
  }

  private updateDelegateProfile(address: string): void {
    const delegations = this.getActiveDelegationsForDelegate(address);
    const votes = this.getVotes({ voter: address });
    
    const totalDelegatedPower = delegations.reduce((sum, d) => sum + d.votingPower, 0);
    const delegators = [...new Set(delegations.map(d => d.delegator))];

    const profile: DelegateProfile = {
      address,
      totalDelegatedPower,
      delegatorCount: delegators.length,
      proposalsVoted: new Set(votes.map(v => v.proposalId)).size,
      votingAccuracy: this.calculateVotingAccuracy(address),
      avgParticipationRate: this.calculateParticipationRate(address),
      delegators,
      votingRecord: votes,
      reputationScore: this.calculateDelegateReputation(address, totalDelegatedPower, delegators.length),
      rank: 0 // Will be calculated separately
    };

    this.index.delegateProfiles.set(address, profile);
    this.updateDelegateRanks();
  }

  getDelegateProfile(address: string): DelegateProfile | undefined {
    return this.index.delegateProfiles.get(address);
  }

  getTopDelegates(limit: number = 10): DelegateProfile[] {
    return Array.from(this.index.delegateProfiles.values())
      .sort((a, b) => b.reputationScore - a.reputationScore)
      .slice(0, limit);
  }

  // ============================================================================
  // CALCULATION HELPERS
  // ============================================================================

  private calculateVoterReputation(votes: Vote[], participationRate: number): number {
    const voteCount = votes.length;
    const avgPower = voteCount > 0 
      ? votes.reduce((sum, v) => sum + v.votingPower, 0) / voteCount 
      : 0;
    
    // Simple reputation formula: participation * log(voteCount + 1) * log(avgPower + 1)
    const reputation = participationRate * Math.log(voteCount + 1) * Math.log(avgPower + 1) * 100;
    return Math.min(Math.round(reputation), 1000);
  }

  private calculateDelegateReputation(address: string, power: number, delegatorCount: number): number {
    const accuracy = this.calculateVotingAccuracy(address);
    const participation = this.calculateParticipationRate(address);
    
    // Reputation based on: accuracy * participation * log(power) * log(delegators)
    const reputation = accuracy * participation * Math.log(power + 1) * Math.log(delegatorCount + 1) * 10;
    return Math.min(Math.round(reputation), 1000);
  }

  private calculateVotingAccuracy(address: string): number {
    const votes = this.getVotes({ voter: address });
    if (votes.length === 0) return 0;

    let correct = 0;
    for (const vote of votes) {
      const proposal = this.getProposal(vote.proposalId);
      if (proposal) {
        const passed = proposal.state === 'succeeded' || proposal.state === 'executed';
        const votedYes = vote.choice === 'yes';
        if (passed === votedYes) correct++;
      }
    }
    return correct / votes.length;
  }

  private calculateParticipationRate(address: string): number {
    const profile = this.getVoterProfile(address);
    return profile?.participationRate || 0;
  }

  private deriveVoterTags(votes: Vote[], participationRate: number): string[] {
    const tags: string[] = [];
    
    if (participationRate > 0.8) tags.push('active');
    if (participationRate < 0.2) tags.push('passive');
    
    const avgPower = votes.reduce((sum, v) => sum + v.votingPower, 0) / (votes.length || 1);
    if (avgPower > 10000) tags.push('whale');
    if (avgPower < 100) tags.push('retail');
    
    return tags;
  }

  private updateDelegateRanks(): void {
    const delegates = Array.from(this.index.delegateProfiles.values())
      .sort((a, b) => b.reputationScore - a.reputationScore);
    
    delegates.forEach((delegate, index) => {
      delegate.rank = index + 1;
    });
  }

  // ============================================================================
  // SYNC STATUS
  // ============================================================================

  updateSyncStatus(update: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...update };
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  addSyncError(error: SyncError): void {
    this.syncStatus.errors.push(error);
    // Keep only last 100 errors
    if (this.syncStatus.errors.length > 100) {
      this.syncStatus.errors = this.syncStatus.errors.slice(-100);
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  getStats(): {
    totalVotes: number;
    totalProposals: number;
    totalDelegations: number;
    totalDiscussions: number;
    totalRealms: number;
    uniqueVoters: number;
    uniqueDelegates: number;
  } {
    return {
      totalVotes: this.index.votes.size,
      totalProposals: this.index.proposals.size,
      totalDelegations: this.index.delegations.size,
      totalDiscussions: this.index.discussions.size,
      totalRealms: this.index.realms.size,
      uniqueVoters: this.index.voterProfiles.size,
      uniqueDelegates: this.index.delegateProfiles.size
    };
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  exportData(): object {
    return {
      votes: Array.from(this.index.votes.entries()),
      proposals: Array.from(this.index.proposals.entries()),
      delegations: Array.from(this.index.delegations.entries()),
      discussions: Array.from(this.index.discussions.entries()),
      realms: Array.from(this.index.realms.entries()),
      voterProfiles: Array.from(this.index.voterProfiles.entries()),
      delegateProfiles: Array.from(this.index.delegateProfiles.entries()),
      syncStatus: this.syncStatus
    };
  }

  importData(data: any): void {
    if (data.votes) {
      this.index.votes = new Map(data.votes);
    }
    if (data.proposals) {
      this.index.proposals = new Map(data.proposals);
    }
    if (data.delegations) {
      this.index.delegations = new Map(data.delegations);
    }
    if (data.discussions) {
      this.index.discussions = new Map(data.discussions);
    }
    if (data.realms) {
      this.index.realms = new Map(data.realms);
    }
    if (data.voterProfiles) {
      this.index.voterProfiles = new Map(data.voterProfiles);
    }
    if (data.delegateProfiles) {
      this.index.delegateProfiles = new Map(data.delegateProfiles);
    }
    if (data.syncStatus) {
      this.syncStatus = data.syncStatus;
    }
  }

  clear(): void {
    this.index.votes.clear();
    this.index.proposals.clear();
    this.index.delegations.clear();
    this.index.discussions.clear();
    this.index.realms.clear();
    this.index.voterProfiles.clear();
    this.index.delegateProfiles.clear();
    this.syncStatus = {
      lastSyncTime: 0,
      lastBlockHeight: 0,
      syncedRealms: [],
      pendingSync: [],
      errors: []
    };
  }
}
