/**
 * ERC-8004 Identity-Memory Binding Tests
 * 
 * Tests for the identity binding functionality:
 * - Binding creation and verification
 * - Signature validation
 * - Revocation
 * - Cross-device recovery
 * - Revoked binding rejection
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  IdentityMemoryBinding, 
  SAIDClient,
  AgentMemory,
  Binding,
  createBindingSignature,
  verifyBindingSignature,
  deriveBindingPDA
} from '../src/identity';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

class MockSAIDClient implements SAIDClient {
  private keypair: nacl.SignKeyPair;
  private identityPubkey: string;

  constructor(existingKeypair?: nacl.SignKeyPair) {
    this.keypair = existingKeypair || nacl.sign.keyPair();
    this.identityPubkey = Buffer.from(this.keypair.publicKey).toString('base64');
  }

  async sign(message: string | Uint8Array): Promise<Uint8Array> {
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message)
      : message;
    return nacl.sign.detached(messageBytes, this.keypair.secretKey);
  }

  async getPublicKey(): Promise<string> {
    return this.identityPubkey;
  }

  async createIdentity(): Promise<{ pubkey: string; secretKey?: Uint8Array }> {
    const newKeypair = nacl.sign.keyPair();
    return {
      pubkey: Buffer.from(newKeypair.publicKey).toString('base64'),
      secretKey: newKeypair.secretKey
    };
  }

  getSecretKey(): Uint8Array {
    return this.keypair.secretKey;
  }
}

class MockAgentMemory implements AgentMemory {
  private memories: Map<string, { id: string; content: string; metadata: any }> = new Map();
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  async store(data: { content: string; importance: string; metadata?: Record<string, any> }): Promise<{ id: string }> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.memories.set(id, {
      id,
      content: data.content,
      metadata: {
        ...data.metadata,
        importance: data.importance,
        agentId: this.agentId,
        storedAt: Date.now()
      }
    });
    return { id };
  }

  async search(params: { agentId: string; query?: string }): Promise<Array<{ id: string; content: string }>> {
    const results: Array<{ id: string; content: string }> = [];
    for (const [id, memory] of this.memories) {
      if (memory.metadata.agentId === params.agentId) {
        results.push({ id: memory.id, content: memory.content });
      }
    }
    return results;
  }

  async get(id: string): Promise<{ id: string; content: string } | null> {
    const memory = this.memories.get(id);
    return memory ? { id: memory.id, content: memory.content } : null;
  }

  clear(): void {
    this.memories.clear();
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Identity-Memory Binding', () => {
  let saidClient: MockSAIDClient;
  let agentMemory: MockAgentMemory;
  let binding: IdentityMemoryBinding;
  let identityPubkey: string;

  beforeEach(async () => {
    saidClient = new MockSAIDClient();
    agentMemory = new MockAgentMemory('test-agent');
    binding = new IdentityMemoryBinding({
      saidClient,
      agentMemory
    });
    identityPubkey = await saidClient.getPublicKey();
  });

  // ============================================================================
  // BINDING CREATION
  // ============================================================================

  it('should bind identity to memory', async () => {
    const bindingId = await binding.bindIdentity(identityPubkey, 'test-agent');
    
    expect(bindingId).toBeDefined();
    expect(typeof bindingId).toBe('string');
    expect(bindingId).toContain(identityPubkey);
    expect(bindingId).toContain('test-agent');

    // Verify binding exists
    const bindingData = await binding.getBinding(identityPubkey, 'test-agent');
    expect(bindingData).not.toBeNull();
    expect(bindingData?.identity_pubkey).toBe(identityPubkey);
    expect(bindingData?.agent_id).toBe('test-agent');
    expect(bindingData?.revoked).toBe(false);
    expect(bindingData?.version).toBe(1);
  });

  it('should create unique binding IDs for different agents', async () => {
    const bindingId1 = await binding.bindIdentity(identityPubkey, 'agent-1');
    const bindingId2 = await binding.bindIdentity(identityPubkey, 'agent-2');
    
    expect(bindingId1).not.toBe(bindingId2);
  });

  it('should create different bindings for different identities', async () => {
    const client2 = new MockSAIDClient();
    const identity2Pubkey = await client2.getPublicKey();
    
    const bindingId1 = await binding.bindIdentity(identityPubkey, 'test-agent');
    
    const binding2 = new IdentityMemoryBinding({
      saidClient: client2,
      agentMemory: new MockAgentMemory('test-agent')
    });
    const bindingId2 = await binding2.bindIdentity(identity2Pubkey, 'test-agent');
    
    expect(bindingId1).not.toBe(bindingId2);
  });

  // ============================================================================
  // VERIFICATION
  // ============================================================================

  it('should verify valid binding', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    
    const isValid = await binding.verifyBinding(identityPubkey, 'test-agent');
    
    expect(isValid).toBe(true);
  });

  it('should verify multiple bindings independently', async () => {
    await binding.bindIdentity(identityPubkey, 'agent-1');
    await binding.bindIdentity(identityPubkey, 'agent-2');
    
    const isValid1 = await binding.verifyBinding(identityPubkey, 'agent-1');
    const isValid2 = await binding.verifyBinding(identityPubkey, 'agent-2');
    
    expect(isValid1).toBe(true);
    expect(isValid2).toBe(true);
  });

  it('should return false for non-existent binding', async () => {
    const isValid = await binding.verifyBinding(identityPubkey, 'non-existent');
    
    expect(isValid).toBe(false);
  });

  // ============================================================================
  // SIGNATURE VALIDATION
  // ============================================================================

  it('should reject invalid signature', async () => {
    // Create a binding
    await binding.bindIdentity(identityPubkey, 'test-agent');
    
    // Create a different client with different keys
    const maliciousClient = new MockSAIDClient();
    const maliciousBinding = new IdentityMemoryBinding({
      saidClient: maliciousClient,
      agentMemory: new MockAgentMemory('test-agent')
    });
    
    // Try to verify with wrong identity
    const maliciousPubkey = await maliciousClient.getPublicKey();
    const isValid = await maliciousBinding.verifyBinding(maliciousPubkey, 'test-agent');
    
    expect(isValid).toBe(false);
  });

  it('should verify signature manually', async () => {
    const agentId = 'test-agent';
    const message = `${identityPubkey}:${agentId}`;
    const signature = await saidClient.sign(message);
    
    const isValid = verifyBindingSignature(identityPubkey, agentId, signature);
    
    expect(isValid).toBe(true);
  });

  it('should reject tampered signature', async () => {
    const agentId = 'test-agent';
    const message = `${identityPubkey}:${agentId}`;
    const signature = await saidClient.sign(message);
    
    // Tamper with signature
    signature[0] = signature[0] ^ 0xFF;
    
    const isValid = verifyBindingSignature(identityPubkey, agentId, signature);
    
    expect(isValid).toBe(false);
  });

  it('should reject signature for wrong message', async () => {
    const agentId = 'test-agent';
    const wrongAgentId = 'wrong-agent';
    const message = `${identityPubkey}:${agentId}`;
    const signature = await saidClient.sign(message);
    
    // Try to verify with wrong agent ID
    const isValid = verifyBindingSignature(identityPubkey, wrongAgentId, signature);
    
    expect(isValid).toBe(false);
  });

  // ============================================================================
  // REVOCATION
  // ============================================================================

  it('should revoke binding', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    
    const revoked = await binding.revokeBinding(identityPubkey, 'test-agent');
    
    expect(revoked).toBe(true);
    
    // Verify binding is revoked
    const bindingData = await binding.getBinding(identityPubkey, 'test-agent');
    expect(bindingData?.revoked).toBe(true);
  });

  it('should reject revoked binding', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    await binding.revokeBinding(identityPubkey, 'test-agent');
    
    const isValid = await binding.verifyBinding(identityPubkey, 'test-agent');
    
    expect(isValid).toBe(false);
  });

  it('should throw error when revoking non-existent binding', async () => {
    await expect(
      binding.revokeBinding(identityPubkey, 'non-existent')
    ).rejects.toThrow('Binding not found');
  });

  it('should not allow unauthorized revocation', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    
    // Create a different client trying to revoke
    const attackerClient = new MockSAIDClient();
    const attackerBinding = new IdentityMemoryBinding({
      saidClient: attackerClient,
      agentMemory: new MockAgentMemory('test-agent')
    });
    
    await expect(
      attackerBinding.revokeBinding(identityPubkey, 'test-agent')
    ).rejects.toThrow('Cannot revoke: not the identity owner');
  });

  // ============================================================================
  // CROSS-DEVICE RECOVERY
  // ============================================================================

  it('should recover memories cross-device', async () => {
    // Bind identity
    await binding.bindIdentity(identityPubkey, 'test-agent');
    
    // Store some memories
    await agentMemory.store({ content: 'Memory 1', importance: 'high' });
    await agentMemory.store({ content: 'Memory 2', importance: 'medium' });
    await agentMemory.store({ content: 'Memory 3', importance: 'low' });
    
    // Recover memories
    const recoveredMemories = await binding.recoverMemories(identityPubkey);
    
    expect(recoveredMemories).toHaveLength(3);
    expect(recoveredMemories.every(id => typeof id === 'string')).toBe(true);
  });

  it('should recover memories from multiple agents', async () => {
    // Create multiple agents bound to same identity
    const agentMemory2 = new MockAgentMemory('agent-2');
    const agentMemory3 = new MockAgentMemory('agent-3');
    
    const binding2 = new IdentityMemoryBinding({
      saidClient,
      agentMemory: agentMemory2
    });
    const binding3 = new IdentityMemoryBinding({
      saidClient,
      agentMemory: agentMemory3
    });
    
    // Bind all agents
    await binding.bindIdentity(identityPubkey, 'test-agent');
    await binding2.bindIdentity(identityPubkey, 'agent-2');
    await binding3.bindIdentity(identityPubkey, 'agent-3');
    
    // Store memories in each agent
    await agentMemory.store({ content: 'Agent 1 memory', importance: 'high' });
    await agentMemory2.store({ content: 'Agent 2 memory', importance: 'medium' });
    await agentMemory3.store({ content: 'Agent 3 memory', importance: 'low' });
    
    // Recover all memories
    const recoveredMemories = await binding.recoverMemories(identityPubkey);
    
    expect(recoveredMemories).toHaveLength(3);
  });

  it('should not recover memories from revoked bindings', async () => {
    // Create two agents
    const agentMemory2 = new MockAgentMemory('agent-2');
    const binding2 = new IdentityMemoryBinding({
      saidClient,
      agentMemory: agentMemory2
    });
    
    // Bind both
    await binding.bindIdentity(identityPubkey, 'test-agent');
    await binding2.bindIdentity(identityPubkey, 'agent-2');
    
    // Store memories
    await agentMemory.store({ content: 'Active memory', importance: 'high' });
    await agentMemory2.store({ content: 'Revoked memory', importance: 'medium' });
    
    // Revoke second binding
    await binding2.revokeBinding(identityPubkey, 'agent-2');
    
    // Recover memories - should only get from active binding
    const recoveredMemories = await binding.recoverMemories(identityPubkey);
    
    expect(recoveredMemories).toHaveLength(1);
  });

  // ============================================================================
  // BINDING QUERIES
  // ============================================================================

  it('should get all bindings for an identity', async () => {
    // Create multiple bindings
    await binding.bindIdentity(identityPubkey, 'agent-1');
    await binding.bindIdentity(identityPubkey, 'agent-2');
    await binding.bindIdentity(identityPubkey, 'agent-3');
    
    const bindings = await binding.getBindingsByIdentity(identityPubkey);
    
    expect(bindings).toHaveLength(3);
    expect(bindings.map(b => b.agent_id).sort()).toEqual(['agent-1', 'agent-2', 'agent-3']);
  });

  it('should check if active binding exists', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    
    const hasActive = await binding.hasActiveBinding(identityPubkey, 'test-agent');
    const hasInactive = await binding.hasActiveBinding(identityPubkey, 'non-existent');
    
    expect(hasActive).toBe(true);
    expect(hasInactive).toBe(false);
  });

  it('should return false for revoked binding in hasActiveBinding', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    await binding.revokeBinding(identityPubkey, 'test-agent');
    
    const hasActive = await binding.hasActiveBinding(identityPubkey, 'test-agent');
    
    expect(hasActive).toBe(false);
  });

  // ============================================================================
  // SIGNATURE ROTATION
  // ============================================================================

  it('should rotate binding signature', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    const initialBinding = await binding.getBinding(identityPubkey, 'test-agent');
    
    // Rotate
    const rotatedBindingId = await binding.rotateBinding(identityPubkey, 'test-agent');
    const rotatedBinding = await binding.getBinding(identityPubkey, 'test-agent');
    
    expect(rotatedBindingId).toBeDefined();
    expect(rotatedBinding?.version).toBe(2);
    expect(rotatedBinding?.version).toBeGreaterThan(initialBinding?.version || 0);
    expect(rotatedBinding?.signature).not.toEqual(initialBinding?.signature);
  });

  it('should verify binding after rotation', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    await binding.rotateBinding(identityPubkey, 'test-agent');
    
    const isValid = await binding.verifyBinding(identityPubkey, 'test-agent');
    
    expect(isValid).toBe(true);
  });

  it('should throw error when rotating non-existent binding', async () => {
    await expect(
      binding.rotateBinding(identityPubkey, 'non-existent')
    ).rejects.toThrow('No existing binding found');
  });

  it('should throw error when rotating revoked binding', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    await binding.revokeBinding(identityPubkey, 'test-agent');
    
    await expect(
      binding.rotateBinding(identityPubkey, 'test-agent')
    ).rejects.toThrow('Cannot rotate revoked binding');
  });

  // ============================================================================
  // STANDALONE FUNCTIONS
  // ============================================================================

  it('should create binding signature with standalone function', () => {
    const secretKey = saidClient.getSecretKey();
    const agentId = 'test-agent';
    
    const signature = createBindingSignature(secretKey, identityPubkey, agentId);
    
    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64);
  });

  it('should derive binding PDA', () => {
    const programId = new PublicKey('11111111111111111111111111111111');
    const agentId = 'test-agent';
    
    const [pda, bump] = deriveBindingPDA(identityPubkey, agentId, programId);
    
    expect(pda).toBeInstanceOf(PublicKey);
    expect(typeof bump).toBe('number');
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThan(256);
  });

  it('should derive consistent PDA for same inputs', () => {
    const programId = new PublicKey('11111111111111111111111111111111');
    const agentId = 'test-agent';
    
    const [pda1, bump1] = deriveBindingPDA(identityPubkey, agentId, programId);
    const [pda2, bump2] = deriveBindingPDA(identityPubkey, agentId, programId);
    
    expect(pda1.equals(pda2)).toBe(true);
    expect(bump1).toBe(bump2);
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  it('should handle empty agent ID gracefully', async () => {
    // Should still create binding (validation happens at contract level)
    const bindingId = await binding.bindIdentity(identityPubkey, '');
    expect(bindingId).toBeDefined();
  });

  it('should handle special characters in agent ID', async () => {
    const specialAgentIds = [
      'agent-with-dashes',
      'agent_with_underscores',
      'agent.with.dots',
      'agent123',
      'AgentWithCaps'
    ];
    
    for (const agentId of specialAgentIds) {
      const bindingId = await binding.bindIdentity(identityPubkey, agentId);
      expect(bindingId).toBeDefined();
      
      const isValid = await binding.verifyBinding(identityPubkey, agentId);
      expect(isValid).toBe(true);
    }
  });

  it('should handle concurrent bindings', async () => {
    // Create multiple bindings concurrently
    const promises = [
      binding.bindIdentity(identityPubkey, 'agent-1'),
      binding.bindIdentity(identityPubkey, 'agent-2'),
      binding.bindIdentity(identityPubkey, 'agent-3')
    ];
    
    const bindingIds = await Promise.all(promises);
    
    expect(bindingIds).toHaveLength(3);
    expect(new Set(bindingIds).size).toBe(3); // All unique
  });

  it('should handle multiple revocations idempotently', async () => {
    await binding.bindIdentity(identityPubkey, 'test-agent');
    
    // First revocation should succeed
    const firstRevoke = await binding.revokeBinding(identityPubkey, 'test-agent');
    expect(firstRevoke).toBe(true);
    
    // Second revocation should fail since already revoked
    await expect(
      binding.revokeBinding(identityPubkey, 'test-agent')
    ).rejects.toThrow();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Identity-Memory Binding Integration', () => {
  it('should perform full lifecycle: create -> verify -> revoke -> verify', async () => {
    const saidClient = new MockSAIDClient();
    const agentMemory = new MockAgentMemory('lifecycle-agent');
    const binding = new IdentityMemoryBinding({ saidClient, agentMemory });
    const identityPubkey = await saidClient.getPublicKey();
    
    // Create
    const bindingId = await binding.bindIdentity(identityPubkey, 'lifecycle-agent');
    expect(bindingId).toBeDefined();
    
    // Verify active
    let isValid = await binding.verifyBinding(identityPubkey, 'lifecycle-agent');
    expect(isValid).toBe(true);
    
    // Store and recover memories
    await agentMemory.store({ content: 'Test memory', importance: 'high' });
    const memories = await binding.recoverMemories(identityPubkey);
    expect(memories.length).toBeGreaterThan(0);
    
    // Revoke
    await binding.revokeBinding(identityPubkey, 'lifecycle-agent');
    
    // Verify revoked
    isValid = await binding.verifyBinding(identityPubkey, 'lifecycle-agent');
    expect(isValid).toBe(false);
  });

  it('should handle cross-device recovery scenario', async () => {
    const saidClient = new MockSAIDClient();
    const identityPubkey = await saidClient.getPublicKey();
    
    // Device 1: Create binding and store memories
    const device1Memory = new MockAgentMemory('cross-device-agent');
    const device1Binding = new IdentityMemoryBinding({ 
      saidClient, 
      agentMemory: device1Memory 
    });
    await device1Binding.bindIdentity(identityPubkey, 'cross-device-agent');
    await device1Memory.store({ content: 'Device 1 memory', importance: 'high' });
    
    // Device 2: Recover memories using same identity
    const device2Memory = new MockAgentMemory('cross-device-agent');
    const device2Binding = new IdentityMemoryBinding({ 
      saidClient, 
      agentMemory: device2Memory 
    });
    await device2Binding.bindIdentity(identityPubkey, 'cross-device-agent');
    await device2Memory.store({ content: 'Device 2 memory', importance: 'medium' });
    
    // Recover from either device should see both
    const allMemories = await device1Binding.recoverMemories(identityPubkey);
    expect(allMemories.length).toBe(2);
  });
});
