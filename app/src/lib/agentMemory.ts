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

// Memory type definitions
export type MemoryType = 
  | 'conversation' 
  | 'learning' 
  | 'preference' 
  | 'task' 
  | 'relationship' 
  | 'knowledge' 
  | 'system';

export interface MemoryMetadata {
  memoryType: MemoryType;
  importance: number; // 0-100
  tags: string[];
  ipfsCid?: string;
}

export interface MemoryVault {
  owner: PublicKey;
  agentKey: PublicKey;
  encryptionPubkey: Uint8Array;
  createdAt: bigint;
  updatedAt: bigint;
  memoryCount: number;
  totalMemorySize: bigint;
  stakedAmount: bigint;
  rewardPoints: number;
  isActive: boolean;
  bump: number;
}

export interface VersionRecord {
  version: number;
  contentHash: Uint8Array;
  contentSize: number;
  metadata: MemoryMetadata;
  createdAt: bigint;
}

export interface MemoryShard {
  vault: PublicKey;
  key: string;
  contentHash: Uint8Array;
  contentSize: number;
  metadata: MemoryMetadata;
  createdAt: bigint;
  updatedAt: bigint;
  version: number;
  isDeleted: boolean;
  deletedAt?: bigint;
  versionHistory: VersionRecord[];
  bump: number;
}

export interface AgentProfile {
  agentKey: PublicKey;
  owner: PublicKey;
  vault: PublicKey;
  name: string;
  capabilities: string[];
  reputationScore: number;
  tasksCompleted: number;
  createdAt: bigint;
  updatedAt: bigint;
  lastTaskAt: bigint;
  isPublic: boolean;
  bump: number;
}

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

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
}

export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 1.5,
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

  /**
   * Retry wrapper for async operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.retryDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof SendTransactionError) {
          throw error; // Transaction errors shouldn't be retried
        }

        if (attempt < this.retryConfig.maxRetries) {
          console.warn(`${operationName} failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= this.retryConfig.backoffMultiplier;
        }
      }
    }

    throw lastError;
  }

  /**
   * Send and confirm transaction with status tracking
   */
  private async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: web3.Signer[],
    options?: ConfirmOptions
  ): Promise<TransactionResult> {
    return this.withRetry(async () => {
      try {
        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = signers[0].publicKey;

        // Sign transaction
        if (signers.length > 0) {
          transaction.sign(...signers);
        }

        // Send transaction
        const rawTransaction = transaction.serialize();
        const signature = await this.connection.sendRawTransaction(rawTransaction, {
          skipPreflight: false,
          preflightCommitment: this.commitment,
          maxRetries: 3,
        });

        this.notifyStatus(signature, 'sent');

        // Confirm transaction
        const confirmation = await this.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, this.commitment);

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        this.notifyStatus(signature, 'confirmed');

        return {
          signature,
          success: true,
          confirmationStatus: this.commitment,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          signature: '',
          success: false,
          error: errorMessage,
        };
      }
    }, 'sendAndConfirmTransaction');
  }

  /**
   * Initialize a new memory vault for an agent
   */
  async initializeVault(
    owner: PublicKey,
    agentKey: PublicKey,
    encryptionPubkey: Uint8Array,
    payer: web3.Signer
  ): Promise<{ vault: PublicKey; profile: PublicKey; result: TransactionResult }> {
    const [vaultPda] = this.findVaultPda(owner, agentKey);
    const [profilePda] = this.findProfilePda(agentKey);

    // Calculate rent exemption
    const vaultSpace = 256; // Adjust based on actual account size
    const profileSpace = 512;
    const vaultRent = await this.connection.getMinimumBalanceForRentExemption(vaultSpace);
    const profileRent = await this.connection.getMinimumBalanceForRentExemption(profileSpace);

    const transaction = new Transaction();

    // Create vault account instruction
    const createVaultIx = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: vaultPda,
      lamports: vaultRent,
      space: vaultSpace,
      programId: this.programId,
    });

    // Create profile account instruction
    const createProfileIx = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: profilePda,
      lamports: profileRent,
      space: profileSpace,
      programId: this.programId,
    });

    // Initialize vault instruction
    const initVaultIx = new TransactionInstruction({
      keys: [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: agentKey, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      ],
      programId: this.programId,
      data: Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.initializeVault,
        Buffer.from(encryptionPubkey),
      ]),
    });

    transaction.add(createVaultIx, createProfileIx, initVaultIx);

    const result = await this.sendAndConfirmTransaction(transaction, [payer]);

    return { vault: vaultPda, profile: profilePda, result };
  }

  /**
   * Create a memory shard (matches contract instruction name)
   */
  async createMemory(
    owner: PublicKey,
    vault: PublicKey,
    key: string,
    contentHash: Uint8Array,
    contentSize: number,
    metadata: MemoryMetadata,
    payer: web3.Signer
  ): Promise<{ memoryPda: PublicKey; result: TransactionResult }> {
    const [memoryPda] = this.findMemoryPda(vault, key);

    const memorySpace = 1024; // Adjust based on actual account size
    const memoryRent = await this.connection.getMinimumBalanceForRentExemption(memorySpace);

    const transaction = new Transaction();

    // Create memory account
    const createMemoryAccountIx = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: memoryPda,
      lamports: memoryRent,
      space: memorySpace,
      programId: this.programId,
    });

    // Serialize metadata
    const metadataBuffer = this.serializeMetadata(metadata);

    // Create memory instruction
    const createMemoryIx = new TransactionInstruction({
      keys: [
        { pubkey: memoryPda, isSigner: false, isWritable: true },
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.createMemory,
        Buffer.from(key),
        Buffer.from(contentHash),
        Buffer.from(new Uint32Array([contentSize]).buffer),
        metadataBuffer,
      ]),
    });

    transaction.add(createMemoryAccountIx, createMemoryIx);

    const result = await this.sendAndConfirmTransaction(transaction, [payer]);

    return { memoryPda, result };
  }

  /**
   * @deprecated Use createMemory instead
   */
  async storeMemory(
    owner: PublicKey,
    vault: PublicKey,
    key: string,
    contentHash: Uint8Array,
    contentSize: number,
    metadata: MemoryMetadata,
    payer: web3.Signer,
    _isEncrypted: boolean = true
  ): Promise<{ memoryPda: PublicKey; result: TransactionResult }> {
    // Delegate to createMemory for backwards compatibility
    return this.createMemory(owner, vault, key, contentHash, contentSize, metadata, payer);
  }

  /**
   * Delete a memory shard
   */
  async deleteMemory(
    owner: PublicKey,
    vault: PublicKey,
    key: string,
    payer: web3.Signer
  ): Promise<TransactionResult> {
    const [memoryPda] = this.findMemoryPda(vault, key);

    const transaction = new Transaction();

    const deleteMemoryIx = new TransactionInstruction({
      keys: [
        { pubkey: memoryPda, isSigner: false, isWritable: true },
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // Rent destination
      ],
      programId: this.programId,
      data: Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.deleteMemory,
        Buffer.from(key),
      ]),
    });

    transaction.add(deleteMemoryIx);

    return await this.sendAndConfirmTransaction(transaction, [payer]);
  }

  /**
   * Update agent profile
   */
  async updateProfile(
    agentKey: PublicKey,
    owner: PublicKey,
    profile: PublicKey,
    updates: {
      name?: string;
      capabilities?: string[];
      isPublic?: boolean;
    },
    payer: web3.Signer
  ): Promise<TransactionResult> {
    const transaction = new Transaction();

    // Build update data
    const nameBuffer = updates.name ? Buffer.from(updates.name) : Buffer.alloc(0);
    const capsBuffer = updates.capabilities 
      ? Buffer.from(updates.capabilities.join(',')) 
      : Buffer.alloc(0);

    const updateProfileIx = new TransactionInstruction({
      keys: [
        { pubkey: profile, isSigner: false, isWritable: true },
        { pubkey: agentKey, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: true, isWritable: false },
      ],
      programId: this.programId,
      data: Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.updateProfile,
        Buffer.from([updates.name ? 1 : 0]),
        Buffer.from(new Uint32Array([nameBuffer.length]).buffer),
        nameBuffer,
        Buffer.from([updates.capabilities ? 1 : 0]),
        Buffer.from(new Uint32Array([capsBuffer.length]).buffer),
        capsBuffer,
        Buffer.from([updates.isPublic !== undefined ? 1 : 0]),
        Buffer.from([updates.isPublic ? 1 : 0]),
      ]),
    });

    transaction.add(updateProfileIx);

    return await this.sendAndConfirmTransaction(transaction, [payer]);
  }

  /**
   * Update existing memory
   */
  async updateMemory(
    owner: PublicKey,
    vault: PublicKey,
    key: string,
    contentHash: Uint8Array,
    contentSize: number,
    metadata: MemoryMetadata,
    payer: web3.Signer
  ): Promise<{ memoryPda: PublicKey; result: TransactionResult }> {
    const [memoryPda] = this.findMemoryPda(vault, key);

    const transaction = new Transaction();

    // Serialize metadata
    const metadataBuffer = this.serializeMetadata(metadata);

    const updateMemoryIx = new TransactionInstruction({
      keys: [
        { pubkey: memoryPda, isSigner: false, isWritable: true },
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
      ],
      programId: this.programId,
      data: Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.updateMemory,
        Buffer.from(key),
        Buffer.from(contentHash),
        Buffer.from(new Uint32Array([contentSize]).buffer),
        metadataBuffer,
      ]),
    });

    transaction.add(updateMemoryIx);

    const result = await this.sendAndConfirmTransaction(transaction, [payer]);

    return { memoryPda, result };
  }

  /**
   * Retrieve a memory shard
   */
  async getMemoryShard(memoryPda: PublicKey): Promise<MemoryShard | null> {
    return this.withRetry(async () => {
      const accountInfo = await this.connection.getAccountInfo(memoryPda);
      if (!accountInfo) return null;
      
      return this.parseMemoryShard(accountInfo.data, memoryPda);
    }, 'getMemoryShard');
  }

  /**
   * Get vault information
   */
  async getVault(vaultPda: PublicKey): Promise<MemoryVault | null> {
    return this.withRetry(async () => {
      const accountInfo = await this.connection.getAccountInfo(vaultPda);
      if (!accountInfo) return null;
      
      return this.parseVault(accountInfo.data, vaultPda);
    }, 'getVault');
  }

  /**
   * Get agent profile
   */
  async getAgentProfile(profilePda: PublicKey): Promise<AgentProfile | null> {
    return this.withRetry(async () => {
      const accountInfo = await this.connection.getAccountInfo(profilePda);
      if (!accountInfo) return null;
      
      return this.parseProfile(accountInfo.data, profilePda);
    }, 'getAgentProfile');
  }

  /**
   * Check if vault exists
   */
  async vaultExists(owner: PublicKey, agentKey: PublicKey): Promise<boolean> {
    const [vaultPda] = this.findVaultPda(owner, agentKey);
    const accountInfo = await this.connection.getAccountInfo(vaultPda);
    return accountInfo !== null;
  }

  /**
   * List all memories in a vault by querying program accounts
   */
  async listMemories(vault: PublicKey): Promise<PublicKey[]> {
    return this.withRetry(async () => {
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0, // Discriminator offset
              bytes: vault.toBase58(),
            },
          },
        ],
      });

      return accounts.map(acc => acc.pubkey);
    }, 'listMemories');
  }

  /**
   * Get multiple memory shards in batch
   */
  async getMultipleMemoryShards(memoryPdas: PublicKey[]): Promise<(MemoryShard | null)[]> {
    return this.withRetry(async () => {
      const accounts = await this.connection.getMultipleAccountsInfo(memoryPdas);
      return accounts.map((acc, idx) => 
        acc ? this.parseMemoryShard(acc.data, memoryPdas[idx]) : null
      );
    }, 'getMultipleMemoryShards');
  }

  // Helper methods for parsing account data
  private parseMemoryShard(data: Buffer, address: PublicKey): MemoryShard {
    try {
      // Skip discriminator (8 bytes)
      let offset = 8;
      
      // Parse vault pubkey (32 bytes)
      const vault = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      // Parse key length and key
      const keyLength = data.readUInt32LE(offset);
      offset += 4;
      const key = data.slice(offset, offset + keyLength).toString('utf-8');
      offset += keyLength;

      // Parse content hash (32 bytes for SHA-256)
      const contentHash = new Uint8Array(data.slice(offset, offset + 32));
      offset += 32;

      // Parse content size
      const contentSize = data.readUInt32LE(offset);
      offset += 4;

      // Parse isEncrypted flag
      const isEncrypted = data[offset] === 1;
      offset += 1;

      // Parse metadata
      const memoryTypeIndex = data[offset];
      const memoryTypes: MemoryType[] = ['conversation', 'learning', 'preference', 'task', 'relationship', 'knowledge', 'system'];
      const memoryType = memoryTypes[memoryTypeIndex] || 'conversation';
      offset += 1;

      const importance = data[offset];
      offset += 1;

      // Parse tags
      const tagsLength = data.readUInt32LE(offset);
      offset += 4;
      const tagsStr = data.slice(offset, offset + tagsLength).toString('utf-8');
      const tags = tagsStr ? tagsStr.split(',') : [];
      offset += tagsLength;

      // Parse timestamps
      const createdAt = BigInt(data.readBigUInt64LE(offset));
      offset += 8;
      const updatedAt = BigInt(data.readBigUInt64LE(offset));
      offset += 8;

      // Parse version
      const version = data.readUInt32LE(offset);
      offset += 4;

      // Parse isDeleted
      const isDeleted = data[offset] === 1;
      offset += 1;

      // Parse deletedAt (optional)
      const hasDeletedAt = data[offset] === 1;
      offset += 1;
      let deletedAt: bigint | undefined;
      if (hasDeletedAt) {
        deletedAt = BigInt(data.readBigUInt64LE(offset));
        offset += 8;
      }

      // Parse version history length
      const historyLength = data.readUInt32LE(offset);
      offset += 4;

      // Parse version history
      const versionHistory: VersionRecord[] = [];
      for (let i = 0; i < historyLength; i++) {
        const recordVersion = data.readUInt32LE(offset);
        offset += 4;
        const recordHash = new Uint8Array(data.slice(offset, offset + 32));
        offset += 32;
        const recordSize = data.readUInt32LE(offset);
        offset += 4;
        const recordTypeIndex = data[offset];
        offset += 1;
        const recordImportance = data[offset];
        offset += 1;
        const recordCreatedAt = BigInt(data.readBigUInt64LE(offset));
        offset += 8;

        versionHistory.push({
          version: recordVersion,
          contentHash: recordHash,
          contentSize: recordSize,
          metadata: {
            memoryType: memoryTypes[recordTypeIndex] || 'conversation',
            importance: recordImportance,
            tags: [], // Simplified - tags not stored per version
          },
          createdAt: recordCreatedAt,
        });
      }

      // Parse bump
      const bump = data[offset];

      return {
        vault,
        key,
        contentHash,
        contentSize,
        metadata: {
          memoryType,
          importance,
          tags,
        },
        createdAt,
        updatedAt,
        version,
        isDeleted,
        deletedAt,
        versionHistory,
        bump,
      };
    } catch (error) {
      console.error('Error parsing memory shard:', error);
      throw new Error('Failed to parse memory shard data');
    }
  }

  private parseVault(data: Buffer, address: PublicKey): MemoryVault {
    try {
      let offset = 8; // Skip discriminator

      const owner = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const agentKey = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const encryptionPubkey = new Uint8Array(data.slice(offset, offset + 32));
      offset += 32;

      const createdAt = BigInt(data.readBigUInt64LE(offset));
      offset += 8;

      const updatedAt = BigInt(data.readBigUInt64LE(offset));
      offset += 8;

      const memoryCount = data.readUInt32LE(offset);
      offset += 4;

      const totalMemorySize = BigInt(data.readBigUInt64LE(offset));
      offset += 8;

      const stakedAmount = BigInt(data.readBigUInt64LE(offset));
      offset += 8;

      const rewardPoints = data.readUInt32LE(offset);
      offset += 4;

      const isActive = data[offset] === 1;
      offset += 1;

      const bump = data[offset];

      return {
        owner,
        agentKey,
        encryptionPubkey,
        createdAt,
        updatedAt,
        memoryCount,
        totalMemorySize,
        stakedAmount,
        rewardPoints,
        isActive,
        bump,
      };
    } catch (error) {
      console.error('Error parsing vault:', error);
      throw new Error('Failed to parse vault data');
    }
  }

  private parseProfile(data: Buffer, address: PublicKey): AgentProfile {
    try {
      let offset = 8; // Skip discriminator

      const agentKey = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const owner = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const vault = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const nameLength = data.readUInt32LE(offset);
      offset += 4;
      const name = data.slice(offset, offset + nameLength).toString('utf-8');
      offset += nameLength;

      const capsLength = data.readUInt32LE(offset);
      offset += 4;
      const capsStr = data.slice(offset, offset + capsLength).toString('utf-8');
      const capabilities = capsStr ? capsStr.split(',') : [];
      offset += capsLength;

      const reputationScore = data.readUInt32LE(offset);
      offset += 4;

      const tasksCompleted = data.readUInt32LE(offset);
      offset += 4;

      const createdAt = BigInt(data.readBigUInt64LE(offset));
      offset += 8;

      const updatedAt = BigInt(data.readBigUInt64LE(offset));
      offset += 8;

      const lastTaskAt = BigInt(data.readBigUInt64LE(offset));
      offset += 8;

      const isPublic = data[offset] === 1;
      offset += 1;

      const bump = data[offset];

      return {
        agentKey,
        owner,
        vault,
        name,
        capabilities,
        reputationScore,
        tasksCompleted,
        createdAt,
        updatedAt,
        lastTaskAt,
        isPublic,
        bump,
      };
    } catch (error) {
      console.error('Error parsing profile:', error);
      throw new Error('Failed to parse profile data');
    }
  }
}

// Utility functions
export function generateEncryptionKey(): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(32));
  }
  // Fallback for Node.js environment
  const { randomBytes } = require('crypto');
  return new Uint8Array(randomBytes(32));
}

export async function hashContent(content: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

export function formatPublicKey(key: PublicKey): string {
  const base58 = key.toBase58();
  return `${base58.slice(0, 6)}...${base58.slice(-4)}`;
}

export function formatTimestamp(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('en-US');
}

export function calculateStorageCost(bytes: number): number {
  // Approximate cost in SOL (devnet rates)
  const lamportsPerByte = 0.000000001; // 1 lamport = 0.000000001 SOL
  const rentExemptionMultiplier = 2;
  return bytes * lamportsPerByte * rentExemptionMultiplier;
}
