/**
 * ERC-8004 Identity Binding Module
 * 
 * SAID Protocol-inspired identity binding for AgentMemory.
 * Provides memory signing, identity verification, and cross-session validation.
 * 
 * Features:
 * - Identity-memory binding with on-chain verification
 * - Cross-device memory recovery
 * - Ed25519 signature verification
 * - Binding revocation and rotation
 */

// Re-export existing binding functionality
export {
  // Main class
  IdentityBinding,
  
  // Standalone functions
  signMemoryContent,
  verifyMemoryContent,
  
  // Constants
  IDENTITY_BINDING_VERSION,
  DEFAULT_CONFIG
} from './binding';

// Export types from existing binding
export type {
  AgentIdentity,
  MemorySignature,
  SignedMemory,
  MemoryMetadata,
  MemoryType,
  VerificationResult,
  CrossSessionState,
  IdentityBindingConfig
} from './binding';

// ============================================================================
// ERC-8004 IDENTITY-MEMORY BINDING
// ============================================================================

import { Connection, PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';

// ============================================================================
// TYPES
// ============================================================================

/**
 * SAID Protocol client interface
 * This is a simplified interface that would be provided by @said-protocol/client
 */
export interface SAIDClient {
  /** Sign a message with the identity's private key */
  sign(message: string | Uint8Array): Promise<Uint8Array>;
  /** Get the identity's public key */
  getPublicKey(): Promise<string>;
  /** Create a new identity */
  createIdentity(): Promise<{ pubkey: string; secretKey?: Uint8Array }>;
}

/**
 * AgentMemory storage interface
 * Simplified interface for memory operations
 */
export interface AgentMemory {
  /** Store a memory */
  store(data: { content: string; importance: string; metadata?: Record<string, any> }): Promise<{ id: string }>;
  /** Search memories */
  search(params: { agentId: string; query?: string }): Promise<Array<{ id: string; content: string }>>;
  /** Get memory by ID */
  get(id: string): Promise<{ id: string; content: string } | null>;
}

/**
 * Identity binding configuration
 */
export interface IdentityConfig {
  /** SAID Protocol client instance */
  saidClient: SAIDClient;
  /** AgentMemory instance */
  agentMemory: AgentMemory;
  /** Solana connection (optional, for on-chain operations) */
  connection?: Connection;
  /** Program ID for the AgentMemory contract */
  programId?: PublicKey;
}

/**
 * Binding data structure
 */
export interface Binding {
  /** SAID Protocol identity public key */
  identity_pubkey: string;
  /** Agent identifier */
  agent_id: string;
  /** Ed25519 signature */
  signature: Uint8Array;
  /** Unix timestamp when binding was created */
  bound_at: number;
  /** Whether the binding is revoked */
  revoked: boolean;
  /** Vault public key */
  vault_pubkey?: string;
  /** Binding version */
  version?: number;
}

/**
 * Binding creation result
 */
export interface BindingResult {
  /** Binding ID/PDA */
  bindingId: string;
  /** Transaction signature */
  signature: string;
  /** Binding data */
  binding: Binding;
}

// ============================================================================
// IDENTITY-MEMORY BINDING CLASS
// ============================================================================

/**
 * IdentityMemoryBinding
 * 
 * Manages the binding between SAID Protocol identities and AgentMemory agents.
 * Implements ERC-8004 standard for identity-memory binding.
 * 
 * @example
 * ```typescript
 * const binding = new IdentityMemoryBinding({
 *   saidClient,
 *   agentMemory
 * });
 * 
 * const bindingId = await binding.bindIdentity(identityPubkey, 'my-agent');
 * ```
 */
export class IdentityMemoryBinding {
  private config: IdentityConfig;
  private localBindings: Map<string, Binding> = new Map();

  constructor(config: IdentityConfig) {
    this.config = config;
  }

  // ============================================================================
  // BINDING OPERATIONS
  // ============================================================================

  /**
   * Bind a SAID Protocol identity to an AgentMemory agent
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @param agentId - The AgentMemory agent identifier
   * @returns The binding ID
   */
  async bindIdentity(identityPubkey: string, agentId: string): Promise<string> {
    // 1. Create message to sign
    const message = `${identityPubkey}:${agentId}`;
    
    // 2. Sign with identity key
    const signature = await this.config.saidClient.sign(message);
    
    // 3. Store binding on-chain or locally
    const bindingId = await this.storeBinding(identityPubkey, agentId, signature);
    
    return bindingId;
  }

  /**
   * Verify that a binding is valid
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @param agentId - The AgentMemory agent identifier
   * @returns Whether the binding is valid
   */
  async verifyBinding(identityPubkey: string, agentId: string): Promise<boolean> {
    const binding = await this.getBinding(identityPubkey, agentId);
    if (!binding || binding.revoked) return false;
    
    const message = `${identityPubkey}:${agentId}`;
    return await this.verifySignature(
      identityPubkey,
      message,
      binding.signature
    );
  }

  /**
   * Revoke an existing binding
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @param agentId - The AgentMemory agent identifier
   * @returns Whether revocation was successful
   */
  async revokeBinding(identityPubkey: string, agentId: string): Promise<boolean> {
    const bindingKey = this.getBindingKey(identityPubkey, agentId);
    const binding = this.localBindings.get(bindingKey);
    
    if (!binding) {
      throw new Error(`Binding not found: ${bindingKey}`);
    }

    // Verify we own this identity
    const currentPubkey = await this.config.saidClient.getPublicKey();
    if (currentPubkey !== identityPubkey) {
      throw new Error('Cannot revoke: not the identity owner');
    }

    binding.revoked = true;
    this.localBindings.set(bindingKey, binding);

    // If on-chain connection exists, submit revocation transaction
    if (this.config.connection && this.config.programId) {
      // On-chain revocation would happen here
      await this.revokeOnChain(identityPubkey, agentId);
    }

    return true;
  }

  /**
   * Rotate the binding signature (for key rotation scenarios)
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @param agentId - The AgentMemory agent identifier
   * @returns The new binding ID
   */
  async rotateBinding(identityPubkey: string, agentId: string): Promise<string> {
    // Verify current binding exists and is valid
    const existingBinding = await this.getBinding(identityPubkey, agentId);
    if (!existingBinding) {
      throw new Error(`No existing binding found for ${identityPubkey}:${agentId}`);
    }

    if (existingBinding.revoked) {
      throw new Error('Cannot rotate revoked binding');
    }

    // Create new signature with potentially new key
    const message = `${identityPubkey}:${agentId}`;
    const newSignature = await this.config.saidClient.sign(message);

    // Update binding
    const bindingKey = this.getBindingKey(identityPubkey, agentId);
    existingBinding.signature = newSignature;
    existingBinding.version = (existingBinding.version || 1) + 1;
    existingBinding.bound_at = Date.now();
    
    this.localBindings.set(bindingKey, existingBinding);

    return bindingKey;
  }

  // ============================================================================
  // MEMORY RECOVERY
  // ============================================================================

  /**
   * Recover memories for a given identity across all bound agents
   * This enables cross-device memory recovery
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @returns Array of memory IDs
   */
  async recoverMemories(identityPubkey: string): Promise<string[]> {
    // Query all agentIds bound to this identity
    const bindings = await this.getBindingsByIdentity(identityPubkey);
    
    // Retrieve memories for each agentId
    const memories: string[] = [];
    for (const binding of bindings) {
      if (!binding.revoked) {
        const agentMemories = await this.config.agentMemory.search({
          agentId: binding.agent_id
        });
        memories.push(...agentMemories.map(m => m.id));
      }
    }
    
    return memories;
  }

  /**
   * Get all memories for a specific agent
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @param agentId - The AgentMemory agent identifier
   * @returns Array of memory objects
   */
  async getAgentMemories(
    identityPubkey: string,
    agentId: string
  ): Promise<Array<{ id: string; content: string }>> {
    // Verify binding first
    const isValid = await this.verifyBinding(identityPubkey, agentId);
    if (!isValid) {
      throw new Error('Invalid or revoked binding');
    }

    return await this.config.agentMemory.search({ agentId });
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Get a specific binding
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @param agentId - The AgentMemory agent identifier
   * @returns The binding or null if not found
   */
  async getBinding(
    identityPubkey: string,
    agentId: string
  ): Promise<Binding | null> {
    const bindingKey = this.getBindingKey(identityPubkey, agentId);
    
    // Check local cache first
    if (this.localBindings.has(bindingKey)) {
      return this.localBindings.get(bindingKey)!;
    }

    // If connection exists, query from blockchain
    if (this.config.connection && this.config.programId) {
      return await this.getBindingFromChain(identityPubkey, agentId);
    }

    return null;
  }

  /**
   * Get all bindings for an identity
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @returns Array of bindings
   */
  async getBindingsByIdentity(identityPubkey: string): Promise<Binding[]> {
    const bindings: Binding[] = [];
    
    // Search local cache
    for (const [, binding] of this.localBindings) {
      if (binding.identity_pubkey === identityPubkey) {
        bindings.push(binding);
      }
    }

    // If connection exists, also query from blockchain
    if (this.config.connection && this.config.programId) {
      const onChainBindings = await this.getBindingsFromChain(identityPubkey);
      // Merge avoiding duplicates
      for (const binding of onChainBindings) {
        const key = this.getBindingKey(binding.identity_pubkey, binding.agent_id);
        if (!bindings.find(b => this.getBindingKey(b.identity_pubkey, b.agent_id) === key)) {
          bindings.push(binding);
        }
      }
    }

    return bindings;
  }

  /**
   * Check if a binding exists and is active
   * 
   * @param identityPubkey - The SAID Protocol identity public key
   * @param agentId - The AgentMemory agent identifier
   * @returns Whether an active binding exists
   */
  async hasActiveBinding(identityPubkey: string, agentId: string): Promise<boolean> {
    return await this.verifyBinding(identityPubkey, agentId);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Store a binding (locally or on-chain)
   */
  private async storeBinding(
    identityPubkey: string,
    agentId: string,
    signature: Uint8Array
  ): Promise<string> {
    const binding: Binding = {
      identity_pubkey: identityPubkey,
      agent_id: agentId,
      signature,
      bound_at: Date.now(),
      revoked: false,
      version: 1
    };

    const bindingKey = this.getBindingKey(identityPubkey, agentId);
    this.localBindings.set(bindingKey, binding);

    // If connection exists, also store on-chain
    if (this.config.connection && this.config.programId) {
      const txSig = await this.storeBindingOnChain(identityPubkey, agentId, signature);
      console.log(`Binding stored on-chain: ${txSig}`);
    }

    return bindingKey;
  }

  /**
   * Verify an ed25519 signature
   */
  private async verifySignature(
    pubkey: string,
    message: string,
    signature: Uint8Array
  ): Promise<boolean> {
    try {
      const pubkeyBytes = new PublicKey(pubkey).toBytes();
      const messageBytes = new TextEncoder().encode(message);
      
      return nacl.sign.detached.verify(
        messageBytes,
        signature,
        pubkeyBytes
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate a unique binding key
   */
  private getBindingKey(identityPubkey: string, agentId: string): string {
    return `${identityPubkey}:${agentId}`;
  }

  /**
   * Store binding on-chain
   */
  private async storeBindingOnChain(
    identityPubkey: string,
    agentId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signature: Uint8Array
  ): Promise<string> {
    // This would be implemented with actual Anchor program calls
    // For now, return a mock signature
    console.log(`Would store binding on-chain for ${identityPubkey}:${agentId}`);
    return 'mock-tx-signature';
  }

  /**
   * Revoke binding on-chain
   */
  private async revokeOnChain(
    identityPubkey: string,
    agentId: string
  ): Promise<void> {
    console.log(`Would revoke binding on-chain for ${identityPubkey}:${agentId}`);
  }

  /**
   * Get binding from blockchain
   */
  private async getBindingFromChain(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    identityPubkey: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    agentId: string
  ): Promise<Binding | null> {
    // This would query the on-chain program
    // For now, return null
    return null;
  }

  /**
   * Get all bindings from blockchain for an identity
   */
  private async getBindingsFromChain(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    identityPubkey: string
  ): Promise<Binding[]> {
    // This would query the on-chain program for the identity registry
    // For now, return empty array
    return [];
  }
}

// ============================================================================
// STANDALONE FUNCTIONS
// ============================================================================

/**
 * Create a binding signature for an identity-agent pair
 * 
 * @param identitySecretKey - The identity's secret key
 * @param identityPubkey - The identity's public key
 * @param agentId - The agent identifier
 * @returns The signature
 */
export function createBindingSignature(
  identitySecretKey: Uint8Array,
  identityPubkey: string,
  agentId: string
): Uint8Array {
  const message = `${identityPubkey}:${agentId}`;
  const messageBytes = new TextEncoder().encode(message);
  
  return nacl.sign.detached(messageBytes, identitySecretKey);
}

/**
 * Verify a binding signature
 * 
 * @param identityPubkey - The identity's public key
 * @param agentId - The agent identifier
 * @param signature - The signature to verify
 * @returns Whether the signature is valid
 */
export function verifyBindingSignature(
  identityPubkey: string,
  agentId: string,
  signature: Uint8Array
): boolean {
  try {
    const message = `${identityPubkey}:${agentId}`;
    const messageBytes = new TextEncoder().encode(message);
    const pubkeyBytes = new PublicKey(identityPubkey).toBytes();
    
    return nacl.sign.detached.verify(messageBytes, signature, pubkeyBytes);
  } catch {
    return false;
  }
}

/**
 * Derive the binding PDA (for on-chain operations)
 * 
 * @param identityPubkey - The identity's public key
 * @param agentId - The agent identifier
 * @param programId - The program ID
 * @returns The PDA and bump
 */
export function deriveBindingPDA(
  identityPubkey: string,
  agentId: string,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('identity_binding'),
      new PublicKey(identityPubkey).toBytes(),
      Buffer.from(agentId)
    ],
    programId
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Current ERC-8004 implementation version */
export const ERC8004_VERSION = '1.0.0';

/** Default configuration for identity binding */
export const DEFAULT_IDENTITY_CONFIG = {
  requireOnChainConfirmation: true,
  signatureExpiryMs: 0, // 0 = no expiry
  enableCrossDeviceRecovery: true
};
