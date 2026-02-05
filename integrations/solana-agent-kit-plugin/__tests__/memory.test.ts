import {
  storeMemoryAction,
  retrieveMemoryAction,
  searchMemoryAction,
  updateMemoryAction,
  deleteMemoryAction,
  archiveMemoryAction,
  createMemoryTools,
  agentMemoryPlugin
} from '../src';

// Mock the agentmemory SDK
jest.mock('agentmemory', () => {
  return {
    AgentMemory: jest.fn().mockImplementation(() => ({
      store: jest.fn(),
      retrieve: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      archive: jest.fn(),
      listRecent: jest.fn(),
      getVersions: jest.fn()
    }))
  };
});

// Mock Solana Agent Kit
type MockAgent = {
  agentId: string;
  network: string;
  wallet: {
    publicKey: {
      toString: () => string;
    };
  };
  [key: string]: any;
};

describe('AgentMemory Solana Agent Kit Plugin', () => {
  const mockAgent: MockAgent = {
    agentId: 'test-agent-123',
    network: 'devnet',
    wallet: { publicKey: { toString: () => 'mock-public-key' } }
  };

  const mockMemory = {
    id: 'mem_test123',
    content: 'Test memory content',
    importance: 'medium' as const,
    tags: ['test', 'memory'],
    category: 'custom' as const,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    encrypted: false,
    version: 1,
    signature: 'mock-signature'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Plugin Structure', () => {
    it('should export agentMemoryPlugin with correct metadata', () => {
      expect(agentMemoryPlugin).toBeDefined();
      expect(agentMemoryPlugin.name).toBe('@agentmemory/solana-agent-kit-plugin');
      expect(agentMemoryPlugin.actions).toHaveLength(8);
    });

    it('should have all required actions', () => {
      const actionNames = agentMemoryPlugin.actions.map(a => a.name);
      expect(actionNames).toContain('STORE_MEMORY');
      expect(actionNames).toContain('RETRIEVE_MEMORY');
      expect(actionNames).toContain('SEARCH_MEMORY');
      expect(actionNames).toContain('UPDATE_MEMORY');
      expect(actionNames).toContain('DELETE_MEMORY');
      expect(actionNames).toContain('ARCHIVE_MEMORY');
      expect(actionNames).toContain('RETRIEVE_MEMORY_VERSIONS');
      expect(actionNames).toContain('LIST_RECENT_MEMORIES');
    });
  });

  describe('STORE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(storeMemoryAction).toBeDefined();
      expect(storeMemoryAction.name).toBe('STORE_MEMORY');
      expect(storeMemoryAction.description).toContain('Store a memory');
      expect(storeMemoryAction.examples).toBeDefined();
      expect(storeMemoryAction.examples?.length).toBeGreaterThan(0);
    });

    it('should store memory successfully with valid input', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockStore = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ store: mockStore }));

      const result = await storeMemoryAction.handler(mockAgent as any, {
        content: 'Test content',
        importance: 'medium',
        tags: ['test']
      });

      expect(result.status).toBe('success');
      expect(result.memoryId).toBe('mem_test123');
      expect(result.signature).toBe('mock-signature');
      expect(mockStore).toHaveBeenCalledWith(expect.objectContaining({
        content: 'Test content',
        importance: 'medium',
        tags: ['test']
      }));
    });

    it('should handle validation errors for empty content', async () => {
      const result = await storeMemoryAction.handler(mockAgent as any, {
        content: ''  // Invalid: empty content
      });

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });

    it('should handle encryption parameter', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockStore = jest.fn().mockResolvedValue({ ...mockMemory, encrypted: true });
      AgentMemory.mockImplementation(() => ({ store: mockStore }));

      const result = await storeMemoryAction.handler(mockAgent as any, {
        content: 'Secret content',
        encrypted: true
      });

      expect(result.status).toBe('success');
      expect(result.encrypted).toBe(true);
      expect(mockStore).toHaveBeenCalledWith(expect.objectContaining({
        encrypted: true
      }));
    });

    it('should handle storage errors gracefully', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        store: jest.fn().mockRejectedValue(new Error('Storage failed'))
      }));

      const result = await storeMemoryAction.handler(mockAgent as any, {
        content: 'Test content'
      });

      expect(result.status).toBe('error');
      expect(result.error).toContain('Storage failed');
    });
  });

  describe('RETRIEVE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(retrieveMemoryAction).toBeDefined();
      expect(retrieveMemoryAction.name).toBe('RETRIEVE_MEMORY');
      expect(retrieveMemoryAction.description).toContain('Retrieve');
    });

    it('should retrieve memory by ID successfully', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockRetrieve = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ retrieve: mockRetrieve }));

      const result = await retrieveMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123',
        decrypt: true
      });

      expect(result.status).toBe('success');
      expect(result.memory.id).toBe('mem_test123');
      expect(result.memory.content).toBe('Test memory content');
      expect(mockRetrieve).toHaveBeenCalledWith('mem_test123', { decrypt: true });
    });

    it('should auto-decrypt encrypted memories when decrypt=true', async () => {
      const { AgentMemory } = require('agentmemory');
      const encryptedMemory = { ...mockMemory, encrypted: true, content: 'Decrypted content' };
      const mockRetrieve = jest.fn().mockResolvedValue(encryptedMemory);
      AgentMemory.mockImplementation(() => ({ retrieve: mockRetrieve }));

      const result = await retrieveMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123',
        decrypt: true
      });

      expect(result.status).toBe('success');
      expect(result.memory.encrypted).toBe(true);
      expect(result.memory.content).toBe('Decrypted content');
    });

    it('should handle not found errors', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({ retrieve: jest.fn().mockResolvedValue(null) }));

      const result = await retrieveMemoryAction.handler(mockAgent as any, {
        memoryId: 'non-existent'
      });

      expect(result.status).toBe('error');
      expect(result.code).toBe('NOT_FOUND');
      expect(result.memoryId).toBe('non-existent');
    });

    it('should handle decryption errors', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        retrieve: jest.fn().mockRejectedValue(new Error('Failed to decrypt'))
      }));

      const result = await retrieveMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123',
        decrypt: true
      });

      expect(result.status).toBe('error');
      expect(result.code).toBe('DECRYPTION_FAILED');
    });
  });

  describe('SEARCH_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(searchMemoryAction).toBeDefined();
      expect(searchMemoryAction.name).toBe('SEARCH_MEMORY');
      expect(searchMemoryAction.description).toContain('Search');
    });

    it('should search memories with query', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockSearch = jest.fn().mockResolvedValue([
        { memory: mockMemory, relevance: 0.95, matchedTags: ['test'] }
      ]);
      AgentMemory.mockImplementation(() => ({ search: mockSearch }));

      const result = await searchMemoryAction.handler(mockAgent as any, {
        query: 'test query',
        limit: 10
      });

      expect(result.status).toBe('success');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].relevance).toBe(0.95);
      expect(result.total).toBe(1);
    });

    it('should filter by tags correctly', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockSearch = jest.fn().mockResolvedValue([]);
      AgentMemory.mockImplementation(() => ({ search: mockSearch }));

      await searchMemoryAction.handler(mockAgent as any, {
        tags: ['important', 'work'],
        limit: 5
      });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['important', 'work'],
        limit: 5
      }));
    });

    it('should use semantic search with query parameter', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockSearch = jest.fn().mockResolvedValue([
        { memory: mockMemory, relevance: 0.88 }
      ]);
      AgentMemory.mockImplementation(() => ({ search: mockSearch }));

      const result = await searchMemoryAction.handler(mockAgent as any, {
        query: 'user preferences and settings'
      });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({
        query: 'user preferences and settings'
      }));
      expect(result.status).toBe('success');
    });

    it('should apply multiple filters', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockSearch = jest.fn().mockResolvedValue([]);
      AgentMemory.mockImplementation(() => ({ search: mockSearch }));

      await searchMemoryAction.handler(mockAgent as any, {
        query: 'test',
        tags: ['important'],
        importance: 'high',
        category: 'task',
        status: 'active',
        minRelevance: 0.7,
        limit: 20
      });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({
        query: 'test',
        tags: ['important'],
        importance: 'high',
        category: 'task',
        status: 'active',
        minRelevance: 0.7,
        limit: 20
      }));
    });
  });

  describe('UPDATE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(updateMemoryAction).toBeDefined();
      expect(updateMemoryAction.name).toBe('UPDATE_MEMORY');
      expect(updateMemoryAction.description).toContain('Update');
    });

    it('should update memory content successfully', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockUpdate = jest.fn().mockResolvedValue({
        ...mockMemory,
        version: 2,
        content: 'Updated content',
        updatedAt: Date.now()
      });
      AgentMemory.mockImplementation(() => ({ update: mockUpdate }));

      const result = await updateMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123',
        content: 'Updated content'
      });

      expect(result.status).toBe('success');
      expect(result.version).toBe(2);
      expect(result.memoryId).toBe('mem_test123');
    });

    it('should create version when createVersion is true', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockUpdate = jest.fn().mockResolvedValue({
        ...mockMemory,
        version: 2,
        previousVersion: 1,
        content: 'Updated content'
      });
      AgentMemory.mockImplementation(() => ({ update: mockUpdate }));

      const result = await updateMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123',
        content: 'Updated content',
        createVersion: true
      });

      expect(result.status).toBe('success');
      expect(result.version).toBe(2);
      expect(result.previousVersion).toBe(1);
    });

    it('should handle not found errors', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        update: jest.fn().mockRejectedValue(new Error('Memory not found'))
      }));

      const result = await updateMemoryAction.handler(mockAgent as any, {
        memoryId: 'non-existent'
      });

      expect(result.status).toBe('error');
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should handle permission errors', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        update: jest.fn().mockRejectedValue(new Error('permission denied'))
      }));

      const result = await updateMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123',
        content: 'New content'
      });

      expect(result.status).toBe('error');
      expect(result.code).toBe('PERMISSION_DENIED');
    });

    it('should update tags with addTags and removeTags', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockUpdate = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ update: mockUpdate }));

      const result = await updateMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123',
        addTags: ['new-tag'],
        removeTags: ['old-tag']
      });

      expect(result.status).toBe('success');
      expect(result.updatedFields).toContain('tags');
      expect(mockUpdate).toHaveBeenCalledWith('mem_test123', expect.objectContaining({
        addTags: ['new-tag'],
        removeTags: ['old-tag']
      }));
    });
  });

  describe('DELETE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(deleteMemoryAction).toBeDefined();
      expect(deleteMemoryAction.name).toBe('DELETE_MEMORY');
      expect(deleteMemoryAction.description).toContain('Delete');
    });

    it('should soft delete memory by default', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      AgentMemory.mockImplementation(() => ({ delete: mockDelete }));

      const result = await deleteMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123'
      });

      expect(result.status).toBe('success');
      expect(result.hardDelete).toBe(false);
      expect(result.deleted).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith('mem_test123', { hardDelete: false });
    });

    it('should hard delete when specified', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      AgentMemory.mockImplementation(() => ({ delete: mockDelete }));

      const result = await deleteMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123',
        hardDelete: true
      });

      expect(result.status).toBe('success');
      expect(result.hardDelete).toBe(true);
      expect(result.deleted).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith('mem_test123', { hardDelete: true });
    });

    it('should handle delete errors', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        delete: jest.fn().mockRejectedValue(new Error('Delete failed'))
      }));

      const result = await deleteMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123'
      });

      expect(result.status).toBe('error');
      expect(result.error).toContain('Delete failed');
    });
  });

  describe('ARCHIVE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(archiveMemoryAction).toBeDefined();
      expect(archiveMemoryAction.name).toBe('ARCHIVE_MEMORY');
      expect(archiveMemoryAction.description).toContain('Archive');
    });

    it('should archive memory successfully', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockArchive = jest.fn().mockResolvedValue(undefined);
      AgentMemory.mockImplementation(() => ({ archive: mockArchive }));

      const result = await archiveMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123'
      });

      expect(result.status).toBe('success');
      expect(result.archived).toBe(true);
      expect(result.memoryId).toBe('mem_test123');
      expect(mockArchive).toHaveBeenCalledWith('mem_test123');
    });

    it('should handle archive errors', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        archive: jest.fn().mockRejectedValue(new Error('Archive failed'))
      }));

      const result = await archiveMemoryAction.handler(mockAgent as any, {
        memoryId: 'mem_test123'
      });

      expect(result.status).toBe('error');
      expect(result.error).toContain('Archive failed');
    });
  });

  describe('LangChain Tools', () => {
    it('should export 5 memory tools', () => {
      const tools = createMemoryTools('test-agent', 'devnet');
      expect(tools).toHaveLength(5);
      
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('store_agent_memory');
      expect(toolNames).toContain('retrieve_agent_memory');
      expect(toolNames).toContain('search_agent_memories');
      expect(toolNames).toContain('update_agent_memory');
      expect(toolNames).toContain('delete_agent_memory');
    });

    it('tools should be compatible with LangChain Tool interface', () => {
      const tools = createMemoryTools('test-agent', 'devnet');
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(typeof tool.call).toBe('function');
      });
    });

    it('should handle store memory tool input', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockStore = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ store: mockStore }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const storeTool = tools.find(t => t.name === 'store_agent_memory');
      expect(storeTool).toBeDefined();

      const result = await storeTool!.call('Plain text content');
      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.memoryId).toBe('mem_test123');
    });

    it('should handle JSON input for store tool', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockStore = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ store: mockStore }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const storeTool = tools.find(t => t.name === 'store_agent_memory');

      const input = JSON.stringify({ content: 'Test', importance: 'high' });
      await storeTool!.call(input);

      expect(mockStore).toHaveBeenCalledWith(expect.objectContaining({
        content: 'Test',
        importance: 'high'
      }));
    });

    it('should handle retrieve memory tool', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockRetrieve = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ retrieve: mockRetrieve }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const retrieveTool = tools.find(t => t.name === 'retrieve_agent_memory');
      expect(retrieveTool).toBeDefined();

      const result = await retrieveTool!.call('mem_test123');
      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.memory.id).toBe('mem_test123');
    });

    it('should handle search memory tool', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockSearch = jest.fn().mockResolvedValue([
        { memory: mockMemory, relevance: 0.9 }
      ]);
      AgentMemory.mockImplementation(() => ({ search: mockSearch }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const searchTool = tools.find(t => t.name === 'search_agent_memories');
      expect(searchTool).toBeDefined();

      const result = await searchTool!.call('test query');
      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.results).toHaveLength(1);
    });

    it('should handle update memory tool', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockUpdate = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ update: mockUpdate }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const updateTool = tools.find(t => t.name === 'update_agent_memory');
      expect(updateTool).toBeDefined();

      const input = JSON.stringify({ memoryId: 'mem_test123', content: 'Updated' });
      const result = await updateTool!.call(input);
      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
    });

    it('should handle delete memory tool', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      AgentMemory.mockImplementation(() => ({ delete: mockDelete }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const deleteTool = tools.find(t => t.name === 'delete_agent_memory');
      expect(deleteTool).toBeDefined();

      const result = await deleteTool!.call('mem_test123');
      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.deleted).toBe(true);
    });

    it('should handle errors in tools gracefully', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        store: jest.fn().mockRejectedValue(new Error('Storage failed'))
      }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const storeTool = tools.find(t => t.name === 'store_agent_memory');

      const result = await storeTool!.call('content');
      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('Storage failed');
    });
  });

  describe('Plugin Initialization', () => {
    it('should initialize successfully with valid agent', async () => {
      const initResult = await agentMemoryPlugin.initialize!(mockAgent as any) as any;
      
      expect(initResult).toBeDefined();
      expect(initResult.status).toBe('ready');
      expect(initResult.actions).toBe(8);
      expect(initResult.features).toContain('store_memory');
      expect(initResult.features).toContain('search_memory');
    });

    it('should throw if agentId is missing', async () => {
      const agentWithoutId = { ...mockAgent, agentId: undefined };
      
      await expect(agentMemoryPlugin.initialize!(agentWithoutId as any))
        .rejects.toThrow('agent.agentId');
    });

    it('should have cleanup function', () => {
      const plugin = agentMemoryPlugin as any;
      expect(plugin.cleanup).toBeDefined();
      expect(typeof plugin.cleanup).toBe('function');
    });
  });
});
