/**
 * Zero-Knowledge Memory Proofs - Core Types
 * 
 * This module defines the interfaces for proving memory existence
 * without revealing content.
 */

// Core types
export type Hash = string;
export type MemoryId = string;
export type Proof = {
  root: Hash;
  leaf: Hash;
  path: Hash[];
  indices: number[]; // 0 = left, 1 = right
};

// Memory representation
export interface Memory {
  id: MemoryId;
  content: string;
  timestamp: number;
  importance: number;
}

// ZK Proof interface
export interface ZKMemoryProof {
  /**
   * Generate a proof that memory exists in the set
   * @param memoryRoot - Root hash of the memory set
   * @param memoryHash - Hash of the specific memory
   * @param witness - Private data: the actual memory content
   */
  proveMembership(
    memoryRoot: Hash,
    memoryHash: Hash,
    witness: Memory
  ): Promise<Proof>;
  
  /**
   * Verify a proof without accessing memory content
   * @param proof - The membership proof
   * @param memoryRoot - Expected root hash
   */
  verifyMembership(
    proof: Proof,
    memoryRoot: Hash
  ): Promise<boolean>;
  
  /**
   * Generate a nullifier to prevent double-spending of proofs
   * @param memoryHash - Hash of the memory
   * @param secret - User's secret
   */
  generateNullifier(memoryHash: Hash, secret: Hash): Hash;
}

// Merkle tree interface
export interface MerkleTree {
  root: Hash;
  leaves: Hash[];
  getProof(leafIndex: number): Proof;
  verifyProof(proof: Proof): boolean;
}

// Advanced: Full ZK interface (for SNARK/STARK integration)
export interface FullZKProof extends ZKMemoryProof {
  /**
   * Prove memory exists AND satisfies hidden criteria
   * Example: prove I have >5 memories from 2024 without revealing which
   */
  provePrivateCriteria(
    memoryRoot: Hash,
    criteria: PrivateCriteria,
    witness: Memory[]
  ): Promise<PrivateProof>;
  
  /**
   * Verify private criteria proof
   */
  verifyPrivateCriteria(
    proof: PrivateProof,
    memoryRoot: Hash,
    publicCriteria: PublicCriteria
  ): Promise<boolean>;
}

export interface PrivateCriteria {
  minCount?: number;
  timeRange?: { start: number; end: number };
  minImportance?: number;
}

export interface PublicCriteria {
  minCount?: number;
  timeRange?: { start: number; end: number };
  minImportance?: number;
}

export interface PrivateProof {
  proof: Uint8Array;
  publicSignals: string[];
}

// Commitment scheme for hiding memory hashes
export interface CommitmentScheme {
  commit(value: string, nonce: string): Hash;
  verify(commitment: Hash, value: string, nonce: string): boolean;
}
