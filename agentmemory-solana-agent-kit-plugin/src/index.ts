import { SolanaAgentKit, Plugin } from "@solana-agent-kit/core";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export interface AgentMemoryConfig {
  programId: string;
  encryptionKey?: string;
  defaultTTL?: number;
  tierConfig?: {
    hot: { maxSize: number; ttl: number };
    warm: { maxSize: number; ttl: number };
    cold: { ttl: number };
  };
  allowSharing?: boolean;
  trustedAgents?: string[];
}

export interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  importance: number;
  timestamp: number;
  ttl: number;
  owner: string;
  encrypted: boolean;
}

export interface MemoryQuery {
  query: string;
  limit?: number;
  tags?: string[];
  timeRange?: { start: number; end: number };
  minImportance?: number;
}

export class AgentMemoryPlugin implements Plugin {
  name = "agentmemory";
  version = "0.1.0";
  
  private config: AgentMemoryConfig;
  private connection: Connection | null = null;
  private programId: PublicKey;

  constructor(config: AgentMemoryConfig) {
    this.config = {
      defaultTTL: 86400 * 30,
      allowSharing: false,
      tierConfig: {
        hot: { maxSize: 100, ttl: 86400 },
        warm: { maxSize: 1000, ttl: 86400 * 7 },
        cold: { ttl: 86400 * 365 },
      },
      ...config,
    };
    this.programId = new PublicKey(config.programId);
  }

  async initialize(agentKit: SolanaAgentKit): Promise<void> {
    this.connection = agentKit.connection;
    
    // Register tools with Solana Agent Kit
    this.registerTools(agentKit);
    
    console.log("[AgentMemory] Plugin initialized with program:", this.config.programId);
  }

  private registerTools(agentKit: SolanaAgentKit): void {
    // Memory storage tool
    agentKit.registerTool({
      name: "memory_store",
      description: "Store a new memory on-chain with optional encryption",
      parameters: {
        content: { type: "string", required: true },
        tags: { type: "array", items: "string", required: false },
        importance: { type: "number", required: false, min: 0, max: 1 },
        ttl: { type: "number", required: false },
        encrypt: { type: "boolean", required: false, default: true },
      },
      handler: this.handleStore.bind(this),
    });

    // Memory retrieval tool
    agentKit.registerTool({
      name: "memory_retrieve",
      description: "Retrieve memories matching a query with semantic search",
      parameters: {
        query: { type: "string", required: true },
        limit: { type: "number", required: false, default: 5 },
        tags: { type: "array", items: "string", required: false },
        timeRange: { type: "object", required: false },
        minImportance: { type: "number", required: false },
      },
      handler: this.handleRetrieve.bind(this),
    });

    // Memory update tool
    agentKit.registerTool({
      name: "memory_update",
      description: "Update an existing memory",
      parameters: {
        memoryId: { type: "string", required: true },
        content: { type: "string", required: false },
        importance: { type: "number", required: false, min: 0, max: 1 },
        tags: { type: "array", items: "string", required: false },
      },
      handler: this.handleUpdate.bind(this),
    });

    // Memory compression tool
    agentKit.registerTool({
      name: "memory_compress",
      description: "Compress old memories to save storage costs",
      parameters: {
        threshold: { type: "number", required: false, default: 0.5 },
        strategy: { type: "string", required: false, enum: ["summarize", "archive"] },
      },
      handler: this.handleCompress.bind(this),
    });

    // Identity export tool
    agentKit.registerTool({
      name: "identity_export",
      description: "Export agent identity and memories as a bundle",
      parameters: {
        format: { type: "string", required: false, enum: ["json", "encrypted_json"], default: "encrypted_json" },
      },
      handler: this.handleIdentityExport.bind(this),
    });
  }

  private async handleStore(params: any): Promise<{ memoryId: string; status: string }> {
    // TODO: Implement on-chain memory storage
    // 1. Encrypt content if encryptionKey provided
    // 2. Build Solana transaction
    // 3. Send transaction via agentKit
    // 4. Return memory ID (PDA derived from content hash + timestamp)
    
    const memoryId = this.generateMemoryId(params.content);
    
    console.log(`[AgentMemory] Storing memory: ${memoryId.substring(0, 16)}...`);
    
    return {
      memoryId,
      status: "stored",
    };
  }

  private async handleRetrieve(params: MemoryQuery): Promise<{ memories: MemoryEntry[] }> {
    // TODO: Implement semantic memory retrieval
    // 1. Query on-chain memory index
    // 2. Decrypt results if encrypted
    // 3. Rank by semantic similarity to query
    // 4. Return matching memories
    
    console.log(`[AgentMemory] Retrieving memories for query: ${params.query.substring(0, 50)}...`);
    
    return {
      memories: [], // Placeholder
    };
  }

  private async handleUpdate(params: any): Promise<{ memoryId: string; status: string }> {
    // TODO: Implement memory update
    console.log(`[AgentMemory] Updating memory: ${params.memoryId.substring(0, 16)}...`);
    
    return {
      memoryId: params.memoryId,
      status: "updated",
    };
  }

  private async handleCompress(params: any): Promise<{ compressed: number; saved: number }> {
    // TODO: Implement memory compression
    console.log(`[AgentMemory] Compressing memories with threshold: ${params.threshold}`);
    
    return {
      compressed: 0,
      saved: 0,
    };
  }

  private async handleIdentityExport(params: any): Promise<{ bundle: string; size: number }> {
    // TODO: Implement identity export
    console.log(`[AgentMemory] Exporting identity in format: ${params.format}`);
    
    return {
      bundle: "",
      size: 0,
    };
  }

  private generateMemoryId(content: string): string {
    // Generate deterministic memory ID from content hash + timestamp
    const timestamp = Date.now();
    const hash = this.simpleHash(content + timestamp);
    return `mem_${hash}_${timestamp}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 16);
  }
}

export default AgentMemoryPlugin;