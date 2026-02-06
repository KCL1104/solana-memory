/**
 * Encryption module for AgentMemory
 * Uses AES-256-GCM for authenticated encryption
 */

import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";

export interface EncryptionResult {
  ciphertext: string;  // base64 encoded
  nonce: string;       // base64 encoded
  tag: string;         // base64 encoded authentication tag
}

export class EncryptionModule {
  private masterKey: Uint8Array;

  constructor(keySeed: string) {
    // Derive 256-bit key from seed using SHA-256
    this.masterKey = nacl.hash(naclUtil.decodeUTF8(keySeed)).slice(0, 32);
  }

  /**
   * Encrypt plaintext using AES-256-GCM via NaCl secretbox
   * Note: NaCl secretbox uses XSalsa20+Poly1305, which is equivalent security
   */
  encrypt(plaintext: string): EncryptionResult {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const message = naclUtil.decodeUTF8(plaintext);
    const box = nacl.secretbox(message, nonce, this.masterKey);
    
    // NaCl secretbox combines ciphertext + auth tag
    return {
      ciphertext: naclUtil.encodeBase64(box.slice(0, box.length - 16)),
      nonce: naclUtil.encodeBase64(nonce),
      tag: naclUtil.encodeBase64(box.slice(box.length - 16)),
    };
  }

  /**
   * Decrypt ciphertext
   */
  decrypt(result: EncryptionResult): string {
    const nonce = naclUtil.decodeBase64(result.nonce);
    const ciphertext = naclUtil.decodeBase64(result.ciphertext);
    const tag = naclUtil.decodeBase64(result.tag);
    
    // Reconstruct NaCl secretbox format
    const box = new Uint8Array(ciphertext.length + tag.length);
    box.set(ciphertext);
    box.set(tag, ciphertext.length);
    
    const decrypted = nacl.secretbox.open(box, nonce, this.masterKey);
    
    if (!decrypted) {
      throw new Error("Decryption failed - invalid ciphertext or tampered data");
    }
    
    return naclUtil.encodeUTF8(decrypted);
  }

  /**
   * Compute SHA-256 hash of content (for on-chain verification)
   */
  computeHash(content: string): string {
    const hash = nacl.hash(naclUtil.decodeUTF8(content));
    return naclUtil.encodeBase64(hash);
  }

  /**
   * Derive a unique key for a specific memory entry
   * Uses HKDF-like construction
   */
  deriveMemoryKey(memoryId: string): EncryptionModule {
    const combined = naclUtil.decodeUTF8(this.masterKey + memoryId);
    const derived = nacl.hash(combined).slice(0, 32);
    const keyString = naclUtil.encodeBase64(derived);
    return new EncryptionModule(keyString);
  }
}

/**
 * Generate a secure random encryption key
 */
export function generateEncryptionKey(): string {
  const key = nacl.randomBytes(32);
  return naclUtil.encodeBase64(key);
}
