'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Agent {
  id: string;
  name: string;
  publicKey: string;
  createdAt: Date;
  avatar?: string;
  description?: string;
}

export interface Memory {
  id: string;
  key: string;
  type: MemoryType;
  content: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  encrypted: boolean;
  importance: number;
  tags: string[];
  agentId: string;
}

export type MemoryType = 'conversation' | 'learning' | 'preference' | 'task' | 'knowledge' | 'relationship' | 'system';

export interface SearchFilters {
  query: string;
  types: MemoryType[];
  startDate: Date | null;
  endDate: Date | null;
  minImportance: number;
  maxImportance: number;
  tags: string[];
  agentId: string | null;
}

export type SortOption = 'newest' | 'oldest' | 'importance_high' | 'importance_low' | 'size_large' | 'size_small' | 'alphabetical';

interface MemoryContextType {
  // Agents
  agents: Agent[];
  currentAgent: Agent | null;
  setCurrentAgent: (agent: Agent | null) => void;
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  
  // Memories
  memories: Memory[];
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  removeMemory: (id: string) => void;
  removeMemories: (ids: string[]) => void;
  duplicateMemory: (id: string) => void;
  
  // Search & Filter
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  filteredMemories: Memory[];
  
  // Import/Export
  exportMemories: (ids?: string[]) => string;
  importMemories: (json: string) => { success: number; failed: number };
  
  // Cache
  getCached: <T>(key: string) => T | null;
  setCached: <T>(key: string, value: T, ttl?: number) => void;
  clearCache: () => void;
  
  // Analytics
  getAnalytics: () => AnalyticsData;
}

export interface AnalyticsData {
  totalMemories: number;
  totalSize: number;
  typeDistribution: Record<MemoryType, number>;
  tagCloud: { tag: string; count: number }[];
  timeline: { date: string; count: number }[];
  storageGrowth: { date: string; size: number }[];
  agentComparison: { agentId: string; name: string; memoryCount: number; totalSize: number }[];
}

const defaultFilters: SearchFilters = {
  query: '',
  types: [],
  startDate: null,
  endDate: null,
  minImportance: 0,
  maxImportance: 100,
  tags: [],
  agentId: null,
};

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

// Simple in-memory cache
const cacheStore = new Map<string, { value: unknown; expiry: number }>();

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'agent_001',
      name: 'Alpha Agent',
      publicKey: '8x7R3...9k2M',
      createdAt: new Date('2026-01-15'),
      description: 'Primary research assistant',
    },
    {
      id: 'agent_002',
      name: 'Beta Agent',
      publicKey: '3n5P9...7j4K',
      createdAt: new Date('2026-01-20'),
      description: 'Code generation specialist',
    },
  ]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  
  const [memories, setMemories] = useState<Memory[]>([
    {
      id: 'mem_001',
      key: 'user_preferences_theme',
      type: 'preference',
      content: 'User prefers dark mode interface. Accent color: orange. Font: monospace.',
      size: 67,
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000),
      encrypted: true,
      importance: 80,
      tags: ['ui', 'preferences', 'theme'],
      agentId: 'agent_001',
    },
    {
      id: 'mem_002',
      key: 'conversation_2026_02_01',
      type: 'conversation',
      content: 'Discussed neural network architecture. User interested in transformer models and attention mechanisms.',
      size: 89,
      createdAt: new Date(Date.now() - 43200000),
      updatedAt: new Date(Date.now() - 43200000),
      encrypted: true,
      importance: 65,
      tags: ['ai', 'neural-networks', 'transformers'],
      agentId: 'agent_001',
    },
    {
      id: 'mem_003',
      key: 'learning_rust_basics',
      type: 'learning',
      content: 'Learned about ownership and borrowing in Rust. Key concepts: mutable references, lifetimes.',
      size: 76,
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(Date.now() - 86400000 * 3),
      encrypted: true,
      importance: 75,
      tags: ['rust', 'programming', 'learning'],
      agentId: 'agent_002',
    },
    {
      id: 'mem_004',
      key: 'task_complete_solana_integration',
      type: 'task',
      content: 'Successfully integrated Solana wallet adapter. Implemented transaction signing.',
      size: 68,
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000 * 2),
      encrypted: true,
      importance: 90,
      tags: ['solana', 'blockchain', 'integration'],
      agentId: 'agent_001',
    },
    {
      id: 'mem_005',
      key: 'knowledge_cyberpunk_design',
      type: 'knowledge',
      content: 'Cyberpunk design principles: neon colors, dark backgrounds, grid patterns, retro-futuristic elements.',
      size: 95,
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000 * 7),
      encrypted: true,
      importance: 60,
      tags: ['design', 'cyberpunk', 'ui'],
      agentId: 'agent_002',
    },
  ]);
  
  const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Agent management
  const addAgent = useCallback((agent: Omit<Agent, 'id' | 'createdAt'>) => {
    const newAgent: Agent = {
      ...agent,
      id: `agent_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date(),
    };
    setAgents(prev => [...prev, newAgent]);
  }, []);

  const removeAgent = useCallback((id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (currentAgent?.id === id) {
      setCurrentAgent(null);
    }
  }, [currentAgent]);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  // Memory management
  const addMemory = useCallback((memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newMemory: Memory = {
      ...memory,
      id: `mem_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    };
    setMemories(prev => [newMemory, ...prev]);
  }, []);

  const updateMemory = useCallback((id: string, updates: Partial<Memory>) => {
    setMemories(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
    ));
  }, []);

  const removeMemory = useCallback((id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  const removeMemories = useCallback((ids: string[]) => {
    setMemories(prev => prev.filter(m => !ids.includes(m.id)));
  }, []);

  const duplicateMemory = useCallback((id: string) => {
    const memory = memories.find(m => m.id === id);
    if (memory) {
      addMemory({
        ...memory,
        key: `${memory.key}_copy`,
      });
    }
  }, [memories, addMemory]);

  // Filter management
  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  // Filtered and sorted memories
  const filteredMemories = memories
    .filter(m => {
      if (currentAgent && m.agentId !== currentAgent.id) return false;
      if (filters.agentId && m.agentId !== filters.agentId) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const matchesKey = m.key.toLowerCase().includes(q);
        const matchesContent = m.content.toLowerCase().includes(q);
        const matchesTags = m.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesKey && !matchesContent && !matchesTags) return false;
      }
      if (filters.types.length > 0 && !filters.types.includes(m.type)) return false;
      if (filters.startDate && m.createdAt < filters.startDate) return false;
      if (filters.endDate && m.createdAt > filters.endDate) return false;
      if (m.importance < filters.minImportance || m.importance > filters.maxImportance) return false;
      if (filters.tags.length > 0 && !filters.tags.some(t => m.tags.includes(t))) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'newest': return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest': return a.createdAt.getTime() - b.createdAt.getTime();
        case 'importance_high': return b.importance - a.importance;
        case 'importance_low': return a.importance - b.importance;
        case 'size_large': return b.size - a.size;
        case 'size_small': return a.size - b.size;
        case 'alphabetical': return a.key.localeCompare(b.key);
        default: return 0;
      }
    });

  // Import/Export
  const exportMemories = useCallback((ids?: string[]) => {
    const toExport = ids ? memories.filter(m => ids.includes(m.id)) : memories;
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      memories: toExport,
      agents: agents.filter(a => toExport.some(m => m.agentId === a.id)),
    }, null, 2);
  }, [memories, agents]);

  const importMemories = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      let success = 0;
      let failed = 0;
      
      if (data.memories && Array.isArray(data.memories)) {
        data.memories.forEach((m: Memory) => {
          try {
            addMemory({
              ...m,
              key: m.key,
              type: m.type,
              content: m.content,
              size: m.size,
              encrypted: m.encrypted,
              importance: m.importance,
              tags: m.tags,
              agentId: m.agentId || currentAgent?.id || 'agent_001',
            });
            success++;
          } catch {
            failed++;
          }
        });
      }
      
      return { success, failed };
    } catch {
      return { success: 0, failed: 0 };
    }
  }, [addMemory, currentAgent]);

  // Cache management
  const getCached = useCallback(<T,>(key: string): T | null => {
    const item = cacheStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      cacheStore.delete(key);
      return null;
    }
    return item.value as T;
  }, []);

  const setCached = useCallback(<T,>(key: string, value: T, ttl = 300000) => {
    cacheStore.set(key, { value, expiry: Date.now() + ttl });
  }, []);

  const clearCache = useCallback(() => {
    cacheStore.clear();
  }, []);

  // Analytics
  const getAnalytics = useCallback((): AnalyticsData => {
    const typeDistribution: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const timelineMap: Record<string, number> = {};
    const storageMap: Record<string, number> = {};
    
    memories.forEach(m => {
      // Type distribution
      typeDistribution[m.type] = (typeDistribution[m.type] || 0) + 1;
      
      // Tag cloud
      m.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
      
      // Timeline
      const date = m.createdAt.toISOString().split('T')[0];
      timelineMap[date] = (timelineMap[date] || 0) + 1;
      storageMap[date] = (storageMap[date] || 0) + m.size;
    });
    
    const tagCloud = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    const timeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const storageGrowth = Object.entries(storageMap)
      .map(([date, size]) => ({ date, size }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const agentComparison = agents.map(a => ({
      agentId: a.id,
      name: a.name,
      memoryCount: memories.filter(m => m.agentId === a.id).length,
      totalSize: memories.filter(m => m.agentId === a.id).reduce((s, m) => s + m.size, 0),
    }));
    
    return {
      totalMemories: memories.length,
      totalSize: memories.reduce((s, m) => s + m.size, 0),
      typeDistribution: typeDistribution as Record<MemoryType, number>,
      tagCloud,
      timeline,
      storageGrowth,
      agentComparison,
    };
  }, [memories, agents]);

  return (
    <MemoryContext.Provider value={{
      agents,
      currentAgent,
      setCurrentAgent,
      addAgent,
      removeAgent,
      updateAgent,
      memories,
      addMemory,
      updateMemory,
      removeMemory,
      removeMemories,
      duplicateMemory,
      filters,
      setFilters,
      resetFilters,
      sortOption,
      setSortOption,
      filteredMemories,
      exportMemories,
      importMemories,
      getCached,
      setCached,
      clearCache,
      getAnalytics,
    }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within MemoryProvider');
  }
  return context;
}
