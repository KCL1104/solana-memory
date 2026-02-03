import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Commitment
} from '@solana/web3.js';

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
  isPublic: boolean;
}

// Program IDs (would be configured based on deployment)
export const AGENT_MEMORY_PROGRAM_ID = new PublicKey(
  'Memo111111111111111111111111111111111111111' // Placeholder - replace with actual program ID
);

export class AgentMemoryClient {
  private connection: Connection;
  private programId: PublicKey;
  private commitment: Commitment;

  constructor(
    connection: Connection, 
    programId?: PublicKey,
    commitment: Commitment = 'confirmed'
  ) {
    this.connection = connection;
    this.programId = programId || AGENT_MEMORY_PROGRAM_ID;
    this.commitment = commitment;
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
   * Initialize a new memory vault for an agent
   */
  async initializeVault(
    owner: PublicKey,
    agentKey: PublicKey,
    encryptionPubkey: Uint8Array
  ): Promise<{ vault: PublicKey; profile: PublicKey; transaction: Transaction }> {
    const [vaultPda] = this.findVaultPda(owner, agentKey);
    const [profilePda] = this.findProfilePda(agentKey);

    // Create transaction instruction
    // Note: This is a placeholder - actual instruction data would match your program
    const instruction = SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: vaultPda,
      lamports: await this.connection.getMinimumBalanceForRentExemption(1024),
      space: 1024,
      programId: this.programId,
    });

    const transaction = new Transaction().add(instruction);

    return { 
      vault: vaultPda, 
      profile: profilePda, 
      transaction 
    };
  }

  /**
   * Store a memory shard
   */
  async storeMemory(
    owner: PublicKey,
    vault: PublicKey,
    key: string,
    contentHash: Uint8Array,
    contentSize: number,
    metadata: MemoryMetadata
  ): Promise<{ memoryPda: PublicKey; transaction: Transaction }> {
    const [memoryPda] = this.findMemoryPda(vault, key);

    // Placeholder instruction
    const instruction = SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: memoryPda,
      lamports: await this.connection.getMinimumBalanceForRentExemption(512),
      space: 512,
      programId: this.programId,
    });

    const transaction = new Transaction().add(instruction);

    return { memoryPda, transaction };
  }

  /**
   * Retrieve a memory shard
   */
  async getMemoryShard(memoryPda: PublicKey): Promise<MemoryShard | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(memoryPda);
      if (!accountInfo) return null;
      
      // Parse account data (placeholder - actual parsing depends on program structure)
      return this.parseMemoryShard(accountInfo.data, memoryPda);
    } catch (error) {
      console.error('Error fetching memory shard:', error);
      return null;
    }
  }

  /**
   * Get vault information
   */
  async getVault(vaultPda: PublicKey): Promise<MemoryVault | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(vaultPda);
      if (!accountInfo) return null;
      
      return this.parseVault(accountInfo.data, vaultPda);
    } catch (error) {
      console.error('Error fetching vault:', error);
      return null;
    }
  }

  /**
   * Get agent profile
   */
  async getAgentProfile(profilePda: PublicKey): Promise<AgentProfile | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(profilePda);
      if (!accountInfo) return null;
      
      return this.parseProfile(accountInfo.data, profilePda);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * List all memories in a vault (requires indexing or event parsing)
   */
  async listMemories(vault: PublicKey): Promise<PublicKey[]> {
    // This would typically involve:
    // 1. Querying an indexer
    // 2. Parsing transaction history
    // 3. Using a subgraph
    // Placeholder implementation
    return [];
  }

  // Helper methods for parsing account data
  private parseMemoryShard(data: Buffer, address: PublicKey): MemoryShard {
    // Placeholder parsing - actual implementation depends on program structure
    return {
      vault: address, // Would be parsed from data
      key: '',
      contentHash: new Uint8Array(),
      contentSize: 0,
      metadata: {
        memoryType: 'conversation',
        importance: 50,
        tags: [],
      },
      createdAt: BigInt(0),
      updatedAt: BigInt(0),
      version: 1,
    };
  }

  private parseVault(data: Buffer, address: PublicKey): MemoryVault {
    // Placeholder parsing
    return {
      owner: address,
      agentKey: address,
      encryptionPubkey: new Uint8Array(),
      createdAt: BigInt(0),
      updatedAt: BigInt(0),
      memoryCount: 0,
      totalMemorySize: BigInt(0),
    };
  }

  private parseProfile(data: Buffer, address: PublicKey): AgentProfile {
    // Placeholder parsing
    return {
      agentKey: address,
      owner: address,
      vault: address,
      name: '',
      capabilities: [],
      reputationScore: 0,
      tasksCompleted: 0,
      createdAt: BigInt(0),
      updatedAt: BigInt(0),
      isPublic: false,
    };
  }
}

// Utility functions
export function generateEncryptionKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
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
