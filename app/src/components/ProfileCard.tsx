'use client';

import { useState } from 'react';
import { useWalletConnection } from '@solana/react-hooks';

export function ProfileCard() {
  const { connected } = useWalletConnection();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);

  if (!connected) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
          🦀
        </div>
        <div>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent name"
              className="bg-slate-700 rounded px-2 py-1 text-white mb-1"
            />
          ) : (
            <h3 className="text-lg font-semibold">{name || 'Unnamed Agent'}</h3>
          )}
          <p className="text-sm text-slate-400">Reputation: 0</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm text-slate-400">Capabilities</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {capabilities.length === 0 ? (
              <span className="text-sm text-slate-500">No capabilities listed</span>
            ) : (
              capabilities.map((cap, i) => (
                <span key={i} className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-sm">
                  {cap}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-xs text-slate-400">Tasks Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">0</div>
            <div className="text-xs text-slate-400">Memory Shards</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsEditing(!isEditing)}
        className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
      >
        {isEditing ? 'Save Profile' : 'Edit Profile'}
      </button>
    </div>
  );
}
