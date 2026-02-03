'use client';

import { useState } from 'react';
import { useWalletConnection } from './WalletButton';
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
  Trash2
} from 'lucide-react';

interface MemoryShard {
  id: string;
  key: string;
  type: MemoryType;
  content: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

type MemoryType = 'conversation' | 'learning' | 'preference' | 'task' | 'knowledge';

const memoryTypeConfig: Record<MemoryType, { icon: React.ReactNode; label: string; color: string }> = {
  conversation: { icon: <MessageSquare className="w-5 h-5" />, label: 'Conversation', color: 'text-blue-400 bg-blue-400/10' },
  learning: { icon: <BookOpen className="w-5 h-5" />, label: 'Learning', color: 'text-green-400 bg-green-400/10' },
  preference: { icon: <Settings className="w-5 h-5" />, label: 'Preference', color: 'text-yellow-400 bg-yellow-400/10' },
  task: { icon: <CheckCircle className="w-5 h-5" />, label: 'Task', color: 'text-purple-400 bg-purple-400/10' },
  knowledge: { icon: <Brain className="w-5 h-5" />, label: 'Knowledge', color: 'text-pink-400 bg-pink-400/10' },
};

export function MemoryBrowser() {
  const { connected } = useWalletConnection();
  const [memories, setMemories] = useState<MemoryShard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newMemory, setNewMemory] = useState<{
    key: string;
    content: string;
    type: MemoryType;
  }>({ key: '', content: '', type: 'conversation' });
  const [selectedMemory, setSelectedMemory] = useState<MemoryShard | null>(null);

  if (!connected) return null;

  const handleAddMemory = () => {
    if (!newMemory.key.trim() || !newMemory.content.trim()) return;
    
    const shard: MemoryShard = {
      id: Math.random().toString(36).substr(2, 9),
      key: newMemory.key.trim(),
      type: newMemory.type,
      content: newMemory.content,
      size: new Blob([newMemory.content]).size,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setMemories([shard, ...memories]);
    setNewMemory({ key: '', content: '', type: 'conversation' });
    setIsAdding(false);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
    if (selectedMemory?.id === id) {
      setSelectedMemory(null);
    }
  };

  const filteredMemories = memories.filter(m => 
    m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Memory Shards</h3>
              <p className="text-sm text-slate-400">{memories.length} memories stored</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              isAdding 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isAdding ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Memory
              </>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 rounded-lg border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Add Memory Form */}
      {isAdding && (
        <div className="p-6 bg-slate-700/30 border-b border-slate-700">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Memory key (e.g., 'user_preferences')"
                value={newMemory.key}
                onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })}
                className="px-4 py-2.5 bg-slate-700 rounded-lg border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <select
                value={newMemory.type}
                onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as MemoryType })}
                className="px-4 py-2.5 bg-slate-700 rounded-lg border border-slate-600 text-white focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(memoryTypeConfig).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Memory content (will be encrypted)"
              value={newMemory.content}
              onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddMemory}
                disabled={!newMemory.key.trim() || !newMemory.content.trim()}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Store Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory List */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">🫙</div>
            <p className="text-lg mb-2">No memories stored yet</p>
            <p className="text-sm">Add your first memory shard above</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredMemories.map((memory) => {
              const config = memoryTypeConfig[memory.type];
              return (
                <div
                  key={memory.id}
                  className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedMemory(memory)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="font-medium text-white mb-1">{memory.key}</div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="capitalize">{config.label}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(memory.updatedAt)}
                          </span>
                          <span>•</span>
                          <span>{formatSize(memory.size)}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-300 line-clamp-2">
                          {memory.content}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMemory(memory.id);
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMemory(null)}
        >
          <div 
            className="bg-slate-800 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${memoryTypeConfig[selectedMemory.type].color}`}>
                    {memoryTypeConfig[selectedMemory.type].icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{selectedMemory.key}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                      <span className="capitalize">{memoryTypeConfig[selectedMemory.type].label}</span>
                      <span>•</span>
                      <span>{formatSize(selectedMemory.size)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-200 whitespace-pre-wrap">{selectedMemory.content}</p>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                <p>Created: {selectedMemory.createdAt.toLocaleString()}</p>
                <p>Updated: {selectedMemory.updatedAt.toLocaleString()}</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => handleDeleteMemory(selectedMemory.id)}
                className="px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedMemory(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
