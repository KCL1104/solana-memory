'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMemories, useVaultState, useAppStore } from '@/features/wallet/store';
import { useMemory } from '@/features/memory/useMemory';
import { useNotify } from '@/features/ui/Notifications';
import { LoadingState, MemorySkeleton, EmptyState } from '@/components/ui/LoadingState';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
} from 'lucide-react';
import { MemoryType, MemoryMetadata, MemoryShard, TransactionResult } from '@/lib/agentMemory';

const memoryTypeConfig: Record<MemoryType, { icon: React.ReactNode; label: string; color: string; border: string; bg: string }> = {
  conversation: { 
    icon: <MessageSquare className="w-4 h-4" />, 
    label: 'CONVERSATION', 
    color: 'text-[#00d4ff]',
    border: 'border-[#00d4ff]',
    bg: 'bg-[#00d4ff]/10'
  },
  learning: { 
    icon: <BookOpen className="w-4 h-4" />, 
    label: 'LEARNING', 
    color: 'text-[#4ade80]',
    border: 'border-[#4ade80]',
    bg: 'bg-[#4ade80]/10'
  },
  preference: { 
    icon: <Settings className="w-4 h-4" />, 
    label: 'PREFERENCE', 
    color: 'text-[#fbbf24]',
    border: 'border-[#fbbf24]',
    bg: 'bg-[#fbbf24]/10'
  },
  task: { 
    icon: <CheckCircle className="w-4 h-4" />, 
    label: 'TASK', 
    color: 'text-[#b829dd]',
    border: 'border-[#b829dd]',
    bg: 'bg-[#b829dd]/10'
  },
  knowledge: { 
    icon: <Brain className="w-4 h-4" />, 
    label: 'KNOWLEDGE', 
    color: 'text-[#ff6b35]',
    border: 'border-[#ff6b35]',
    bg: 'bg-[#ff6b35]/10'
  },
  relationship: { 
    icon: <Cpu className="w-4 h-4" />, 
    label: 'RELATIONSHIP', 
    color: 'text-[#8b5cf6]',
    border: 'border-[#8b5cf6]',
    bg: 'bg-[#8b5cf6]/10'
  },
  system: { 
    icon: <Terminal className="w-4 h-4" />, 
    label: 'SYSTEM', 
    color: 'text-[#6b7280]',
    border: 'border-[#6b7280]',
    bg: 'bg-[#6b7280]/10'
  },
};

// MemoryCard component with animations
const MemoryCard = ({ 
  memory, 
  index, 
  onClick, 
  onDelete 
}: { 
  memory: MemoryShard; 
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) => {
  const config = memoryTypeConfig[memory.metadata?.memoryType || 'conversation'];
  
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(13, 13, 18, 1)' }}
      className="p-4 bg-[#0a0a0f] border-b border-[#1a1a25] cursor-pointer group transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-10 h-10 border ${config.border} ${config.color} flex items-center justify-center flex-shrink-0 ${config.bg}`}
          >
            {config.icon}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
              <span className="font-mono text-sm text-white truncate max-w-[150px] sm:max-w-[200px]">{memory.key}</span>
              <span className={`text-[10px] px-2 py-0.5 border ${config.border} ${config.color} opacity-60 hidden sm:inline-block`}>
                {config.label}
              </span>
              {memory.isEncrypted && (
                <Lock className="w-3 h-3 text-[#4ade80] flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#666] font-mono mb-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(memory.updatedAt)}
              </span>
              <span className="hidden sm:inline">{formatSize(memory.contentSize || 0)}</span>
              <span className="text-[#888]">IMP: {memory.metadata?.importance || 0}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {memory.metadata?.tags?.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[10px] text-[#555] bg-[#1a1a25] px-2 py-0.5">
                  #{tag}
                </span>
              ))}
              {(memory.metadata?.tags?.length || 0) > 3 && (
                <span className="text-[10px] text-[#444] px-1">+{(memory.metadata?.tags?.length || 0) - 3}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
          <ChevronRight className="w-4 h-4 text-[#444] hidden sm:block" />
        </div>
      </div>
    </motion.div>
  );
};

export function MemoryBrowser() {
  const { connected, publicKey } = useWallet();
  const { vault, exists: vaultExists } = useVaultState();
  const { memories, isStale } = useMemories();
  const { storeMemory, deleteMemory, fetchMemories } = useMemory();
  const client = useAppStore((state) => state.client);
  const notify = useNotify();
  
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
  const [selectedMemory, setSelectedMemory] = useState<MemoryShard | null>(null);
  const [filterType, setFilterType] = useState<MemoryType | 'all'>('all');
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
    if (!vault || !client) return;

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
        setShowDeleteConfirm(null);
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const totalSize = memories.reduce((acc, m) => acc + (m.contentSize || 0), 0);

  if (!connected) return null;

  if (!vaultExists) {
    return (
      <EmptyState
        icon={<Database className="w-10 h-10 text-[#444]" />}
        title="VAULT_REQUIRED"
        description="Initialize a vault to store memories"
      />
    );
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="cyber-card overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#222]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 sm:w-12 sm:h-12 border border-[#ff6b35] flex items-center justify-center glow-orange"
              >
                <Database className="w-5 h-5 text-[#ff6b35]" />
              </motion.div>
              <div>
                <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wider">MEMORY_SHARDS</h3>
                <p className="text-xs text-[#666] font-mono">
                  <span className="text-[#ff6b35]">{memories.length}</span> SHARDS // 
                  <span className="text-[#00d4ff]"> {formatSize(totalSize)}</span> TOTAL
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex-1 sm:flex-none px-3 py-2 border border-[#333] text-[#666] hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors font-mono text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAdding(!isAdding)}
                className={`flex-1 sm:flex-none px-4 py-2 border text-sm font-mono tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                  isAdding 
                    ? 'border-[#666] text-[#666] hover:border-[#ff4444] hover:text-[#ff4444]' 
                    : 'border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0a]'
                }`}
              >
                {isAdding ? (
                  <>
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">CANCEL</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">NEW_SHARD</span>
                  </>
                )}
              </motion.button>
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
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 text-xs font-mono tracking-wider border transition-colors ${
                    filterType === type
                      ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                      : 'border-[#333] text-[#666] hover:border-[#555]'
                  }`}
                >
                  {type === 'all' ? 'ALL' : type.slice(0, 4).toUpperCase()}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Add Memory Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-[#222] bg-[#0f0f0f]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="w-4 h-4 text-[#ff6b35]" />
                    <span className="text-[#ff6b35] text-sm font-mono tracking-wider">NEW_MEMORY_PROTOCOL</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                      <Lock className="w-3 h-3" />
                      <span>WILL_BE_ENCRYPTED</span>
                      <span className="text-[#444]">|</span>
                      <span>~{(new Blob([newMemory.content]).size / 1024).toFixed(2)}KB</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddMemory}
                      disabled={!newMemory.key.trim() || !newMemory.content.trim() || isLoading}
                      className="w-full sm:w-auto px-6 py-2 border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] disabled:hover:bg-transparent disabled:cursor-not-allowed font-mono text-sm tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      COMMIT_TO_CHAIN
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memory List */}
        <div className="max-h-[500px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {isLoading && memories.length === 0 ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MemorySkeleton count={5} />
              </motion.div>
            ) : filteredMemories.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  icon={<Database className="w-8 h-8 text-[#444]" />}
                  title="NO_DATA_FOUND"
                  description={searchQuery ? "No memories match your search" : "Initialize new memory shard to begin"}
                  action={!searchQuery ? {
                    label: 'CREATE_MEMORY',
                    onClick: () => setIsAdding(true)
                  } : undefined}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-[#222]"
              >
                <AnimatePresence>
                  {filteredMemories.map((memory, index) => (
                    <MemoryCard
                      key={memory.key}
                      memory={memory}
                      index={index}
                      onClick={() => setSelectedMemory(memory)}
                      onDelete={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(memory.key);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Transaction Status Modal */}
      <AnimatePresence>
        {showStatusDialog && transactionResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowStatusDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="cyber-card w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center border-2 ${
                    transactionResult.success ? 'border-[#4ade80] text-[#4ade80]' : 'border-[#ff4444] text-[#ff4444]'
                  }`}
                >
                  {transactionResult.success ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <AlertCircle className="w-8 h-8" />
                  )}
                </motion.div>
                <h3 className={`text-xl font-display font-bold mb-2 ${
                  transactionResult.success ? 'text-[#4ade80]' : 'text-[#ff4444]'
                }`}>
                  {transactionResult.success ? 'TRANSACTION_SUCCESS' : 'TRANSACTION_FAILED'}
                </h3>
                {transactionResult.signature && (
                  <code className="text-xs text-[#666] font-mono block mb-4 break-all">
                    SIG: {transactionResult.signature.slice(0, 20)}...
                  </code>
                )}
                {transactionResult.error && (
                  <p className="text-sm text-[#ff4444] mb-4">{transactionResult.error}</p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowStatusDialog(false)}
                  className="px-6 py-2 border border-[#333] text-[#888] hover:border-[#666] hover:text-white transition-colors font-mono text-sm tracking-wider"
                >
                  CLOSE
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="cyber-card w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border-2 border-[#ff4444] text-[#ff4444]"
                >
                  <Trash2 className="w-8 h-8" />
                </motion.div>
                <h3 className="text-xl font-display font-bold text-[#ff4444] mb-2">CONFIRM_DELETE</h3>
                <p className="text-sm text-[#666] mb-6">
                  Are you sure you want to delete <span className="text-white font-mono">{showDeleteConfirm}</span>?<br />
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-6 py-2 border border-[#333] text-[#888] hover:border-[#666] hover:text-white transition-colors font-mono text-sm tracking-wider"
                  >
                    CANCEL
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDeleteMemory(showDeleteConfirm)}
                    disabled={isLoading}
                    className="px-6 py-2 border border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444] hover:text-white transition-colors font-mono text-sm tracking-wider flex items-center gap-2"
                  >
                    {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    DELETE
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6 border-b border-[#222]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className={`w-10 h-10 sm:w-12 sm:h-12 border ${memoryTypeConfig[(selectedMemory.metadata?.memoryType || 'conversation') as MemoryType].border} ${memoryTypeConfig[(selectedMemory.metadata?.memoryType || 'conversation') as MemoryType].color} flex items-center justify-center ${memoryTypeConfig[(selectedMemory.metadata?.memoryType || 'conversation') as MemoryType].bg}`}
                    >
                      {memoryTypeConfig[(selectedMemory.metadata?.memoryType || 'conversation') as MemoryType].icon}
                    </motion.div>
                    <div className="min-w-0">
                      <h4 className="text-base sm:text-lg font-display font-bold text-white tracking-wider truncate">{selectedMemory.key}</h4>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#666] font-mono mt-1 flex-wrap">
                        <span>{memoryTypeConfig[(selectedMemory.metadata?.memoryType || 'conversation') as MemoryType].label}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">{formatSize(selectedMemory.contentSize || 0)}</span>
                        <span className="text-[#4ade80] flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span className="hidden sm:inline">ENCRYPTED</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedMemory(null)}
                    className="p-2 text-[#666] hover:text-[#ff6b35] hover:bg-[#ff6b35]/10 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh]">
                <div className="mb-4 flex items-center gap-2 text-xs text-[#666] font-mono">
                  <Terminal className="w-3 h-3" />
                  <span>ENCRYPTED_CONTENT_HASH</span>
                </div>
                <div className="bg-[#0a0a0a] border border-[#333] p-4 font-mono text-xs sm:text-sm text-[#aaa] leading-relaxed break-all">
                  <span className="text-[#ff6b35]">{`>`}</span> {Array.from(selectedMemory.contentHash || [])
                    .map((b: number) => b.toString(16).padStart(2, '0'))
                    .join('')}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 text-xs font-mono text-[#666]">
                  <div>
                    <span className="text-[#444]">CREATED:</span>
                    <p className="text-[#888] mt-1">{new Date(Number(selectedMemory.createdAt) * 1000).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[#444]">MODIFIED:</span>
                    <p className="text-[#888] mt-1">{new Date(Number(selectedMemory.updatedAt) * 1000).toLocaleString()}</p>
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
                        <span key={i} className="text-xs text-[#888] bg-[#1a1a25] px-2 py-1 font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-[#222] bg-[#0f0f0f] flex flex-col sm:flex-row justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(selectedMemory.key)}
                  disabled={isLoading}
                  className="px-4 py-2 border border-[#ff4444]/50 text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors font-mono text-sm tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  DELETE
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMemory(null)}
                  className="px-4 py-2 border border-[#333] text-[#888] hover:border-[#666] hover:text-white transition-colors font-mono text-sm tracking-wider"
                >
                  CLOSE
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
