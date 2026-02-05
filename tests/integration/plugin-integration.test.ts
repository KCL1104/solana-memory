import { MemoryStorage } from '../../src/core/storage';
import { IdentityBinding } from '../../src/identity/binding';
import { Connection, clusterApiUrl } from '@solana/web3.js';

describe('S.A.K. Plugin Integration', () => {
  let storage: MemoryStorage;
  let identityBinding: IdentityBinding;

  beforeEach(() => {
    storage = new MemoryStorage();
    const connection = new Connection(clusterApiUrl('devnet'));
    identityBinding = new IdentityBinding(connection, {
      requireSignatures: true,
      enableCrossSession: true,
      trustThreshold: 3
    });
  });

  afterEach(() => {
    storage.clear();
  });

  describe('Plugin Interface', () => {
    it('should export compatible memory storage', () => {
      // Verify storage has required methods for S.A.K. plugin
      expect(typeof storage.storeVote).toBe('function');
      expect(typeof storage.getVote).toBe('function');
      expect(typeof storage.getVotes).toBe('function');
      expect(typeof storage.storeProposal).toBe('function');
      expect(typeof storage.getProposal).toBe('function');
      expect(typeof storage.exportData).toBe('function');
      expect(typeof storage.importData).toBe('function');
    });

    it('should export compatible identity binding', () => {
      // Verify identity binding has required methods
      expect(typeof identityBinding.createIdentity).toBe('function');
      expect(typeof identityBinding.signMemory).toBe('function');
      expect(typeof identityBinding.verifyMemory).toBe('function');
      expect(typeof identityBinding.batchSignMemories).toBe('function');
      expect(typeof identityBinding.batchVerifyMemories).toBe('function');
    });
  });

  describe('Memory Type Support', () => {
    it('should support all required memory types', () => {
      const identity = identityBinding.createIdentity('plugin-agent');
      
      const memoryTypes = [
        'conversation',
        'learning',
        'preference',
        'task',
        'relationship',
        'knowledge',
        'system'
      ] as const;

      memoryTypes.forEach((type, i) => {
        const signedMemory = identityBinding.signMemory(identity.id, {
          key: `${type}-memory-${i}`,
          content: `Test ${type} content`,
          metadata: {
            memoryType: type,
            importance: 50,
            tags: [i]
          },
          vault: 'plugin-vault'
        });

        expect(signedMemory.metadata.memoryType).toBe(type);
        
        const verification = identityBinding.verifyMemory(signedMemory);
        expect(verification.valid).toBe(true);
      });
    });
  });

  describe('Plugin Configuration', () => {
    it('should accept plugin-specific configuration', () => {
      const connection = new Connection(clusterApiUrl('devnet'));
      
      // Create binding with plugin config
      const pluginBinding = new IdentityBinding(connection, {
        requireSignatures: false, // Plugin may not require signatures
        signatureExpiryHours: 0,
        enableCrossSession: true,
        trustThreshold: 1 // Lower threshold for plugin use
      });

      const identity = pluginBinding.createIdentity('plugin-agent');
      expect(identity).toBeDefined();

      // Should work with relaxed config
      const signedMemory = pluginBinding.signMemory(identity.id, {
        key: 'test-memory',
        content: 'Test content',
        metadata: {
          memoryType: 'conversation',
          importance: 50,
          tags: []
        },
        vault: 'plugin-vault'
      });

      expect(signedMemory).toBeDefined();
    });
  });

  describe('Data Export/Import for Plugin State', () => {
    it('should export plugin-compatible data format', () => {
      // Create plugin state
      const identity = identityBinding.createIdentity('plugin-agent');
      
      storage.storeVote({
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: identity.id,
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      });

      const signedMemory = identityBinding.signMemory(identity.id, {
        key: 'plugin-memory',
        content: 'Plugin state data',
        metadata: {
          memoryType: 'system',
          importance: 100,
          tags: [1, 2, 3]
        },
        vault: 'plugin-vault'
      });

      // Export
      const exported = storage.exportData();
      expect(exported).toHaveProperty('votes');
      expect(exported).toHaveProperty('proposals');
      expect(exported).toHaveProperty('delegations');

      // Should be JSON serializable
      const serialized = JSON.stringify(exported);
      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);

      // Should be deserializable
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toHaveProperty('votes');
    });

    it('should import plugin state data', () => {
      // Create initial state
      const identity = identityBinding.createIdentity('plugin-agent');
      storage.storeVote({
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: identity.id,
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      });

      const exported = storage.exportData();
      
      // Clear and reimport
      storage.clear();
      expect(storage.getStats().totalVotes).toBe(0);

      storage.importData(exported);
      expect(storage.getStats().totalVotes).toBe(1);
      expect(storage.getVote('vote-1')).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    it('should support plugin event patterns', () => {
      // Simulate plugin event handling
      const events: string[] = [];

      // Create wrapper that emits events
      const pluginStorage = {
        ...storage,
        storeVote: (vote: any) => {
          events.push('vote:stored');
          storage.storeVote(vote);
        },
        storeProposal: (proposal: any) => {
          events.push('proposal:stored');
          storage.storeProposal(proposal);
        }
      };

      // Use plugin storage
      pluginStorage.storeVote({
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: 'voter-1',
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      });

      pluginStorage.storeProposal({
        id: 'proposal-1',
        title: 'Test',
        description: 'Test',
        category: 'treasury',
        state: 'voting',
        proposer: 'p',
        realm: 'r',
        daoName: 'DAO',
        createdAt: Date.now(),
        votingStartsAt: Date.now(),
        votingEndsAt: Date.now() + 86400000,
        votesYes: 0,
        votesNo: 0,
        votesAbstain: 0,
        totalVotingPower: 0,
        quorum: 0,
        threshold: 0
      });

      expect(events).toContain('vote:stored');
      expect(events).toContain('proposal:stored');
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should support plugin initialization', () => {
      // Simulate plugin init
      const initPlugin = () => {
        const connection = new Connection(clusterApiUrl('devnet'));
        return {
          storage: new MemoryStorage(),
          identity: new IdentityBinding(connection, {
            requireSignatures: true,
            enableCrossSession: true,
            trustThreshold: 3
          })
        };
      };

      const plugin = initPlugin();
      expect(plugin.storage).toBeDefined();
      expect(plugin.identity).toBeDefined();

      // Should be ready for use
      const agent = plugin.identity.createIdentity('plugin-agent');
      expect(agent).toBeDefined();
    });

    it('should support plugin shutdown with cleanup', () => {
      const connection = new Connection(clusterApiUrl('devnet'));
      const pluginStorage = new MemoryStorage();
      const pluginIdentity = new IdentityBinding(connection);

      // Create some state
      const agent = pluginIdentity.createIdentity('plugin-agent');
      pluginStorage.storeVote({
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: agent.id,
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      });

      // Simulate shutdown - export state for persistence
      const exported = pluginStorage.exportData();
      expect(exported).toBeDefined();

      // Clear memory
      pluginStorage.clear();
      expect(pluginStorage.getStats().totalVotes).toBe(0);
    });
  });

  describe('Plugin Hooks', () => {
    it('should support pre/post operation hooks', () => {
      const hooks = {
        beforeStore: jest.fn(),
        afterStore: jest.fn()
      };

      // Create hooked storage
      const hookedStorage = {
        storeVote: (vote: any) => {
          hooks.beforeStore(vote);
          storage.storeVote(vote);
          hooks.afterStore(vote);
        },
        getVote: (id: string) => storage.getVote(id),
        getVotes: (query?: any) => storage.getVotes(query)
      };

      const testVote = {
        id: 'vote-1',
        proposalId: 'proposal-1',
        voter: 'voter-1',
        choice: 'yes',
        votingPower: 100,
        timestamp: Date.now()
      };

      hookedStorage.storeVote(testVote);

      expect(hooks.beforeStore).toHaveBeenCalledWith(testVote);
      expect(hooks.afterStore).toHaveBeenCalledWith(testVote);
    });
  });
});
