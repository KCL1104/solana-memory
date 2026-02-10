/**
 * AgentMemory Protocol - Utility Functions
 * Helper functions for encryption, hashing, and formatting
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Generate a random 32-byte encryption key
 */
export function generateEncryptionKey(): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(32));
  }
  // Fallback for Node.js environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('crypto');
  return new Uint8Array(randomBytes(32));
}

/**
 * Hash content using SHA-256
 */
export async function hashContent(content: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Format a public key for display (shortened)
 */
export function formatPublicKey(key: PublicKey): string {
  const base58 = key.toBase58();
  return `${base58.slice(0, 6)}...${base58.slice(-4)}`;
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('en-US');
}

/**
 * Calculate approximate storage cost in SOL
 */
export function calculateStorageCost(bytes: number): number {
  // Approximate cost in SOL (devnet rates)
  const lamportsPerByte = 0.000000001; // 1 lamport = 0.000000001 SOL
  const rentExemptionMultiplier = 2;
  return bytes * lamportsPerByte * rentExemptionMultiplier;
}

/**
 * Validate a memory key (must be non-empty and reasonable length)
 */
export function validateMemoryKey(key: string): boolean {
  return key.length > 0 && key.length <= 64;
}

/**
 * Validate memory metadata
 */
export function validateMetadata(metadata: { importance: number; tags: string[] }): boolean {
  return (
    metadata.importance >= 0 &&
    metadata.importance <= 100 &&
    metadata.tags.every(tag => tag.length <= 32)
  );
}
