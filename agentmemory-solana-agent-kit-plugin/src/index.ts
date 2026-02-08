/**
 * AgentMemory Plugin for Solana Agent Kit
 * 
 * Integrates AgentMemory Protocol with Solana Agent Kit v2, enabling AI agents
 * to store, retrieve, and manage persistent encrypted memories on Solana.
 * 
 * @module @agentmemory/solana-agent-kit-plugin
 * @version 0.1.0
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  clusterApiUrl
} from "@solana/web3.js";
import * as nacl from "tweetnacl";
import * as bs58 from "bs58";

// Re-export types from AgentMemory SDK
export {
  Memory,
  MemoryMetadata,
  Vault,
  AccessGrant,
  PermissionLevel,
  SearchResult,
  BatchResult,
} from "@moltdev-labs/agent-memory-sdk";

import {
  AgentMemoryClient,
  StoreMemoryRequest,
  UpdateMemoryRequest,
  MemorySearchOptions,
} from "@moltdev-labs/agent-memory-sdk";

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AgentMemoryConfig {
  /** AgentMemory program ID on Solana (defaults to devnet) */
  programId?: string;
  /** AgentMemory API URL */
  apiUrl?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Solana RPC URL */
  rpcUrl?: string;
  /** Optional encryption key for E2E encryption (base58 encoded) */
  encryptionKey?: string;
  /** Default time-to-live for memories in seconds (default: 30 days) */
  defaultTTL?: number;
  /** Hot/Warm/Cold tier configuration */
  tierConfig?: TierConfig;
  /** Enable memory sharing with other agents */
  allowSharing?: boolean;
  /** Agents allowed to access shared memories */
  trustedAgents?: string[];
  /** Auto-compress memories older than this (in seconds) */
  compressionThreshold?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface TierConfig {
  hot: { maxSize: number; ttl: number };
  warm: { maxSize: number; ttl: number };
  cold: { ttl: number };
}

export interface MemoryEntry {
  id: string;
  key: string;
  content: any;
  tags: string[];
  importance: number;
  timestamp: number;
  ttl: number;
  owner: string;
  encrypted: boolean;
  version: number;
}

export interface MemoryQuery {
  query: string;
  limit?: number;
  tags?: string[];
  timeRange?: { start: number; end: number };
  minImportance?: number;
  semantic?: boolean;
}

export interface StoreParams {
  key?: string;
  content: any;
  tags?: string[];
  importance?: number;
  ttl?: number;
  encrypt?: boolean;
  metadata?: Record<string, any>;
}

export interface RetrieveParams {
  query: string;
  limit?: number;
  tags?: string[];
  timeRange?: { start: number; end: number };
  minImportance?: number;
  semantic?: boolean;
}

export interface UpdateParams {
  memoryId: string;
  content?: any;
  importance?: number;
  tags?: string[];
  append?: boolean;
}

export interface CompressParams {
  threshold?: number;
  strategy?: "summarize" | "archive" | "delete";
  tags?: string[];
  olderThan?: number;
}

export interface ShareParams {
  memoryId: string;
  recipient: string;
  permissions: {
    read: boolean;
    write?: boolean;
    share?: boolean;
  };
  expiresAt?: number;
}

export interface IdentityExportParams {
  format?: "json" | "encrypted_json";
  includeMemories?: boolean;
}

// ============================================================================
// PLUGIN CLASS
// ============================================================================

export class AgentMemoryPlugin {
  name = "agentmemory";
  version = "0.1.0";
  
  private config: Required<AgentMemoryConfig>;
  private client: AgentMemoryClient;
  private connection: Connection | null = null;
  private programId: PublicKey;
  private encryptionKeyPair: nacl.BoxKeyPair | null = null;
  private vaultId: string | null = null;

  constructor(config: AgentMemoryConfig = {}) {
    this.config = {
      programId: "Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq",
      apiUrl: config.apiUrl || "https://api.agentmemory.io/v1",
      apiKey: config.apiKey || "",
      rpcUrl: config.rpcUrl || clusterApiUrl("devnet"),
      encryptionKey: config.encryptionKey || "",
      defaultTTL: config.defaultTTL || 86400 * 30, // 30 days
      tierConfig: {
        hot: { maxSize: 100, ttl: 86400 },      // 24 hours
        warm: { maxSize: 1000, ttl: 86400 * 7 }, // 7 days
        cold: { ttl: 86400 * 365 },               // 1 year
        ...config.tierConfig,
      },
      allowSharing: config.allowSharing ?? false,
      trustedAgents: config.trustedAgents || [],
      compressionThreshold: config.compressionThreshold || 86400 * 7, // 7 days
      debug: config.debug ?? false,
    };

    this.programId = new PublicKey(this.config.programId);

    // Initialize AgentMemory SDK client
    this.client = new AgentMemoryClient({
      apiUrl: this.config.apiUrl,
      apiKey: this.config.apiKey,
      debug: this.config.debug,
    });

    // Initialize encryption if key provided
    if (this.config.encryptionKey) {
      this.initializeEncryption();
    }

    if (this.config.debug) {
      console.log("[AgentMemory] Plugin initialized");
      console.log("[AgentMemory] Program ID:", this.config.programId);
      console.log("[AgentMemory] API URL:", this.config.apiUrl);
    }
  }

  /**
   * Initialize the plugin with Solana Agent Kit
   */
  async initialize(agentKit: any): Promise<void> {
    this.connection = agentKit.connection;
    
    // Create or get vault for this agent
    await this.initializeVault(agentKit);
    
    // Register tools with agent kit
    this.registerTools(agentKit);
    
    if (this.config.debug) {
      console.log("[AgentMemory] Plugin initialized with vault:", this.vaultId);
    }
  }

  /**
   * Initialize encryption from base58 key
   */
  private initializeEncryption(): void {
    try {
      const keyBytes = bs58.decode(this.config.encryptionKey);
      if (keyBytes.length !== 32) {
        throw new Error("Encryption key must be 32 bytes");
      }
      this.encryptionKeyPair = nacl.box.keyPair.fromSecretKey(keyBytes);
      
      if (this.config.debug) {
        console.log("[AgentMemory] Encryption initialized");
      }
    } catch (error) {
      console.error("[AgentMemory] Failed to initialize encryption:", error);
      throw new Error("Invalid encryption key format");
    }
  }

  /**
   * Initialize or retrieve vault for this agent
   */
  private async initializeVault(agentKit: any): Promise<void> {
    const agentPublicKey = agentKit.wallet.publicKey.toBase58();
    
    try {
      // Try to find existing vault
      const vaults = await this.client.listVaults({ owner: agentPublicKey });
      
      if (vaults.data.length > 0) {
        this.vaultId = vaults.data[0].id;
        
        if (this.config.debug) {
          console.log("[AgentMemory] Found existing vault:", this.vaultId);
        }
      } else {
        // Create new vault
        const vault = await this.client.createVault({
          name: `agent-vault-${agentPublicKey.slice(0, 8)}`,
          description: "Agent memory vault created by Solana Agent Kit",
          metadata: {
            createdBy: "solana-agent-kit-plugin",
            agentPublicKey,
            version: this.version,
          },
        });
        
        this.vaultId = vault.id;
        
        if (this.config.debug) {
          console.log("[AgentMemory] Created new vault:", this.vaultId);
        }
      }
    } catch (error) {
      console.error("[AgentMemory] Failed to initialize vault:", error);
      throw error;
    }
  }

  // ============================================================================
  // TOOL REGISTRATION
  // ============================================================================

  private registerTools(agentKit: any): void {
    // Store memory
    agentKit.registerTool({
      name: "memory_store",
      description: "Store a new memory on-chain with optional encryption. Returns memory ID.",
      parameters: {
        key: { type: "string", required: false, description: "Unique key for this memory" },
        content: { type: "any", required: true, description: "Memory content (string or object)" },
        tags: { type: "array", items: "string", required: false, description: "Tags for categorization" },
        importance: { type: "number", required: false, min: 0, max: 1, description: "Importance score (0-1)" },
        ttl: { type: "number", required: false, description: "Time to live in seconds" },
        encrypt: { type: "boolean", required: false, default: true, description: "Encrypt the memory" },
      },
      handler: this.handleStore.bind(this),
    });

    // Retrieve memories
    agentKit.registerTool({
      name: "memory_retrieve",
      description: "Retrieve memories matching a query with semantic search support",
      parameters: {
        query: { type: "string", required: true, description: "Search query" },
        limit: { type: "number", required: false, default: 5, description: "Max results" },
        tags: { type: "array", items: "string", required: false, description: "Filter by tags" },
        minImportance: { type: "number", required: false, description: "Minimum importance filter" },
        semantic: { type: "boolean", required: false, default: true, description: "Use semantic search" },
      },
      handler: this.handleRetrieve.bind(this),
    });

    // Update memory
    agentKit.registerTool({
      name: "memory_update",
      description: "Update an existing memory by ID",
      parameters: {
        memoryId: { type: "string", required: true, description: "Memory ID to update" },
        content: { type: "any", required: false, description: "New content" },
        importance: { type: "number", required: false, min: 0, max: 1 },
        tags: { type: "array", items: "string", required: false },
        append: { type: "boolean", required: false, default: false, description: "Append to existing content" },
      },
      handler: this.handleUpdate.bind(this),
    });

    // Delete memory
    agentKit.registerTool({
      name: "memory_delete",
      description: "Delete a memory (soft delete by default)",
      parameters: {
        memoryId: { type: "string", required: true, description: "Memory ID to delete" },
        permanent: { type: "boolean", required: false, default: false, description: "Permanently delete" },
      },
      handler: this.handleDelete.bind(this),
    });

    // Compress memories
    agentKit.registerTool({
      name: "memory_compress",
      description: "Compress old memories to save storage costs",
      parameters: {
        threshold: { type: "number", required: false, default: 0.5, description: "Compression threshold" },
        strategy: { type: "string", required: false, enum: ["summarize", "archive", "delete"], default: "summarize" },
        olderThan: { type: "number", required: false, description: "Only compress memories older than X seconds" },
      },
      handler: this.handleCompress.bind(this),
    });

    // Share memory
    agentKit.registerTool({
      name: "memory_share",
      description: "Share a memory with another agent",
      parameters: {
        memoryId: { type: "string", required: true },
        recipient: { type: "string", required: true, description: "Recipient public key" },
        permissions: { type: "object", required: true, description: "{ read: boolean, write?: boolean, share?: boolean }" },
        expiresAt: { type: "number", required: false, description: "Expiration timestamp" },
      },
      handler: this.handleShare.bind(this),
    });

    // Identity export
    agentKit.registerTool({
      name: "identity_export",
      description: "Export agent identity and memories as a bundle",
      parameters: {
        format: { type: "string", required: false, enum: ["json", "encrypted_json"], default: "encrypted_json" },
        includeMemories: { type: "boolean", required: false, default: true },
      },
      handler: this.handleIdentityExport.bind(this),
    });

    // Identity import
    agentKit.registerTool({
      name: "identity_import",
      description: "Import agent identity from a bundle",
      parameters: {
        bundle: { type: "string", required: true, description: "Identity bundle data" },
        verifyKey: { type: "string", required: false, description: "Verification key" },
      },
      handler: this.handleIdentityImport.bind(this),
    });
  }

  // ============================================================================
  // TOOL HANDLERS
  // ============================================================================

  private async handleStore(params: StoreParams): Promise<{ memoryId: string; status: string; tier: string }> {
    if (!this.vaultId) {
      throw new Error("Vault not initialized");
    }

    const key = params.key || this.generateMemoryKey(params.content);
    let content = params.content;
    let encrypted = false;

    // Encrypt if requested and encryption is available
    if (params.encrypt && this.encryptionKeyPair) {
      content = this.encryptContent(JSON.stringify(content));
      encrypted = true;
    }

    // Determine tier based on importance
    const importance = params.importance || 0.5;
    const tier = this.determineTier(importance);

    const request: StoreMemoryRequest = {
      key,
      data: {
        content,
        importance,
        tier,
        timestamp: Date.now(),
      },
      metadata: {
        tags: params.tags || [],
        labels: {
          tier,
          encrypted: encrypted ? "true" : "false",
        },
        contentType: typeof content === "string" ? "text" : "json",
      },
      ttl: params.ttl || this.config.defaultTTL,
    };

    try {
      const memory = await this.client.storeMemory(this.vaultId, request);
      
      if (this.config.debug) {
        console.log(`[AgentMemory] Stored memory: ${memory.id} (tier: ${tier})`);
      }

      return {
        memoryId: memory.id,
        status: "stored",
        tier,
      };
    } catch (error) {
      console.error("[AgentMemory] Failed to store memory:", error);
      throw error;
    }
  }

  private async handleRetrieve(params: RetrieveParams): Promise<{ memories: MemoryEntry[]; count: number }> {
    if (!this.vaultId) {
      throw new Error("Vault not initialized");
    }

    const searchOptions: MemorySearchOptions = {
      query: params.query,
      vaultId: this.vaultId,
      tags: params.tags,
      limit: params.limit || 5,
      semantic: params.semantic ?? true,
      minScore: params.minImportance ? params.minImportance * 0.8 : undefined,
    };

    try {
      const results = await this.client.searchMemories(searchOptions);
      
      // Transform to MemoryEntry format
      const memories: MemoryEntry[] = results.map(result => {
        const memory = result.memory;
        let content = memory.data?.content;
        
        // Decrypt if encrypted
        if (memory.metadata?.labels?.encrypted === "true" && this.encryptionKeyPair) {
          try {
            content = JSON.parse(this.decryptContent(content));
          } catch (e) {
            console.warn("[AgentMemory] Failed to decrypt memory:", memory.id);
          }
        }

        return {
          id: memory.id,
          key: memory.key,
          content,
          tags: memory.metadata?.tags || [],
          importance: memory.data?.importance || 0.5,
          timestamp: new Date(memory.createdAt).getTime(),
          ttl: memory.ttl || 0,
          owner: memory.createdBy,
          encrypted: memory.metadata?.labels?.encrypted === "true",
          version: memory.version,
        };
      });

      if (this.config.debug) {
        console.log(`[AgentMemory] Retrieved ${memories.length} memories`);
      }

      return {
        memories,
        count: memories.length,
      };
    } catch (error) {
      console.error("[AgentMemory] Failed to retrieve memories:", error);
      throw error;
    }
  }

  private async handleUpdate(params: UpdateParams): Promise<{ memoryId: string; status: string; version: number }> {
    if (!this.vaultId) {
      throw new Error("Vault not initialized");
    }

    try {
      // Get existing memory
      const existing = await this.client.getMemory(this.vaultId, params.memoryId);
      
      let content = params.content;
      
      // Handle append mode
      if (params.append && existing.data?.content) {
        const existingContent = existing.metadata?.labels?.encrypted === "true" && this.encryptionKeyPair
          ? JSON.parse(this.decryptContent(existing.data.content))
          : existing.data.content;
        
        content = typeof existingContent === "string" && typeof content === "string"
          ? `${existingContent}\n${content}`
          : { ...existingContent, ...content };
      }

      // Encrypt if memory was encrypted
      if (existing.metadata?.labels?.encrypted === "true" && this.encryptionKeyPair && content) {
        content = this.encryptContent(JSON.stringify(content));
      }

      const request: UpdateMemoryRequest = {
        data: content ? { ...existing.data, content } : undefined,
        metadata: {
          labels: params.importance !== undefined 
            ? { ...existing.metadata?.labels, importance: String(params.importance) }
            : undefined,
          tags: params.tags,
        },
      };

      const updated = await this.client.updateMemory(this.vaultId, params.memoryId, request);

      if (this.config.debug) {
        console.log(`[AgentMemory] Updated memory: ${updated.id} (v${updated.version})`);
      }

      return {
        memoryId: updated.id,
        status: "updated",
        version: updated.version,
      };
    } catch (error) {
      console.error("[AgentMemory] Failed to update memory:", error);
      throw error;
    }
  }

  private async handleDelete(params: { memoryId: string; permanent?: boolean }): Promise<{ memoryId: string; status: string }> {
    if (!this.vaultId) {
      throw new Error("Vault not initialized");
    }

    try {
      await this.client.deleteMemory(this.vaultId, params.memoryId, params.permanent || false);

      if (this.config.debug) {
        console.log(`[AgentMemory] Deleted memory: ${params.memoryId} (${params.permanent ? 'permanent' : 'soft'})`);
      }

      return {
        memoryId: params.memoryId,
        status: params.permanent ? "permanently_deleted" : "deleted",
      };
    } catch (error) {
      console.error("[AgentMemory] Failed to delete memory:", error);
      throw error;
    }
  }

  private async handleCompress(params: CompressParams): Promise<{ compressed: number; saved: number; strategy: string }> {
    if (!this.vaultId) {
      throw new Error("Vault not initialized");
    }

    const strategy = params.strategy || "summarize";
    const olderThan = params.olderThan || this.config.compressionThreshold;
    const cutoffDate = new Date(Date.now() - olderThan * 1000).toISOString();

    try {
      // Get old memories
      const oldMemories = await this.client.listMemories(this.vaultId, {
        createdBefore: cutoffDate,
        limit: 100,
      });

      let compressed = 0;
      let saved = 0;

      for (const memory of oldMemories.data) {
        const importance = memory.data?.importance || 0.5;
        
        if (importance < (params.threshold || 0.5)) {
          switch (strategy) {
            case "summarize":
              // In real implementation, this would use an LLM to summarize
              await this.client.updateMemory(this.vaultId, memory.key, {
                data: { ...memory.data, compressed: true },
                metadata: { labels: { ...memory.metadata?.labels, tier: "warm" } },
              });
              compressed++;
              saved += 100; // Estimated bytes saved
              break;
            
            case "archive":
              await this.client.updateMemory(this.vaultId, memory.key, {
                metadata: { labels: { ...memory.metadata?.labels, tier: "cold" } },
              });
              compressed++;
              break;
            
            case "delete":
              await this.client.deleteMemory(this.vaultId, memory.key, false);
              compressed++;
              saved += JSON.stringify(memory).length;
              break;
          }
        }
      }

      if (this.config.debug) {
        console.log(`[AgentMemory] Compressed ${compressed} memories (${strategy})`);
      }

      return {
        compressed,
        saved,
        strategy,
      };
    } catch (error) {
      console.error("[AgentMemory] Failed to compress memories:", error);
      throw error;
    }
  }

  private async handleShare(params: ShareParams): Promise<{ shareId: string; status: string }> {
    if (!this.vaultId) {
      throw new Error("Vault not initialized");
    }

    if (!this.config.allowSharing) {
      throw new Error("Memory sharing is disabled in configuration");
    }

    try {
      const grant = await this.client.grantAccess(this.vaultId, {
        userId: params.recipient,
        permission: params.permissions.write ? "write" : "read",
        expiresAt: params.expiresAt ? new Date(params.expiresAt).toISOString() : undefined,
        reason: `Shared memory ${params.memoryId}`,
      });

      if (this.config.debug) {
        console.log(`[AgentMemory] Shared memory with ${params.recipient}`);
      }

      return {
        shareId: grant.userId,
        status: "shared",
      };
    } catch (error) {
      console.error("[AgentMemory] Failed to share memory:", error);
      throw error;
    }
  }

  private async handleIdentityExport(params: IdentityExportParams): Promise<{ bundle: string; size: number; format: string }> {
    if (!this.vaultId) {
      throw new Error("Vault not initialized");
    }

    try {
      // Get vault info
      const vault = await this.client.getVault(this.vaultId);
      
      let memories: any[] = [];
      if (params.includeMemories) {
        const allMemories = await this.client.listMemories(this.vaultId, { limit: 1000 });
        memories = allMemories.data.map(m => ({
          key: m.key,
          data: m.data,
          metadata: m.metadata,
          version: m.version,
        }));
      }

      const identity = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        vault: {
          id: vault.id,
          name: vault.name,
          metadata: vault.metadata,
        },
        memories: params.includeMemories ? memories : undefined,
        config: {
          tierConfig: this.config.tierConfig,
          allowSharing: this.config.allowSharing,
        },
      };

      let bundle: string;
      
      if (params.format === "encrypted_json" && this.encryptionKeyPair) {
        bundle = this.encryptContent(JSON.stringify(identity));
      } else {
        bundle = JSON.stringify(identity, null, 2);
      }

      if (this.config.debug) {
        console.log(`[AgentMemory] Exported identity (${bundle.length} bytes)`);
      }

      return {
        bundle,
        size: bundle.length,
        format: params.format || "json",
      };
    } catch (error) {
      console.error("[AgentMemory] Failed to export identity:", error);
      throw error;
    }
  }

  private async handleIdentityImport(params: { bundle: string; verifyKey?: string }): Promise<{ imported: number; status: string }> {
    try {
      let identity: any;
      
      // Try to decrypt if encrypted
      if (this.encryptionKeyPair) {
        try {
          identity = JSON.parse(this.decryptContent(params.bundle));
        } catch {
          // Not encrypted, parse as JSON
          identity = JSON.parse(params.bundle);
        }
      } else {
        identity = JSON.parse(params.bundle);
      }

      if (!identity.vault || !identity.version) {
        throw new Error("Invalid identity bundle format");
      }

      let imported = 0;

      // Import memories if included
      if (identity.memories && this.vaultId) {
        for (const memory of identity.memories) {
          try {
            await this.client.storeMemory(this.vaultId, {
              key: memory.key,
              data: memory.data,
              metadata: memory.metadata,
            });
            imported++;
          } catch (e) {
            console.warn(`[AgentMemory] Failed to import memory ${memory.key}:`, e);
          }
        }
      }

      if (this.config.debug) {
        console.log(`[AgentMemory] Imported ${imported} memories from identity bundle`);
      }

      return {
        imported,
        status: "imported",
      };
    } catch (error) {
      console.error("[AgentMemory] Failed to import identity:", error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate a deterministic memory key from content
   */
  private generateMemoryKey(content: any): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(JSON.stringify(content) + timestamp);
    return `mem_${hash}_${timestamp}`;
  }

  /**
   * Simple hash function for memory IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 16);
  }

  /**
   * Determine storage tier based on importance
   */
  private determineTier(importance: number): "hot" | "warm" | "cold" {
    if (importance >= 0.8) return "hot";
    if (importance >= 0.4) return "warm";
    return "cold";
  }

  /**
   * Encrypt content using NaCl secretbox
   */
  private encryptContent(content: string): string {
    if (!this.encryptionKeyPair) {
      throw new Error("Encryption not initialized");
    }

    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const message = new TextEncoder().encode(content);
    const encrypted = nacl.secretbox(message, nonce, this.encryptionKeyPair.secretKey.slice(0, 32));

    // Combine nonce + encrypted data and encode as base58
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);

    return bs58.encode(combined);
  }

  /**
   * Decrypt content using NaCl secretbox
   */
  private decryptContent(encryptedContent: string): string {
    if (!this.encryptionKeyPair) {
      throw new Error("Encryption not initialized");
    }

    const combined = bs58.decode(encryptedContent);
    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const encrypted = combined.slice(nacl.secretbox.nonceLength);

    const decrypted = nacl.secretbox.open(encrypted, nonce, this.encryptionKeyPair.secretKey.slice(0, 32));
    
    if (!decrypted) {
      throw new Error("Failed to decrypt content");
    }

    return new TextDecoder().decode(decrypted);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Direct access to AgentMemory SDK client
   */
  getClient(): AgentMemoryClient {
    return this.client;
  }

  /**
   * Get current vault ID
   */
  getVaultId(): string | null {
    return this.vaultId;
  }

  /**
   * Check if encryption is enabled
   */
  isEncryptionEnabled(): boolean {
    return this.encryptionKeyPair !== null;
  }

  /**
   * Get encryption public key (for sharing)
   */
  getEncryptionPublicKey(): string | null {
    if (!this.encryptionKeyPair) return null;
    return bs58.encode(this.encryptionKeyPair.publicKey);
  }

  /**
   * Store a memory (direct API)
   */
  async store(params: StoreParams): Promise<{ memoryId: string; status: string; tier: string }> {
    return this.handleStore(params);
  }

  /**
   * Retrieve memories (direct API)
   */
  async retrieve(params: RetrieveParams): Promise<{ memories: MemoryEntry[]; count: number }> {
    return this.handleRetrieve(params);
  }

  /**
   * Update a memory (direct API)
   */
  async update(params: UpdateParams): Promise<{ memoryId: string; status: string; version: number }> {
    return this.handleUpdate(params);
  }

  /**
   * Delete a memory (direct API)
   */
  async delete(memoryId: string, permanent?: boolean): Promise<{ memoryId: string; status: string }> {
    return this.handleDelete({ memoryId, permanent });
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; vaultId: string | null; encrypted: boolean }> {
    try {
      const apiHealth = await this.client.health();
      return {
        status: apiHealth.status,
        vaultId: this.vaultId,
        encrypted: this.isEncryptionEnabled(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        vaultId: this.vaultId,
        encrypted: this.isEncryptionEnabled(),
      };
    }
  }
}

// Export default
export default AgentMemoryPlugin;
