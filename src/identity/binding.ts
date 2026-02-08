/**
 * AgentMemory Identity Binding Module
 * 
 * Implements SAID Protocol-inspired identity binding for AgentMemory.
 * Provides memory signing, identity verification, and cross-session validation.
 * 
 * Features:
 * - Memory signing with agent identity keys
 * - Signature verification for memory integrity
 * - Cross-session identity verification
 * - Agent selfhood establishment
 */

import { 
  Connection, 
  PublicKey
} from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { createHash, randomBytes } from 'crypto';

// Internal interface for storing signing keys
interface SigningKeyPair {
  publicKey: PublicKey;
  secretKey: Buffer;
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Agent Identity structure
 */
export interface AgentIdentity {
  /** Unique agent identifier (public key) */
  id: string;
  /** Agent display name */
  name: string;
  /** Ed25519 public key for signing */
  signingPublicKey: Uint8Array;
  /** Key derivation timestamp */
  createdAt: number;
  /** Key rotation counter */
  keyVersion: number;
}

/**
 * Memory signature structure
 */
export interface MemorySignature {
  /** Signature bytes */
  signature: Uint8Array;
  /** Agent identity that signed */
  agentId: string;
  /** Public key used for signing */
  publicKey: Uint8Array;
  /** Timestamp of signing */
  timestamp: number;
  /** Key version used */
  keyVersion: number;
}

/**
 * Signed memory structure
 */
export interface SignedMemory {
  /** Memory key/identifier */
  key: string;
  /** Memory content hash (SHA-256) */
  contentHash: string;
  /** Memory content size in bytes */
  contentSize: number;
  /** Memory metadata */
  metadata: MemoryMetadata;
  /** Identity signature */
  signature: MemorySignature;
  /** Vault reference */
  vault: string;
  /** Memory version */
  version: number;
}

/**
 * Memory metadata for signed memories
 */
export interface MemoryMetadata {
  /** Memory type */
  memoryType: MemoryType;
  /** Importance score (0-100) */
  importance: number;
  /** Tags array */
  tags: string[];
  /** Optional IPFS CID for large content */
  ipfsCid?: string;
}

/**
 * Memory types
 */
export type MemoryType = 
  | 'conversation' 
  | 'learning' 
  | 'preference' 
  | 'task' 
  | 'relationship' 
  | 'knowledge' 
  | 'system';

/**
 * Verification result
 */
export interface VerificationResult {
  /** Whether verification succeeded */
  valid: boolean;
  /** Agent identity verified */
  agentId?: string;
  /** Timestamp when signed */
  signedAt?: number;
  /** Error message if invalid */
  error?: string;
  /** Signature age in milliseconds */
  signatureAge?: number;
}

/**
 * Cross-session verification state
 */
export interface CrossSessionState {
  /** Session identifier */
  sessionId: string;
  /** Agent identity */
  agentIdentity: AgentIdentity;
  /** Verified memories count */
  verifiedMemories: number;
  /** Last verification timestamp */
  lastVerifiedAt: number;
  /** Chain of trust established */
  trustEstablished: boolean;
}

/**
 * Identity binding configuration
 */
export interface IdentityBindingConfig {
  /** Require all memories to be signed */
  requireSignatures: boolean;
  /** Signature validity period in hours (0 = no expiry) */
  signatureExpiryHours: number;
  /** Enable cross-session verification */
  enableCrossSession: boolean;
  /** Number of verifications required for trust */
  trustThreshold: number;
}

// ============================================================================
// IDENTITY BINDING CLASS
// ============================================================================

export class IdentityBinding {
  private connection: Connection;
  private config: IdentityBindingConfig;
  private identities: Map<string, AgentIdentity> = new Map();
  private signingKeys: Map<string, SigningKeyPair> = new Map();
  private sessionStates: Map<string, CrossSessionState> = new Map();

  constructor(
    connection: Connection,
    config: Partial<IdentityBindingConfig> = {}
  ) {
    this.connection = connection;
    this.config = {
      requireSignatures: true,
      signatureExpiryHours: 0,
      enableCrossSession: true,
      trustThreshold: 3,
      ...config
    };
  }

  // ============================================================================
  // IDENTITY MANAGEMENT
  // ============================================================================

  /**
   * Create a new agent identity with signing keys
   */
  createIdentity(name: string): AgentIdentity {
    // Generate Ed25519 keypair for signing
    const keypair = nacl.sign.keyPair();
    const id = Buffer.from(keypair.publicKey).toString('base64url');
    
    const identity: AgentIdentity = {
      id,
      name,
      signingPublicKey: keypair.publicKey,
      createdAt: Date.now(),
      keyVersion: 1
    };

    // Store identity and private key
    this.identities.set(id, identity);
    this.signingKeys.set(id, {
      publicKey: new PublicKey(keypair.publicKey),
      secretKey: Buffer.from(keypair.secretKey)
    });

    return identity;
  }

  /**
   * Import an existing identity
   */
  importIdentity(
    name: string,
    secretKey: Uint8Array
  ): AgentIdentity {
    const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
    const id = Buffer.from(keypair.publicKey).toString('base64url');
    
    const identity: AgentIdentity = {
      id,
      name,
      signingPublicKey: keypair.publicKey,
      createdAt: Date.now(),
      keyVersion: 1
    };

    this.identities.set(id, identity);
    this.signingKeys.set(id, {
      publicKey: new PublicKey(keypair.publicKey),
      secretKey: Buffer.from(keypair.secretKey)
    });

    return identity;
  }

  /**
   * Get identity by ID
   */
  getIdentity(id: string): AgentIdentity | undefined {
    return this.identities.get(id);
  }

  /**
   * Get all registered identities
   */
  getAllIdentities(): AgentIdentity[] {
    return Array.from(this.identities.values());
  }

  /**
   * Rotate signing keys for an identity
   */
  rotateKeys(identityId: string): AgentIdentity {
    const identity = this.identities.get(identityId);
    if (!identity) {
      throw new Error(`Identity not found: ${identityId}`);
    }

    // Generate new keypair
    const keypair = nacl.sign.keyPair();
    
    // Update identity
    identity.signingPublicKey = keypair.publicKey;
    identity.keyVersion++;
    identity.createdAt = Date.now();

    // Update stored keys
    this.signingKeys.set(identityId, {
      publicKey: new PublicKey(keypair.publicKey),
      secretKey: Buffer.from(keypair.secretKey)
    });

    return identity;
  }

  // ============================================================================
  // MEMORY SIGNING
  // ============================================================================

  /**
   * Sign a memory with agent identity
   */
  signMemory(
    identityId: string,
    memory: {
      key: string;
      content: string | Uint8Array;
      metadata: MemoryMetadata;
      vault: string;
    }
  ): SignedMemory {
    const identity = this.identities.get(identityId);
    if (!identity) {
      throw new Error(`Identity not found: ${identityId}`);
    }

    const signingKey = this.signingKeys.get(identityId);
    if (!signingKey) {
      throw new Error(`Signing key not found for identity: ${identityId}`);
    }

    // Calculate content hash
    const contentBytes = typeof memory.content === 'string' 
      ? Buffer.from(memory.content) 
      : memory.content;
    const contentHash = createHash('sha256').update(contentBytes).digest('hex');

    // Create signature payload
    const timestamp = Date.now();
    const payload = this.createSignaturePayload({
      key: memory.key,
      contentHash,
      contentSize: contentBytes.length,
      metadata: memory.metadata,
      vault: memory.vault,
      timestamp,
      keyVersion: identity.keyVersion
    });

    // Sign the payload
    const signature = nacl.sign.detached(
      payload,
      signingKey.secretKey
    );

    // Create signed memory
    const signedMemory: SignedMemory = {
      key: memory.key,
      contentHash,
      contentSize: contentBytes.length,
      metadata: memory.metadata,
      vault: memory.vault,
      version: 1,
      signature: {
        signature,
        agentId: identity.id,
        publicKey: identity.signingPublicKey,
        timestamp,
        keyVersion: identity.keyVersion
      }
    };

    return signedMemory;
  }

  /**
   * Verify a signed memory
   */
  verifyMemory(signedMemory: SignedMemory): VerificationResult {
    try {
      // Check signature expiry if configured
      if (this.config.signatureExpiryHours > 0) {
        const maxAge = this.config.signatureExpiryHours * 60 * 60 * 1000;
        const age = Date.now() - signedMemory.signature.timestamp;
        if (age > maxAge) {
          return {
            valid: false,
            error: 'Signature has expired',
            signatureAge: age
          };
        }
      }

      // Recreate signature payload
      const payload = this.createSignaturePayload({
        key: signedMemory.key,
        contentHash: signedMemory.contentHash,
        contentSize: signedMemory.contentSize,
        metadata: signedMemory.metadata,
        vault: signedMemory.vault,
        timestamp: signedMemory.signature.timestamp,
        keyVersion: signedMemory.signature.keyVersion
      });

      // Verify signature
      const isValid = nacl.sign.detached.verify(
        payload,
        signedMemory.signature.signature,
        signedMemory.signature.publicKey
      );

      if (!isValid) {
        return {
          valid: false,
          error: 'Invalid signature'
        };
      }

      return {
        valid: true,
        agentId: signedMemory.signature.agentId,
        signedAt: signedMemory.signature.timestamp,
        signatureAge: Date.now() - signedMemory.signature.timestamp
      };
    } catch (error) {
      return {
        valid: false,
        error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create signature payload for signing/verification
   */
  private createSignaturePayload(data: {
    key: string;
    contentHash: string;
    contentSize: number;
    metadata: MemoryMetadata;
    vault: string;
    timestamp: number;
    keyVersion: number;
  }): Uint8Array {
    const payload = Buffer.concat([
      Buffer.from(data.key),
      Buffer.from(data.contentHash, 'hex'),
      Buffer.from(data.contentSize.toString()),
      Buffer.from(JSON.stringify(data.metadata)),
      Buffer.from(data.vault),
      Buffer.from(data.timestamp.toString()),
      Buffer.from(data.keyVersion.toString())
    ]);

    // Hash the combined payload
    return createHash('sha256').update(payload).digest();
  }

  // ============================================================================
  // CROSS-SESSION VERIFICATION
  // ============================================================================

  /**
   * Initialize cross-session verification
   */
  initCrossSession(
    identityId: string,
    sessionId?: string
  ): CrossSessionState {
    const identity = this.identities.get(identityId);
    if (!identity) {
      throw new Error(`Identity not found: ${identityId}`);
    }

    const session: CrossSessionState = {
      sessionId: sessionId || this.generateSessionId(),
      agentIdentity: identity,
      verifiedMemories: 0,
      lastVerifiedAt: Date.now(),
      trustEstablished: false
    };

    this.sessionStates.set(session.sessionId, session);
    return session;
  }

  /**
   * Verify memory in cross-session context
   */
  verifyInSession(
    sessionId: string,
    signedMemory: SignedMemory
  ): VerificationResult {
    const session = this.sessionStates.get(sessionId);
    if (!session) {
      return {
        valid: false,
        error: 'Session not found'
      };
    }

    // First verify the memory signature
    const result = this.verifyMemory(signedMemory);
    if (!result.valid) {
      return result;
    }

    // Verify agent matches session
    if (result.agentId !== session.agentIdentity.id) {
      return {
        valid: false,
        error: 'Agent identity mismatch'
      };
    }

    // Update session state
    session.verifiedMemories++;
    session.lastVerifiedAt = Date.now();
    
    // Check if trust threshold reached
    if (session.verifiedMemories >= this.config.trustThreshold) {
      session.trustEstablished = true;
    }

    return {
      ...result,
      valid: true
    };
  }

  /**
   * Get session state
   */
  getSessionState(sessionId: string): CrossSessionState | undefined {
    return this.sessionStates.get(sessionId);
  }

  /**
   * Check if trust is established for a session
   */
  isTrustEstablished(sessionId: string): boolean {
    const session = this.sessionStates.get(sessionId);
    return session?.trustEstablished || false;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Sign multiple memories at once
   */
  batchSignMemories(
    identityId: string,
    memories: Array<{
      key: string;
      content: string | Uint8Array;
      metadata: MemoryMetadata;
      vault: string;
    }>
  ): SignedMemory[] {
    return memories.map(memory => this.signMemory(identityId, memory));
  }

  /**
   * Verify multiple memories at once
   */
  batchVerifyMemories(
    signedMemories: SignedMemory[]
  ): VerificationResult[] {
    return signedMemories.map(memory => this.verifyMemory(memory));
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Export identity (for backup)
   */
  exportIdentity(identityId: string): {
    identity: AgentIdentity;
    secretKey: string;
  } | null {
    const identity = this.identities.get(identityId);
    const signingKey = this.signingKeys.get(identityId);
    
    if (!identity || !signingKey) {
      return null;
    }

    return {
      identity,
      secretKey: Buffer.from(signingKey.secretKey).toString('base64')
    };
  }

  /**
   * Serialize signed memory for storage
   */
  serializeSignedMemory(signedMemory: SignedMemory): string {
    return JSON.stringify({
      ...signedMemory,
      signature: {
        ...signedMemory.signature,
        signature: Buffer.from(signedMemory.signature.signature).toString('base64'),
        publicKey: Buffer.from(signedMemory.signature.publicKey).toString('base64')
      }
    });
  }

  /**
   * Deserialize signed memory from storage
   */
  deserializeSignedMemory(data: string): SignedMemory {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      signature: {
        ...parsed.signature,
        signature: Buffer.from(parsed.signature.signature, 'base64'),
        publicKey: Buffer.from(parsed.signature.publicKey, 'base64')
      }
    };
  }
}

// ============================================================================
// STANDALONE FUNCTIONS
// ============================================================================

/**
 * Quick sign function for one-off operations
 */
export function signMemoryContent(
  content: string | Uint8Array,
  secretKey: Uint8Array
): {
  signature: string;
  hash: string;
  timestamp: number;
} {
  const contentBytes = typeof content === 'string' 
    ? Buffer.from(content) 
    : content;
  
  const hash = createHash('sha256').update(contentBytes).digest('hex');
  const timestamp = Date.now();
  
  const payload = createHash('sha256')
    .update(Buffer.concat([
      Buffer.from(hash, 'hex'),
      Buffer.from(timestamp.toString())
    ]))
    .digest();

  const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
  const signature = nacl.sign.detached(payload, keypair.secretKey);

  return {
    signature: Buffer.from(signature).toString('base64'),
    hash,
    timestamp
  };
}

/**
 * Quick verify function for one-off operations
 */
export function verifyMemoryContent(
  content: string | Uint8Array,
  signature: string,
  publicKey: Uint8Array,
  timestamp: number
): boolean {
  try {
    const contentBytes = typeof content === 'string' 
      ? Buffer.from(content) 
      : content;
    
    const hash = createHash('sha256').update(contentBytes).digest('hex');
    
    const payload = createHash('sha256')
      .update(Buffer.concat([
        Buffer.from(hash, 'hex'),
        Buffer.from(timestamp.toString())
      ]))
      .digest();

    return nacl.sign.detached.verify(
      payload,
      Buffer.from(signature, 'base64'),
      publicKey
    );
  } catch {
    return false;
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const IDENTITY_BINDING_VERSION = '1.0.0';

export const DEFAULT_CONFIG: IdentityBindingConfig = {
  requireSignatures: true,
  signatureExpiryHours: 0,
  enableCrossSession: true,
  trustThreshold: 3
};
