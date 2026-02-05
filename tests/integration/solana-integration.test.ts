import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { MemoryStorage } from '../../src/core/storage';

describe('Solana Integration', () => {
  let connection: Connection;
  const TEST_TIMEOUT = 30000;

  beforeAll(() => {
    const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
    connection = new Connection(rpcUrl);
  });

  describe('Connection', () => {
    it('should connect to devnet', async () => {
      const version = await connection.getVersion();
      expect(version).toBeDefined();
      expect(version['solana-core']).toBeDefined();
    }, TEST_TIMEOUT);

    it('should get recent blockhash', async () => {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      expect(blockhash).toBeDefined();
      expect(blockhash.length).toBeGreaterThan(0);
      expect(lastValidBlockHeight).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should get slot information', async () => {
      const slot = await connection.getSlot();
      expect(slot).toBeGreaterThan(0);
      
      const blockTime = await connection.getBlockTime(slot);
      expect(blockTime).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('Account Operations', () => {
    it('should get account info for system program', async () => {
      const systemProgram = new PublicKey('11111111111111111111111111111111');
      const accountInfo = await connection.getAccountInfo(systemProgram);
      
      // System program should exist
      expect(accountInfo).toBeDefined();
    }, TEST_TIMEOUT);

    it('should handle non-existent accounts gracefully', async () => {
      const randomKey = new PublicKey(Buffer.alloc(32, 0));
      const accountInfo = await connection.getAccountInfo(randomKey);
      
      expect(accountInfo).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('Transaction Simulation', () => {
    it('should get fee calculator', async () => {
      const { blockhash } = await connection.getLatestBlockhash();
      const feeCalculator = await connection.getFeeCalculatorForBlockhash(blockhash);
      
      expect(feeCalculator.value).toBeDefined();
    }, TEST_TIMEOUT);

    it('should estimate transaction fees', async () => {
      const feeCalculator = await connection.getFeeCalculatorForBlockhash(
        (await connection.getLatestBlockhash()).blockhash
      );
      
      if (feeCalculator.value) {
        const lamportsPerSignature = feeCalculator.value.lamportsPerSignature;
        expect(lamportsPerSignature).toBeGreaterThanOrEqual(0);
      }
    }, TEST_TIMEOUT);
  });

  describe('Program Integration', () => {
    it('should be ready for program deployment', () => {
      // This test verifies the integration structure is in place
      expect(connection).toBeDefined();
      expect(connection.rpcEndpoint).toBeDefined();
    });

    it('should support program account lookup', async () => {
      // Using a known devnet program (Token Program)
      const tokenProgram = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const accountInfo = await connection.getAccountInfo(tokenProgram);
      
      expect(accountInfo).toBeDefined();
      expect(accountInfo?.executable).toBe(true);
    }, TEST_TIMEOUT);
  });
});
