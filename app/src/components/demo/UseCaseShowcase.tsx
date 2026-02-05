'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Users, Gamepad2, ArrowRight, 
  Bot, Shield, Zap, Database, Sparkles, ChevronRight
} from 'lucide-react';

// Use case data
const useCases = [
  {
    id: 'trading',
    icon: TrendingUp,
    title: 'Trading Bot',
    subtitle: 'Adaptive Trading Intelligence',
    description: 'Trading bots that learn from market patterns and remember successful strategies.',
    color: 'neon-green',
    features: [
      'Learns from past trades',
      'Remembers market conditions',
      'Adapts strategy over time',
      'Shares insights with other agents',
    ],
    demo: {
      title: 'Strategy Memory',
      memories: [
        { key: 'rsi_oversold_bounce', value: 'Success rate: 73% when RSI < 30 + volume spike' },
        { key: 'btc_support_42k', value: 'Strong support at $42,000 - watch for accumulation' },
        { key: 'fomc_volatility', value: 'FOMC announcements: avoid trading 30min before/after' },
      ],
    },
  },
  {
    id: 'dao',
    icon: Users,
    title: 'DAO Governance',
    subtitle: 'Institutional Knowledge Retention',
    description: 'DAO agents that remember past proposals, voter preferences, and governance patterns.',
    color: 'neon-purple',
    features: [
      'Tracks voter history',
      'Summarizes past proposals',
      'Identifies consensus patterns',
      'Maintains institutional memory',
    ],
    demo: {
      title: 'Governance Memory',
      memories: [
        { key: 'treasury_alloc_pref', value: 'Community prefers 60% development, 30% marketing, 10% reserves' },
        { key: 'voter_turnout_pattern', value: 'Higher turnout on funding proposals (avg 67% vs 42%)' },
        { key: 'delegation_trust', value: 'Top delegates: alice.sol, bob.sol, charlie.sol' },
      ],
    },
  },
  {
    id: 'gaming',
    icon: Gamepad2,
    title: 'Gaming NPC',
    subtitle: 'Persistent Character Memory',
    description: 'NPCs that remember player interactions, forming lasting relationships and dynamic storylines.',
    color: 'neon-pink',
    features: [
      'Remembers player choices',
      'Evolves personality over time',
      'Creates unique storylines',
      'Shares world state between sessions',
    ],
    demo: {
      title: 'Character Memory',
      memories: [
        { key: 'player_hero_name', value: 'Player saved my village - owes them a favor' },
        { key: 'quest_dragon_slay', value: 'Attempted dragon quest 3 times, prefers stealth approach' },
        { key: 'faction_rep', value: 'Friendly with Rangers, hostile to Shadow Guild' },
      ],
    },
  },
];

// Animated code block
function CodeBlock({ lines, activeLine }: { lines: string[]; activeLine: number }) {
  return (
    <div className="font-mono text-sm bg-[#0d0d12] rounded-lg p-4 border border-theme-border-primary overflow-hidden">
      {lines.map((line, i) => (
        <div 
          key={i}
          className={`flex transition-all duration-300 ${
            i === activeLine ? 'text-white' : 'text-theme-text-muted'
          }`}
        >
          <span className="w-8 text-theme-text-muted select-none">{i + 1}</span>
          <span className={`${i === activeLine ? 'text-neon-cyan' : ''}`}>
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}

// Memory visualization
function MemoryVisualization({ memories, activeIndex }: { memories: { key: string; value: string }[]; activeIndex: number }) {
  return (
    <div className="space-y-2">
      {memories.map((mem, i) => (
        <div 
          key={mem.key}
          className={`p-3 rounded border transition-all duration-500 ${
            i === activeIndex 
              ? 'bg-neon-cyan/10 border-neon-cyan/50 scale-105' 
              : 'bg-theme-bg-tertiary border-theme-border-primary opacity-60'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Database className={`w-3 h-3 ${i === activeIndex ? 'text-neon-cyan' : 'text-theme-text-muted'}`} />
            <span className={`text-xs font-mono ${i === activeIndex ? 'text-neon-cyan' : 'text-theme-text-muted'}`}>
              {mem.key}
            </span>
          </div>
          <p className={`text-sm ${i === activeIndex ? 'text-white' : 'text-theme-text-secondary'}`}>
            {mem.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// Use case card
function UseCaseCard({ 
  useCase, 
  isActive, 
  onClick 
}: { 
  useCase: typeof useCases[0]; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const Icon = useCase.icon;
  const colorClasses: Record<string, string> = {
    'neon-green': 'text-neon-green border-neon-green/30 bg-neon-green/10',
    'neon-purple': 'text-neon-purple border-neon-purple/30 bg-neon-purple/10',
    'neon-pink': 'text-neon-pink border-neon-pink/30 bg-neon-pink/10',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-6 rounded-xl border transition-all duration-300 group ${
        isActive 
          ? `${colorClasses[useCase.color]} border-2` 
          : 'bg-theme-bg-tertiary border-theme-border-primary hover:border-theme-border-hover'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isActive ? 'bg-current/20' : 'bg-theme-bg-secondary group-hover:bg-theme-bg-tertiary'
        }`}>
          <Icon className={`w-6 h-6 ${isActive ? 'text-current' : 'text-theme-text-secondary'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-display font-bold mb-1 ${isActive ? 'text-white' : 'text-theme-text-primary'}`}>
            {useCase.title}
          </h3>
          <p className={`text-xs font-mono uppercase tracking-wider ${isActive ? 'text-current' : 'text-theme-text-muted'}`}>
            {useCase.subtitle}
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'rotate-90' : ''} ${
          isActive ? 'text-current' : 'text-theme-text-muted'
        }`} />
      </div>
    </button>
  );
}

export function UseCaseShowcase() {
  const [activeCase, setActiveCase] = useState(0);
  const [activeMemoryIndex, setActiveMemoryIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeUseCase = useCases[activeCase];

  // Auto-cycle through memories
  useEffect(() => {
    if (!isAutoPlaying) return;

    intervalRef.current = setInterval(() => {
      setActiveMemoryIndex((prev) => (prev + 1) % activeUseCase.demo.memories.length);
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeUseCase, isAutoPlaying]);

  const handleCaseChange = (index: number) => {
    setActiveCase(index);
    setActiveMemoryIndex(0);
    setIsAutoPlaying(true);
  };

  const codeExamples: Record<string, string[]> = {
    trading: [
      '// Store trading insight',
      'await agentMemory.store({',
      '  content: "RSI oversold bounce: 73% win rate",',
      '  importance: "high",',
      '  tags: ["strategy", "rsi", "btc"]',
      '});',
      '',
      '// Retrieve relevant strategies',
      'const strategies = await agentMemory.search({',
      '  query: "RSI bounce BTC",',
      '  limit: 5',
      '});',
    ],
    dao: [
      '// Record governance preference',
      'await agentMemory.store({',
      '  content: "Community prefers 60% dev allocation",',
      '  importance: "critical",',
      '  tags: ["governance", "treasury", "preferences"]',
      '});',
      '',
      '// Query voter patterns',
      'const patterns = await agentMemory.search({',
      '  query: "delegation trust",',
      '  limit: 10',
      '});',
    ],
    gaming: [
      '// Save player interaction',
      'await agentMemory.store({',
      '  content: "Player chose to save the village",',
      '  importance: "high",',
      '  tags: ["quest", "reputation", "heroic"]',
      '});',
      '',
      '// Check faction standing',
      'const reputation = await agentMemory.search({',
      '  query: "faction reputation player",',
      '  limit: 3',
      '});',
    ],
  };

  const colorClasses: Record<string, string> = {
    'neon-green': 'text-neon-green',
    'neon-purple': 'text-neon-purple',
    'neon-pink': 'text-neon-pink',
  };

  return (
    <section id="use-cases" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-theme-bg-primary" />
      <div className="absolute inset-0 hex-bg opacity-30" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-neon-orange/30 rounded-full bg-neon-orange/5">
            <Sparkles className="w-4 h-4 text-neon-orange" />
            <span className="text-xs font-mono text-neon-orange tracking-wider">USE CASES</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Built for <span className="text-neon-orange text-glow-orange">Every Agent</span>
          </h2>
          <p className="text-lg text-theme-text-secondary max-w-2xl mx-auto">
            From trading bots to gaming NPCs, AgentMemory enables persistent intelligence 
            across every type of AI agent.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Use Case Selector */}
          <div className="lg:col-span-4 space-y-4">
            {useCases.map((useCase, i) => (
              <UseCaseCard
                key={useCase.id}
                useCase={useCase}
                isActive={activeCase === i}
                onClick={() => handleCaseChange(i)}
              />
            ))}

            {/* Features List */}
            <div className="mt-8 p-6 bg-theme-bg-tertiary rounded-xl border border-theme-border-primary">
              <h4 className="text-sm font-mono uppercase tracking-wider text-theme-text-muted mb-4">
                Key Capabilities
              </h4>
              <ul className="space-y-3">
                {activeUseCase.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-theme-text-secondary">
                    <Zap className={`w-4 h-4 ${colorClasses[activeUseCase.color]}`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="lg:col-span-8">
            <div className="cyber-card p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-xl font-display font-bold ${colorClasses[activeUseCase.color]}`}>
                    {activeUseCase.demo.title}
                  </h3>
                  <p className="text-sm text-theme-text-muted mt-1">
                    Live memory visualization
                  </p>
                </div>
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="px-4 py-2 text-xs font-mono border border-theme-border-primary rounded hover:border-theme-border-hover transition-colors"
                >
                  {isAutoPlaying ? 'Pause' : 'Play'} Demo
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Code Example */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-theme-text-muted mb-4">
                    Implementation
                  </h4>
                  <CodeBlock 
                    lines={codeExamples[activeUseCase.id]} 
                    activeLine={2 + activeMemoryIndex * 2}
                  />
                </div>

                {/* Memory Visualization */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-theme-text-muted mb-4">
                    Stored Memories
                  </h4>
                  <MemoryVisualization 
                    memories={activeUseCase.demo.memories}
                    activeIndex={activeMemoryIndex}
                  />
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {activeUseCase.demo.memories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveMemoryIndex(i);
                      setIsAutoPlaying(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === activeMemoryIndex 
                        ? `bg-${activeUseCase.color} w-6` 
                        : 'bg-theme-border-primary hover:bg-theme-border-hover'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
