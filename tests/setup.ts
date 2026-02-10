/**
 * AgentMemory Protocol - Test Setup
 * Global test configuration and utilities
 */

import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import { AgentMemoryClient } from '../src';

// Test configuration
export const TEST_CONFIG = {
  network: 'devnet' as const,
  rpcUrl: process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
  agentId: 'test-agent-' + Date.now(),
};

// Create test client
export function createTestClient(): AgentMemoryClient {
  const connection = new Connection(TEST_CONFIG.rpcUrl);
  return new AgentMemoryClient(connection);
}

// Generate test keypairs
export function generateTestKeypairs() {
  return {
    owner: Keypair.generate(),
    agentKey: Keypair.generate(),
    payer: Keypair.generate(),
  };
}

// Mock data generators
export function generateMockMemoryKey(): string {
  return `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMockContent(): string {
  return JSON.stringify({
    message: 'Test memory content',
    timestamp: Date.now(),
    metadata: { source: 'test' },
  });
}

export function generateMockMetadata() {
  return {
    memoryType: 'conversation' as const,
    importance: 50,
    tags: ['test', 'mock'],
  };
}

// Test utilities
export async function airdropSol(
  connection: Connection,
  pubkey: typeof Keypair.prototype.publicKey,
  amount: number = 1
): Promise<string> {
  const signature = await connection.requestAirdrop(
    pubkey,
    amount * 1e9 // Convert SOL to lamports
  );
  await connection.confirmTransaction(signature);
  return signature;
}

// Global beforeAll
beforeAll(async () => {
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
