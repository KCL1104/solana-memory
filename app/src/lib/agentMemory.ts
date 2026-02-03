import { Address, Rpc, SolanaRpcApi } from '@solana/kit';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';

// IDL (would normally be imported from JSON)
const IDL: Idl = {
  version: "0.1.0",
  name: "agent_memory",
  // ... (full IDL here)
} as any;

export interface MemoryVault {
  owner: Address;
  agentKey: Address;
  encryptionPubkey: Uint8Array;
  createdAt: bigint;
  updatedAt: bigint;
  memoryCount: number;
  totalMemorySize: bigint;
}

export interface MemoryShard {
  vault: Address;
  key: string;
  contentHash: Uint8Array;
  contentSize: number;
  metadata: MemoryMetadata;
  createdAt: bigint;
  updatedAt: bigint;
  version: number;
}

export interface MemoryMetadata {
  memoryType: MemoryType;
  importance: number;
  tags: Uint8Array;
  ipfsCid: Uint8Array | null;
}

export type MemoryType = 
  | 'conversation' 
  | 'learning' 
  | 'preference' 
  | 'task' 
  | 'relationship' 
  | 'knowledge' 
  | 'system';

export interface AgentProfile {
  agentKey: Address;
  owner: Address;
  vault: Address;
  name: string;
  capabilities: string[];
  reputationScore: number;
  tasksCompleted: number;
  createdAt: bigint;
  updatedAt: bigint;
  isPublic: boolean;
}

export class AgentMemoryClient {
  private program: Program;
  
  constructor(provider: AnchorProvider, programId?: Address) {
    this.program = new Program(IDL, provider);
  }

  async initializeVault(
    owner: Address,
    agentKey: Address,
    encryptionPubkey: Uint8Array
  ): Promise<{ vault: Address; profile: Address }> {
    // Derive PDAs
    const [vaultPda] = this.findPda('vault', [owner, agentKey]);
    const [profilePda] = this.findPda('profile', [agentKey]);

    await this.program.methods
      .initializeVault(Array.from(encryptionPubkey))
      .accounts({
        owner,
        agentKey,
        vault: vaultPda,
        agentProfile: profilePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return { vault: vaultPda, profile: profilePda };
  }

  async storeMemory(
    owner: Address,
    vault: Address,
    key: string,
    contentHash: Uint8Array,
    contentSize: number,
    metadata: MemoryMetadata
  ): Promise<Address> {
    const [memoryPda] = this.findPda('memory', [vault, Buffer.from(key)]);

    await this.program.methods
      .storeMemory(
        key,
        Array.from(contentHash),
        contentSize,
        {
          memoryType: { [metadata.memoryType]: {} },
          importance: metadata.importance,
          tags: Array.from(metadata.tags),
          ipfsCid: metadata.ipfsCid ? Array.from(metadata.ipfsCid) : null,
        }
      )
      .accounts({
        owner,
        vault,
        memoryShard: memoryPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return memoryPda;
  }

  async getVault(vault: Address): Promise<MemoryVault> {
    return await this.program.account.memoryVault.fetch(vault);
  }

  async getMemoryShard(memory: Address): Promise<MemoryShard> {
    return await this.program.account.memoryShard.fetch(memory);
  }

  async getAgentProfile(profile: Address): Promise<AgentProfile> {
    return await this.program.account.agentProfile.fetch(profile);
  }

  private findPda(seeds: string, buffers: Buffer[]): [Address, number] {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(seeds), ...buffers],
      this.program.programId
    );
  }
}
