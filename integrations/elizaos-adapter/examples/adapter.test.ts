/**
 * Tests for AgentMemoryAdapter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AgentMemoryAdapter } from "../index.js";
import type { Memory, Account, Goal, UUID } from "@elizaos/core";

// Mock AgentMemory SDK
vi.mock("agent-memory", () => ({
  AgentMemory: class MockAgentMemory {
    async initialize() { return true; }
    async createMemory() { return true; }
    async getMemoryById(id: string) { return null; }
    async getMemories() { return []; }
    async searchMemories() { return []; }
    async removeMemory() { return true; }
    async createAccount() { return true; }
    async getAccountById() { return null; }
    async createRoom() { return "room-123"; }
    async getRoom() { return "room-123"; }
    async addParticipant() { return true; }
    async getParticipantsForRoom() { return []; }
    async createGoal() { return true; }
    async getGoals() { return []; }
    async createRelationship() { return true; }
    async getRelationships() { return []; }
    async setCache() { return true; }
    async getCache() { return undefined; }
  },
}));

describe("AgentMemoryAdapter", () => {
  let adapter: AgentMemoryAdapter;

  beforeEach(() => {
    adapter = new AgentMemoryAdapter({
      solanaEndpoint: "https://api.devnet.solana.com",
      debug: false,
    });
  });

  afterEach(async () => {
    await adapter.close();
  });

  describe("Initialization", () => {
    it("should initialize successfully", async () => {
      await expect(adapter.init()).resolves.not.toThrow();
      expect(adapter).toBeDefined();
    });

    it("should handle multiple init calls", async () => {
      await adapter.init();
      await expect(adapter.init()).resolves.not.toThrow();
    });
  });

  describe("Room Operations", () => {
    it("should create a room", async () => {
      await adapter.init();
      const roomId = await adapter.createRoom();
      expect(roomId).toBeDefined();
      expect(typeof roomId).toBe("string");
    });

    it("should create room with custom ID", async () => {
      await adapter.init();
      const customId = "custom-room-id" as UUID;
      const roomId = await adapter.createRoom(customId);
      expect(roomId).toBe(customId);
    });
  });

  describe("Memory Operations", () => {
    const mockMemory: Memory = {
      id: "mem-123",
      entityId: "user-1",
      agentId: "agent-1",
      roomId: "room-1",
      content: { text: "Test memory" },
      createdAt: Date.now(),
    };

    it("should create memory", async () => {
      await adapter.init();
      await expect(
        adapter.createMemory(mockMemory, "messages")
      ).resolves.not.toThrow();
    });

    it("should get memories by room", async () => {
      await adapter.init();
      const memories = await adapter.getMemories({
        roomId: "room-1",
        tableName: "messages",
        agentId: "agent-1",
      });
      expect(Array.isArray(memories)).toBe(true);
    });

    it("should parse JSON content", async () => {
      await adapter.init();
      const memoryWithJSON = {
        ...mockMemory,
        content: JSON.stringify({ text: "JSON content" }),
      };
      await expect(
        adapter.createMemory(memoryWithJSON, "messages")
      ).resolves.not.toThrow();
    });
  });

  describe("Account Operations", () => {
    const mockAccount: Account = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      avatarUrl: "https://example.com/avatar.png",
      details: { interests: ["AI", "blockchain"] },
    };

    it("should create account", async () => {
      await adapter.init();
      const result = await adapter.createAccount(mockAccount);
      expect(typeof result).toBe("boolean");
    });

    it("should get account by ID", async () => {
      await adapter.init();
      const account = await adapter.getAccountById("user-1");
      // Will be null with mock, but shouldn't throw
      expect(account).toBeNull();
    });
  });

  describe("Goal Operations", () => {
    const mockGoal: Goal = {
      id: "goal-1",
      roomId: "room-1",
      userId: "user-1",
      name: "Test Goal",
      status: "IN_PROGRESS",
      objectives: [
        { description: "Objective 1", completed: false },
      ],
    };

    it("should create goal", async () => {
      await adapter.init();
      await expect(adapter.createGoal(mockGoal)).resolves.not.toThrow();
    });

    it("should get goals", async () => {
      await adapter.init();
      const goals = await adapter.getGoals({
        roomId: "room-1",
      });
      expect(Array.isArray(goals)).toBe(true);
    });
  });

  describe("Cache Operations", () => {
    it("should set and get cache", async () => {
      await adapter.init();
      const result = await adapter.setCache({
        key: "test-key",
        agentId: "agent-1",
        value: "test-value",
      });
      expect(result).toBe(true);

      const cached = await adapter.getCache({
        key: "test-key",
        agentId: "agent-1",
      });
      expect(cached).toBe("test-value");
    });

    it("should delete cache", async () => {
      await adapter.init();
      await adapter.setCache({
        key: "delete-test",
        agentId: "agent-1",
        value: "to-delete",
      });

      const result = await adapter.deleteCache({
        key: "delete-test",
        agentId: "agent-1",
      });
      expect(typeof result).toBe("boolean");
    });
  });

  describe("Relationship Operations", () => {
    it("should create relationship", async () => {
      await adapter.init();
      const result = await adapter.createRelationship({
        userA: "user-1",
        userB: "user-2",
      });
      expect(typeof result).toBe("boolean");
    });

    it("should get relationships", async () => {
      await adapter.init();
      const relationships = await adapter.getRelationships({
        userId: "user-1",
      });
      expect(Array.isArray(relationships)).toBe(true);
    });
  });

  describe("Utility Functions", () => {
    it("should parse string content", async () => {
      await adapter.init();
      // @ts-ignore - accessing private method for testing
      const parsed = adapter["parseContent"]("{\"text\":\"hello\"}");
      expect(parsed).toEqual({ text: "hello" });
    });

    it("should handle invalid JSON content", async () => {
      await adapter.init();
      // @ts-ignore
      const parsed = adapter["parseContent"]("invalid json");
      expect(parsed).toEqual({ text: "invalid json" });
    });

    it("should normalize timestamps", async () => {
      await adapter.init();
      const now = Date.now();
      // @ts-ignore
      expect(adapter["normalizeTimestamp"](now)).toBe(now);
      // @ts-ignore
      expect(typeof adapter["normalizeTimestamp"](new Date().toISOString())).toBe("number");
    });
  });
});
