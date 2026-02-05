/**
 * AgentMemory Identity Binding Demo
 * 
 * Demonstrates the key features of the Identity Binding module:
 * - Agent identity creation and management
 * - Memory signing with cryptographic signatures
 * - Cross-session identity verification
 * - Trust establishment through verification
 * 
 * Run with: npx ts-node demo/identity-binding-demo.ts
 */

import { Connection, clusterApiUrl } from '@solana/web3.js';
import { 
  IdentityBinding, 
  AgentIdentity, 
  SignedMemory,
  MemoryMetadata
} from '../src/identity';

// Demo configuration
const DEMO_CONFIG = {
  requireSignatures: true,
  signatureExpiryHours: 24,
  enableCrossSession: true,
  trustThreshold: 3
};

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(title: string, content: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${colors.bright}[${title}]${colors.reset} ${content}`);
}

function divider() {
  console.log('\n' + '='.repeat(70) + '\n');
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Demo: Basic Identity Creation and Memory Signing
 */
async function demoBasicIdentityAndSigning(binding: IdentityBinding) {
  log('DEMO 1', 'Basic Identity Creation & Memory Signing', 'cyan');
  console.log('Creating a new AI agent with cryptographic identity...\n');

  // Create agent identity
  const agent = binding.createIdentity('Demo AI Assistant');
  log('✓', `Created agent: ${agent.name}`, 'green');
  log('  ', `Agent ID: ${agent.id.substring(0, 40)}...`, 'yellow');
  log('  ', `Signing Key Version: ${agent.keyVersion}`, 'yellow');
  log('  ', `Created At: ${new Date(agent.createdAt).toISOString()}`, 'yellow');

  console.log('\n--- Signing Memories ---\n');

  // Sign some memories
  const memories = [
    {
      key: 'user-preferences',
      content: JSON.stringify({ theme: 'dark', language: 'en', notifications: true }),
      metadata: {
        memoryType: 'preference' as const,
        importance: 85,
        tags: [1, 2, 0, 0, 0, 0, 0, 0]
      }
    },
    {
      key: 'learned-fact-1',
      content: 'The user prefers concise responses and dislikes verbose explanations.',
      metadata: {
        memoryType: 'learning' as const,
        importance: 70,
        tags: [3, 4, 0, 0, 0, 0, 0, 0]
      }
    },
    {
      key: 'task-completion-1',
      content: JSON.stringify({ task: 'analyze-data', status: 'completed', result: 'success' }),
      metadata: {
        memoryType: 'task' as const,
        importance: 60,
        tags: [5, 0, 0, 0, 0, 0, 0, 0]
      }
    }
  ];

  const signedMemories: SignedMemory[] = [];

  for (const mem of memories) {
    const signed = binding.signMemory(agent.id, {
      ...mem,
      vault: 'demo-vault-001'
    });
    signedMemories.push(signed);

    log('✓', `Signed memory: ${mem.key}`, 'green');
    log('  ', `Content Hash: ${signed.contentHash.substring(0, 32)}...`, 'yellow');
    log('  ', `Signature: ${Buffer.from(signed.signature.signature).toString('base64').substring(0, 40)}...`, 'yellow');
    log('  ', `Timestamp: ${new Date(signed.signature.timestamp).toISOString()}`, 'yellow');
    console.log('');
  }

  return { agent, signedMemories };
}

/**
 * Demo: Memory Verification
 */
async function demoMemoryVerification(binding: IdentityBinding, signedMemories: SignedMemory[]) {
  log('DEMO 2', 'Memory Verification', 'cyan');
  console.log('Verifying signed memories to ensure integrity...\n');

  for (const memory of signedMemories) {
    const result = binding.verifyMemory(memory);

    if (result.valid) {
      log('✓', `Verified: ${memory.key}`, 'green');
      log('  ', `Signed by: ${result.agentId?.substring(0, 40)}...`, 'yellow');
      log('  ', `Signed at: ${new Date(result.signedAt!).toISOString()}`, 'yellow');
      log('  ', `Signature age: ${result.signatureAge}ms`, 'yellow');
    } else {
      log('✗', `Failed: ${memory.key} - ${result.error}`, 'red');
    }
    console.log('');
  }

  // Demonstrate tampering detection
  log('!', 'Testing tampering detection...', 'magenta');
  const tamperedMemory = { ...signedMemories[0] };
  tamperedMemory.contentHash = 'tampered123';

  const tamperResult = binding.verifyMemory(tamperedMemory);
  if (!tamperResult.valid) {
    log('✓', `Tampering detected: ${tamperResult.error}`, 'green');
  }
}

/**
 * Demo: Cross-Session Verification
 */
async function demoCrossSessionVerification(
  binding: IdentityBinding, 
  agent: AgentIdentity, 
  signedMemories: SignedMemory[]
) {
  divider();
  log('DEMO 3', 'Cross-Session Verification & Trust Establishment', 'cyan');
  console.log('Establishing trust through multiple verifications...\n');

  // Initialize a new session
  const session = binding.initCrossSession(agent.id);
  log('✓', `Initialized session: ${session.sessionId.substring(0, 40)}...`, 'green');
  log('  ', `Agent: ${session.agentIdentity.name}`, 'yellow');
  log('  ', `Trust Threshold: 3 verifications`, 'yellow');
  console.log('');

  // Verify memories in session
  console.log('--- Verifying Memories in Session ---\n');
  
  for (let i = 0; i < signedMemories.length; i++) {
    const memory = signedMemories[i];
    const result = binding.verifyInSession(session.sessionId, memory);

    await sleep(100); // Small delay for realism

    const sessionState = binding.getSessionState(session.sessionId);
    
    if (result.valid) {
      log('✓', `Verified #${i + 1}: ${memory.key}`, 'green');
      log('  ', `Session verified memories: ${sessionState?.verifiedMemories}`, 'yellow');
      log('  ', `Trust established: ${sessionState?.trustEstablished}`, 'yellow');
    } else {
      log('✗', `Failed: ${result.error}`, 'red');
    }
    console.log('');
  }

  // Check final trust status
  const finalTrust = binding.isTrustEstablished(session.sessionId);
  if (finalTrust) {
    log('🎉', 'TRUST ESTABLISHED! Agent identity verified.', 'green');
    log('  ', 'This agent can now be trusted in this session.', 'yellow');
  }
}

/**
 * Demo: Key Rotation
 */
async function demoKeyRotation(binding: IdentityBinding, agent: AgentIdentity) {
  divider();
  log('DEMO 4', 'Key Rotation', 'cyan');
  console.log('Rotating agent signing keys for security...\n');

  log('BEFORE', `Key Version: ${agent.keyVersion}`, 'yellow');
  
  const rotated = binding.rotateKeys(agent.id);
  
  log('AFTER', `Key Version: ${rotated.keyVersion}`, 'green');
  log('  ', `New Public Key: ${Buffer.from(rotated.signingPublicKey).toString('base64').substring(0, 40)}...`, 'yellow');

  // Sign new memory with rotated keys
  console.log('\n--- Signing with New Keys ---\n');
  
  const newMemory = binding.signMemory(agent.id, {
    key: 'post-rotation-memory',
    content: 'This memory was signed after key rotation',
    metadata: {
      memoryType: 'system' as const,
      importance: 90,
      tags: [9, 0, 0, 0, 0, 0, 0, 0]
    },
    vault: 'demo-vault-001'
  });

  log('✓', `Signed with key version: ${newMemory.signature.keyVersion}`, 'green');
  
  const verifyResult = binding.verifyMemory(newMemory);
  if (verifyResult.valid) {
    log('✓', 'New signature verified successfully', 'green');
  }
}

/**
 * Demo: Batch Operations
 */
async function demoBatchOperations(binding: IdentityBinding, agent: AgentIdentity) {
  divider();
  log('DEMO 5', 'Batch Operations', 'cyan');
  console.log('Processing multiple memories efficiently...\n');

  const batchMemories = Array.from({ length: 5 }, (_, i) => ({
    key: `batch-memory-${i + 1}`,
    content: `Batch content ${i + 1}`,
    metadata: {
      memoryType: 'knowledge' as const,
      importance: 50 + i * 10,
      tags: [i, 0, 0, 0, 0, 0, 0, 0]
    },
    vault: 'demo-vault-001'
  }));

  log('PROCESSING', `Signing ${batchMemories.length} memories...`, 'blue');
  const startTime = Date.now();
  
  const signed = binding.batchSignMemories(agent.id, batchMemories);
  
  const signTime = Date.now() - startTime;
  log('✓', `Signed ${signed.length} memories in ${signTime}ms`, 'green');

  console.log('\n--- Batch Verification ---\n');
  
  const verifyStart = Date.now();
  const results = binding.batchVerifyMemories(signed);
  const verifyTime = Date.now() - verifyStart;

  const validCount = results.filter(r => r.valid).length;
  log('✓', `Verified ${validCount}/${results.length} memories in ${verifyTime}ms`, 'green');
  log('  ', `Average: ${(verifyTime / results.length).toFixed(2)}ms per memory`, 'yellow');
}

/**
 * Demo: Serialization
 */
async function demoSerialization(binding: IdentityBinding, agent: AgentIdentity) {
  divider();
  log('DEMO 6', 'Serialization & Persistence', 'cyan');
  console.log('Preparing memories for storage...\n');

  const memory = binding.signMemory(agent.id, {
    key: 'persistable-memory',
    content: JSON.stringify({ data: 'Important data to persist' }),
    metadata: {
      memoryType: 'system' as const,
      importance: 95,
      tags: [1, 2, 3, 0, 0, 0, 0, 0],
      ipfsCid: 'QmExampleCID123'
    },
    vault: 'demo-vault-001'
  });

  log('SERIALIZING', 'Converting signed memory to JSON...', 'blue');
  const serialized = binding.serializeSignedMemory(memory);
  
  log('✓', `Serialized size: ${serialized.length} bytes`, 'green');
  log('  ', `Preview: ${serialized.substring(0, 100)}...`, 'yellow');

  console.log('\n--- Deserialization ---\n');
  
  const deserialized = binding.deserializeSignedMemory(serialized);
  log('✓', `Deserialized memory: ${deserialized.key}`, 'green');
  log('  ', `Signature preserved: ${deserialized.signature.signature.length === 64}`, 'yellow');

  // Verify after deserialization
  const verifyResult = binding.verifyMemory(deserialized);
  if (verifyResult.valid) {
    log('✓', 'Deserialized memory signature valid', 'green');
  }
}

/**
 * Demo: Identity Export/Backup
 */
async function demoIdentityExport(binding: IdentityBinding, agent: AgentIdentity) {
  divider();
  log('DEMO 7', 'Identity Export & Recovery', 'cyan');
  console.log('Backing up and recovering agent identity...\n');

  log('EXPORTING', `Agent: ${agent.name}`, 'blue');
  const exported = binding.exportIdentity(agent.id);

  if (exported) {
    log('✓', 'Identity exported successfully', 'green');
    log('  ', `Secret Key Length: ${exported.secretKey.length} chars (base64)`, 'yellow');

    console.log('\n--- Recovery Simulation ---\n');
    
    // Create new binding instance and import
    const newBinding = new IdentityBinding(
      new Connection(clusterApiUrl('devnet')),
      DEMO_CONFIG
    );

    const recovered = newBinding.importIdentity(
      'Recovered Agent',
      Buffer.from(exported.secretKey, 'base64')
    );

    log('✓', `Recovered agent: ${recovered.name}`, 'green');
    log('  ', `Same ID: ${recovered.id === agent.id}`, 'yellow');
    log('  ', `Same Public Key: ${Buffer.from(recovered.signingPublicKey).toString('base64') === Buffer.from(agent.signingPublicKey).toString('base64')}`, 'yellow');

    // Verify recovered identity can sign
    const testMemory = newBinding.signMemory(recovered.id, {
      key: 'recovery-test',
      content: 'Testing recovered identity',
      metadata: { memoryType: 'system', importance: 80, tags: [] },
      vault: 'recovered-vault'
    });

    const verifyResult = newBinding.verifyMemory(testMemory);
    if (verifyResult.valid) {
      log('✓', 'Recovered identity can sign and verify', 'green');
    }
  }
}

/**
 * Main Demo Runner
 */
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     🤖 AgentMemory Identity Binding Demo                           ║
║                                                                    ║
║     SAID Protocol-inspired identity binding for AI agents          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
  `);

  // Initialize connection and binding
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const binding = new IdentityBinding(connection, DEMO_CONFIG);

  log('INIT', 'Connected to Solana Devnet', 'blue');
  log('CONFIG', `Trust Threshold: ${DEMO_CONFIG.trustThreshold} verifications`, 'blue');
  log('CONFIG', `Signature Expiry: ${DEMO_CONFIG.signatureExpiryHours} hours`, 'blue');
  console.log('');

  try {
    // Run demos
    const { agent, signedMemories } = await demoBasicIdentityAndSigning(binding);
    await demoMemoryVerification(binding, signedMemories);
    await demoCrossSessionVerification(binding, agent, signedMemories);
    await demoKeyRotation(binding, agent);
    await demoBatchOperations(binding, agent);
    await demoSerialization(binding, agent);
    await demoIdentityExport(binding, agent);

    divider();
    log('✨', 'All demos completed successfully!', 'green');
    console.log(`
📚 Key Takeaways:
   • Agent identities are cryptographically secured with Ed25519 keys
   • Every memory is signed, ensuring integrity and authenticity
   • Cross-session verification establishes trust over time
   • Key rotation allows for security maintenance
   • Batch operations enable efficient processing
   • Full export/recovery support for identity portability

🔗 Next Steps:
   • Integrate with AgentMemory vault operations
   • Store signed memories on-chain
   • Implement agent-to-agent verification protocols
   • Explore ZK proofs for privacy-preserving verification
    `);

  } catch (error) {
    console.error(`${colors.red}Demo failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);
