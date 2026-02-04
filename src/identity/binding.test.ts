/**
 * Identity Binding Tests
 * Comprehensive test suite for the Identity Binding module
 */

import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { 
  IdentityBinding, 
  AgentIdentity, 
  SignedMemory, 
  MemoryMetadata,
  signMemoryContent,
  verifyMemoryContent,
  DEFAULT_CONFIG
} from './binding';

// Use devnet for testing
const TEST_CONNECTION = new Connection(clusterApiUrl('devnet'), 'confirmed');

describe('IdentityBinding', () => {
  let binding: IdentityBinding;

  beforeEach(() => {
    binding = new IdentityBinding(TEST_CONNECTION, DEFAULT_CONFIG);
  });

  // ============================================================================
  // IDENTITY CREATION TESTS
  // ============================================================================
  describe('Identity Creation', () => {
    it('should create a new agent identity', () => {
      const identity = binding.createIdentity('Test Agent');

      expect(identity).toBeDefined();
      expect(identity.name).toBe('Test Agent');
      expect(identity.id).toBeDefined();
      expect(identity.signingPublicKey).toBeInstanceOf(Uint8Array);
      expect(identity.signingPublicKey.length).toBe(32);
      expect(identity.keyVersion).toBe(1);
      expect(identity.createdAt).toBeGreaterThan(0);
    });

    it('should create multiple identities with unique IDs', () => {
      const identity1 = binding.createIdentity('Agent 1');
      const identity2 = binding.createIdentity('Agent 2');

      expect(identity1.id).not.toBe(identity2.id);
      expect(binding.getAllIdentities()).toHaveLength(2);
    });

    it('should retrieve identity by ID', () => {
      const identity = binding.createIdentity('Retrievable Agent');
      const retrieved = binding.getIdentity(identity.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(identity.id);
      expect(retrieved?.name).toBe('Retrievable Agent');
    });

    it('should return undefined for non-existent identity', () => {
      const retrieved = binding.getIdentity('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  // ============================================================================
  // IDENTITY IMPORT/EXPORT TESTS
  // ============================================================================
  describe('Identity Import/Export', () => {
    it('should export and re-import identity', () => {
      const identity = binding.createIdentity('Exportable Agent');
      const exported = binding.exportIdentity(identity.id);

      expect(exported).toBeDefined();
      expect(exported?.identity.id).toBe(identity.id);
      expect(exported?.secretKey).toBeDefined();

      // Create new binding and import
      const newBinding = new IdentityBinding(TEST_CONNECTION);
      const imported = newBinding.importIdentity(
        'Imported Agent',
        Buffer.from(exported!.secretKey, 'base64')
      );

      expect(imported.id).toBe(identity.id);
      expect(imported.signingPublicKey).toEqual(identity.signingPublicKey);
    });

    it('should return null when exporting non-existent identity', () => {
      const exported = binding.exportIdentity('non-existent');
      expect(exported).toBeNull();
    });
  });

  // ============================================================================
  // KEY ROTATION TESTS
  // ============================================================================
  describe('Key Rotation', () => {
    it('should rotate signing keys', () => {
      const identity = binding.createIdentity('Rotatable Agent');
      const oldPublicKey = new Uint8Array(identity.signingPublicKey);
      const oldVersion = identity.keyVersion;

      const rotated = binding.rotateKeys(identity.id);

      expect(rotated.keyVersion).toBe(oldVersion + 1);
      expect(rotated.signingPublicKey).not.toEqual(oldPublicKey);
    });

    it('should throw error when rotating non-existent identity', () => {
      expect(() => {
        binding.rotateKeys('non-existent');
      }).toThrow('Identity not found');
    });
  });

  // ============================================================================
  // MEMORY SIGNING TESTS
  // ============================================================================
  describe('Memory Signing', () => {
    let identity: AgentIdentity;
    const sampleMetadata: MemoryMetadata = {
      memoryType: 'knowledge',
      importance: 80,
      tags: [1, 2, 3, 0, 0, 0, 0, 0]
    };

    beforeEach(() => {
      identity = binding.createIdentity('Signing Agent');
    });

    it('should sign memory content', () => {
      const signedMemory = binding.signMemory(identity.id, {
        key: 'test-memory-1',
        content: 'Test memory content',
        metadata: sampleMetadata,
        vault: 'vault123'
      });

      expect(signedMemory).toBeDefined();
      expect(signedMemory.key).toBe('test-memory-1');
      expect(signedMemory.contentHash).toBeDefined();
      expect(signedMemory.contentHash.length).toBe(64); // SHA-256 hex
      expect(signedMemory.signature).toBeDefined();
      expect(signedMemory.signature.agentId).toBe(identity.id);
      expect(signedMemory.signature.signature).toBeInstanceOf(Uint8Array);
      expect(signedMemory.signature.signature.length).toBe(64); // Ed25519 signature
    });

    it('should sign binary content', () => {
      const binaryContent = new Uint8Array([1, 2, 3, 4, 5]);
      
      const signedMemory = binding.signMemory(identity.id, {
        key: 'binary-memory',
        content: binaryContent,
        metadata: sampleMetadata,
        vault: 'vault123'
      });

      expect(signedMemory.contentSize).toBe(5);
      expect(signedMemory.contentHash).toBeDefined();
    });

    it('should throw error when signing with non-existent identity', () => {
      expect(() => {
        binding.signMemory('non-existent', {
          key: 'test',
          content: 'content',
          metadata: sampleMetadata,
          vault: 'vault123'
        });
      }).toThrow('Identity not found');
    });

    it('should include correct metadata in signed memory', () => {
      const signedMemory = binding.signMemory(identity.id, {
        key: 'metadata-test',
        content: 'content',
        metadata: {
          memoryType: 'conversation',
          importance: 95,
          tags: [5, 6, 7, 8, 0, 0, 0, 0],
          ipfsCid: 'QmTest123'
        },
        vault: 'vault456'
      });

      expect(signedMemory.metadata.memoryType).toBe('conversation');
      expect(signedMemory.metadata.importance).toBe(95);
      expect(signedMemory.metadata.tags).toEqual([5, 6, 7, 8, 0, 0, 0, 0]);
      expect(signedMemory.metadata.ipfsCid).toBe('QmTest123');
    });

    it('should generate unique signatures for different content', () => {
      const signed1 = binding.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Content A',
        metadata: sampleMetadata,
        vault: 'vault123'
      });

      const signed2 = binding.signMemory(identity.id, {
        key: 'memory-2',
        content: 'Content B',
        metadata: sampleMetadata,
        vault: 'vault123'
      });

      expect(signed1.signature.signature).not.toEqual(signed2.signature.signature);
      expect(signed1.contentHash).not.toBe(signed2.contentHash);
    });
  });

  // ============================================================================
  // MEMORY VERIFICATION TESTS
  // ============================================================================
  describe('Memory Verification', () => {
    let identity: AgentIdentity;
    let signedMemory: SignedMemory;
    const sampleMetadata: MemoryMetadata = {
      memoryType: 'task',
      importance: 70,
      tags: [1, 0, 0, 0, 0, 0, 0, 0]
    };

    beforeEach(() => {
      identity = binding.createIdentity('Verification Agent');
      signedMemory = binding.signMemory(identity.id, {
        key: 'verify-test',
        content: 'Content to verify',
        metadata: sampleMetadata,
        vault: 'vault789'
      });
    });

    it('should verify valid signed memory', () => {
      const result = binding.verifyMemory(signedMemory);

      expect(result.valid).toBe(true);
      expect(result.agentId).toBe(identity.id);
      expect(result.signedAt).toBe(signedMemory.signature.timestamp);
      expect(result.error).toBeUndefined();
    });

    it('should fail verification with tampered content hash', () => {
      const tamperedMemory = {
        ...signedMemory,
        contentHash: 'tamperedhash123'
      };

      const result = binding.verifyMemory(tamperedMemory);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature');
    });

    it('should fail verification with tampered key', () => {
      const tamperedMemory = {
        ...signedMemory,
        key: 'tampered-key'
      };

      const result = binding.verifyMemory(tamperedMemory);
      expect(result.valid).toBe(false);
    });

    it('should fail verification with wrong public key', () => {
      const wrongIdentity = binding.createIdentity('Wrong Agent');
      const tamperedMemory = {
        ...signedMemory,
        signature: {
          ...signedMemory.signature,
          publicKey: wrongIdentity.signingPublicKey
        }
      };

      const result = binding.verifyMemory(tamperedMemory);
      expect(result.valid).toBe(false);
    });

    it('should include signature age in result', () => {
      const result = binding.verifyMemory(signedMemory);
      expect(result.signatureAge).toBeDefined();
      expect(result.signatureAge).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // SIGNATURE EXPIRY TESTS
  // ============================================================================
  describe('Signature Expiry', () => {
    let identity: AgentIdentity;
    let bindingWithExpiry: IdentityBinding;

    beforeEach(() => {
      bindingWithExpiry = new IdentityBinding(TEST_CONNECTION, {
        ...DEFAULT_CONFIG,
        signatureExpiryHours: 1 // 1 hour expiry
      });
      identity = bindingWithExpiry.createIdentity('Expiry Agent');
    });

    it('should accept valid non-expired signature', () => {
      const signedMemory = bindingWithExpiry.signMemory(identity.id, {
        key: 'fresh-memory',
        content: 'Fresh content',
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      const result = bindingWithExpiry.verifyMemory(signedMemory);
      expect(result.valid).toBe(true);
    });

    it('should reject expired signature', () => {
      const signedMemory = bindingWithExpiry.signMemory(identity.id, {
        key: 'old-memory',
        content: 'Old content',
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      // Manually set timestamp to past
      signedMemory.signature.timestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago

      const result = bindingWithExpiry.verifyMemory(signedMemory);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  // ============================================================================
  // CROSS-SESSION VERIFICATION TESTS
  // ============================================================================
  describe('Cross-Session Verification', () => {
    let identity: AgentIdentity;
    let sessionId: string;

    beforeEach(() => {
      identity = binding.createIdentity('Session Agent');
      const session = binding.initCrossSession(identity.id);
      sessionId = session.sessionId;
    });

    it('should initialize cross-session', () => {
      const session = binding.getSessionState(sessionId);
      
      expect(session).toBeDefined();
      expect(session?.agentIdentity.id).toBe(identity.id);
      expect(session?.verifiedMemories).toBe(0);
      expect(session?.trustEstablished).toBe(false);
    });

    it('should verify memory in session', () => {
      const signedMemory = binding.signMemory(identity.id, {
        key: 'session-memory',
        content: 'Session content',
        metadata: { memoryType: 'conversation', importance: 60, tags: [] },
        vault: 'vault123'
      });

      const result = binding.verifyInSession(sessionId, signedMemory);
      
      expect(result.valid).toBe(true);
      expect(result.agentId).toBe(identity.id);
    });

    it('should update verified memory count', () => {
      const signedMemory = binding.signMemory(identity.id, {
        key: 'count-memory',
        content: 'Count content',
        metadata: { memoryType: 'knowledge', importance: 70, tags: [] },
        vault: 'vault123'
      });

      binding.verifyInSession(sessionId, signedMemory);
      
      const session = binding.getSessionState(sessionId);
      expect(session?.verifiedMemories).toBe(1);
    });

    it('should establish trust after threshold', () => {
      // Sign and verify 3 memories (trustThreshold = 3)
      for (let i = 0; i < 3; i++) {
        const signedMemory = binding.signMemory(identity.id, {
          key: `trust-memory-${i}`,
          content: `Trust content ${i}`,
          metadata: { memoryType: 'knowledge', importance: 70, tags: [] },
          vault: 'vault123'
        });

        binding.verifyInSession(sessionId, signedMemory);
      }

      expect(binding.isTrustEstablished(sessionId)).toBe(true);
    });

    it('should reject verification with wrong agent', () => {
      const wrongIdentity = binding.createIdentity('Wrong Session Agent');
      const wrongSignedMemory = binding.signMemory(wrongIdentity.id, {
        key: 'wrong-memory',
        content: 'Wrong content',
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      const result = binding.verifyInSession(sessionId, wrongSignedMemory);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should return error for non-existent session', () => {
      const signedMemory = binding.signMemory(identity.id, {
        key: 'orphan-memory',
        content: 'Orphan content',
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      const result = binding.verifyInSession('non-existent-session', signedMemory);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Session not found');
    });
  });

  // ============================================================================
  // BATCH OPERATIONS TESTS
  // ============================================================================
  describe('Batch Operations', () => {
    let identity: AgentIdentity;

    beforeEach(() => {
      identity = binding.createIdentity('Batch Agent');
    });

    it('should batch sign memories', () => {
      const memories = [
        {
          key: 'batch-1',
          content: 'Content 1',
          metadata: { memoryType: 'knowledge', importance: 50, tags: [1] },
          vault: 'vault123'
        },
        {
          key: 'batch-2',
          content: 'Content 2',
          metadata: { memoryType: 'conversation', importance: 60, tags: [2] },
          vault: 'vault123'
        },
        {
          key: 'batch-3',
          content: 'Content 3',
          metadata: { memoryType: 'task', importance: 70, tags: [3] },
          vault: 'vault123'
        }
      ];

      const signed = binding.batchSignMemories(identity.id, memories);

      expect(signed).toHaveLength(3);
      signed.forEach((memory, i) => {
        expect(memory.key).toBe(`batch-${i + 1}`);
        expect(memory.signature.agentId).toBe(identity.id);
      });
    });

    it('should batch verify memories', () => {
      const memories = [
        {
          key: 'verify-1',
          content: 'Content 1',
          metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
          vault: 'vault123'
        },
        {
          key: 'verify-2',
          content: 'Content 2',
          metadata: { memoryType: 'knowledge', importance: 60, tags: [] },
          vault: 'vault123'
        }
      ];

      const signed = binding.batchSignMemories(identity.id, memories);
      const results = binding.batchVerifyMemories(signed);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.valid).toBe(true);
      });
    });
  });

  // ============================================================================
  // SERIALIZATION TESTS
  // ============================================================================
  describe('Serialization', () => {
    let identity: AgentIdentity;
    let signedMemory: SignedMemory;

    beforeEach(() => {
      identity = binding.createIdentity('Serialization Agent');
      signedMemory = binding.signMemory(identity.id, {
        key: 'serialize-test',
        content: 'Serialization content',
        metadata: { 
          memoryType: 'system', 
          importance: 90, 
          tags: [1, 2, 3],
          ipfsCid: 'QmTest'
        },
        vault: 'vault123'
      });
    });

    it('should serialize and deserialize signed memory', () => {
      const serialized = binding.serializeSignedMemory(signedMemory);
      expect(typeof serialized).toBe('string');

      const deserialized = binding.deserializeSignedMemory(serialized);
      
      expect(deserialized.key).toBe(signedMemory.key);
      expect(deserialized.contentHash).toBe(signedMemory.contentHash);
      expect(deserialized.signature.agentId).toBe(signedMemory.signature.agentId);
      expect(Buffer.from(deserialized.signature.signature).toString('base64'))
        .toBe(Buffer.from(signedMemory.signature.signature).toString('base64'));
    });

    it('should maintain signature validity after serialization', () => {
      const serialized = binding.serializeSignedMemory(signedMemory);
      const deserialized = binding.deserializeSignedMemory(serialized);

      const result = binding.verifyMemory(deserialized);
      expect(result.valid).toBe(true);
    });
  });

  // ============================================================================
  // STANDALONE FUNCTION TESTS
  // ============================================================================
  describe('Standalone Functions', () => {
    it('should sign and verify with standalone functions', () => {
      const keypair = binding.createIdentity('Standalone Agent');
      const exported = binding.exportIdentity(keypair.id);
      const secretKey = Buffer.from(exported!.secretKey, 'base64');
      
      const content = 'Standalone test content';
      
      // Sign
      const signResult = signMemoryContent(content, secretKey);
      expect(signResult.signature).toBeDefined();
      expect(signResult.hash).toBeDefined();
      expect(signResult.timestamp).toBeGreaterThan(0);

      // Verify
      const isValid = verifyMemoryContent(
        content,
        signResult.signature,
        keypair.signingPublicKey,
        signResult.timestamp
      );
      
      expect(isValid).toBe(true);
    });

    it('should reject tampered content with standalone functions', () => {
      const keypair = binding.createIdentity('Tamper Agent');
      const exported = binding.exportIdentity(keypair.id);
      const secretKey = Buffer.from(exported!.secretKey, 'base64');
      
      const content = 'Original content';
      const signResult = signMemoryContent(content, secretKey);

      // Verify with tampered content
      const isValid = verifyMemoryContent(
        'Tampered content',
        signResult.signature,
        keypair.signingPublicKey,
        signResult.timestamp
      );
      
      expect(isValid).toBe(false);
    });
  });

  // ============================================================================
  // CONFIGURATION TESTS
  // ============================================================================
  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultBinding = new IdentityBinding(TEST_CONNECTION);
      
      // Create identity and sign to verify defaults work
      const identity = defaultBinding.createIdentity('Default Config Agent');
      const signed = defaultBinding.signMemory(identity.id, {
        key: 'config-test',
        content: 'Config test content',
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      const result = defaultBinding.verifyMemory(signed);
      expect(result.valid).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customBinding = new IdentityBinding(TEST_CONNECTION, {
        requireSignatures: false,
        signatureExpiryHours: 24,
        enableCrossSession: false,
        trustThreshold: 5
      });

      const identity = customBinding.createIdentity('Custom Config Agent');
      expect(identity).toBeDefined();
    });
  });

  // ============================================================================
  // EDGE CASE TESTS
  // ============================================================================
  describe('Edge Cases', () => {
    let identity: AgentIdentity;

    beforeEach(() => {
      identity = binding.createIdentity('Edge Case Agent');
    });

    it('should handle empty content', () => {
      const signed = binding.signMemory(identity.id, {
        key: 'empty-content',
        content: '',
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      expect(signed.contentSize).toBe(0);
      
      const result = binding.verifyMemory(signed);
      expect(result.valid).toBe(true);
    });

    it('should handle very long content', () => {
      const longContent = 'a'.repeat(100000);
      
      const signed = binding.signMemory(identity.id, {
        key: 'long-content',
        content: longContent,
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      expect(signed.contentSize).toBe(100000);
      
      const result = binding.verifyMemory(signed);
      expect(result.valid).toBe(true);
    });

    it('should handle special characters in key', () => {
      const specialKey = 'key-with-special-chars-123_!@#$%';
      
      const signed = binding.signMemory(identity.id, {
        key: specialKey,
        content: 'Content',
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      expect(signed.key).toBe(specialKey);
      
      const result = binding.verifyMemory(signed);
      expect(result.valid).toBe(true);
    });

    it('should handle unicode content', () => {
      const unicodeContent = 'Hello 世界 🌍 Привет мир';
      
      const signed = binding.signMemory(identity.id, {
        key: 'unicode-content',
        content: unicodeContent,
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault123'
      });

      const result = binding.verifyMemory(signed);
      expect(result.valid).toBe(true);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================
  describe('Integration', () => {
    it('should complete full identity lifecycle', () => {
      // Create identity
      const identity = binding.createIdentity('Lifecycle Agent');
      
      // Sign some memories
      const memories = [];
      for (let i = 0; i < 5; i++) {
        const signed = binding.signMemory(identity.id, {
          key: `lifecycle-${i}`,
          content: `Content ${i}`,
          metadata: { memoryType: 'knowledge', importance: 50 + i, tags: [i] },
          vault: 'vault123'
        });
        memories.push(signed);
      }

      // Verify all memories
      memories.forEach(memory => {
        const result = binding.verifyMemory(memory);
        expect(result.valid).toBe(true);
      });

      // Init cross-session
      const session = binding.initCrossSession(identity.id);
      
      // Verify in session
      memories.forEach(memory => {
        binding.verifyInSession(session.sessionId, memory);
      });

      // Check trust established
      expect(binding.isTrustEstablished(session.sessionId)).toBe(true);

      // Rotate keys
      const rotated = binding.rotateKeys(identity.id);
      expect(rotated.keyVersion).toBe(2);

      // Sign new memory with rotated keys
      const newSigned = binding.signMemory(identity.id, {
        key: 'post-rotation',
        content: 'After rotation',
        metadata: { memoryType: 'knowledge', importance: 60, tags: [] },
        vault: 'vault123'
      });

      expect(newSigned.signature.keyVersion).toBe(2);
      
      const newResult = binding.verifyMemory(newSigned);
      expect(newResult.valid).toBe(true);
    });
  });
});
