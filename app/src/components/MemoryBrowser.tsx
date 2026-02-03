'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMemories, useVaultState, useAppStore } from '@/features/wallet/store';
import { useMemory } from '@/features/memory/useMemory';
import { useNotify } from '@/features/ui/Notifications';
import { LoadingSpinner } from '@/features/ui/Loading';
import { ConfirmDialog, TransactionStatusDialog, useConfirm } from '@/features/ui/Dialogs';
import { 
  Search, 
  Plus, 
  X, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  CheckCircle, 
  Brain,
  Clock,
  Database,
  Trash2,
  Terminal,
  Cpu,
  Lock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { MemoryType, MemoryMetadata, TransactionResult } from '@/lib/agentMemory';

const memoryTypeConfig: Record<MemoryType, { icon: React.ReactNode; label: string; color: string; border: string }> = {
  conversation: { 
    icon: <MessageSquare className="w-4 h-4" />, 
    label: 'CONVERSATION', 
    color: 'text-[#00d4ff]',
    border: 'border-[#00d4ff]'
  },
  learning: { 
    icon: <BookOpen className="w-4 h-4" />, 
    label: 'LEARNING', 
    color: 'text-[#4ade80]',
    border: 'border-[#4ade80]'
  },
  preference: { 
    icon: <Settings className="w-4 h-4" />, 
    label: 'PREFERENCE', 
    color: 'text-[#fbbf24]',
    border: 'border-[#fbbf24]'
  },
  task: { 
    icon: <CheckCircle className="w-4 h-4" />, 
    label: 'TASK', 
    color: 'text-[#b829dd]',
    border: 'border-[#b829dd]'
  },
  knowledge: { 
    icon: <Brain className="w-4 h-4" />, 
    label: 'KNOWLEDGE', 
    color: 'text-[#ff6b35]',
    border: 'border-[#ff6b35]'
  },
  relationship: { 
    icon: <Cpu className="w-4 h-4" />, 
    label: 'RELATIONSHIP', 
    color: 'text-[#8b5cf6]',
    border: 'border-[#8b5cf6]'
  },
  system: { 
    icon: <Terminal className="w-4 h-4" />, 
    label: 'SYSTEM', 
    color: 'text-[#6b7280]',
    border: 'border-[#6b7280]'
  },
};

export function MemoryBrowser() {
  const { connected, publicKey } = useWallet();
  const { vault, exists: vaultExists } = useVaultState();
  const { memories, isStale } = useMemories();
  const { storeMemory, deleteMemory, fetchMemories } = useMemory();
  const client = useAppStore((state) => state.client);
  const notify = useNotify();
  const { confirm, dialogProps } = useConfirm();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMemory, setNewMemory] = useState<{
    key: string;
    content: string;
    type: MemoryType;
    importance: number;
    tags: string;
  }>({ key: '', content: '', type: 'conversation', importance: 50, tags: '' });
  const [selectedMemory, setSelectedMemory] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<MemoryType | 'all'>('all');
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load memories when vault exists
  useEffect(() => {
    if (vaultExists && vault && (memories.length === 0 || isStale)) {
      loadMemories();
    }
  }, [vaultExists, vault, isStale]);

  const loadMemories = async () => {
    if (!client || !vault) return;
    setIsLoading(true);
    try {
      const [vaultPda] = client.findVaultPda(vault.owner, vault.agentKey);
      await fetchMemories(vaultPda);
    } catch (error) {
      notify.error('Load Failed', 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemory.key.trim() || !newMemory.content.trim() || !vault || !client) return;
    
    setIsLoading(true);
    notify.info('Storing Memory', 'Please confirm the transaction...');

    try {
      const [vaultPda] = client.findVaultPda(vault.owner, vault.agentKey);
      
      const metadata: MemoryMetadata = {
        memoryType: newMemory.type,
        importance: newMemory.importance,
        tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const result = await storeMemory({
        key: newMemory.key.trim(),
        content: newMemory.content,
        metadata,
        vault: vaultPda,
        isEncrypted: true,
      });

      setTransactionResult(result);
      setShowStatusDialog(true);

      if (result.success) {
        notify.success('Memory Stored', 'Your memory has been saved to the blockchain');
        setNewMemory({ key: '', content: '', type: 'conversation', importance: 50, tags: '' });
        setIsAdding(false);
      } else {
        notify.error('Storage Failed', result.error || 'Failed to store memory');
      }
    } catch (error) {
      notify.error('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryKey: string) => {
    const confirmed = await confirm(
      'DELETE_MEMORY',
      `Are you sure you want to delete memory "${memoryKey}"?\n\nThis action cannot be undone.`,
      'danger'
    );

    if (!confirmed || !vault || !client) return;

    setIsLoading(true);
    notify.info('Deleting Memory', 'Please confirm the transaction...');

    try {
      const [vaultPda] = client.findVaultPda(vault.owner, vault.agentKey);
      
      const result = await deleteMemory({
        key: memoryKey,
        vault: vaultPda,
      });

      setTransactionResult(result);
      setShowStatusDialog(true);

      if (result.success) {
        notify.success('Memory Deleted', 'The memory has been removed');
        setSelectedMemory(null);
      } else {
        notify.error('Deletion Failed', result.error || 'Failed to delete memory');
      }
    } catch (error) {
      notify.error('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    notify.info('Refreshing', 'Updating memory list...');
    await loadMemories();
    notify.success('Updated', 'Memory list refreshed');
  };

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (m.metadata?.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);
    const matchesType = filterType === 'all' || m.metadata?.memoryType === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (timestamp: bigint | number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'NOW';
    if (minutes < 60) return `${minutes}M`;
    if (hours < 24) return `${hours}H`;
    if (days < 7) return `${days}D`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const totalSize = memories.reduce((acc, m) => acc + (m.contentSize || 0), 0);

  if (!connected) return null;

  if (!vaultExists) {
    return (
      <div className="retro-card p-8 text-center">
        <div className="w-20 h-20 border border-[#333] flex items-center justify-center mx-auto mb-4">
          <Database className="w-10 h-10 text-[#444]" />
        </div>
        <h3 className="text-lg font-display font-bold text-[#666] mb-2">VAULT_REQUIRED</h3>
        <p className="text-sm text-[#555] font-mono">Initialize a vault to store memories</p>
      </div>
    );
  }

  return (
    <>
      <div className="retro-card overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#222]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-[#ff6b35] flex items-center justify-center glow-orange">
                <Database className="w-5 h-5 text-[#ff6b35]" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white tracking-wider">MEMORY_SHARDS</h3>
                <p className="text-xs text-[#666] font-mono">
                  <span className="text-[#ff6b35]">{memories.length}</span> SHARDS // 
                  <span className="text-[#00d4ff]"> {formatSize(totalSize)}</span> TOTAL
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-3 py-2 border border-[#333] text-[#666] hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors font-mono text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className={`px-4 py-2 border text-sm font-mono tracking-wider transition-all duration-300 flex items-center gap-2 ${
                  isAdding 
                    ? 'border-[#666] text-[#666] hover:border-[#ff4444] hover:text-[#ff4444]' 
                    : 'border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0a]'
                }`}
              >
                {isAdding ? (
                  <>
                    <X className="w-4 h-4" />
                    CANCEL
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    NEW_SHARD
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                type="text"
                placeholder="SEARCH_MEMORY..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#ff6b35] focus:outline-none font-mono text-sm transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'conversation', 'knowledge', 'task', 'preference'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 text-xs font-mono tracking-wider border transition-colors ${
                    filterType === type
                      ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                      : 'border-[#333] text-[#666] hover:border-[#555]'
                  }`}
                >
                  {type === 'all' ? 'ALL' : type.slice(0, 4).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add Memory Form */}
        {isAdding && (
          <div className="p-6 border-b border-[#222] bg-[#0f0f0f]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-[#ff6b35]" />
                <span className="text-[#ff6b35] text-sm font-mono tracking-wider">NEW_MEMORY_PROTOCOL</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="MEMORY_KEY"
                  value={newMemory.key}
                  onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })}
                  className="px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#ff6b35] focus:outline-none font-mono text-sm transition-colors"
                />
                <select
                  value={newMemory.type}
                  onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as MemoryType })}
                  className="px-4 py-3 bg-[#111] border border-[#333] text-white focus:border-[#ff6b35] focus:outline-none font-mono text-sm transition-colors cursor-pointer"
                >
                  {Object.entries(memoryTypeConfig).map(([type, config]) => (
                    <option key={type} value={type}>{config.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2 px-4 py-3 bg-[#111] border border-[#333]">
                  <span className="text-xs text-[#666]">IMPORTANCE:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newMemory.importance}
                    onChange={(e) => setNewMemory({ ...newMemory, importance: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-sm text-[#ff6b35] w-8 text-right">{newMemory.importance}</span>
                </div>
              </div>
              <input
                type="text"
                placeholder="TAGS (comma separated)"
                value={newMemory.tags}
                onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#ff6b35] focus:outline-none font-mono text-sm transition-colors"
              />
              <textarea
                placeholder="ENCRYPTED_CONTENT..."
                value={newMemory.content}
                onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#ff6b35] focus:outline-none font-mono text-sm resize-none transition-colors"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#666]">
                  <Lock className="w-3 h-3" />
                  <span>WILL_BE_ENCRYPTED</span>
                  <span className="text-[#444]">|</span>
                  <span>~{(new Blob([newMemory.content]).size / 1024).toFixed(2)}KB</span>
                </div>
                <button
                  onClick={handleAddMemory}
                  disabled={!newMemory.key.trim() || !newMemory.content.trim() || isLoading}
                  className="px-6 py-2 border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] disabled:hover:bg-transparent disabled:cursor-not-allowed font-mono text-sm tracking-wider transition-all flex items-center gap-2"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" color="cyan" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  COMMIT_TO_CHAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Memory List */}
        <div className="max-h-[500px] overflow-y-auto">
          {isLoading && memories.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 border border-[#333] flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-[#444]" />
              </div>
              <p className="text-[#666] font-mono mb-2">NO_DATA_FOUND</p>
              <p className="text-xs text-[#555]">Initialize new memory shard to begin</p>
            </div>
          ) : (
            <div className="divide-y divide-[#222]">
              {filteredMemories.map((memory, index) => {
                const config = memoryTypeConfig[memory.metadata?.memoryType || 'conversation'];
                return (
                  <div
                    key={memory.key}
                    className="p-4 hover:bg-[#111] transition-colors cursor-pointer group"
                    onClick={() => setSelectedMemory(memory)}
                    style={{ 
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                      transition: `all 0.3s ease ${index * 50}ms`
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 border ${config.border} ${config.color} flex items-center justify-center flex-shrink-0`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm text-white truncate">{memory.key}</span>
                            <span className={`text-[10px] px-2 py-0.5 border ${config.border} ${config.color} opacity-60`}>
                              {config.label}
                            </span>
                            {memory.isEncrypted && (
                              <Lock className="w-3 h-3 text-[#4ade80]" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#666] font-mono mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(memory.updatedAt)}
                            </span>
                            <span>{formatSize(memory.contentSize || 0)}</span>
                            <span className="text-[#888]">IMP: {memory.metadata?.importance || 0}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {memory.metadata?.tags?.map((tag, i) => (
                              <span key={i} className="text-[10px] text-[#555] bg-[#1a1a1a] px-2 py-0.5">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMemory(memory.key);
                          }}
                          disabled={isLoading}
                          className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#444]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog {...dialogProps} isLoading={isLoading} />
      
      <TransactionStatusDialog
        result={transactionResult}
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
      />

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMemory(null)}
        >
          <div 
            className="retro-card w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#222]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 border ${memoryTypeConfig[selectedMemory.metadata?.memoryType || 'conversation'].border} ${memoryTypeConfig[selectedMemory.metadata?.memoryType || 'conversation'].color} flex items-center justify-center`}>
                    {memoryTypeConfig[selectedMemory.metadata?.memoryType || 'conversation'].icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-display font-bold text-white tracking-wider">{selectedMemory.key}</h4>
                    <div className="flex items-center gap-3 text-xs text-[#666] font-mono mt-1">
                      <span>{memoryTypeConfig[selectedMemory.metadata?.memoryType || 'conversation'].label}</span>
                      <span>•</span>
                      <span>{formatSize(selectedMemory.contentSize || 0)}</span>
                      <span>•</span>
                      <span className="text-[#4ade80] flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        ENCRYPTED
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="p-2 text-[#666] hover:text-[#ff6b35] hover:bg-[#ff6b35]/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="mb-4 flex items-center gap-2 text-xs text-[#666] font-mono">
                <Terminal className="w-3 h-3" />
                <span>ENCRYPTED_CONTENT_HASH</span>
              </div>
              <div className="bg-[#0a0a0a] border border-[#333] p-4 font-mono text-sm text-[#aaa] leading-relaxed break-all">
                <span className="text-[#ff6b35]">{`>`}</span> {Array.from(selectedMemory.contentHash || [])
                  .map((b: number) => b.toString(16).padStart(2, '0'))
                  .join('')}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs font-mono text-[#666]">
                <div>
                  <span className="text-[#444]">CREATED:</span>
                  <p className="text-[#888] mt-1">{formatDate(selectedMemory.createdAt)}</p>
                </div>
                <div>
                  <span className="text-[#444]">MODIFIED:</span>
                  <p className="text-[#888] mt-1">{formatDate(selectedMemory.updatedAt)}</p>
                </div>
                <div>
                  <span className="text-[#444]">VERSION:</span>
                  <p className="text-[#888] mt-1">v{selectedMemory.version || 1}</p>
                </div>
                <div>
                  <span className="text-[#444]">IMPORTANCE:</span>
                  <p className="text-[#888] mt-1">{selectedMemory.metadata?.importance || 0}/100</p>
                </div>
              </div>
              {selectedMemory.metadata?.tags && selectedMemory.metadata.tags.length > 0 && (
                <div className="mt-4">
                  <span className="text-[#444] text-xs font-mono">TAGS:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMemory.metadata.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs text-[#888] bg-[#1a1a1a] px-2 py-1 font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#222] bg-[#0f0f0f] flex justify-end gap-3">
              <button
                onClick={() => handleDeleteMemory(selectedMemory.key)}
                disabled={isLoading}
                className="px-4 py-2 border border-[#ff4444]/50 text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors font-mono text-sm tracking-wider flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <LoadingSpinner size="sm" color="cyan" /> : <Trash2 className="w-4 h-4" />}
                DELETE
              </button>
              <button
                onClick={() => setSelectedMemory(null)}
                className="px-4 py-2 border border-[#333] text-[#888] hover:border-[#666] hover:text-white transition-colors font-mono text-sm tracking-wider"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
