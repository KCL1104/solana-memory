// Tool definitions for individual memory operations
// These can be imported separately for granular control

export interface StoreMemoryParams {
  content: string;
  tags?: string[];
  importance?: number;
  ttl?: number;
  encrypt?: boolean;
  context?: Record<string, any>;
}

export interface RetrieveMemoryParams {
  query: string;
  limit?: number;
  tags?: string[];
  timeRange?: { start: number; end: number };
  minImportance?: number;
  includeEncrypted?: boolean;
}

export interface UpdateMemoryParams {
  memoryId: string;
  content?: string;
  importance?: number;
  tags?: string[];
  append?: boolean;
}

export interface DeleteMemoryParams {
  memoryId: string;
  permanent?: boolean;
}

export interface CompressMemoryParams {
  threshold?: number;
  strategy?: "summarize" | "archive" | "delete";
  tags?: string[];
  olderThan?: number;
}

export interface ShareMemoryParams {
  memoryId: string;
  recipient: string;
  permissions: {
    read: boolean;
    write?: boolean;
    share?: boolean;
  };
  expiresAt?: number;
}

// Specific tool implementations will go here
// Each tool handles one memory operation with full type safety