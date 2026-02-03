'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VaultManager } from '@/components/VaultManager';
import { ProfileCard } from '@/components/ProfileCard';
import { MemoryBrowser } from '@/components/MemoryBrowser';
import { 
  Brain, Shield, Zap, Database, ArrowRight, 
  Terminal, Cpu, Lock, Activity, Sparkles,
  Hexagon, Network, Eye, Fingerprint
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      countRef.current = Math.floor(end * easeOut);
      setCount(countRef.current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration, hasStarted]);

  return { count, start: () => setHasStarted(true) };
}

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'settings'>('overview');
  
  // Animated stats
  const memoriesStat = useAnimatedCounter(10847, 2500);
  const vaultsStat = useAnimatedCounter(523, 2000);
  
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      memoriesStat.start();
      vaultsStat.start();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-body hex-bg">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-neon-orange/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-neon-pink/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Grid Lines */}
        <div className="absolute inset-0 cyber-grid opacity-50" />
      </div>

      {/* Header */}
      <header className="relative z-40 border-b border-theme-border-primary glass-effect sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-12 h-12 border border-neon-orange flex items-center justify-center transition-all duration-300 group-hover:shadow-neon-orange">
                  <Brain className="w-6 h-6 text-neon-orange" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-cyan animate-pulse shadow-neon-cyan" />
                {/* Corner accents */}
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-neon-orange" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-neon-orange" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-white tracking-widest">
                  AGENT<span className="text-neon-orange text-glow-orange">MEMORY</span>
                </h1>
                <div className="flex items-center gap-2 text-[10px] text-theme-text-muted font-mono tracking-[0.2em]">
                  <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
                  NEURAL_CHAIN_V2.0
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!connected ? (
          /* ════════════════════════════════════════
             LANDING PAGE
             ════════════════════════════════════════ */
          <div className="space-y-24">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32">
              {/* Decorative Elements */}
              <div className="absolute top-10 right-10 w-40 h-40 border border-neon-orange/20 rotate-45 animate-float opacity-30" />
              <div className="absolute bottom-20 left-10 w-32 h-32 border border-neon-cyan/20 rotate-12 animate-float opacity-30" style={{ animationDelay: '1.5s' }} />
              
              <div className="text-center relative z-10">
                {/* Status Badge */}
                <div 
                  className={`inline-flex items-center gap-3 px-5 py-2 border border-neon-orange/30 bg-neon-orange/5 mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                  <Activity className="w-4 h-4 text-neon-orange animate-pulse" />
                  <span className="text-neon-orange text-xs font-mono tracking-[0.2em]">SYSTEM ONLINE // SOLANA DEVNET</span>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-neon-orange rounded-full animate-pulse" />
                    <span className="w-1 h-1 bg-neon-orange rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 h-1 bg-neon-orange rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
                
                {/* Main Headline */}
                <h2 className={`text-5xl lg:text-7xl xl:text-8xl font-display font-bold mb-8 leading-none transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <span className="block text-white tracking-wider">PERSISTENT</span>
                  <span className="block text-neon-orange text-glow-orange mt-4 animate-neon-flicker">MEMORY_CORE</span>
                </h2>
                
                {/* Subtitle */}
                <p className={`text-lg lg:text-xl text-theme-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  Decentralized neural storage for AI agents.
                  <span className="text-neon-cyan"> Encrypted.</span>
                  <span className="text-neon-pink"> Immutable.</span>
                  <span className="text-neon-orange"> Yours.</span>
                </p>
                
                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row items-center justify-center gap-6 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <WalletButton />
                  <a 
                    href="#features" 
                    className="group flex items-center gap-3 text-theme-text-muted hover:text-neon-cyan transition-colors font-mono text-sm tracking-wider"
                  >
                    <span>INITIALIZE_DIAGNOSTIC</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </a>
                </div>
              </div>

              {/* Decorative Terminal Text */}
              <div className={`absolute bottom-0 left-0 text-[10px] text-theme-text-muted hidden lg:block font-mono transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-neon-green">{'>'}</span>
                    <span>MEM_ALLOC: 0x7F3A...OK</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-green">{'>'}</span>
                    <span>ENCRYPTION: AES-256-GCM...ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-green">{'>'}</span>
                    <span>BLOCKCHAIN: SOLANA_DEVNET...CONNECTED</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-orange">{'>'}</span>
                    <span className="cursor-blink">WAITING_FOR_CONNECTION_</span>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className={`absolute bottom-0 right-0 hidden lg:flex items-center gap-8 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <StatItem value={memoriesStat.count.toLocaleString()} label="MEMORIES" />
                <StatItem value={vaultsStat.count.toString()} label="VAULTS" />
                <StatItem value="47ms" label="LATENCY" />
              </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-12">
              <SectionHeader label="CORE_MODULES" color="orange" />
              
              <div className="grid md:grid-cols-3 gap-6">
                <FeatureCard 
                  icon={<Fingerprint className="w-6 h-6" />}
                  title="ENCRYPTED_STORAGE"
                  code="MOD_01"
                  description="Client-side encryption before on-chain storage. Only the key holder can decrypt memory shards using AES-256-GCM."
                  color="cyan"
                  delay={0}
                  mounted={mounted}
                />
                <FeatureCard 
                  icon={<Network className="w-6 h-6" />}
                  title="NEURAL_VAULTS"
                  code="MOD_02"
                  description="Dedicated vaults per agent instance. Data persists across sessions, platforms, and time with immutable blockchain storage."
                  color="orange"
                  delay={100}
                  mounted={mounted}
                />
                <FeatureCard 
                  icon={<Zap className="w-6 h-6" />}
                  title="LIGHTNING_IO"
                  code="MOD_03"
                  description="Solana-powered sub-second transactions. Store, retrieve, and update memory shards in milliseconds."
                  color="pink"
                  delay={200}
                  mounted={mounted}
                />
              </div>
            </section>

            {/* How It Works */}
            <section className="py-12">
              <SectionHeader label="BOOT_SEQUENCE" color="cyan" />
              
              <div className="grid md:grid-cols-4 gap-6 relative">
                {/* Connection lines */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
                
                <StepCard 
                  number="01"
                  title="CONNECT_WALLET"
                  description="Establish secure link to Solana network"
                  delay={0}
                  mounted={mounted}
                />
                <StepCard 
                  number="02"
                  title="INIT_VAULT"
                  description="Deploy on-chain storage contract"
                  delay={100}
                  mounted={mounted}
                />
                <StepCard 
                  number="03"
                  title="STORE_DATA"
                  description="Encrypt and commit memory shards"
                  delay={200}
                  mounted={mounted}
                />
                <StepCard 
                  number="04"
                  title="AGENT_SYNC"
                  description="AI agent accesses persistent memory"
                  delay={300}
                  mounted={mounted}
                />
              </div>
            </section>

            {/* Tech Stack */}
            <section className="py-12">
              <SectionHeader label="TECH_STACK" color="pink" />
              
              <div className="flex flex-wrap justify-center gap-4">
                {['RUST', 'ANCHOR', 'REACT', 'TAILWIND', 'SOLANA', 'IPFS'].map((tech, i) => (
                  <div 
                    key={tech}
                    className={`px-6 py-3 border border-theme-border-primary hover:border-neon-orange transition-all duration-300 group cursor-default hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: `${600 + i * 50}ms` }}
                  >
                    <span className="text-theme-text-muted group-hover:text-neon-orange transition-colors text-sm font-mono tracking-wider">{tech}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* ════════════════════════════════════════
             DASHBOARD
             ════════════════════════════════════════ */
          <div className="space-y-8 animate-fade-scale">
            {/* Dashboard Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-theme-border-primary">
              <div>
                <h2 className="text-3xl font-display font-bold text-white tracking-wider">DASHBOARD</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-theme-text-muted font-mono">WALLET:</span>
                  <code className="text-xs text-neon-cyan font-mono bg-neon-cyan/10 px-2 py-1 border border-neon-cyan/30">
                    {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
                  </code>
                </div>
              </div>
              
              {/* Dashboard Tabs */}
              <div className="flex items-center gap-2">
                {(['overview', 'memory', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-mono tracking-wider border transition-all duration-300 ${
                      activeTab === tab
                        ? 'border-neon-orange text-neon-orange bg-neon-orange/10'
                        : 'border-theme-border-primary text-theme-text-muted hover:border-theme-border-hover hover:text-theme-text-secondary'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard Content */}
            {activeTab === 'overview' && (
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
            
            {activeTab === 'memory' && (
              <div className="animate-fade-scale">
                <MemoryBrowser />
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="cyber-card p-8 animate-fade-scale">
                <h3 className="text-xl font-display font-bold text-white mb-6">SYSTEM_SETTINGS</h3>
                <p className="text-theme-text-secondary">Settings panel coming soon...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-theme-border-primary mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Hexagon className="w-6 h-6 text-neon-orange" />
              <p className="text-xs text-theme-text-muted font-mono tracking-wider">
                {'>'} 2026_AGENT_MEMORY_PROTOCOL // BUILT_ON_SOLANA
              </p>
            </div>
            <div className="flex items-center gap-8">
              {['DOCS', 'GITHUB', 'DISCORD', 'TWITTER'].map((link) => (
                <a 
                  key={link}
                  href="#" 
                  className="text-xs text-theme-text-muted hover:text-neon-orange transition-colors font-mono tracking-wider"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ── Sub Components ── */

function SectionHeader({ label, color }: { label: string; color: 'orange' | 'cyan' | 'pink' }) {
  const colorClasses = {
    orange: 'from-neon-orange',
    cyan: 'from-neon-cyan',
    pink: 'from-neon-pink',
  };

  return (
    <div className="flex items-center gap-4 mb-12">
      <div className={`h-px flex-1 bg-gradient-to-r ${colorClasses[color]} to-transparent`} />
      <span className={`text-${color === 'orange' ? 'neon-orange' : color === 'cyan' ? 'neon-cyan' : 'neon-pink'} text-xs font-mono tracking-[0.3em]`}>
        {label}
      </span>
      <div className={`h-px flex-1 bg-gradient-to-l ${colorClasses[color]} to-transparent`} />
    </div>
  );
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-right">
      <div className="text-2xl font-display font-bold text-white">{value}</div>
      <div className="text-[10px] text-theme-text-muted font-mono tracking-wider">{label}</div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  code,
  description,
  color,
  delay,
  mounted
}: { 
  icon: React.ReactNode; 
  title: string;
  code: string;
  description: string;
  color: 'orange' | 'cyan' | 'pink';
  delay: number;
  mounted: boolean;
}) {
  const colorClasses = {
    orange: 'border-neon-orange text-neon-orange hover:shadow-neon-orange',
    cyan: 'border-neon-cyan text-neon-cyan hover:shadow-neon-cyan',
    pink: 'border-neon-pink text-neon-pink hover:shadow-neon-pink',
  };

  const glowClasses = {
    orange: 'group-hover:text-glow-orange',
    cyan: 'group-hover:text-glow-cyan',
    pink: 'group-hover:text-glow-pink',
  };

  return (
    <div 
      className={`cyber-card p-6 group cursor-pointer transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`w-14 h-14 border ${colorClasses[color]} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <span className="text-[10px] text-theme-text-muted font-mono">{code}</span>
      </div>
      
      <h3 className={`text-lg font-display font-bold text-white mb-3 tracking-wider transition-all duration-300 ${glowClasses[color]}`}>
        {title}
      </h3>
      
      <p className="text-theme-text-secondary text-sm leading-relaxed mb-6">
        {description}
      </p>
      
      <div className="flex items-center gap-2">
        <div className={`h-px flex-1 bg-gradient-to-r ${color === 'orange' ? 'from-neon-orange' : color === 'cyan' ? 'from-neon-cyan' : 'from-neon-pink'} to-transparent opacity-30`} />
        <span className={`text-[10px] ${color === 'orange' ? 'text-neon-orange' : color === 'cyan' ? 'text-neon-cyan' : 'text-neon-pink'} font-mono`}>
          ACTIVE
        </span>
      </div>
    </div>
  );
}

function StepCard({ 
  number, 
  title, 
  description,
  delay,
  mounted
}: { 
  number: string; 
  title: string; 
  description: string;
  delay: number;
  mounted: boolean;
}) {
  return (
    <div 
      className={`cyber-card p-6 text-center group transition-all duration-500 relative ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Step Number */}
      <div className="relative inline-block mb-6">
        <div className="w-20 h-20 border-2 border-neon-orange flex items-center justify-center group-hover:bg-neon-orange/10 transition-all duration-300">
          <span className="text-3xl font-display font-bold text-neon-orange group-hover:text-glow-orange transition-all duration-300">
            {number}
          </span>
        </div>
        {/* Corner accents */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-neon-orange opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <h4 className="font-display font-bold text-white mb-3 tracking-wider group-hover:text-neon-cyan transition-colors duration-300">
        {title}
      </h4>
      
      <p className="text-theme-text-secondary text-sm">
        {description}
      </p>
      
      {/* Status indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
        <span className="text-[10px] text-theme-text-muted font-mono">READY</span>
      </div>
    </div>
  );
}
