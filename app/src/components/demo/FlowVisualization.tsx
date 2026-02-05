'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Bot, Cpu, Database, Globe, Shield, 
  ArrowRight, Lock, FileSearch, Server,
  Sparkles, Zap
} from 'lucide-react';

// Animation step type
type Step = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  details: string[];
};

const steps: Step[] = [
  {
    id: 'agent',
    icon: Bot,
    title: 'AI Agent',
    description: 'Your intelligent agent creates or retrieves memories',
    details: [
      'Natural language processing',
      'Intent recognition',
      'Memory relevance scoring',
    ],
  },
  {
    id: 'sdk',
    icon: Cpu,
    title: 'AgentMemory SDK',
    description: 'TypeScript SDK handles encryption and serialization',
    details: [
      'End-to-end encryption',
      'Content hashing (SHA-256)',
      'Automatic retry logic',
    ],
  },
  {
    id: 'solana',
    icon: Globe,
    title: 'Solana Blockchain',
    description: 'Transaction submitted to Solana devnet/mainnet',
    details: [
      'Sub-second finality',
      'Low transaction costs',
      'Verifiable on-chain data',
    ],
  },
  {
    id: 'storage',
    icon: Database,
    title: 'On-Chain Memory',
    description: 'Memory stored permanently in smart contract',
    details: [
      'Version history tracking',
      'Metadata indexing',
      'Access control rules',
    ],
  },
];

// Animated node component
function FlowNode({ 
  step, 
  index, 
  isActive, 
  progress 
}: { 
  step: Step; 
  index: number; 
  isActive: boolean;
  progress: number;
}) {
  const Icon = step.icon;
  const isCompleted = progress > index;
  
  return (
    <div className={`relative flex flex-col items-center transition-all duration-500 ${
      isActive ? 'scale-110' : isCompleted ? 'opacity-100' : 'opacity-50'
    }`}>
      {/* Icon Container */}
      <div className={`
        relative w-20 h-20 rounded-2xl flex items-center justify-center
        transition-all duration-500 border-2
        ${isActive 
          ? 'bg-neon-cyan/20 border-neon-cyan shadow-neon-cyan' 
          : isCompleted
            ? 'bg-neon-green/10 border-neon-green'
            : 'bg-theme-bg-tertiary border-theme-border-primary'
        }
      `}>
        <Icon className={`w-8 h-8 transition-colors duration-300 ${
          isActive ? 'text-neon-cyan' : isCompleted ? 'text-neon-green' : 'text-theme-text-muted'
        }`} />
        
        {/* Pulse Effect */}
        {isActive && (
          <div className="absolute inset-0 rounded-2xl border-2 border-neon-cyan animate-ping opacity-20" />
        )}
        
        {/* Step Number */}
        <div className={`
          absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center
          text-xs font-mono font-bold
          ${isActive || isCompleted ? 'bg-neon-cyan text-black' : 'bg-theme-border-primary text-theme-text-muted'}
        `}>
          {index + 1}
        </div>
      </div>
      
      {/* Label */}
      <div className="mt-4 text-center">
        <h4 className={`font-display font-bold text-sm transition-colors duration-300 ${
          isActive ? 'text-white' : 'text-theme-text-secondary'
        }`}>
          {step.title}
        </h4>
        <p className={`text-xs mt-1 max-w-[140px] transition-colors duration-300 ${
          isActive ? 'text-neon-cyan' : 'text-theme-text-muted'
        }`}>
          {step.description}
        </p>
      </div>
    </div>
  );
}

// Connection line between nodes
function ConnectionLine({ 
  isActive, 
  isCompleted,
  progress 
}: { 
  isActive: boolean; 
  isCompleted: boolean;
  progress: number;
}) {
  return (
    <div className="flex-1 h-1 bg-theme-border-primary relative overflow-hidden rounded-full mx-2">
      <div 
        className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-full ${
          isCompleted 
            ? 'w-full bg-neon-green' 
            : isActive 
              ? 'bg-neon-cyan animate-pulse'
              : 'w-0'
        }`}
        style={isActive ? { width: `${(progress % 1) * 100}%` } : undefined}
      />
      
      {/* Flowing particles */}
      {isActive && (
        <div className="absolute inset-0">
          <div className="absolute top-0 bottom-0 w-2 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-[slideRight_1s_linear_infinite]" />
        </div>
      )}
    </div>
  );
}

// Detail card for active step
function DetailCard({ step }: { step: Step }) {
  return (
    <div className="cyber-card p-6 animate-fade-scale">
      <div className="flex items-center gap-3 mb-4">
        <step.icon className="w-6 h-6 text-neon-cyan" />
        <h4 className="text-lg font-display font-bold text-white">{step.title}</h4>
      </div>
      <p className="text-theme-text-secondary mb-4">{step.description}</p>
      <ul className="space-y-2">
        {step.details.map((detail, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-theme-text-muted">
            <Zap className="w-4 h-4 text-neon-orange" />
            {detail}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Transaction simulation visualization
function TransactionSimulation({ isActive }: { isActive: boolean }) {
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const logMessages = [
    '> Initializing AgentMemory SDK...',
    '> Encrypting content with AES-256-GCM...',
    '> Computing SHA-256 content hash...',
    '> Building Solana transaction...',
    '> Signing with agent keypair...',
    '> Sending to devnet RPC...',
    '> Transaction confirmed (slot 324,582,941)',
    '> Memory stored successfully!',
  ];

  useEffect(() => {
    if (!isActive) {
      setLogs([]);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < logMessages.length) {
        setLogs(prev => [...prev, logMessages[index]]);
        index++;
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="font-mono text-xs bg-[#050508] rounded-lg p-4 border border-theme-border-primary h-48 overflow-hidden">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-theme-border-primary">
        <Server className="w-4 h-4 text-neon-cyan" />
        <span className="text-neon-cyan">Transaction Logs</span>
        {isActive && <span className="animate-pulse text-neon-green">● Live</span>}
      </div>
      <div ref={logRef} className="space-y-1 overflow-y-auto h-full pb-6">
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`${
              log.includes('confirmed') ? 'text-neon-green' :
              log.includes('successfully') ? 'text-neon-green font-bold' :
              log.includes('Encrypting') || log.includes('hash') ? 'text-neon-purple' :
              'text-theme-text-muted'
            }`}
          >
            {log}
          </div>
        ))}
        {isActive && logs.length < logMessages.length && (
          <div className="text-neon-cyan animate-pulse">_</div>
        )}
      </div>
    </div>
  );
}

export function FlowVisualization() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const animationRef = useRef<number>();

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setProgress(prev => {
        const newProgress = prev + delta * 0.5; // 2 seconds per step
        if (newProgress >= steps.length) {
          return 0; // Loop back to start
        }
        return newProgress;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Update active step based on progress
  useEffect(() => {
    setActiveStep(Math.floor(progress));
  }, [progress]);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-theme-bg-secondary to-theme-bg-primary" />
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-orange/5 rounded-full blur-[100px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-neon-purple/30 rounded-full bg-neon-purple/5">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            <span className="text-xs font-mono text-neon-purple tracking-wider">HOW IT WORKS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            From Agent to <span className="text-neon-purple text-glow-purple">Blockchain</span>
          </h2>
          <p className="text-lg text-theme-text-secondary max-w-2xl mx-auto">
            See how memories flow from your AI agent to permanent on-chain storage 
            in under 2 seconds.
          </p>
        </div>

        {/* Flow Visualization */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <FlowNode 
                  step={step} 
                  index={i} 
                  isActive={activeStep === i}
                  progress={progress}
                />
                {i < steps.length - 1 && (
                  <ConnectionLine 
                    isActive={activeStep === i}
                    isCompleted={progress > i + 1}
                    progress={progress}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg font-mono text-sm hover:border-neon-cyan/50 transition-all duration-300 flex items-center gap-2"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'} Animation
          </button>
          <button
            onClick={() => {
              setProgress(0);
              setIsPlaying(true);
            }}
            className="px-6 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg font-mono text-sm hover:border-neon-cyan/50 transition-all duration-300"
          >
            ↻ Restart
          </button>
        </div>

        {/* Detail Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <DetailCard step={steps[activeStep]} />
          <TransactionSimulation isActive={isPlaying} />
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: 'Avg Latency', value: '<500ms', icon: Zap },
            { label: 'Encryption', value: 'AES-256', icon: Lock },
            { label: 'Consensus', value: '<1s Finality', icon: Shield },
            { label: 'Storage', value: 'Permanent', icon: Database },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 cyber-card">
              <stat.icon className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
              <div className="text-xl font-display font-bold text-white">{stat.value}</div>
              <div className="text-xs text-theme-text-muted uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </section>
  );
}
