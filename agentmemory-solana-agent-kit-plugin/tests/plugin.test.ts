import { AgentMemoryPlugin } from "../src/index";
import { SolanaAgentKit } from "@solana-agent-kit/core";

// Mock Solana Agent Kit for testing
jest.mock("@solana-agent-kit/core");

describe("AgentMemoryPlugin", () => {
  let plugin: AgentMemoryPlugin;
  let mockAgentKit: jest.Mocked<SolanaAgentKit>;

  beforeEach(() => {
    mockAgentKit = {
      connection: { rpcEndpoint: "https://api.devnet.solana.com" } as any,
      registerTool: jest.fn(),
      wallet: { publicKey: { toString: () => "mockPublicKey" } },
    } as any;

    plugin = new AgentMemoryPlugin({
      programId: "Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq",
      encryptionKey: "test-key-123",
    });
  });

  describe("initialization", () => {
    it("should initialize with correct config", async () => {
      await plugin.initialize(mockAgentKit);
      expect(mockAgentKit.registerTool).toHaveBeenCalledTimes(5);
    });

    it("should register all memory tools", async () => {
      await plugin.initialize(mockAgentKit);
      
      const registeredTools = mockAgentKit.registerTool.mock.calls.map(call => call[0].name);
      expect(registeredTools).toContain("memory_store");
      expect(registeredTools).toContain("memory_retrieve");
      expect(registeredTools).toContain("memory_update");
      expect(registeredTools).toContain("memory_compress");
      expect(registeredTools).toContain("identity_export");
    });
  });

  describe("memory operations", () => {
    beforeEach(async () => {
      await plugin.initialize(mockAgentKit);
    });

    it("should generate unique memory IDs", () => {
      const id1 = (plugin as any).generateMemoryId("test content 1");
      const id2 = (plugin as any).generateMemoryId("test content 2");
      
      expect(id1).toMatch(/^mem_[a-f0-9]+_\d+$/);
      expect(id1).not.toBe(id2);
    });

    // TODO: Add tests for actual on-chain operations once implemented
    // These will require a local validator or devnet integration
  });

  describe("configuration", () => {
    it("should use default config values", () => {
      const defaultPlugin = new AgentMemoryPlugin({
        programId: "TestProgramId",
      });
      
      // Access private config for testing
      const config = (defaultPlugin as any).config;
      expect(config.defaultTTL).toBe(86400 * 30);
      expect(config.allowSharing).toBe(false);
      expect(config.tierConfig.hot.maxSize).toBe(100);
    });

    it("should accept custom config values", () => {
      const customPlugin = new AgentMemoryPlugin({
        programId: "TestProgramId",
        defaultTTL: 86400,
        allowSharing: true,
      });
      
      const config = (customPlugin as any).config;
      expect(config.defaultTTL).toBe(86400);
      expect(config.allowSharing).toBe(true);
    });
  });
});

// Integration tests (requires Solana connection)
describe("AgentMemoryPlugin Integration", () => {
  // These tests require a running Solana validator or devnet connection
  // Run with: npm run test:integration
  
  it.skip("should store and retrieve memory on devnet", async () => {
    // Implementation pending
  });

  it.skip("should encrypt and decrypt sensitive memories", async () => {
    // Implementation pending
  });

  it.skip("should compress old memories to save rent", async () => {
    // Implementation pending
  });
});