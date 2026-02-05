/**
 * Zero-Knowledge Memory Proofs - Prototype Implementation
 * 
 * Uses Merkle trees for membership proofs.
 * Note: This is a "lightweight ZK" - hides content but not membership.
 * For full ZK (hiding membership too), integrate with snarkjs or similar.
 */

import { ethers } from 'ethers';
import type { Hash, Memory, Proof, MerkleTree, ZKMemoryProof } from './concept';

// Simple SHA256 hash using ethers
function hash(data: string): Hash {
  return ethers.utils.sha256(ethers.utils.toUtf8Bytes(data));
}

// Combine two hashes (standard Merkle tree pairing)
function combineHashes(left: Hash, right: Hash): Hash {
  // Sort to ensure deterministic ordering
  const [a, b] = left < right ? [left, right] : [right, left];
  return hash(a.slice(2) + b.slice(2)); // Remove 0x prefix
}

/**
 * Simple Merkle Tree Implementation
 */
export class SimpleMerkleTree implements MerkleTree {
  root: Hash;
  leaves: Hash[];
  private layers: Hash[][];

  constructor(data: string[]) {
    this.leaves = data.map(d => hash(d));
    this.layers = this.buildLayers(this.leaves);
    this.root = this.layers[this.layers.length - 1][0];
  }

  private buildLayers(leaves: Hash[]): Hash[][] {
    const layers: Hash[][] = [leaves];
    
    while (layers[layers.length - 1].length > 1) {
      const current = layers[layers.length - 1];
      const next: Hash[] = [];
      
      for (let i = 0; i < current.length; i += 2) {
        const left = current[i];
        const right = current[i + 1] || left; // Duplicate last if odd
        next.push(combineHashes(left, right));
      }
      
      layers.push(next);
    }
    
    return layers;
  }

  getProof(leafIndex: number): Proof {
    const path: Hash[] = [];
    const indices: number[] = [];
    let index = leafIndex;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;
      
      // If sibling exists, add to path
      if (siblingIndex < layer.length) {
        path.push(layer[siblingIndex]);
        indices.push(isRight ? 0 : 1); // 0 = sibling on left
      } else {
        // Odd leaf, sibling is itself (duplicated)
        path.push(layer[index]);
        indices.push(0);
      }
      
      index = Math.floor(index / 2);
    }

    return {
      root: this.root,
      leaf: this.leaves[leafIndex],
      path,
      indices
    };
  }

  verifyProof(proof: Proof): boolean {
    let current = proof.leaf;
    
    for (let i = 0; i < proof.path.length; i++) {
      const sibling = proof.path[i];
      current = proof.indices[i] === 0
        ? combineHashes(sibling, current)
        : combineHashes(current, sibling);
    }
    
    return current === proof.root;
  }
}

/**
 * ZK Memory Proof Implementation
 * 
 * This implementation provides:
 * 1. Merkle tree commitment to memory set
 * 2. Membership proofs that don't reveal content
 * 3. Nullifiers to prevent proof replay
 */
export class ZKMemoryProofImpl implements ZKMemoryProof {
  private trees: Map<Hash, SimpleMerkleTree> = new Map();
  private nullifiers: Set<Hash> = new Set();

  /**
   * Create a commitment to a set of memories
   */
  commitMemorySet(memories: Memory[]): Hash {
    // Hash each memory
    const hashes = memories.map(m => this.hashMemory(m));
    
    // Build tree
    const tree = new SimpleMerkleTree(hashes);
    
    // Store tree
    this.trees.set(tree.root, tree);
    
    return tree.root;
  }

  /**
   * Generate a proof of membership
   * 
   * Note: In a full ZK system, this would use snarkjs to generate
   * a SNARK proof that proves knowledge of memory without revealing it.
   * Here we use a Merkle proof which reveals the hash but not content.
   */
  async proveMembership(
    memoryRoot: Hash,
    memoryHash: Hash,
    witness: Memory
  ): Promise<Proof> {
    const tree = this.trees.get(memoryRoot);
    if (!tree) {
      throw new Error('Unknown memory root');
    }

    // Verify witness matches hash
    const computedHash = this.hashMemory(witness);
    if (computedHash !== memoryHash) {
      throw new Error('Witness does not match hash');
    }

    // Find leaf index
    const leafIndex = tree.leaves.indexOf(memoryHash);
    if (leafIndex === -1) {
      throw new Error('Memory not in set');
    }

    return tree.getProof(leafIndex);
  }

  /**
   * Verify a membership proof
   */
  async verifyMembership(proof: Proof, memoryRoot: Hash): Promise<boolean> {
    // Check root matches
    if (proof.root !== memoryRoot) {
      return false;
    }

    // Verify the proof
    const tree = this.trees.get(memoryRoot);
    if (!tree) {
      // For external verification, we'd use on-chain verifier
      return this.verifyProofExternally(proof);
    }

    return tree.verifyProof(proof);
  }

  /**
   * Generate a nullifier to prevent double-spending
   */
  generateNullifier(memoryHash: Hash, secret: Hash): Hash {
    const nullifier = hash(memoryHash + secret);
    this.nullifiers.add(nullifier);
    return nullifier;
  }

  /**
   * Check if a nullifier has been used
   */
  isNullifierUsed(nullifier: Hash): boolean {
    return this.nullifiers.has(nullifier);
  }

  private hashMemory(memory: Memory): Hash {
    const data = JSON.stringify({
      id: memory.id,
      content: memory.content,
      timestamp: memory.timestamp,
      importance: memory.importance
    });
    return hash(data);
  }

  private verifyProofExternally(proof: Proof): boolean {
    let current = proof.leaf;
    
    for (let i = 0; i < proof.path.length; i++) {
      const sibling = proof.path[i];
      current = proof.indices[i] === 0
        ? combineHashes(sibling, current)
        : combineHashes(current, sibling);
    }
    
    return current === proof.root;
  }
}

/**
 * Demo / Test
 */
async function main() {
  console.log('=== ZK Memory Proofs Prototype ===\n');

  // Create some memories
  const memories: Memory[] = [
    { id: 'mem-1', content: 'User prefers dark mode', timestamp: 1704067200, importance: 0.8 },
    { id: 'mem-2', content: 'Meeting with team scheduled for Tuesday', timestamp: 1704153600, importance: 0.9 },
    { id: 'mem-3', content: 'Project deadline is end of month', timestamp: 1704240000, importance: 0.7 },
    { id: 'mem-4', content: 'User is allergic to peanuts', timestamp: 1704326400, importance: 1.0 },
    { id: 'mem-5', content: 'Favorite color is blue', timestamp: 1704412800, importance: 0.3 },
  ];

  const zk = new ZKMemoryProofImpl();

  // Step 1: Commit to memory set
  console.log('1. Committing memory set...');
  const root = zk.commitMemorySet(memories);
  console.log(`   Root hash: ${root.slice(0, 30)}...\n`);

  // Step 2: Generate proof for a specific memory
  console.log('2. Generating membership proof...');
  const targetMemory = memories[1]; // "Meeting with team..."
  const memoryHash = hash(JSON.stringify({
    id: targetMemory.id,
    content: targetMemory.content,
    timestamp: targetMemory.timestamp,
    importance: targetMemory.importance
  }));
  
  const proof = await zk.proveMembership(root, memoryHash, targetMemory);
  console.log(`   Proving memory: "${targetMemory.content.slice(0, 30)}..."`);
  console.log(`   Proof path length: ${proof.path.length}`);
  console.log(`   Proof size: ~${JSON.stringify(proof).length} bytes\n`);

  // Step 3: Verify proof
  console.log('3. Verifying proof...');
  const isValid = await zk.verifyMembership(proof, root);
  console.log(`   Valid: ${isValid}\n`);

  // Step 4: Generate nullifier
  console.log('4. Generating nullifier...');
  const secret = hash('user-secret-123');
  const nullifier = zk.generateNullifier(memoryHash, secret);
  console.log(`   Nullifier: ${nullifier.slice(0, 30)}...`);
  console.log(`   Used: ${zk.isNullifierUsed(nullifier)}\n`);

  // Step 5: Verify wrong proof fails
  console.log('5. Testing invalid proof...');
  const wrongProof: Proof = {
    ...proof,
    leaf: hash('fake-memory')
  };
  const isInvalid = await zk.verifyMembership(wrongProof, root);
  console.log(`   Invalid proof rejected: ${!isInvalid}\n`);

  console.log('=== Demo Complete ===');
  
  return {
    root,
    proof,
    nullifier,
    isValid,
    isInvalid: !isInvalid
  };
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(result => {
      console.log('\nResults:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

export { main, SimpleMerkleTree, ZKMemoryProofImpl };
