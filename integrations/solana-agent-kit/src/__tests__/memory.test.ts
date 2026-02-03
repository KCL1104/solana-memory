/**
 * Test suite for Memory Plugin
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import MemoryPlugin from "../index";
import { SolanaAgentKit } from "solana-agent-kit";

// Mock the SolanaAgentKit
const mockAgent = {
  wallet: {
    publicKey: { toString: () => "MockPublicKey123" },
    sendTransaction: jest.fn().mockResolvedValue("mockSignature123"),
  },
  connection: {
    getBalance: jest.fn().mockResolvedValue(1000000000),
  },
} as unknown as SolanaAgentKit;

describe("MemoryPlugin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Plugin Structure", () => {
    it("should have the correct name", () => {
      expect(MemoryPlugin.name).toBe("memory");
    });

    it("should have required methods", () => {
      expect(MemoryPlugin.methods).toHaveProperty("storeMemory");
      expect(MemoryPlugin.methods).toHaveProperty("retrieveMemories");
      expect(MemoryPlugin.methods).toHaveProperty("updateMemory");
      expect(MemoryPlugin.methods).toHaveProperty("deleteMemory");
      expect(MemoryPlugin.methods).toHaveProperty("searchMemories");
      expect(MemoryPlugin.methods).toHaveProperty("getMemoryStats");
      expect(MemoryPlugin.methods).toHaveProperty("cleanupExpiredMemories");
    });

    it("should have required actions", () => {
      const actionNames = MemoryPlugin.actions.map((a: { name: string }) => a.name);
      expect(actionNames).toContain("STORE_MEMORY_ACTION");
      expect(actionNames).toContain("RETRIEVE_MEMORY_ACTION");
      expect(actionNames).toContain("UPDATE_MEMORY_ACTION");
      expect(actionNames).toContain("DELETE_MEMORY_ACTION");
      expect(actionNames).toContain("SEARCH_MEMORY_ACTION");
      expect(actionNames).toContain("MEMORY_STATS_ACTION");
      expect(actionNames).toContain("CLEANUP_MEMORY_ACTION");
    });

    it("should have initialize function", () => {
      expect(typeof MemoryPlugin.initialize).toBe("function");
    });
  });

  describe("storeMemory", () => {
    it("should store a memory successfully", async () => {
      const result = await MemoryPlugin.methods.storeMemory(mockAgent, {
        content: "Test memory",
        tags: ["test"],
        priority: 5,
        useMemoProgram: true,
      });

      expect(result.status).toBe("success");
      expect(result.memory).toBeDefined();
      expect(result.memory?.content).toBe("Test memory");
      expect(result.memory?.tags).toEqual(["test"]);
      expect(result.signature).toBeDefined();
    });

    it("should handle empty content error", async () => {
      const result = await MemoryPlugin.methods.storeMemory(mockAgent, {
        content: "",
        useMemoProgram: true,
      });

      expect(result.status).toBe("error");
    });
  });

  describe("retrieveMemories", () => {
    it("should return empty array for now (requires indexer)", async () => {
      const result = await MemoryPlugin.methods.retrieveMemories(mockAgent, {
        tag: "test",
      });

      expect(result.status).toBe("success");
      expect(result.memories).toEqual([]);
    });
  });

  describe("deleteMemory", () => {
    it("should return success for delete operation", async () => {
      const result = await MemoryPlugin.methods.deleteMemory(
        mockAgent,
        "mem_123"
      );

      expect(result.status).toBe("success");
      expect(result.message).toContain("mem_123");
    });
  });

  describe("searchMemories", () => {
    it("should return empty results (requires indexer)", async () => {
      const result = await MemoryPlugin.methods.searchMemories(
        mockAgent,
        "test",
        {}
      );

      expect(result.status).toBe("success");
      expect(result.memories).toEqual([]);
    });
  });

  describe("export/import", () => {
    it("should export memories as JSON", async () => {
      const exported = await MemoryPlugin.methods.exportMemories(mockAgent);
      expect(typeof exported).toBe("string");
      expect(JSON.parse(exported)).toEqual([]);
    });

    it("should import memories from JSON", async () => {
      const testData = JSON.stringify([
        {
          id: "test1",
          content: "Test content",
          timestamp: Date.now(),
          tags: ["test"],
          priority: 5,
        },
      ]);

      const result = await MemoryPlugin.methods.importMemories(mockAgent, testData);
      expect(result.status).toBe("success");
    });
  });
});

describe("Actions", () => {
  const storeAction = MemoryPlugin.actions.find(
    (a: { name: string }) => a.name === "STORE_MEMORY_ACTION"
  );

  it("STORE_MEMORY_ACTION should have correct similes", () => {
    expect(storeAction?.similes).toContain("save memory");
    expect(storeAction?.similes).toContain("remember");
    expect(storeAction?.similes).toContain("store information");
  });

  it("STORE_MEMORY_ACTION should have valid schema", () => {
    expect(storeAction?.schema).toBeDefined();
  });

  it("STORE_MEMORY_ACTION should have examples", () => {
    expect(storeAction?.examples.length).toBeGreaterThan(0);
  });
});
