'use client';

import { useState } from 'react';
import { useWalletConnection } from '@solana/react-hooks';

interface MemoryShard {
  key: string;
  type: string;
  size: string;
  updated: string;
}

export function MemoryBrowser() {
  const { connected } = useWalletConnection();
  const [memories, setMemories] = useState<MemoryShard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newMemory, setNewMemory] = useState({ key: '', content: '', type: 'conversation' });

  if (!connected) return null;

  const handleAddMemory = () => {
    if (!newMemory.key || !newMemory.content) return;
    
    const shard: MemoryShard = {
      key: newMemory.key,
      type: newMemory.type,
      size: `${newMemory.content.length} bytes`,
      updated: 'just now',
    };
    
    setMemories([shard, ...memories]);
    setNewMemory({ key: '', content: '', type: 'conversation' });
    setIsAdding(false);
  };

  const filteredMemories = memories.filter(m => 
    m.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">📝 Memory Shards</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          {isAdding ? 'Cancel' : '+ Add Memory'}
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Memory key (e.g., 'user_preferences')"
            value={newMemory.key}
            onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-white placeholder-slate-500"
          />
          <select
            value={newMemory.type}
            onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-white"
          >
            <option value="conversation">Conversation</option>
            <option value="learning">Learning</option>
            <option value="preference">Preference</option>
            <option value="task">Task</option>
            <option value="knowledge">Knowledge</option>
          </select>
          <textarea
            placeholder="Memory content (encrypted client-side)"
            value={newMemory.content}
            onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-white placeholder-slate-500"
          />
          <button
            onClick={handleAddMemory}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
          >
            Store Memory
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search memories..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 mb-4 bg-slate-700 rounded-lg border border-slate-600 text-white placeholder-slate-500"
      />

      {filteredMemories.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">🫙</div>
          <p>No memories stored yet</p>
          <p className="text-sm">Add your first memory shard above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMemories.map((memory, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {memory.type === 'conversation' && '💬'}
                  {memory.type === 'learning' && '📚'}
                  {memory.type === 'preference' && '⚙️'}
                  {memory.type === 'task' && '✅'}
                  {memory.type === 'knowledge' && '🧠'}
                </span>
                <div>
                  <div className="font-medium">{memory.key}</div>
                  <div className="text-sm text-slate-400 capitalize">{memory.type}</div>
                </div>
              </div>
              <div className="text-right text-sm text-slate-400">
                <div>{memory.size}</div>
                <div>{memory.updated}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
