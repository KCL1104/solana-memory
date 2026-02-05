// Global test setup
import { MemoryStorage } from '../src/core/storage';
import { IdentityBinding } from '../src/identity/binding';
import { Connection, clusterApiUrl } from '@solana/web3.js';

// Devnet configuration for tests
export const TEST_CONFIG = {
  network: 'devnet' as const,
  agentId: 'test-agent-' + Date.now(),
  rpcUrl: process.env.SOLANA_RPC_URL || clusterApiUrl('devnet')
};

// Test utilities
export async function cleanupTestData(storage: MemoryStorage) {
  storage.clear();
}

export function createTestStorage(): MemoryStorage {
  return new MemoryStorage();
}

export function createTestIdentityBinding(): IdentityBinding {
  const connection = new Connection(TEST_CONFIG.rpcUrl);
  return new IdentityBinding(connection, {
    requireSignatures: true,
    signatureExpiryHours: 0,
    enableCrossSession: true,
    trustThreshold: 3
  });
}

// Mock data generators
export function generateMockVote(overrides: Partial<any> = {}) {
  return {
    id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    proposalId: `proposal-${Math.random().toString(36).substr(2, 9)}`,
    voter: `voter-${Math.random().toString(36).substr(2, 9)}`,
    choice: 'yes' as const,
    votingPower: 100,
    timestamp: Date.now(),
    ...overrides
  };
}

export function generateMockProposal(overrides: Partial<any> = {}) {
  return {
    id: `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Proposal',
    description: 'Test proposal description',
    category: 'treasury' as const,
    state: 'voting' as const,
    proposer: `proposer-${Math.random().toString(36).substr(2, 9)}`,
    realm: `realm-${Math.random().toString(36).substr(2, 9)}`,
    daoName: 'Test DAO',
    createdAt: Date.now(),
    votingStartsAt: Date.now(),
    votingEndsAt: Date.now() + 86400000,
    votesYes: 100,
    votesNo: 50,
    votesAbstain: 10,
    totalVotingPower: 160,
    quorum: 100,
    threshold: 50,
    ...overrides
  };
}

export function generateMockDelegation(overrides: Partial<any> = {}) {
  return {
    id: `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    delegator: `delegator-${Math.random().toString(36).substr(2, 9)}`,
    delegate: `delegate-${Math.random().toString(36).substr(2, 9)}`,
    realm: `realm-${Math.random().toString(36).substr(2, 9)}`,
    votingPower: 100,
    delegatedAt: Date.now(),
    active: true,
    ...overrides
  };
}

// Global beforeAll
beforeAll(async () => {
  // Check devnet connection
  if (process.env.CI !== 'true') {
    try {
      const connection = new Connection(TEST_CONFIG.rpcUrl);
      await connection.getVersion();
      console.log('✓ Devnet connection established');
    } catch (error) {
      console.warn('⚠ Devnet connection failed, some tests may be skipped');
    }
  }
});

// Global afterAll
afterAll(async () => {
  // Global cleanup if needed
});

// Extend jest matchers if needed
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMemory(): R;
    }
  }
}
