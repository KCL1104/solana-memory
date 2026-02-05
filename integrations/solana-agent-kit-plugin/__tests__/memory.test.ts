import {
  storeMemoryAction,
  retrieveMemoryAction,
  retrieveMemoryVersionsAction,
  searchMemoryAction,
  listRecentMemoriesAction,
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

describe('AgentMemory Solana Agent Kit Plugin', () => {
  const mockAgent = {
    agentId: 'test-agent-123',
    network: 'devnet',
    wallet: { publicKey: { toString: () => 'mock-public-key' } }
  };

  const mockMemory = {
    id: 'mem_test123',
    content: 'Test memory content',
    importance: 'medium',
    tags: ['test', 'memory'],
    category: 'custom',
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
      expect(agentMemoryPlugin.version).toBe('1.0.0');
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
    });

    it('should validate input parameters', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockStore = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ store: mockStore }));

      const result = await storeMemoryAction.handler(mockAgent, {
        content: 'Test content',
        importance: 'medium',
        tags: ['test']
      });

      expect(result.status).toBe('success');
      expect(mockStore).toHaveBeenCalledWith(expect.objectContaining({
        content: 'Test content',
        importance: 'medium',
        tags: ['test']
      }));
    });

    it('should handle validation errors', async () => {
      const result = await storeMemoryAction.handler(mockAgent, {
        content: ''  // Invalid: empty content
      });

      expect(result.status).toBe('error');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('RETRIEVE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(retrieveMemoryAction).toBeDefined();
      expect(retrieveMemoryAction.name).toBe('RETRIEVE_MEMORY');
    });

    it('should retrieve memory by ID', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockRetrieve = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ retrieve: mockRetrieve }));

      const result = await retrieveMemoryAction.handler(mockAgent, {
        memoryId: 'mem_test123'
      });

      expect(result.status).toBe('success');
      expect(result.memory.id).toBe('mem_test123');
    });

    it('should handle not found errors', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({ retrieve: jest.fn().mockResolvedValue(null) }));

      const result = await retrieveMemoryAction.handler(mockAgent, {
        memoryId: 'non-existent'
      });

      expect(result.status).toBe('error');
      expect(result.code).toBe('NOT_FOUND');
    });
  });

  describe('SEARCH_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(searchMemoryAction).toBeDefined();
      expect(searchMemoryAction.name).toBe('SEARCH_MEMORY');
    });

    it('should search memories with query', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockSearch = jest.fn().mockResolvedValue([
        { memory: mockMemory, relevance: 0.95 }
      ]);
      AgentMemory.mockImplementation(() => ({ search: mockSearch }));

      const result = await searchMemoryAction.handler(mockAgent, {
        query: 'test',
        limit: 10
      });

      expect(result.status).toBe('success');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].relevance).toBe(0.95);
    });

    it('should apply filters correctly', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockSearch = jest.fn().mockResolvedValue([]);
      AgentMemory.mockImplementation(() => ({ search: mockSearch }));

      await searchMemoryAction.handler(mockAgent, {
        tags: ['important'],
        importance: 'high',
        category: 'task'
      });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['important'],
        importance: 'high',
        category: 'task'
      }));
    });
  });

  describe('UPDATE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(updateMemoryAction).toBeDefined();
      expect(updateMemoryAction.name).toBe('UPDATE_MEMORY');
    });

    it('should update memory with new content', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockUpdate = jest.fn().mockResolvedValue({
        ...mockMemory,
        version: 2,
        content: 'Updated content'
      });
      AgentMemory.mockImplementation(() => ({ update: mockUpdate }));

      const result = await updateMemoryAction.handler(mockAgent, {
        memoryId: 'mem_test123',
        content: 'Updated content'
      });

      expect(result.status).toBe('success');
      expect(result.version).toBe(2);
    });

    it('should handle not found errors', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        update: jest.fn().mockRejectedValue(new Error('Memory not found'))
      }));

      const result = await updateMemoryAction.handler(mockAgent, {
        memoryId: 'non-existent'
      });

      expect(result.status).toBe('error');
      expect(result.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(deleteMemoryAction).toBeDefined();
      expect(deleteMemoryAction.name).toBe('DELETE_MEMORY');
    });

    it('should soft delete memory', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      AgentMemory.mockImplementation(() => ({ delete: mockDelete }));

      const result = await deleteMemoryAction.handler(mockAgent, {
        memoryId: 'mem_test123',
        hardDelete: false
      });

      expect(result.status).toBe('success');
      expect(result.hardDelete).toBe(false);
    });
  });

  describe('ARCHIVE_MEMORY Action', () => {
    it('should be defined with correct metadata', () => {
      expect(archiveMemoryAction).toBeDefined();
      expect(archiveMemoryAction.name).toBe('ARCHIVE_MEMORY');
    });

    it('should archive memory', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockArchive = jest.fn().mockResolvedValue(undefined);
      AgentMemory.mockImplementation(() => ({ archive: mockArchive }));

      const result = await archiveMemoryAction.handler(mockAgent, {
        memoryId: 'mem_test123'
      });

      expect(result.status).toBe('success');
      expect(result.archived).toBe(true);
    });
  });

  describe('LangChain Tools', () => {
    it('should create 5 memory tools', () => {
      const tools = createMemoryTools('test-agent', 'devnet');
      expect(tools).toHaveLength(5);
      
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('store_agent_memory');
      expect(toolNames).toContain('retrieve_agent_memory');
      expect(toolNames).toContain('search_agent_memories');
      expect(toolNames).toContain('update_agent_memory');
      expect(toolNames).toContain('delete_agent_memory');
    });

    it('should handle store memory tool input', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockStore = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ store: mockStore }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const storeTool = tools.find(t => t.name === 'store_agent_memory');

      const result = await storeTool?.call('Plain text content');
      const parsed = JSON.parse(result!);
      
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
      await storeTool?.call(input);

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

      const result = await retrieveTool?.call('mem_test123');
      const parsed = JSON.parse(result!);
      
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

      const result = await searchTool?.call('test query');
      const parsed = JSON.parse(result!);
      
      expect(parsed.success).toBe(true);
      expect(parsed.results).toHaveLength(1);
    });

    it('should handle update memory tool', async () => {
      const { AgentMemory } = require('agentmemory');
      const mockUpdate = jest.fn().mockResolvedValue(mockMemory);
      AgentMemory.mockImplementation(() => ({ update: mockUpdate }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const updateTool = tools.find(t => t.name === 'update_agent_memory');

      const input = JSON.stringify({ memoryId: 'mem_test123', content: 'Updated' });
      const result = await updateTool?.call(input);
      const parsed = JSON.parse(result!);
      
      expect(parsed.success).toBe(true);
    });

    it('should handle errors in tools gracefully', async () => {
      const { AgentMemory } = require('agentmemory');
      AgentMemory.mockImplementation(() => ({
        store: jest.fn().mockRejectedValue(new Error('Storage failed'))
      }));

      const tools = createMemoryTools('test-agent', 'devnet');
      const storeTool = tools.find(t => t.name === 'store_agent_memory');

      const result = await storeTool?.call('content');
      const parsed = JSON.parse(result!);
      
      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('Storage failed');
    });
  });

  describe('Plugin Initialization', () => {
    it('should initialize successfully', async () => {
      const initResult = await agentMemoryPlugin.initialize!(mockAgent);
      
      expect(initResult.status).toBe('ready');
      expect(initResult.actions).toBe(8);
      expect(initResult.features).toContain('store_memory');
      expect(initResult.features).toContain('search_memory');
    });

    it('should throw if agentId is missing', async () => {
      const agentWithoutId = { ...mockAgent, agentId: undefined };
      
      await expect(agentMemoryPlugin.initialize!(agentWithoutId))
        .rejects.toThrow('agent.agentId');
    });
  });
});
