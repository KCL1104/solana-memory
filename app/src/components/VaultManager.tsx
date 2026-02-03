'use client';

import { useState, useEffect } from 'react';
import { useWalletConnection } from './WalletButton';
import { Plus, Lock, Database, Shield } from 'lucide-react';

export function VaultManager() {
  const { connected, publicKey } = useWalletConnection();
  const [hasVault, setHasVault] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [vaultInfo, setVaultInfo] = useState({
    memoryCount: 0,
    totalSize: 0,
    createdAt: null as Date | null,
  });

  if (!connected) return null;

  const handleCreateVault = async () => {
    setIsCreating(true);
    // TODO: Call initialize_vault instruction on chain
    // For demo purposes, simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setHasVault(true);
    setVaultInfo({
      memoryCount: 0,
      totalSize: 0,
      createdAt: new Date(),
    });
    setIsCreating(false);
  };

  if (!hasVault) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Memory Vault</h3>
            <p className="text-sm text-slate-400">Create your on-chain storage</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Create a vault to start storing encrypted memory on-chain. Your vault is owned by your wallet.
        </p>
        <button
          onClick={handleCreateVault}
          disabled={isCreating}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Vault
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-500/20 rounded-lg">
          <Lock className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Memory Vault</h3>
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Active
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
          <span className="text-slate-400 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Memory Shards
          </span>
          <span className="text-white font-medium">{vaultInfo.memoryCount}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
          <span className="text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Total Size
          </span>
          <span className="text-white font-medium">
            {vaultInfo.totalSize === 0 ? '0 bytes' : `${vaultInfo.totalSize} bytes`}
          </span>
        </div>
        
        <div className="flex items-center justify-between py-3">
          <span className="text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Encryption
          </span>
          <span className="text-green-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            Enabled
          </span>
        </div>
      </div>

      {vaultInfo.createdAt && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          Created {vaultInfo.createdAt.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
