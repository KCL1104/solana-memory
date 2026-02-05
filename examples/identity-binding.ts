/**
 * ERC-8004 Identity Binding Example
 * 
 * Demonstrates how to:
 * 1. Create a SAID Protocol identity
 * 2. Bind it to an AgentMemory agent
 * 3. Store memories with identity verification
 * 4. Verify the binding
 * 5. Recover memories across devices
 */

import { AgentMemory } from '../src/core/storage';
import { IdentityMemoryBinding, SAIDClient, Binding } from '../src/identity';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';

// ============================================================================
// MOCK SAID CLIENT
// ============================================================================

/**
 * Mock SAID Protocol client for demonstration
 * In production, use: import { SAIDClient } from '@said-protocol/client';
 */
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

// ============================================================================
// MOCK AGENT MEMORY
// ============================================================================

/**
 * Mock AgentMemory for demonstration
 * In production, use: import { AgentMemory } from 'agentmemory';
 */
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
    console.log(`  [AgentMemory] Stored memory: ${id}`);
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

  getAllMemories(): Array<{ id: string; content: string }> {
    return Array.from(this.memories.values()).map(m => ({ id: m.id, content: m.content }));
  }
}

// ============================================================================
// DEMO FUNCTIONS
// ============================================================================

/**
 * Run the complete identity binding demo
 */
async function demoIdentityBinding() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  ERC-8004 Identity Binding Demo                              ║');
  console.log('║  SAID Protocol + AgentMemory Integration                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Initialize clients
  console.log('📦 Initializing clients...');
  const saidClient = new MockSAIDClient();
  const agentMemory = new MockAgentMemory('my-agent');
  
  // Create binding service
  const binding = new IdentityMemoryBinding({
    saidClient,
    agentMemory
  });

  // ============================================================================
  // STEP 1: Create SAID Identity
  // ============================================================================
  console.log('\n🔑 STEP 1: Creating SAID Protocol Identity');
  console.log('─────────────────────────────────────────────');
  
  const identity = await saidClient.createIdentity();
  console.log(`✓ Identity created: ${identity.pubkey.slice(0, 30)}...`);

  // ============================================================================
  // STEP 2: Bind Identity to Memory
  // ============================================================================
  console.log('\n🔗 STEP 2: Binding Identity to AgentMemory');
  console.log('─────────────────────────────────────────────');
  
  const bindingId = await binding.bindIdentity(
    identity.pubkey,
    'my-agent'
  );
  console.log(`✓ Binding created: ${bindingId.slice(0, 40)}...`);

  // Get and display binding details
  const bindingData = await binding.getBinding(identity.pubkey, 'my-agent');
  if (bindingData) {
    console.log(`  Agent ID: ${bindingData.agent_id}`);
    console.log(`  Bound at: ${new Date(bindingData.bound_at).toISOString()}`);
    console.log(`  Version: ${bindingData.version}`);
    console.log(`  Revoked: ${bindingData.revoked}`);
  }

  // ============================================================================
  // STEP 3: Store Memories
  // ============================================================================
  console.log('\n💾 STEP 3: Storing Memories');
  console.log('─────────────────────────────────────────────');
  
  const memories = [
    { content: 'User prefers dark mode', importance: 'high' },
    { content: 'User works in Pacific Time Zone', importance: 'medium' },
    { content: 'User favorite color is blue', importance: 'low' },
    { content: 'User is a software engineer', importance: 'high' }
  ];

  for (const memory of memories) {
    await agentMemory.store(memory);
  }
  console.log(`✓ Stored ${memories.length} memories`);

  // ============================================================================
  // STEP 4: Verify Binding
  // ============================================================================
  console.log('\n✅ STEP 4: Verifying Binding');
  console.log('─────────────────────────────────────────────');
  
  const isValid = await binding.verifyBinding(identity.pubkey, 'my-agent');
  console.log(`✓ Binding valid: ${isValid}`);

  // Try invalid verification
  const invalidClient = new MockSAIDClient();
  const invalidPubkey = await invalidClient.getPublicKey();
  const isInvalidValid = await binding.verifyBinding(invalidPubkey, 'my-agent');
  console.log(`✓ Invalid binding rejected: ${!isInvalidValid}`);

  // ============================================================================
  // STEP 5: Cross-Device Recovery
  // ============================================================================
  console.log('\n🔄 STEP 5: Simulating Cross-Device Recovery');
  console.log('─────────────────────────────────────────────');
  
  // Simulate a new device by creating a new binding service
  // with the same identity but different memory instance
  const newDeviceMemory = new MockAgentMemory('my-agent');
  const recoveryBinding = new IdentityMemoryBinding({
    saidClient,
    agentMemory: newDeviceMemory
  });

  // Bind the same identity to the new device
  await recoveryBinding.bindIdentity(identity.pubkey, 'my-agent');
  console.log(`✓ Identity bound to new device`);

  // Recover memories
  const recoveredMemories = await binding.recoverMemories(identity.pubkey);
  console.log(`✓ Recovered ${recoveredMemories.length} memory references`);
  console.log('  Memory IDs:');
  recoveredMemories.forEach((id, i) => {
    console.log(`    ${i + 1}. ${id.slice(0, 40)}...`);
  });

  // ============================================================================
  // STEP 6: Binding Revocation
  // ============================================================================
  console.log('\n🚫 STEP 6: Revoking Binding');
  console.log('─────────────────────────────────────────────');
  
  // Revoke the binding
  await binding.revokeBinding(identity.pubkey, 'my-agent');
  console.log(`✓ Binding revoked`);

  // Verify it's revoked
  const isRevokedValid = await binding.verifyBinding(identity.pubkey, 'my-agent');
  console.log(`✓ Revoked binding invalid: ${!isRevokedValid}`);

  // ============================================================================
  // STEP 7: Multiple Agents per Identity
  // ============================================================================
  console.log('\n👥 STEP 7: Multiple Agents per Identity');
  console.log('─────────────────────────────────────────────');
  
  // Create additional agents
  const agent2Memory = new MockAgentMemory('agent-2');
  const agent3Memory = new MockAgentMemory('agent-3');

  // Bind same identity to multiple agents
  const binding2 = new IdentityMemoryBinding({ saidClient, agentMemory: agent2Memory });
  const binding3 = new IdentityMemoryBinding({ saidClient, agentMemory: agent3Memory });

  await binding2.bindIdentity(identity.pubkey, 'agent-2');
  await binding3.bindIdentity(identity.pubkey, 'agent-3');

  // Store memories in each agent
  await agent2Memory.store({ content: 'Agent 2 memory', importance: 'medium' });
  await agent3Memory.store({ content: 'Agent 3 memory', importance: 'medium' });

  // Get all bindings
  const allBindings = await binding.getBindingsByIdentity(identity.pubkey);
  console.log(`✓ Total bindings for identity: ${allBindings.length}`);
  
  for (const b of allBindings) {
    console.log(`  - Agent: ${b.agent_id} | Active: ${b.is_active !== false}`);
  }

  // Recover from all agents
  const allMemories = await binding.recoverMemories(identity.pubkey);
  console.log(`✓ Total memories across all agents: ${allMemories.length}`);

  // ============================================================================
  // STEP 8: Signature Rotation
  // ============================================================================
  console.log('\n🔄 STEP 8: Signature Rotation');
  console.log('─────────────────────────────────────────────');
  
  // Re-activate a revoked binding with a new signature
  const activeClient = new MockSAIDClient();
  const activeIdentity = await activeClient.createIdentity();
  
  const activeBinding = new IdentityMemoryBinding({ 
    saidClient: activeClient, 
    agentMemory: new MockAgentMemory('rotating-agent') 
  });
  
  // Create initial binding
  const initialBindingId = await activeBinding.bindIdentity(activeIdentity.pubkey, 'rotating-agent');
  console.log(`✓ Initial binding created (v1)`);
  
  // Rotate the signature
  const rotatedBindingId = await activeBinding.rotateBinding(activeIdentity.pubkey, 'rotating-agent');
  console.log(`✓ Binding signature rotated (v2)`);
  
  // Verify rotated binding still works
  const rotatedValid = await activeBinding.verifyBinding(activeIdentity.pubkey, 'rotating-agent');
  console.log(`✓ Rotated binding valid: ${rotatedValid}`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Demo Complete!                                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log('Summary:');
  console.log(`  • Created 1 SAID identity`);
  console.log(`  • Created ${allBindings.length} identity-memory bindings`);
  console.log(`  • Stored ${memories.length} + 2 memories`);
  console.log(`  • Recovered ${allMemories.length} memories cross-device`);
  console.log(`  • Demonstrated revocation and rotation`);
  console.log('\nERC-8004 Identity Binding is working as expected! ✅\n');
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

async function runWithErrorHandling() {
  try {
    await demoIdentityBinding();
  } catch (error) {
    console.error('\n❌ Demo failed with error:', error);
    process.exit(1);
  }
}

// Run the demo
runWithErrorHandling();
