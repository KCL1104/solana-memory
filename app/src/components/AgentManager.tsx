'use client';

import { useState } from 'react';
import { useMemory, Agent } from '@/contexts/MemoryContext';
import { 
  Users, 
  Plus, 
  X, 
  Edit3, 
  Check,
  Cpu,
  Trash2,
  ChevronRight,
  BarChart3,
  Copy
} from 'lucide-react';

export function AgentManager() {
  const { 
    agents, 
    currentAgent, 
    setCurrentAgent, 
    addAgent, 
    removeAgent, 
    updateAgent,
    memories 
  } = useMemory();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState({ name: '', publicKey: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', publicKey: '', description: '' });

  const handleAddAgent = () => {
    if (!newAgent.name.trim()) return;
    addAgent({
      name: newAgent.name,
      publicKey: newAgent.publicKey || `0x${Math.random().toString(36).substr(2, 16).toUpperCase()}`,
      description: newAgent.description,
    });
    setNewAgent({ name: '', publicKey: '', description: '' });
    setIsAdding(false);
  };

  const handleEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setEditForm({
      name: agent.name,
      publicKey: agent.publicKey,
      description: agent.description || '',
    });
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateAgent(editingId, editForm);
      setEditingId(null);
    }
  };

  const getAgentStats = (agentId: string) => {
    const agentMemories = memories.filter(m => m.agentId === agentId);
    return {
      count: agentMemories.length,
      size: agentMemories.reduce((acc, m) => acc + m.size, 0),
    };
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-56 z-40 w-12 h-12 border border-[#b829dd] bg-[#0a0a0a] flex items-center justify-center hover:bg-[#b829dd] hover:text-[#0a0a0a] transition-all group"
        title="Agent Manager"
      >
        <Users className="w-5 h-5 text-[#b829dd] group-hover:text-[#0a0a0a]" />
        {currentAgent && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#b829dd] rounded-full" />
        )}
      </button>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="retro-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-[#b829dd] flex items-center justify-center glow-purple">
              <Users className="w-5 h-5 text-[#b829dd]" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white tracking-wider">AGENT_NETWORK</h3>
              <p className="text-xs text-[#666] font-mono">
                <span className="text-[#b829dd]">{agents.length}</span> AGENTS // 
                <span className="text-[#00d4ff]"> {currentAgent ? '1' : '0'}</span> ACTIVE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-[#0a0a0a] transition-colors font-mono text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                ADD_AGENT
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Agent Form */}
          {isAdding && (
            <div className="border border-[#222] p-4 mb-6 bg-[#0f0f0f]">
              <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#4ade80]" />
                NEW_AGENT_REGISTRATION
              </h4>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="AGENT_NAME"
                    className="px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#4ade80] focus:outline-none font-mono text-sm"
                  />
                  <input
                    type="text"
                    value={newAgent.publicKey}
                    onChange={(e) => setNewAgent({ ...newAgent, publicKey: e.target.value })}
                    placeholder="PUBLIC_KEY (optional)"
                    className="px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#4ade80] focus:outline-none font-mono text-sm"
                  />
                </div>
                <input
                  type="text"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="DESCRIPTION (optional)"
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#4ade80] focus:outline-none font-mono text-sm"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddAgent}
                    disabled={!newAgent.name.trim()}
                    className="px-6 py-2 border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] transition-colors font-mono text-sm"
                  >
                    REGISTER
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewAgent({ name: '', publicKey: '', description: '' });
                    }}
                    className="px-6 py-2 border border-[#333] text-[#666] hover:border-[#ff4444] hover:text-[#ff4444] transition-colors font-mono text-sm"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Agent List */}
          <div className="space-y-3">
            {agents.map((agent) => {
              const stats = getAgentStats(agent.id);
              const isCurrent = currentAgent?.id === agent.id;
              const isEditing = editingId === agent.id;

              return (
                <div 
                  key={agent.id}
                  className={`border p-4 transition-colors ${
                    isCurrent 
                      ? 'border-[#b829dd] bg-[#b829dd]/5' 
                      : 'border-[#222] hover:border-[#333]'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-3 py-2 bg-[#111] border border-[#333] text-white text-sm font-mono focus:border-[#b829dd] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editForm.publicKey}
                          onChange={(e) => setEditForm({ ...editForm, publicKey: e.target.value })}
                          className="px-3 py-2 bg-[#111] border border-[#333] text-white text-sm font-mono focus:border-[#b829dd] focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-[#111] border border-[#333] text-white text-sm font-mono focus:border-[#b829dd] focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-1.5 border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-[#0a0a0a] transition-colors font-mono text-xs"
                        >
                          SAVE
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-1.5 border border-[#333] text-[#666] hover:border-[#ff4444] hover:text-[#ff4444] transition-colors font-mono text-xs"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 border flex items-center justify-center ${
                          isCurrent ? 'border-[#b829dd] text-[#b829dd]' : 'border-[#333] text-[#666]'
                        }`}>
                          <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-white font-display font-bold">{agent.name}</h4>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-[#b829dd]/20 border border-[#b829dd]/50 text-[#b829dd] text-[10px] font-mono">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#666] font-mono mb-2">
                            <span className="flex items-center gap-1">
                              <Copy className="w-3 h-3" />
                              {agent.publicKey.slice(0, 12)}...
                            </span>
                            <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
                          </div>
                          {agent.description && (
                            <p className="text-sm text-[#888]">{agent.description}</p>
                          )}
                          <div className="flex gap-4 mt-3 text-xs font-mono">
                            <span className="text-[#00d4ff]">{stats.count} MEMORIES</span>
                            <span className="text-[#ff6b35]">{formatSize(stats.size)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCurrent ? (
                          <button
                            onClick={() => setCurrentAgent(agent)}
                            className="px-3 py-1.5 border border-[#b829dd] text-[#b829dd] hover:bg-[#b829dd] hover:text-[#0a0a0a] transition-colors font-mono text-xs"
                          >
                            ACTIVATE
                          </button>
                        ) : (
                          <button
                            onClick={() => setCurrentAgent(null)}
                            className="px-3 py-1.5 border border-[#666] text-[#666] hover:border-[#ff4444] hover:text-[#ff4444] transition-colors font-mono text-xs"
                          >
                            DEACTIVATE
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(agent)}
                          className="p-2 text-[#666] hover:text-[#ff6b35] hover:bg-[#ff6b35]/10 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeAgent(agent.id)}
                          disabled={agents.length <= 1}
                          className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comparison Section */}
          {agents.length > 1 && (
            <div className="mt-8 border border-[#222] p-4">
              <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00d4ff]" />
                AGENT_COMPARISON
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#222]">
                      <th className="text-left py-2 px-3 text-[#666] font-mono">AGENT</th>
                      <th className="text-right py-2 px-3 text-[#666] font-mono">MEMORIES</th>
                      <th className="text-right py-2 px-3 text-[#666] font-mono">STORAGE</th>
                      <th className="text-right py-2 px-3 text-[#666] font-mono">CREATED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => {
                      const stats = getAgentStats(agent.id);
                      return (
                        <tr key={agent.id} className="border-b border-[#111] hover:bg-[#111]">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white">{agent.name}</span>
                              {currentAgent?.id === agent.id && (
                                <span className="w-2 h-2 bg-[#b829dd] rounded-full" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-[#00d4ff] font-mono">{stats.count}</td>
                          <td className="py-3 px-3 text-right text-[#ff6b35] font-mono">{formatSize(stats.size)}</td>
                          <td className="py-3 px-3 text-right text-[#666] font-mono">
                            {new Date(agent.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
