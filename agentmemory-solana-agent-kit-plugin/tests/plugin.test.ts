/**
 * Tests for AgentMemory Solana Agent Kit Plugin
 */

import { AgentMemoryPlugin } from "../src/index";

// Mock AgentMemory SDK
jest.mock("@moltdev-labs/agent-memory-sdk", () => ({
  AgentMemoryClient: jest.fn().mockImplementation(() => ({
    listVaults: jest.fn().mockResolvedValue({ data: [] }),
    createVault: jest.fn().mockResolvedValue({
      id: "vault_test123",
      name: "test-vault",
      owner: "test_owner",
    }),
    getVault: jest.fn().mockResolvedValue({
      id: "vault_test123",
      name: "test-vault",
      metadata: {},
    }),
    storeMemory: jest.fn().mockResolvedValue({
      id: "mem_abc123",
      key: "test_key",
      version: 1,
    }),
    getMemory: jest.fn().mockResolvedValue({
      id: "mem_abc123",
      key: "test_key",
      data: { content: "test content" },
      metadata: { tags: ["test"] },
      version: 1,
    }),
    updateMemory: jest.fn().mockResolvedValue({
      id: "mem_abc123",
      version: 2,
    }),
    deleteMemory: jest.fn().mockResolvedValue(undefined),
    searchMemories: jest.fn().mockResolvedValue([
      {
        memory: {
          id: "mem_abc123",
          key: "test_key",
          data: { content: "test content", importance: 0.8 },
          metadata: { tags: ["test"] },
          createdAt: new Date().toISOString(),
          version: 1,
        },
        score: 0.95,
      },
    ]),
    listMemories: jest.fn().mockResolvedValue({
      data: [
        {
          id: "mem_abc123",
          key: "test_key",
          data: { content: "old content", importance: 0.3 },
          metadata: { labels: { tier: "warm" } },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    }),
    grantAccess: jest.fn().mockResolvedValue({
      userId: "recipient_pubkey",
      permission: "read",
    }),
    health: jest.fn().mockResolvedValue({
      status: "healthy",
      version: "1.0.0",
    }),
  })),
}));

describe("AgentMemoryPlugin", () => {
  let plugin: AgentMemoryPlugin;
  let mockAgentKit: any;

  beforeEach(() => {
    mockAgentKit = {
      connection: {
        getBalance: jest.fn().mockResolvedValue(1000000000),
      },
      wallet: {
        publicKey: {
          toBase58: () => "test_agent_pubkey",
        },
      },
      registerTool: jest.fn(),
    };

    plugin = new AgentMemoryPlugin({
      apiUrl: "https://test-api.agentmemory.io",
      apiKey: "test_key",
      debug: false,
    });
  });

  describe("initialization", () => {
    it("should initialize with default config", () => {
      const defaultPlugin = new AgentMemoryPlugin();
      expect(defaultPlugin).toBeDefined();
      expect(defaultPlugin.name).toBe("agentmemory");
      expect(defaultPlugin.version).toBe("0.1.0");
    });

    it("should initialize with custom config", () => {
      const customPlugin = new AgentMemoryPlugin({
        apiUrl: "https://custom.api.com",
        defaultTTL: 86400,
        allowSharing: true,
      });
      expect(customPlugin).toBeDefined();
    });

    it("should register tools on initialization", async () => {
      await plugin.initialize(mockAgentKit);
      expect(mockAgentKit.registerTool).toHaveBeenCalledTimes(8);
    });
  });

  describe("memory storage", () => {
    beforeEach(async () => {
      await plugin.initialize(mockAgentKit);
    });

    it("should store a memory", async () => {
      const result = await plugin.store({
        content: "Test memory content",
        tags: ["test"],
        importance: 0.8,
      });

      expect(result.memoryId).toBeDefined();
      expect(result.status).toBe("stored");
      expect(result.tier).toBe("hot"); // High importance = hot tier
    });

    it("should generate key if not provided", async () => {
      const result = await plugin.store({
        content: "Test content",
      });

      expect(result.memoryId).toBeDefined();
    });

    it("should use correct tier based on importance", async () => {
      const hotResult = await plugin.store({
        content: "Hot memory",
        importance: 0.9,
      });
      expect(hotResult.tier).toBe("hot");

      const warmResult = await plugin.store({
        content: "Warm memory",
        importance: 0.5,
      });
      expect(warmResult.tier).toBe("warm");

      const coldResult = await plugin.store({
        content: "Cold memory",
        importance: 0.2,
      });
      expect(coldResult.tier).toBe("cold");
    });
  });

  describe("memory retrieval", () => {
    beforeEach(async () => {
      await plugin.initialize(mockAgentKit);
    });

    it("should retrieve memories by query", async () => {
      const result = await plugin.retrieve({
        query: "test query",
        limit: 5,
      });

      expect(result.memories).toBeDefined();
      expect(Array.isArray(result.memories)).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it("should filter by tags", async () => {
      const result = await plugin.retrieve({
        query: "test",
        tags: ["important"],
      });

      expect(result.memories).toBeDefined();
    });

    it("should support semantic search", async () => {
      const result = await plugin.retrieve({
        query: "semantic query",
        semantic: true,
      });

      expect(result.memories).toBeDefined();
    });
  });

  describe("memory updates", () => {
    beforeEach(async () => {
      await plugin.initialize(mockAgentKit);
    });

    it("should update a memory", async () => {
      const result = await plugin.update({
        memoryId: "mem_abc123",
        content: "Updated content",
        importance: 0.9,
      });

      expect(result.memoryId).toBe("mem_abc123");
      expect(result.status).toBe("updated");
      expect(result.version).toBe(2);
    });

    it("should support append mode", async () => {
      const result = await plugin.update({
        memoryId: "mem_abc123",
        content: "Additional content",
        append: true,
      });

      expect(result.status).toBe("updated");
    });
  });

  describe("memory deletion", () => {
    beforeEach(async () => {
      await plugin.initialize(mockAgentKit);
    });

    it("should soft delete a memory", async () => {
      const result = await plugin.delete("mem_abc123");

      expect(result.memoryId).toBe("mem_abc123");
      expect(result.status).toBe("deleted");
    });

    it("should permanently delete a memory", async () => {
      const result = await plugin.delete("mem_abc123", true);

      expect(result.memoryId).toBe("mem_abc123");
      expect(result.status).toBe("permanently_deleted");
    });
  });

  describe("memory compression", () => {
    beforeEach(async () => {
      await plugin.initialize(mockAgentKit);
    });

    it("should compress memories", async () => {
      const result = await plugin.handleCompress({
        strategy: "summarize",
        olderThan: 86400,
      });

      expect(typeof result.compressed).toBe("number");
      expect(typeof result.saved).toBe("number");
      expect(result.strategy).toBe("summarize");
    });
  });

  describe("encryption", () => {
    it("should detect when encryption is disabled", () => {
      expect(plugin.isEncryptionEnabled()).toBe(false);
    });

    it("should initialize encryption with valid key", () => {
      const encryptedPlugin = new AgentMemoryPlugin({
        encryptionKey: "7x8vJ2kLmN3pQr5sTu6wXy9zAbCdEfGhIjKlMnOpQrSt", // Valid base58 32-byte key
        debug: false,
      });

      expect(encryptedPlugin.isEncryptionEnabled()).toBe(true);
      expect(encryptedPlugin.getEncryptionPublicKey()).toBeDefined();
    });

    it("should throw on invalid encryption key", () => {
      expect(() => {
        new AgentMemoryPlugin({
          encryptionKey: "invalid_key",
        });
      }).toThrow();
    });
  });

  describe("health check", () => {
    beforeEach(async () => {
      await plugin.initialize(mockAgentKit);
    });

    it("should return health status", async () => {
      const health = await plugin.health();

      expect(health.status).toBe("healthy");
      expect(health.vaultId).toBeDefined();
      expect(health.encrypted).toBe(false);
    });
  });

  describe("direct API access", () => {
    beforeEach(async () => {
      await plugin.initialize(mockAgentKit);
    });

    it("should expose SDK client", () => {
      const client = plugin.getClient();
      expect(client).toBeDefined();
    });

    it("should expose vault ID", () => {
      const vaultId = plugin.getVaultId();
      expect(vaultId).toBeDefined();
    });
  });
});

describe("Tool Registry", () => {
  it("should export tool definitions", () => {
    const { TOOL_REGISTRY, getAllToolDefinitions, getToolDefinition } = require("../src/tools");
    
    expect(TOOL_REGISTRY).toBeDefined();
    expect(getAllToolDefinitions).toBeDefined();
    expect(getToolDefinition).toBeDefined();
    
    const allTools = getAllToolDefinitions();
    expect(allTools.length).toBeGreaterThan(0);
    
    const storeTool = getToolDefinition("memory_store");
    expect(storeTool).toBeDefined();
    expect(storeTool.name).toBe("memory_store");
  });
});
