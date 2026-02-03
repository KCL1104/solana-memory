/**
 * AgentMemory Adapter for ElizaOS
 * 
 * This adapter implements the ElizaOS IDatabaseAdapter interface using AgentMemory
 * for persistent storage on Solana blockchain with local caching.
 */

import {
  DatabaseAdapter,
  elizaLogger,
  type IDatabaseCacheAdapter,
  type UUID,
  type Account,
  type Actor,
  type Goal,
  type GoalStatus,
  type Memory,
  type Participant,
  type Relationship,
  type RAGKnowledgeItem,
  type ChunkRow,
} from "@elizaos/core";
import { v4 } from "uuid";

/**
 * Configuration for AgentMemoryAdapter
 */
export interface AgentMemoryAdapterConfig {
  /** Solana RPC endpoint */
  solanaEndpoint?: string;
  /** Optional wallet private key for transactions (if not using AgentMemory SDK defaults) */
  walletPrivateKey?: string;
  /** Local cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Embedding dimension size (default: 384 for most models) */
  embeddingDimension?: number;
}

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * AgentMemoryAdapter - ElizaOS Database Adapter Implementation
 * 
 * Provides persistent storage using Solana blockchain with local LRU cache
 * for high-performance memory operations.
 */
export class AgentMemoryAdapter extends DatabaseAdapter<null> implements IDatabaseCacheAdapter {
  private config: Required<AgentMemoryAdapterConfig>;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private memory: any; // AgentMemory SDK instance
  private initialized = false;

  constructor(config: AgentMemoryAdapterConfig = {}) {
    super();
    this.config = {
      solanaEndpoint: config.solanaEndpoint || "https://api.devnet.solana.com",
      walletPrivateKey: config.walletPrivateKey || "",
      cacheTTL: config.cacheTTL || 5 * 60 * 1000, // 5 minutes
      debug: config.debug || false,
      embeddingDimension: config.embeddingDimension || 384,
    };
  }

  /**
   * Initialize the adapter and connect to Solana
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Import AgentMemory SDK dynamically
      const { AgentMemory } = await import("agent-memory");
      
      this.memory = new AgentMemory({
        solanaEndpoint: this.config.solanaEndpoint,
        walletPrivateKey: this.config.walletPrivateKey || undefined,
      });

      await this.memory.initialize();
      this.initialized = true;
      elizaLogger.success("AgentMemoryAdapter initialized successfully");
    } catch (error) {
      elizaLogger.error("Failed to initialize AgentMemoryAdapter:", error);
      throw error;
    }
  }

  /**
   * Close the adapter connection
   */
  async close(): Promise<void> {
    this.cache.clear();
    this.initialized = false;
    elizaLogger.info("AgentMemoryAdapter closed");
  }

  // ============================================================
  // Cache Management
  // ============================================================

  private getCacheKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(":")}`;
  }

  private getCached<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.config.cacheTTL);
    this.cache.set(key, { data, expiresAt });
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ============================================================
  // Room Operations
  // ============================================================

  async getRoom(roomId: UUID): Promise<UUID | null> {
    const cacheKey = this.getCacheKey("room", roomId);
    const cached = this.getCached<UUID>(cacheKey);
    if (cached) return cached;

    try {
      const room = await this.memory.getRoom?.(roomId);
      if (room) {
        this.setCache(cacheKey, roomId);
        return roomId;
      }
      return null;
    } catch (error) {
      this.logDebug("getRoom error:", error);
      return null;
    }
  }

  async createRoom(roomId?: UUID): Promise<UUID> {
    const id = roomId || (v4() as UUID);
    
    try {
      await this.memory.createRoom?.(id);
      this.invalidateCache("room:");
      return id;
    } catch (error) {
      this.logDebug("createRoom error:", error);
      // Room might already exist, return the ID anyway
      return id;
    }
  }

  async removeRoom(roomId: UUID): Promise<void> {
    try {
      await this.memory.removeRoom?.(roomId);
      this.invalidateCache(`room:${roomId}`);
      this.invalidateCache(`participants:${roomId}`);
    } catch (error) {
      this.logDebug("removeRoom error:", error);
    }
  }

  async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
    const cacheKey = this.getCacheKey("user-rooms", userId);
    const cached = this.getCached<UUID[]>(cacheKey);
    if (cached) return cached;

    try {
      const rooms = await this.memory.getRoomsForParticipant?.(userId) || [];
      this.setCache(cacheKey, rooms);
      return rooms;
    } catch (error) {
      this.logDebug("getRoomsForParticipant error:", error);
      return [];
    }
  }

  async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
    const rooms = new Set<UUID>();
    for (const userId of userIds) {
      const userRooms = await this.getRoomsForParticipant(userId);
      userRooms.forEach(r => rooms.add(r));
    }
    return Array.from(rooms);
  }

  // ============================================================
  // Participant Operations
  // ============================================================

  async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
    const cacheKey = this.getCacheKey("participants", roomId);
    const cached = this.getCached<UUID[]>(cacheKey);
    if (cached) return cached;

    try {
      const participants = await this.memory.getParticipantsForRoom?.(roomId) || [];
      this.setCache(cacheKey, participants);
      return participants;
    } catch (error) {
      this.logDebug("getParticipantsForRoom error:", error);
      return [];
    }
  }

  async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
    try {
      return await this.memory.getParticipantsForAccount?.(userId) || [];
    } catch (error) {
      this.logDebug("getParticipantsForAccount error:", error);
      return [];
    }
  }

  async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
    try {
      await this.memory.addParticipant?.(userId, roomId);
      this.invalidateCache(`participants:${roomId}`);
      return true;
    } catch (error) {
      this.logDebug("addParticipant error:", error);
      return false;
    }
  }

  async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
    try {
      await this.memory.removeParticipant?.(userId, roomId);
      this.invalidateCache(`participants:${roomId}`);
      return true;
    } catch (error) {
      this.logDebug("removeParticipant error:", error);
      return false;
    }
  }

  async getParticipantUserState(
    roomId: UUID,
    userId: UUID
  ): Promise<"FOLLOWED" | "MUTED" | null> {
    try {
      return await this.memory.getParticipantUserState?.(roomId, userId) || null;
    } catch (error) {
      this.logDebug("getParticipantUserState error:", error);
      return null;
    }
  }

  async setParticipantUserState(
    roomId: UUID,
    userId: UUID,
    state: "FOLLOWED" | "MUTED" | null
  ): Promise<void> {
    try {
      await this.memory.setParticipantUserState?.(roomId, userId, state);
    } catch (error) {
      this.logDebug("setParticipantUserState error:", error);
    }
  }

  async getActorDetails(params: { roomId: UUID }): Promise<Actor[]> {
    try {
      const participants = await this.getParticipantsForRoom(params.roomId);
      const actors: Actor[] = [];
      
      for (const userId of participants) {
        const account = await this.getAccountById(userId);
        if (account) {
          actors.push({
            id: account.id,
            name: account.name,
            username: account.username,
            details: account.details,
          });
        }
      }
      
      return actors;
    } catch (error) {
      this.logDebug("getActorDetails error:", error);
      return [];
    }
  }

  // ============================================================
  // Account Operations
  // ============================================================

  async createAccount(account: Account): Promise<boolean> {
    try {
      await this.memory.createAccount?.(account);
      this.invalidateCache(`account:${account.id}`);
      return true;
    } catch (error) {
      this.logDebug("createAccount error:", error);
      return false;
    }
  }

  async getAccountById(userId: UUID): Promise<Account | null> {
    const cacheKey = this.getCacheKey("account", userId);
    const cached = this.getCached<Account>(cacheKey);
    if (cached) return cached;

    try {
      const account = await this.memory.getAccountById?.(userId);
      if (account) {
        // Parse JSON details if stored as string
        if (typeof account.details === "string") {
          account.details = JSON.parse(account.details);
        }
        this.setCache(cacheKey, account);
        return account;
      }
      return null;
    } catch (error) {
      this.logDebug("getAccountById error:", error);
      return null;
    }
  }

  // ============================================================
  // Memory Operations
  // ============================================================

  async createMemory(memory: Memory, tableName: string): Promise<void> {
    try {
      // Check for similar memories if embedding provided
      let isUnique = true;
      if (memory.embedding && memory.embedding.length > 0) {
        const similar = await this.searchMemoriesByEmbedding(memory.embedding, {
          tableName,
          agentId: memory.agentId!,
          roomId: memory.roomId,
          match_threshold: 0.95,
          count: 1,
        });
        isUnique = similar.length === 0;
      }

      const memoryData = {
        ...memory,
        id: memory.id || v4(),
        type: tableName,
        unique: isUnique,
        createdAt: memory.createdAt || Date.now(),
        content: typeof memory.content === "string" 
          ? memory.content 
          : JSON.stringify(memory.content),
      };

      await this.memory.createMemory?.(memoryData);
      this.invalidateCache(`memories:${tableName}`);
    } catch (error) {
      this.logDebug("createMemory error:", error);
      throw error;
    }
  }

  async getMemoryById(memoryId: UUID): Promise<Memory | null> {
    const cacheKey = this.getCacheKey("memory", memoryId);
    const cached = this.getCached<Memory>(cacheKey);
    if (cached) return cached;

    try {
      const memory = await this.memory.getMemoryById?.(memoryId);
      if (memory) {
        memory.content = this.parseContent(memory.content);
        this.setCache(cacheKey, memory);
        return memory;
      }
      return null;
    } catch (error) {
      this.logDebug("getMemoryById error:", error);
      return null;
    }
  }

  async getMemories(params: {
    roomId: UUID;
    count?: number;
    unique?: boolean;
    tableName: string;
    agentId: UUID;
    start?: number;
    end?: number;
  }): Promise<Memory[]> {
    const cacheKey = this.getCacheKey(
      "memories",
      params.tableName,
      params.roomId,
      params.agentId,
      String(params.count || "all")
    );
    const cached = this.getCached<Memory[]>(cacheKey);
    if (cached) return cached;

    try {
      const memories = await this.memory.getMemories?.(params) || [];
      const parsed = memories.map((m: Memory) => ({
        ...m,
        content: this.parseContent(m.content),
        createdAt: this.normalizeTimestamp(m.createdAt),
      }));
      
      this.setCache(cacheKey, parsed);
      return parsed;
    } catch (error) {
      this.logDebug("getMemories error:", error);
      return [];
    }
  }

  async getMemoriesByIds(memoryIds: UUID[], tableName?: string): Promise<Memory[]> {
    if (memoryIds.length === 0) return [];

    const memories: Memory[] = [];
    for (const id of memoryIds) {
      const memory = await this.getMemoryById(id);
      if (memory && (!tableName || memory.type === tableName)) {
        memories.push(memory);
      }
    }
    return memories;
  }

  async getMemoriesByRoomIds(params: {
    agentId: UUID;
    roomIds: UUID[];
    tableName: string;
    limit?: number;
  }): Promise<Memory[]> {
    const allMemories: Memory[] = [];
    
    for (const roomId of params.roomIds) {
      const memories = await this.getMemories({
        roomId,
        tableName: params.tableName,
        agentId: params.agentId,
        count: params.limit,
      });
      allMemories.push(...memories);
    }
    
    // Sort by createdAt DESC and apply limit
    allMemories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return params.limit ? allMemories.slice(0, params.limit) : allMemories;
  }

  async searchMemories(params: {
    tableName: string;
    roomId: UUID;
    agentId?: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    try {
      const memories = await this.memory.searchMemories?.(params) || [];
      return memories.map((m: Memory) => ({
        ...m,
        content: this.parseContent(m.content),
        createdAt: this.normalizeTimestamp(m.createdAt),
      }));
    } catch (error) {
      this.logDebug("searchMemories error:", error);
      return [];
    }
  }

  async searchMemoriesByEmbedding(
    embedding: number[],
    params: {
      match_threshold?: number;
      count?: number;
      roomId?: UUID;
      agentId: UUID;
      unique?: boolean;
      tableName: string;
    }
  ): Promise<Memory[]> {
    try {
      const memories = await this.memory.searchMemoriesByEmbedding?.(
        embedding,
        params
      ) || [];
      return memories.map((m: Memory) => ({
        ...m,
        content: this.parseContent(m.content),
        createdAt: this.normalizeTimestamp(m.createdAt),
      }));
    } catch (error) {
      this.logDebug("searchMemoriesByEmbedding error:", error);
      return [];
    }
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    try {
      await this.memory.removeMemory?.(memoryId, tableName);
      this.invalidateCache(`memory:${memoryId}`);
      this.invalidateCache(`memories:${tableName}`);
    } catch (error) {
      this.logDebug("removeMemory error:", error);
    }
  }

  async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
    try {
      await this.memory.removeAllMemories?.(roomId, tableName);
      this.invalidateCache(`memories:${tableName}`);
    } catch (error) {
      this.logDebug("removeAllMemories error:", error);
    }
  }

  async countMemories(
    roomId: UUID,
    unique = true,
    tableName = ""
  ): Promise<number> {
    try {
      return await this.memory.countMemories?.(roomId, unique, tableName) || 0;
    } catch (error) {
      this.logDebug("countMemories error:", error);
      return 0;
    }
  }

  async getCachedEmbeddings(opts: {
    query_table_name: string;
    query_threshold: number;
    query_input: string;
    query_field_name: string;
    query_field_sub_name: string;
    query_match_count: number;
  }): Promise<{ embedding: number[]; levenshtein_score: number }[]> {
    try {
      return await this.memory.getCachedEmbeddings?.(opts) || [];
    } catch (error) {
      this.logDebug("getCachedEmbeddings error:", error);
      return [];
    }
  }

  // ============================================================
  // Goal Operations
  // ============================================================

  async createGoal(goal: Goal): Promise<void> {
    try {
      const goalData = {
        ...goal,
        id: goal.id || v4(),
        objectives: typeof goal.objectives === "string"
          ? goal.objectives
          : JSON.stringify(goal.objectives),
      };
      await this.memory.createGoal?.(goalData);
      this.invalidateCache(`goals:${goal.roomId}`);
    } catch (error) {
      this.logDebug("createGoal error:", error);
    }
  }

  async getGoals(params: {
    roomId: UUID;
    userId?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    const cacheKey = this.getCacheKey(
      "goals",
      params.roomId,
      params.userId || "all",
      String(params.count || "all")
    );
    const cached = this.getCached<Goal[]>(cacheKey);
    if (cached) return cached;

    try {
      const goals = await this.memory.getGoals?.(params) || [];
      const parsed = goals.map((g: Goal) => ({
        ...g,
        objectives: typeof g.objectives === "string"
          ? JSON.parse(g.objectives)
          : g.objectives,
      }));
      this.setCache(cacheKey, parsed);
      return parsed;
    } catch (error) {
      this.logDebug("getGoals error:", error);
      return [];
    }
  }

  async updateGoal(goal: Goal): Promise<void> {
    try {
      await this.memory.updateGoal?.({
        ...goal,
        objectives: typeof goal.objectives === "string"
          ? goal.objectives
          : JSON.stringify(goal.objectives),
      });
      this.invalidateCache(`goals:${goal.roomId}`);
    } catch (error) {
      this.logDebug("updateGoal error:", error);
    }
  }

  async updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void> {
    try {
      await this.memory.updateGoalStatus?.(params);
      this.invalidateCache("goals:");
    } catch (error) {
      this.logDebug("updateGoalStatus error:", error);
    }
  }

  async removeGoal(goalId: UUID): Promise<void> {
    try {
      await this.memory.removeGoal?.(goalId);
      this.invalidateCache("goals:");
    } catch (error) {
      this.logDebug("removeGoal error:", error);
    }
  }

  async removeAllGoals(roomId: UUID): Promise<void> {
    try {
      await this.memory.removeAllGoals?.(roomId);
      this.invalidateCache(`goals:${roomId}`);
    } catch (error) {
      this.logDebug("removeAllGoals error:", error);
    }
  }

  // ============================================================
  // Relationship Operations
  // ============================================================

  async createRelationship(params: { userA: UUID; userB: UUID }): Promise<boolean> {
    try {
      await this.memory.createRelationship?.(params);
      return true;
    } catch (error) {
      this.logDebug("createRelationship error:", error);
      return false;
    }
  }

  async getRelationship(params: { userA: UUID; userB: UUID }): Promise<Relationship | null> {
    try {
      return await this.memory.getRelationship?.(params) || null;
    } catch (error) {
      this.logDebug("getRelationship error:", error);
      return null;
    }
  }

  async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
    try {
      return await this.memory.getRelationships?.(params) || [];
    } catch (error) {
      this.logDebug("getRelationships error:", error);
      return [];
    }
  }

  // ============================================================
  // Knowledge Operations (RAG)
  // ============================================================

  async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {
    try {
      const knowledgeData = {
        ...knowledge,
        content: typeof knowledge.content === "string"
          ? knowledge.content
          : JSON.stringify(knowledge.content),
        createdAt: knowledge.createdAt || Date.now(),
      };
      await this.memory.createKnowledge?.(knowledgeData);
      this.invalidateCache("knowledge:");
    } catch (error) {
      this.logDebug("createKnowledge error:", error);
    }
  }

  async getKnowledge(params: {
    id?: UUID;
    agentId: UUID;
    limit?: number;
    query?: string;
  }): Promise<RAGKnowledgeItem[]> {
    const cacheKey = this.getCacheKey(
      "knowledge",
      params.agentId,
      params.id || "all",
      String(params.limit || "all")
    );
    const cached = this.getCached<RAGKnowledgeItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const items = await this.memory.getKnowledge?.(params) || [];
      const parsed = items.map((item: RAGKnowledgeItem) => ({
        ...item,
        content: typeof item.content === "string"
          ? JSON.parse(item.content)
          : item.content,
        createdAt: this.normalizeTimestamp(item.createdAt),
      }));
      this.setCache(cacheKey, parsed);
      return parsed;
    } catch (error) {
      this.logDebug("getKnowledge error:", error);
      return [];
    }
  }

  async searchKnowledge(params: {
    agentId: UUID;
    embedding: Float32Array;
    match_threshold: number;
    match_count: number;
    searchText?: string;
  }): Promise<RAGKnowledgeItem[]> {
    try {
      const items = await this.memory.searchKnowledge?.(params) || [];
      return items.map((item: RAGKnowledgeItem) => ({
        ...item,
        content: typeof item.content === "string"
          ? JSON.parse(item.content)
          : item.content,
        createdAt: this.normalizeTimestamp(item.createdAt),
      }));
    } catch (error) {
      this.logDebug("searchKnowledge error:", error);
      return [];
    }
  }

  async removeKnowledge(id: UUID): Promise<void> {
    try {
      await this.memory.removeKnowledge?.(id);
      this.invalidateCache("knowledge:");
    } catch (error) {
      this.logDebug("removeKnowledge error:", error);
    }
  }

  async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {
    try {
      await this.memory.clearKnowledge?.(agentId, shared);
      this.invalidateCache("knowledge:");
    } catch (error) {
      this.logDebug("clearKnowledge error:", error);
    }
  }

  // ============================================================
  // Cache Operations (IDatabaseCacheAdapter)
  // ============================================================

  async getCache(params: { key: string; agentId: UUID }): Promise<string | undefined> {
    const cacheKey = this.getCacheKey("runtime-cache", params.agentId, params.key);
    return this.getCached<string>(cacheKey);
  }

  async setCache(params: { key: string; agentId: UUID; value: string }): Promise<boolean> {
    const cacheKey = this.getCacheKey("runtime-cache", params.agentId, params.key);
    this.setCache(cacheKey, params.value, this.config.cacheTTL);
    
    // Also persist to AgentMemory for cross-session persistence
    try {
      await this.memory.setCache?.(params);
    } catch (error) {
      this.logDebug("setCache persist error:", error);
    }
    
    return true;
  }

  async deleteCache(params: { key: string; agentId: UUID }): Promise<boolean> {
    const cacheKey = this.getCacheKey("runtime-cache", params.agentId, params.key);
    this.cache.delete(cacheKey);
    
    try {
      await this.memory.deleteCache?.(params);
      return true;
    } catch (error) {
      this.logDebug("deleteCache error:", error);
      return false;
    }
  }

  // ============================================================
  // Log Operations
  // ============================================================

  async log(params: {
    body: { [key: string]: unknown };
    userId: UUID;
    roomId: UUID;
    type: string;
  }): Promise<void> {
    try {
      await this.memory.log?.({
        ...params,
        body: JSON.stringify(params.body),
      });
    } catch (error) {
      this.logDebug("log error:", error);
    }
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  private parseContent(content: unknown): any {
    if (typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch {
        return { text: content };
      }
    }
    return content;
  }

  private normalizeTimestamp(ts: string | number | undefined): number {
    if (typeof ts === "string") {
      return Date.parse(ts);
    }
    return ts || Date.now();
  }

  private logDebug(...args: any[]): void {
    if (this.config.debug) {
      elizaLogger.debug("[AgentMemoryAdapter]", ...args);
    }
  }
}

export default AgentMemoryAdapter;
