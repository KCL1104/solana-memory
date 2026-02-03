'use client';

import { useState } from 'react';
import { useWalletConnection } from '@solana/react-hooks';

export function VaultManager() {
  const { connected } = useWalletConnection();
  const [hasVault, setHasVault] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!connected) return null;

  const handleCreateVault = () => {
    setIsCreating(true);
    // TODO: Call initialize_vault instruction
    setTimeout(() => {
      setHasVault(true);
      setIsCreating(false);
    }, 1000);
  };

  if (!hasVault) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-2">🗄️ Memory Vault</h3>
        <p className="text-sm text-slate-400 mb-4">
          Create a vault to start storing encrypted memory on-chain.
        </p>
        <button
          onClick={handleCreateVault}
          disabled={isCreating}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg font-medium transition-colors"
        >
          {isCreating ? 'Creating...' : 'Create Vault'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold mb-4">🗄️ Memory Vault</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Status</span>
          <span className="text-green-400">Active</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Memory Shards</span>
          <span className="text-white">0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Total Size</span>
          <span className="text-white">0 bytes</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Encryption</span>
          <span className="text-green-400">Enabled</span>
        </div>
      </div>
    </div>
  );
}
