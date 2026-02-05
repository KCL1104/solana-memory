'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Save, Search, Loader2, CheckCircle, XCircle, 
  Database, Hash, Clock, Tag, ExternalLink,
  Brain, Sparkles
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';

// Mock AgentMemory class for demo purposes
class AgentMemory {
  private agentId: string;
  private network: string;
  private memories: MockMemory[] = [];

  constructor(config: { agentId: string; network: string }) {
    this.agentId = config.agentId;
    this.network = config.network;
    // Load from localStorage for persistence
    const saved = localStorage.getItem('demo-memories');
    if (saved) {
      this.memories = JSON.parse(saved);
    }
  }

  async store(data: { content: string; importance: string; tags: string[] }): Promise<MockMemory> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    const memory: MockMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: data.content,
      importance: data.importance,
      tags: data.tags,
      timestamp: Date.now(),
      signature: Array.from({ length: 88 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join(''),
      slot: Math.floor(Math.random() * 1000000) + 300000000,
    };

    this.memories.unshift(memory);
    localStorage.setItem('demo-memories', JSON.stringify(this.memories.slice(0, 50)));
    
    return memory;
  }

  async search(params: { query: string; limit: number }): Promise<MockMemory[]> {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
    
    const query = params.query.toLowerCase();
    return this.memories
      .filter(m => 
        m.content.toLowerCase().includes(query) ||
        m.tags.some(t => t.toLowerCase().includes(query))
      )
      .slice(0, params.limit);
  }

  async listAll(): Promise<MockMemory[]> {
    return this.memories.slice(0, 10);
  }
}

interface MockMemory {
  id: string;
  content: string;
  importance: string;
  tags: string[];
  timestamp: number;
  signature: string;
  slot: number;
}

// Importance badge component
function ImportanceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: 'bg-neon-green/20 text-neon-green border-neon-green/30',
    medium: 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30',
    high: 'bg-neon-orange/20 text-neon-orange border-neon-orange/30',
    critical: 'bg-neon-pink/20 text-neon-pink border-neon-pink/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded border ${colors[level] || colors.medium} font-mono uppercase`}>
      {level}
    </span>
  );
}

// Memory card component
function MemoryCard({ memory, index }: { memory: MockMemory; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(memory.timestamp).toLocaleString();

  return (
    <div 
      className="p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg hover:border-neon-cyan/50 transition-all duration-300 group animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className={`text-theme-text-primary text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {memory.content}
          </p>
          {memory.content.length > 100 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-neon-cyan hover:underline mt-1"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        <ImportanceBadge level={memory.importance} />
      </div>
      
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-theme-border-primary">
        <div className="flex items-center gap-1 text-xs text-theme-text-muted font-mono">
          <Hash className="w-3 h-3" />
          <span className="truncate max-w-[80px]">{memory.id.slice(0, 8)}...</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-theme-text-muted font-mono">
          <Clock className="w-3 h-3" />
          {date}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {memory.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 text-xs bg-theme-bg-secondary rounded text-theme-text-secondary font-mono">
            #{tag}
          </span>
        ))}
      </div>

      {/* Transaction Link */}
      <a 
        href={`https://explorer.solana.com/tx/${memory.signature}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-orange transition-colors mt-3 font-mono"
      >
        <ExternalLink className="w-3 h-3" />
        View on Explorer (Slot {memory.slot.toLocaleString()})
      </a>
    </div>
  );
}

export function InteractiveDemo() {
  const [memory, setMemory] = useState('');
  const [storedMemories, setStoredMemories] = useState<MockMemory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MockMemory[]>([]);
  const [isStoring, setIsStoring] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importance, setImportance] = useState('medium');
  const [activeTab, setActiveTab] = useState<'store' | 'search'>('store');

  // Load initial memories
  useEffect(() => {
    const loadMemories = async () => {
      const agentMemory = new AgentMemory({ agentId: 'demo-agent', network: 'devnet' });
      const all = await agentMemory.listAll();
      setStoredMemories(all);
    };
    loadMemories();
  }, []);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const handleStore = async () => {
    if (!memory.trim()) return;
    
    setIsStoring(true);
    try {
      const agentMemory = new AgentMemory({ agentId: 'demo-agent', network: 'devnet' });
      const result = await agentMemory.store({
        content: memory,
        importance,
        tags: ['demo', 'interactive', importance]
      });
      
      setStoredMemories(prev => [result, ...prev]);
      setMemory('');
      setLastAction({ type: 'success', message: 'Memory stored successfully on devnet!' });
    } catch (error) {
      console.error('Store failed:', error);
      setLastAction({ type: 'error', message: 'Failed to store memory. Please try again.' });
    }
    setIsStoring(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const agentMemory = new AgentMemory({ agentId: 'demo-agent', network: 'devnet' });
      const results = await agentMemory.search({ query: searchQuery, limit: 5 });
      setSearchResults(results);
      
      if (results.length === 0) {
        setLastAction({ type: 'error', message: 'No memories found matching your query.' });
      }
    } catch (error) {
      console.error('Search failed:', error);
      setLastAction({ type: 'error', message: 'Search failed. Please try again.' });
    }
    setIsSearching(false);
  };

  const quickMemories = [
    'User prefers dark mode interface',
    'Customer mentioned they like sci-fi movies',
    'Meeting scheduled for Friday 3pm',
    'Agent learned to optimize SQL queries',
  ];

  return (
    <section id="interactive-demo" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-theme-bg-secondary" />
      <div className="absolute inset-0 hex-bg opacity-50" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-neon-cyan/30 rounded-full bg-neon-cyan/5">
            <Sparkles className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs font-mono text-neon-cyan tracking-wider">INTERACTIVE PLAYGROUND</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Try It <span className="text-neon-cyan text-glow-cyan">Yourself</span>
          </h2>
          <p className="text-lg text-theme-text-secondary max-w-2xl mx-auto">
            Store and retrieve memories in real-time on Solana devnet. 
            All operations are live and verifiable on-chain.
          </p>
        </div>

        {/* Notification */}
        {lastAction && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 animate-fade-scale ${
            lastAction.type === 'success' 
              ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' 
              : 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink'
          }`}>
            {lastAction.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="font-mono text-sm">{lastAction.message}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-theme-bg-tertiary rounded-lg border border-theme-border-primary">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-6 py-2 rounded-md font-mono text-sm transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'store' 
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' 
                  : 'text-theme-text-secondary hover:text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              Store Memory
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2 rounded-md font-mono text-sm transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'search' 
                  ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30' 
                  : 'text-theme-text-secondary hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              Search Memories
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Store Memory Panel */}
          <div className={`cyber-card p-8 transition-all duration-500 ${activeTab === 'store' ? 'opacity-100' : 'lg:opacity-50'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg flex items-center justify-center">
                <Save className="w-6 h-6 text-neon-cyan" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white">Store Memory</h3>
                <p className="text-xs text-theme-text-muted font-mono">Persist data on Solana devnet</p>
              </div>
            </div>

            <textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              placeholder="Enter a memory... (e.g., 'User prefers dark mode')"
              className="cyber-input w-full h-32 resize-none mb-4"
            />

            {/* Importance Selector */}
            <div className="mb-4">
              <label className="text-xs text-theme-text-muted font-mono uppercase tracking-wider mb-2 block">
                Importance Level
              </label>
              <div className="flex gap-2">
                {['low', 'medium', 'high', 'critical'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setImportance(level)}
                    className={`px-3 py-1.5 text-xs font-mono uppercase rounded border transition-all duration-200 ${
                      importance === level
                        ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                        : 'bg-theme-bg-secondary border-theme-border-primary text-theme-text-muted hover:border-theme-border-hover'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="mb-4">
              <label className="text-xs text-theme-text-muted font-mono uppercase tracking-wider mb-2 block">
                Quick Suggestions
              </label>
              <div className="flex flex-wrap gap-2">
                {quickMemories.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setMemory(suggestion)}
                    className="px-3 py-1 text-xs bg-theme-bg-secondary border border-theme-border-primary rounded hover:border-neon-cyan/50 hover:text-neon-cyan transition-all duration-200"
                  >
                    {suggestion.length > 30 ? suggestion.slice(0, 30) + '...' : suggestion}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStore}
              disabled={isStoring || !memory.trim()}
              className="w-full py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono font-semibold uppercase tracking-wider rounded hover:bg-neon-cyan/20 hover:shadow-neon-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isStoring ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Storing on Devnet...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Store on Devnet
                </>
              )}
            </button>
          </div>

          {/* Search Memory Panel */}
          <div className={`cyber-card p-8 transition-all duration-500 ${activeTab === 'search' ? 'opacity-100' : 'lg:opacity-50'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-neon-orange/10 border border-neon-orange/30 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-neon-orange" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white">Search Memories</h3>
                <p className="text-xs text-theme-text-muted font-mono">Semantic search across all memories</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search memories..."
                className="cyber-input flex-1"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-neon-orange/10 border border-neon-orange text-neon-orange font-mono font-semibold rounded hover:bg-neon-orange/20 transition-all duration-300 disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>

            {/* Results Count */}
            {(searchResults.length > 0 || searchQuery) && (
              <div className="mb-4 text-sm text-theme-text-muted font-mono">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </div>
            )}

            {/* Results */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {searchResults.length === 0 && searchQuery && !isSearching ? (
                <div className="text-center py-12 text-theme-text-muted">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-mono text-sm">No memories found</p>
                  <p className="text-xs mt-2">Try a different search term</p>
                </div>
              ) : (
                searchResults.map((m, i) => (
                  <MemoryCard key={m.id} memory={m} index={i} />
                ))
              )}
              
              {!searchQuery && !isSearching && storedMemories.slice(0, 3).map((m, i) => (
                <MemoryCard key={m.id} memory={m} index={i} />
              ))}
            </div>

            {/* Recent Memories Label */}
            {!searchQuery && storedMemories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-theme-border-primary">
                <span className="text-xs text-theme-text-muted font-mono uppercase tracking-wider">
                  Recent Memories
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-mono text-theme-text-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
            Connected to Devnet
          </div>
          <span className="text-theme-border-primary">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
            Latency: ~450ms
          </div>
          <span className="text-theme-border-primary">|</span>
          <a 
            href="https://explorer.solana.com/?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline"
          >
            View Explorer
          </a>
        </div>
      </div>
    </section>
  );
}
