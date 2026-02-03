/**
 * DAO Governance Memory Module - Core Types
 * Defines all data structures for governance memory
 */

// ============================================================================
// VOTING
// ============================================================================

export type VoteChoice = 'yes' | 'no' | 'abstain' | number[]; // number[] for multi-choice

export interface Vote {
  id: string;
  proposalId: string;
  voter: string; // Wallet public key
  choice: VoteChoice;
  votingPower: number;
  timestamp: number;
  transactionSignature?: string;
  realm?: string;
  daoName?: string;
}

export interface VoteRecord {
  vote: Vote;
  voterProfile?: VoterProfile;
  delegationInfo?: DelegationInfo;
}

export interface VoterProfile {
  address: string;
  totalVotes: number;
  totalProposals: number;
  participationRate: number;
  averageVotingPower: number;
  delegateOf?: string[];
  delegatedTo?: string;
  reputationScore: number;
  votingHistory: Vote[];
  tags: string[];
}

// ============================================================================
// PROPOSALS
// ============================================================================

export type ProposalState = 
  | 'draft'
  | 'pending' 
  | 'voting'
  | 'succeeded'
  | 'defeated'
  | 'executed'
  | 'canceled'
  | 'expired';

export type ProposalCategory = 
  | 'treasury'
  | 'governance'
  | 'parameter'
  | 'upgrade'
  | 'membership'
  | 'other';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: ProposalCategory;
  state: ProposalState;
  proposer: string;
  realm: string;
  daoName: string;
  
  // Timing
  createdAt: number;
  votingStartsAt: number;
  votingEndsAt: number;
  executedAt?: number;
  
  // Voting stats
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  totalVotingPower: number;
  quorum: number;
  threshold: number;
  
  // Details
  choices?: string[]; // For multi-choice proposals
  transactions?: ProposalTransaction[];
  discussionUrl?: string;
  metadata?: Record<string, any>;
}

export interface ProposalTransaction {
  instruction: string;
  accounts: string[];
  data: string;
  executed: boolean;
}

export interface ProposalOutcome {
  proposalId: string;
  state: ProposalState;
  finalYesVotes: number;
  finalNoVotes: number;
  finalAbstainVotes: number;
  totalParticipation: number;
  uniqueVoters: number;
  averageVotingPower: number;
  executionSuccess?: boolean;
  executionError?: string;
}

// ============================================================================
// DELEGATION
// ============================================================================

export interface Delegation {
  id: string;
  delegator: string;
  delegate: string;
  realm: string;
  votingPower: number;
  delegatedAt: number;
  revokedAt?: number;
  active: boolean;
}

export interface DelegationInfo {
  delegator: string;
  delegate: string;
  votingPower: number;
  startTime: number;
  endTime?: number;
}

export interface DelegateProfile {
  address: string;
  totalDelegatedPower: number;
  delegatorCount: number;
  proposalsVoted: number;
  votingAccuracy: number; // % of votes that aligned with outcome
  avgParticipationRate: number;
  delegators: string[];
  votingRecord: Vote[];
  reputationScore: number;
  rank: number;
  bio?: string;
  discord?: string;
  twitter?: string;
}

// ============================================================================
// DISCUSSIONS
// ============================================================================

export interface Discussion {
  id: string;
  proposalId: string;
  title: string;
  author: string;
  content: string;
  createdAt: number;
  replies: Reply[];
  reactions: Reaction[];
  summary?: DiscussionSummary;
  sentiment?: SentimentAnalysis;
}

export interface Reply {
  id: string;
  author: string;
  content: string;
  createdAt: number;
  parentId?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface DiscussionSummary {
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  consensusLevel: number; // 0-1
  actionItems: string[];
  controversialPoints: string[];
  generatedAt: number;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// ============================================================================
// DAO / REALM
// ============================================================================

export interface Realm {
  id: string;
  name: string;
  symbol: string;
  publicKey: string;
  programId: string;
  
  // Governance config
  minVotesToCreateProposal: number;
  minInstructionHoldUpTime: number;
  maxVotingTime: number;
  voteThresholdPercentage: number;
  proposalCount: number;
  
  // Treasury
  treasuryAddress?: string;
  treasuryValue?: number;
  tokenMint?: string;
  
  // Stats
  memberCount: number;
  totalProposals: number;
  activeProposals: number;
  
  metadata?: {
    description?: string;
    icon?: string;
    website?: string;
    discord?: string;
    twitter?: string;
    github?: string;
  };
}

export interface DAOMetrics {
  realmId: string;
  timestamp: number;
  
  // Participation
  totalUniqueVoters: number;
  avgParticipationRate: number;
  avgVotingPowerPerVote: number;
  
  // Activity
  proposalsLast30Days: number;
  votesLast30Days: number;
  discussionsLast30Days: number;
  
  // Governance health
  avgTimeToExecution: number;
  proposalSuccessRate: number;
  quorumAchievementRate: number;
  
  // Delegation
  totalDelegatedPower: number;
  delegationRate: number;
  topDelegates: string[];
}

// ============================================================================
// MEMORY STORAGE
// ============================================================================

export interface MemoryQuery {
  realm?: string;
  voter?: string;
  proposal?: string;
  delegate?: string;
  state?: ProposalState;
  category?: ProposalCategory;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'votingPower' | 'reputation';
  sortOrder?: 'asc' | 'desc';
}

export interface MemoryIndex {
  votes: Map<string, Vote>;
  proposals: Map<string, Proposal>;
  delegations: Map<string, Delegation>;
  discussions: Map<string, Discussion>;
  realms: Map<string, Realm>;
  voterProfiles: Map<string, VoterProfile>;
  delegateProfiles: Map<string, DelegateProfile>;
}

export interface SyncStatus {
  lastSyncTime: number;
  lastBlockHeight: number;
  syncedRealms: string[];
  pendingSync: string[];
  errors: SyncError[];
}

export interface SyncError {
  realm: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface VotingPattern {
  voter: string;
  pattern: 'consistent' | 'swing' | 'strategic' | 'passive';
  consistencyScore: number;
  alignmentWithMajority: number;
  voteTiming: 'early' | 'mid' | 'late';
  categoryPreferences: Record<ProposalCategory, number>;
}

export interface GovernanceInsight {
  type: 'participation' | 'decentralization' | 'efficiency' | 'engagement';
  title: string;
  description: string;
  metric: number;
  trend: 'up' | 'down' | 'stable';
  recommendation?: string;
}

export interface TrendAnalysis {
  timeframe: string;
  metrics: {
    participation: number[];
    proposalSuccess: number[];
    newMembers: number[];
    delegationActivity: number[];
  };
  predictions: {
    nextMonthParticipation: number;
    expectedProposals: number;
    quorumRisk: 'low' | 'medium' | 'high';
  };
}

// ============================================================================
// API CONFIGURATION
// ============================================================================

export interface RealmsConfig {
  endpoint: string;
  programId?: string;
  governanceProgram?: string;
}

export interface SnapshotConfig {
  apiUrl: string;
  hubName?: string;
}

export interface DAOMemoryConfig {
  realms?: RealmsConfig;
  snapshot?: SnapshotConfig;
  storagePath?: string;
  syncInterval?: number;
  cacheEnabled?: boolean;
  analyticsEnabled?: boolean;
}
