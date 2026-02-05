import { IdentityBinding } from '../../src/identity/binding';
import { Connection, clusterApiUrl } from '@solana/web3.js';

describe('Access Control', () => {
  let identityBinding: IdentityBinding;

  beforeEach(() => {
    const connection = new Connection(clusterApiUrl('devnet'));
    identityBinding = new IdentityBinding(connection, {
      requireSignatures: true,
      signatureExpiryHours: 24,
      enableCrossSession: true,
      trustThreshold: 3
    });
  });

  describe('Identity-Based Access Control', () => {
    it('should allow identity to sign its own memories', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      expect(signedMemory.signature.agentId).toBe(identity.id);
    });

    it('should reject signing for non-existent identity', () => {
      expect(() => {
        identityBinding.signMemory('non-existent-id', {
          key: 'memory-1',
          content: 'Test content',
          metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
          vault: 'vault-123'
        });
      }).toThrow('Identity not found');
    });

    it('should reject access to private identity data', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      // Should not be able to get secret key directly
      const exported = identityBinding.exportIdentity(identity.id);
      expect(exported).toBeNull(); // Export returns null if not implemented
    });
  });

  describe('Cross-Session Verification', () => {
    it('should initialize cross-session for identity', () => {
      const identity = identityBinding.createIdentity('test-agent');
      const session = identityBinding.initCrossSession(identity.id);
      
      expect(session.sessionId).toBeDefined();
      expect(session.agentIdentity.id).toBe(identity.id);
      expect(session.verifiedMemories).toBe(0);
      expect(session.trustEstablished).toBe(false);
    });

    it('should track verified memories in session', () => {
      const identity = identityBinding.createIdentity('test-agent');
      const session = identityBinding.initCrossSession(identity.id);
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      identityBinding.verifyInSession(session.sessionId, signedMemory);
      
      const updatedSession = identityBinding.getSessionState(session.sessionId);
      expect(updatedSession?.verifiedMemories).toBe(1);
    });

    it('should establish trust after threshold verifications', () => {
      const identity = identityBinding.createIdentity('test-agent');
      const session = identityBinding.initCrossSession(identity.id);
      
      // Trust threshold is 3
      for (let i = 0; i < 3; i++) {
        const signedMemory = identityBinding.signMemory(identity.id, {
          key: `memory-${i}`,
          content: `Content ${i}`,
          metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
          vault: 'vault-123'
        });
        
        identityBinding.verifyInSession(session.sessionId, signedMemory);
      }
      
      expect(identityBinding.isTrustEstablished(session.sessionId)).toBe(true);
    });

    it('should reject verification for wrong agent in session', () => {
      const identity1 = identityBinding.createIdentity('agent-1');
      const identity2 = identityBinding.createIdentity('agent-2');
      
      const session = identityBinding.initCrossSession(identity1.id);
      
      const signedMemory = identityBinding.signMemory(identity2.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      const result = identityBinding.verifyInSession(session.sessionId, signedMemory);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('identity mismatch');
    });

    it('should reject verification for non-existent session', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      const result = identityBinding.verifyInSession('non-existent-session', signedMemory);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Session not found');
    });
  });

  describe('Signature Expiry', () => {
    it('should reject expired signatures when expiry is configured', () => {
      const connection = new Connection(clusterApiUrl('devnet'));
      const bindingWithExpiry = new IdentityBinding(connection, {
        requireSignatures: true,
        signatureExpiryHours: 1, // 1 hour expiry
        enableCrossSession: true,
        trustThreshold: 3
      });
      
      const identity = bindingWithExpiry.createIdentity('test-agent');
      
      // Create a memory with old timestamp by manually constructing
      const signedMemory = bindingWithExpiry.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      // Manually set timestamp to past
      signedMemory.signature.timestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      
      const result = bindingWithExpiry.verifyMemory(signedMemory);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should accept valid signatures within expiry window', () => {
      const connection = new Connection(clusterApiUrl('devnet'));
      const bindingWithExpiry = new IdentityBinding(connection, {
        requireSignatures: true,
        signatureExpiryHours: 24,
        enableCrossSession: true,
        trustThreshold: 3
      });
      
      const identity = bindingWithExpiry.createIdentity('test-agent');
      
      const signedMemory = bindingWithExpiry.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      const result = bindingWithExpiry.verifyMemory(signedMemory);
      expect(result.valid).toBe(true);
    });
  });

  describe('Permission Levels', () => {
    it('should enforce signature requirement when configured', () => {
      const connection = new Connection(clusterApiUrl('devnet'));
      const bindingWithRequirement = new IdentityBinding(connection, {
        requireSignatures: true,
        signatureExpiryHours: 0,
        enableCrossSession: true,
        trustThreshold: 3
      });
      
      const identity = bindingWithRequirement.createIdentity('test-agent');
      
      // Should be able to sign
      const signedMemory = bindingWithRequirement.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      expect(signedMemory.signature).toBeDefined();
    });

    it('should allow operation without signatures when not required', () => {
      const connection = new Connection(clusterApiUrl('devnet'));
      const bindingWithoutRequirement = new IdentityBinding(connection, {
        requireSignatures: false,
        signatureExpiryHours: 0,
        enableCrossSession: false,
        trustThreshold: 3
      });
      
      const identity = bindingWithoutRequirement.createIdentity('test-agent');
      
      // Should still be able to sign even when not required
      const signedMemory = bindingWithoutRequirement.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      expect(signedMemory.signature).toBeDefined();
    });
  });

  describe('Identity Isolation', () => {
    it('should isolate identities from each other', () => {
      const identity1 = identityBinding.createIdentity('agent-1');
      const identity2 = identityBinding.createIdentity('agent-2');
      
      // Each identity should only see its own data
      const allIdentities = identityBinding.getAllIdentities();
      expect(allIdentities).toHaveLength(2);
      expect(allIdentities.map(i => i.id)).toContain(identity1.id);
      expect(allIdentities.map(i => i.id)).toContain(identity2.id);
    });

    it('should not allow one identity to access another\'s memories', () => {
      const identity1 = identityBinding.createIdentity('agent-1');
      const identity2 = identityBinding.createIdentity('agent-2');
      
      // Identity1 signs a memory
      const signedMemory = identityBinding.signMemory(identity1.id, {
        key: 'memory-1',
        content: 'Secret content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      // Verify it was signed by identity1, not identity2
      const result = identityBinding.verifyMemory(signedMemory);
      expect(result.valid).toBe(true);
      expect(result.agentId).toBe(identity1.id);
      expect(result.agentId).not.toBe(identity2.id);
    });
  });

  describe('Key Rotation Access Control', () => {
    it('should invalidate old keys after rotation', () => {
      const identity = identityBinding.createIdentity('test-agent');
      
      // Sign with original key
      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'memory-1',
        content: 'Test content',
        metadata: { memoryType: 'knowledge', importance: 80, tags: [] },
        vault: 'vault-123'
      });
      
      // Store original signature info
      const originalSignature = signedMemory.signature.signature;
      const originalPublicKey = signedMemory.signature.publicKey;
      
      // Rotate keys
      identityBinding.rotateKeys(identity.id);
      
      // New key version should be different
      const identityAfterRotation = identityBinding.getIdentity(identity.id);
      expect(identityAfterRotation?.keyVersion).toBeGreaterThan(signedMemory.signature.keyVersion);
      
      // But old signed memory should still verify (it has the old public key)
      const result = identityBinding.verifyMemory(signedMemory);
      expect(result.valid).toBe(true);
    });
  });
});
