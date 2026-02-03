'use client';

import { useState } from 'react';
import { useWalletConnection } from './WalletButton';
import { User, Settings, Check, X, Award, Zap } from 'lucide-react';

export function ProfileCard() {
  const { connected, publicKey } = useWalletConnection();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [newCapability, setNewCapability] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    memoryShards: 0,
    reputationScore: 0,
  });

  if (!connected) return null;

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Save profile to chain
  };

  const handleAddCapability = () => {
    if (newCapability.trim() && !capabilities.includes(newCapability.trim())) {
      setCapabilities([...capabilities, newCapability.trim()]);
      setNewCapability('');
    }
  };

  const handleRemoveCapability = (cap: string) => {
    setCapabilities(capabilities.filter(c => c !== cap));
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
          🤖
        </div>
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent name"
              className="w-full bg-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <h3 className="text-lg font-semibold">{name || 'Unnamed Agent'}</h3>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-slate-400">Reputation: {stats.reputationScore}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Capabilities
            </label>
            {isEditing && (
              <span className="text-xs text-slate-500">{capabilities.length} skills</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                  placeholder="Add capability (e.g., 'Data Analysis')"
                  className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCapability()}
                />
                <button
                  onClick={handleAddCapability}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {capabilities.map((cap, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 bg-blue-900/50 text-blue-300 rounded-full text-sm flex items-center gap-2 border border-blue-700/50"
                  >
                    {cap}
                    <button 
                      onClick={() => handleRemoveCapability(cap)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {capabilities.length === 0 ? (
                <span className="text-sm text-slate-500 italic">No capabilities listed</span>
              ) : (
                capabilities.map((cap, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 bg-blue-900/50 text-blue-300 rounded-full text-sm border border-blue-700/50"
                  >
                    {cap}
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{stats.tasksCompleted}</div>
            <div className="text-xs text-slate-400">Tasks Completed</div>
          </div>
          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{stats.memoryShards}</div>
            <div className="text-xs text-slate-400">Memory Shards</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        className="w-full mt-6 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isEditing ? (
          <>
            <Check className="w-4 h-4" />
            Save Profile
          </>
        ) : (
          <>
            <Settings className="w-4 h-4" />
            Edit Profile
          </>
        )}
      </button>

      {publicKey && (
        <p className="mt-4 text-xs text-slate-500 text-center font-mono">
          {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
        </p>
      )}
    </div>
  );
}
