/**
 * Unit tests for AgentMemory Solana Agent Kit Plugin
 */

import { AgentMemoryPlugin } from "../client";
import { EncryptionModule, generateEncryptionKey } from "../encryption";

// Mock Solana connection
jest.mock("@solana/web3.js", () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(1000000000),
    getAccountInfo: jest.fn().mockResolvedValue(null),
  })),
  PublicKey: jest.fn().mockImplementation((key: string) => ({
    toBase58: () => key,
    toBytes: () => Buffer.from(key),
  })),
  clusterApiUrl: jest.fn().mockReturnValue("https://api.devnet.solana.com"),
}));

describe("EncryptionModule", () => {
  const testKey = "test_encryption_key_12345";
  let encryption: EncryptionModule;

  beforeEach(() => {
    encryption = new EncryptionModule(testKey);
  });

  test("should encrypt and decrypt text correctly", () => {
    const plaintext = "This is a secret memory";
    const encrypted = encryption.encrypt(plaintext);
    
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.nonce).toBeDefined();
    expect(encrypted.tag).toBeDefined();
    
    const decrypted = encryption.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test("should produce different ciphertexts for same plaintext (nonce randomization)", () => {
    const plaintext = "Same text";
    const encrypted1 = encryption.encrypt(plaintext);
    const encrypted2 = encryption.encrypt(plaintext);
    
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    expect(encrypted1.nonce).not.toBe(encrypted2.nonce);
  });

  test("should compute consistent hashes", () => {
    const content = "Test content";
    const hash1 = encryption.computeHash(content);
    const hash2 = encryption.computeHash(content);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(44); // base64 encoded SHA-256
  });

  test("should fail decryption with tampered ciphertext", () => {
    const plaintext = "Secret";
    const encrypted = encryption.encrypt(plaintext);
    
    // Tamper with ciphertext
    encrypted.ciphertext = encrypted.ciphertext.slice(0, -4) + "XXXX";
    
    expect(() => encryption.decrypt(encrypted)).toThrow("Decryption failed");
  });
});

describe("AgentMemoryPlugin", () => {
  const mockConfig = {
    programId: "AGMEM111111111111111111111111111111111111111",
    encryptionKey: generateEncryptionKey(),
    cluster: "devnet" as const,
  };

  let plugin: AgentMemoryPlugin;

  beforeEach(async () => {
    plugin = new AgentMemoryPlugin(mockConfig);
    await plugin.initialize();
  });

  test("should initialize with config", () => {
    expect(plugin).toBeDefined();
  });

  test("should generate agent identity", async () => {
    const identity = await plugin.getAgentIdentity();
    
    expect(identity.agentId).toBeDefined();
    expect(identity.pubkey).toBeDefined();
    expect(identity.registeredAt).toBeInstanceOf(Date);
    expect(identity.memoryCount).toBe(0);
  });

  test("should store memory and return entry", async () => {
    const memory = await plugin.storeMemory({
      content: "User prefers detailed explanations",
      tags: ["preference", "user"],
      priority: "high",
    });
    
    expect(memory.id).toBeDefined();
    expect(memory.contentHash).toBeDefined();
    expect(memory.tags).toContain("preference");
    expect(memory.priority).toBe("high");
    expect(memory.provenance).toHaveLength(1);
    expect(memory.provenance[0].action).toBe("create");
  });

  test("should apply default expiry", async () => {
    const memory = await plugin.storeMemory({
      content: "Test memory",
    });
    
    expect(memory.expiresAt).toBeDefined();
    expect(memory.expiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  test("should retrieve memories (empty initially)", async () => {
    const memories = await plugin.retrieveMemories({ limit: 10 });
    expect(memories).toEqual([]);
  });

  test("should generate unique memory IDs", async () => {
    const memory1 = await plugin.storeMemory({ content: "First" });
    const memory2 = await plugin.storeMemory({ content: "Second" });
    
    expect(memory1.id).not.toBe(memory2.id);
  });
});

describe("generateEncryptionKey", () => {
  test("should generate unique keys", () => {
    const key1 = generateEncryptionKey();
    const key2 = generateEncryptionKey();
    
    expect(key1).not.toBe(key2);
    expect(key1).toHaveLength(44); // base64 encoded 32 bytes
  });
});
