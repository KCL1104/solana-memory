/**
 * AgentMemory Protocol - Main Client
 * SDK for interacting with the AgentMemory Solana program
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Commitment,
  SendTransactionError,
  ConfirmOptions
} from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import {
  MemoryType,
  MemoryMetadata,
  MemoryVault,
  MemoryShard,
  AgentProfile,
  VersionRecord,
  TransactionResult,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
} from './types';

// Program ID (Devnet deployment)
export const AGENT_MEMORY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'Memo111111111111111111111111111111111111111'
);

// Instruction discriminators (8 bytes each) - should match Anchor IDL
const INSTRUCTION_DISCRIMINATORS = {
  initializeVault: Buffer.from([0x1a, 0x8b, 0x4c, 0x7d, 0x9e, 0x2f, 0x5a, 0x3c]),
  createMemory: Buffer.from([0x2b, 0x9c, 0x5d, 0x8e, 0x1f, 0x6a, 0x4b, 0x7d]),
  deleteMemory: Buffer.from([0x3c, 0xad, 0x6e, 0x9f, 0x2a, 0x7b, 0x5c, 0x8e]),
  updateProfile: Buffer.from([0x4d, 0xbe, 0x7f, 0x1a, 0x3b, 0x8c, 0x6d, 0x9f]),
  updateMemory: Buffer.from([0x5e, 0xcf, 0x8a, 0x2b, 0x4c, 0x9d, 0x7e, 0x1a]),
};

export class AgentMemoryClient {
  private connection: Connection;
  private programId: PublicKey;
  private commitment: Commitment;
  private retryConfig: RetryConfig;
  private transactionCallbacks: Map<string, (status: string) => void>;

  constructor(
    connection: Connection, 
    programId?: PublicKey,
    commitment: Commitment = 'confirmed',
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.connection = connection;
    this.programId = programId || AGENT_MEMORY_PROGRAM_ID;
    this.commitment = commitment;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.transactionCallbacks = new Map();
  }

  // Transaction status callback
  onTransactionStatus(signature: string, callback: (status: string) => void) {
    this.transactionCallbacks.set(signature, callback);
  }

  private notifyStatus(signature: string, status: string) {
    const callback = this.transactionCallbacks.get(signature);
    if (callback) {
      callback(status);
    }
  }

  /**
   * Derive Program Derived Address (PDA) for vault
   */
  findVaultPda(owner: PublicKey, agentKey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.toBuffer(), agentKey.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive PDA for agent profile
   */
  findProfilePda(agentKey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('profile'), agentKey.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive PDA for memory shard
   */
  findMemoryPda(vault: PublicKey, key: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('memory'), vault.toBuffer(), Buffer.from(key)],
      this.programId
    );
  }

  /**
   * Serialize metadata for on-chain storage
   */
  private serializeMetadata(metadata: MemoryMetadata): Buffer {
    const memoryTypeMap: Record<MemoryType, number> = {
      conversation: 0,
      learning: 1,
      preference: 2,
      task: 3,
      relationship: 4,
      knowledge: 5,
      system: 6,
    };

    const tagsBuffer = Buffer.from(metadata.tags.join(','));
    const ipfsBuffer = metadata.ipfsCid ? Buffer.from(metadata.ipfsCid) : Buffer.alloc(0);

    return Buffer.concat([
      Buffer.from([memoryTypeMap[metadata.memoryType]]),
      Buffer.from([metadata.importance]),
      Buffer.from(new Uint32Array([tagsBuffer.length]).buffer),
      tagsBuffer,
      Buffer.from(new Uint32Array([ipfsBuffer.length]).buffer),
      ipfsBuffer,
    ]);
  }

  // ============================================================================
  // VAULT OPERATIONS
  // ============================================================================

  /**
   * Initialize a new memory vault
   */
  async initializeVault(
    owner: PublicKey,
    agentKey: PublicKey,
    encryptionPubkey: Uint8Array,
    payer: PublicKey
  ): Promise<TransactionResult> {
    try {
      const [vaultPda, vaultBump] = this.findVaultPda(owner, agentKey);
      const [profilePda] = this.findProfilePda(agentKey);

      // Build instruction data
      const data = Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.initializeVault,
        Buffer.from(encryptionPubkey),
      ]);

      // Create instruction
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: profilePda, isSigner: false, isWritable: true },
          { pubkey: payer, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: this.programId,
        data,
      });

      return this.sendTransactionWithRetry([instruction], payer);
    } catch (error) {
      return {
        signature: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error initializing vault',
      };
    }
  }

  // ============================================================================
  // MEMORY OPERATIONS
  // ============================================================================

  /**
   * Create a new memory shard
   */
  async createMemory(
    vault: PublicKey,
    key: string,
    contentHash: Uint8Array,
    contentSize: number,
    metadata: MemoryMetadata,
    owner: PublicKey,
    isEncrypted: boolean = true
  ): Promise<TransactionResult> {
    try {
      const [memoryPda] = this.findMemoryPda(vault, key);
      const serializedMetadata = this.serializeMetadata(metadata);

      // Build instruction data
      const data = Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.createMemory,
        Buffer.from(key),
        Buffer.from(contentHash),
        Buffer.from(new Uint32Array([contentSize]).buffer),
        Buffer.from([isEncrypted ? 1 : 0]),
        serializedMetadata,
      ]);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: vault, isSigner: false, isWritable: true },
          { pubkey: memoryPda, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: this.programId,
        data,
      });

      return this.sendTransactionWithRetry([instruction], owner);
    } catch (error) {
      return {
        signature: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating memory',
      };
    }
  }

  // ============================================================================
  // TRANSACTION HELPERS
  // ============================================================================

  private async sendTransactionWithRetry(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    signers?: web3.Keypair[]
  ): Promise<TransactionResult> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < this.retryConfig.maxRetries) {
      try {
        const transaction = new Transaction();
        transaction.add(...instructions);
        
        const { blockhash } = await this.connection.getLatestBlockhash(this.commitment);
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = payer;

        if (signers) {
          transaction.sign(...signers);
        }

        const signature = await this.connection.sendTransaction(transaction, signers || [], {
          skipPreflight: false,
        });

        this.notifyStatus(signature, 'sent');

        // Wait for confirmation
        await this.connection.confirmTransaction(signature, this.commitment);
        this.notifyStatus(signature, 'confirmed');

        return {
          signature,
          success: true,
          confirmationStatus: this.commitment,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retries++;
        
        if (retries < this.retryConfig.maxRetries) {
          const delay = this.retryConfig.retryDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retries - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      signature: '',
      success: false,
      error: lastError?.message || 'Transaction failed after retries',
    };
  }
}
