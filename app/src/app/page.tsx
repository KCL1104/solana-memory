'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import { VaultManager } from '@/components/VaultManager';
import { ProfileCard } from '@/components/ProfileCard';
import { MemoryBrowser } from '@/components/MemoryBrowser';
import { Brain, Shield, Zap, Database, ArrowRight } from 'lucide-react';

export default function Home() {
  const { connected, publicKey } = useWallet();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                AgentMemory
              </h1>
              <p className="text-xs text-slate-400">Persistent memory for AI agents</p>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!connected ? (
          /* Landing Page */
          <div className="space-y-16">
            {/* Hero Section */}
            <section className="text-center py-16 lg:py-24">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
                <Zap className="w-4 h-4" />
                <span>Now on Solana Devnet</span>
              </div>
              
              <h2 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Give Your AI Agent
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Persistent Memory
                </span>
              </h2>
              
              <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Store context, learnings, and preferences on-chain with human-owned 
                encryption keys. Your agent remembers everything, forever.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <WalletButton />
                <a 
                  href="#features" 
                  className="px-6 py-3 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-8">
              <div className="grid md:grid-cols-3 gap-6">
                <FeatureCard 
                  icon={<Shield className="w-6 h-6" />}
                  title="Encrypted Storage"
                  description="All memories are encrypted client-side before being stored on-chain. Only you control the keys."
                />
                <FeatureCard 
                  icon={<Database className="w-6 h-6" />}
                  title="Persistent Vaults"
                  description="Create dedicated memory vaults for each agent. Data persists across sessions and platforms."
                />
                <FeatureCard 
                  icon={<Zap className="w-6 h-6" />}
                  title="Lightning Fast"
                  description="Built on Solana for high-speed, low-cost transactions. Store memories in milliseconds."
                />
              </div>
            </section>

            {/* How It Works */}
            <section className="py-8">
              <h3 className="text-2xl font-bold text-center mb-12">How It Works</h3>
              <div className="grid md:grid-cols-4 gap-8">
                <StepCard 
                  number="1"
                  title="Connect Wallet"
                  description="Link your Solana wallet to get started"
                />
                <StepCard 
                  number="2"
                  title="Create Vault"
                  description="Initialize a secure memory vault on-chain"
                />
                <StepCard 
                  number="3"
                  title="Store Memories"
                  description="Add encrypted memory shards with metadata"
                />
                <StepCard 
                  number="4"
                  title="Agent Access"
                  description="Your AI agent reads from the vault"
                />
              </div>
            </section>

            {/* Stats */}
            <section className="py-8">
              <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-white/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <StatCard value="10k+" label="Memories Stored" />
                  <StatCard value="500+" label="Active Vaults" />
                  <StatCard value="50ms" label="Avg. Latency" />
                  <StatCard value="0.001" label="SOL per Store" />
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Dashboard */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-slate-400 text-sm">
                  Connected as {publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Connected
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <ProfileCard />
                <VaultManager />
              </div>
              <div className="lg:col-span-2">
                <MemoryBrowser />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2026 AgentMemory. Built on Solana.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors group">
      <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ 
  number, 
  title, 
  description 
}: { 
  number: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function StatCard({ 
  value, 
  label 
}: { 
  value: string; 
  label: string;
}) {
  return (
    <div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}
