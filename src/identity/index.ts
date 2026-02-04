/**
 * AgentMemory Identity Binding Module
 * 
 * SAID Protocol-inspired identity binding for AgentMemory.
 * Provides memory signing, identity verification, and cross-session validation.
 */

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

// Export types
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
