import * as nacl from 'tweetnacl';
import { createHash, randomBytes } from 'crypto';
import { IdentityBinding } from '../../src/identity/binding';
import { Connection, clusterApiUrl } from '@solana/web3.js';

describe('ChaCha20-Poly1305 Encryption', () => {
  let identityBinding: IdentityBinding;

  beforeEach(() => {
    const connection = new Connection(clusterApiUrl('devnet'));
    identityBinding = new IdentityBinding(connection, {
      requireSignatures: true,
      enableCrossSession: true,
      trustThreshold: 3
    });
  });

  describe('Key Generation', () => {
    it('should generate Ed25519 keypair for identity', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      expect(identity.signingPublicKey).toBeDefined();
      expect(identity.signingPublicKey.length).toBe(32);
      expect(identity.id).toBeDefined();
      expect(identity.keyVersion).toBe(1);
    });

    it('should generate unique keys for different identities', () => {
      const identity1 = identityBinding.createIdentity('agent-1');
      const identity2 = identityBinding.createIdentity('agent-2');
      
      expect(identity1.id).not.toBe(identity2.id);
      expect(Buffer.from(identity1.signingPublicKey).toString('hex'))
        .not.toBe(Buffer.from(identity2.signingPublicKey).toString('hex'));
    });

    it('should import identity from existing secret key', () => {
      const keypair = nacl.sign.keyPair();
      const identity = identityBinding.importIdentity('imported-agent', keypair.secretKey);
      
      expect(identity.signingPublicKey).toEqual(keypair.publicKey);
      expect(identity.name).toBe('imported-agent');
    });
  });

  describe('Memory Signing', () => {
    it('should sign memory content', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-key',
        content: 'Test memory content',
        metadata: {
          memoryType: 'knowledge',
          importance: 80,
          tags: [1, 2, 3]
        },
        vault: 'vault-123'
      });
      
      expect(signedMemory.signature).toBeDefined();
      expect(signedMemory.signature.signature.length).toBe(64); // Ed25519 signature length
      expect(signedMemory.contentHash).toBeDefined();
      expect(signedMemory.contentHash.length).toBe(64); // SHA-256 hex length
    });

    it('should sign binary content', () => {
      const identity = identityBinding.createIdentity('test-agent');
      const binaryContent = randomBytes(1024);
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'binary-memory',
        content: binaryContent,
        metadata: {
          memoryType: 'system',
          importance: 100,
          tags: []
        },
        vault: 'vault-123'
      });
      
      expect(signedMemory.contentSize).toBe(1024);
      expect(signedMemory.contentHash).toBe(createHash('sha256').update(binaryContent).digest('hex'));
    });

    it('should create consistent content hash for same content', () => {
      const identity = identityBinding.createIdentity('test-agent');
      const content = 'Consistent content';
      
      const signed1 = identityBinding.signMemory(identity.id, {
        key: 'memory-1',
        content,
        metadata: { memoryType: 'knowledge', importance: 50, tags: [] },
        vault: 'vault-1'
      });
      
      const signed2 = identityBinding.signMemory(identity.id, {
        key: 'memory-2',
        content,
        metadata: { memoryType: 'learning', importance: 60, tags: [1] },
        vault: 'vault-2'
      });
      
      // Same content should produce same hash regardless of other fields
      expect(signed1.contentHash).toBe(signed2.contentHash);
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signature', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-key',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      const result = identityBinding.verifyMemory(signedMemory);
      expect(result.valid).toBe(true);
      expect(result.agentId).toBe(identity.id);
    });

    it('should reject tampered content hash', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-key',
        content: 'Original content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      // Tamper with content hash
      signedMemory.contentHash = createHash('sha256').update('Different content').digest('hex');
      
      const result = identityBinding.verifyMemory(signedMemory);
      expect(result.valid).toBe(false);
    });

    it('should reject tampered metadata', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-key',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      // Tamper with metadata
      signedMemory.metadata.importance = 100;
      
      const result = identityBinding.verifyMemory(signedMemory);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid signature', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-key',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      // Corrupt signature
      signedMemory.signature.signature[0] ^= 0xFF;
      
      const result = identityBinding.verifyMemory(signedMemory);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature');
    });
  });

  describe('Key Rotation', () => {
    it('should rotate signing keys', () => {
      const identity = identityBinding.createIdentity('test-agent');
      const oldPublicKey = Buffer.from(identity.signingPublicKey);
      const oldKeyVersion = identity.keyVersion;
      
      const rotated = identityBinding.rotateKeys(identity.id);
      
      expect(rotated.keyVersion).toBe(oldKeyVersion + 1);
      expect(Buffer.from(rotated.signingPublicKey)).not.toEqual(oldPublicKey);
    });

    it('should still verify memories signed with old keys', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      // Sign with original key
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-key',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      // Rotate keys
      identityBinding.rotateKeys(identity.id);
      
      // Old signature should still verify (stored with key version)
      const result = identityBinding.verifyMemory(signedMemory);
      expect(result.valid).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize signed memory', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-key',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [1, 2] },
        vault: 'vault-123'
      });
      
      const serialized = identityBinding.serializeSignedMemory(signedMemory);
      const deserialized = identityBinding.deserializeSignedMemory(serialized);
      
      expect(deserialized.key).toBe(signedMemory.key);
      expect(deserialized.contentHash).toBe(signedMemory.contentHash);
      expect(Buffer.from(deserialized.signature.signature)).toEqual(Buffer.from(signedMemory.signature.signature));
    });

    it('should handle special characters in content', () => {
      const identity = identityBinding.createIdentity('test-agent');
      const specialContent = 'Special chars: 🔐 ñ 中文 \\n \\t \\'"`;
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-key',
        content: specialContent,
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      const serialized = identityBinding.serializeSignedMemory(signedMemory);
      const deserialized = identityBinding.deserializeSignedMemory(serialized);
      
      expect(deserialized.contentHash).toBe(signedMemory.contentHash);
    });
  });

  describe('Batch Operations', () => {
    it('should sign multiple memories in batch', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const memories = Array.from({ length: 10 }, (_, i) => ({
        key: `memory-${i}`,
        content: `Content ${i}`,
        metadata: { memoryType: 'knowledge' as const, importance: 50, tags: [i] },
        vault: 'vault-123'
      }));
      
      const signed = identityBinding.batchSignMemories(identity.id, memories);
      
      expect(signed).toHaveLength(10);
      signed.forEach((memory, i) => {
        expect(memory.key).toBe(`memory-${i}`);
        expect(memory.signature.signature.length).toBe(64);
      });
    });

    it('should verify multiple memories in batch', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const memories = Array.from({ length: 5 }, (_, i) =>
        identityBinding.signMemory(identity.id, {
          key: `memory-${i}`,
          content: `Content ${i}`,
          metadata: { memoryType: 'knowledge' as const, importance: 50, tags: [] },
          vault: 'vault-123'
        })
      );
      
      const results = identityBinding.batchVerifyMemories(memories);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.valid).toBe(true);
      });
    });
  });
});
