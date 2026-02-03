'use client';

import { useWalletConnection } from '@solana/react-hooks';
import { WalletButton } from '@/components/WalletButton';
import { VaultManager } from '@/components/VaultManager';
import { ProfileCard } from '@/components/ProfileCard';
import { MemoryBrowser } from '@/components/MemoryBrowser';

export default function Home() {
  const { wallet, connected } = useWalletConnection();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🧠</div>
            <div>
              <h1 className="text-2xl font-bold">AgentMemory</h1>
              <p className="text-sm text-slate-400">Persistent memory for AI agents on Solana</p>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!connected ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🦀</div>
            <h2 className="text-3xl font-bold mb-4">Welcome to AgentMemory</h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              AI agents deserve persistent memory. Store context, learnings, and preferences 
              on-chain with human-owned encryption keys.
            </p>
            <div className="inline-block">
              <WalletButton />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <ProfileCard />
              <VaultManager />
            </div>
            <div className="lg:col-span-2">
              <MemoryBrowser />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
