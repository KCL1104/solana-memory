'use client';

import { useEffect, useState, useRef } from 'react';
import { Brain, Activity, Clock, Coins } from 'lucide-react';

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

// Stat component with animation
function Stat({ label, value, suffix = '' }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="text-center p-6 cyber-card">
      <div className="text-3xl font-display font-bold text-neon-cyan text-glow-cyan mb-2">
        {value}{suffix}
      </div>
      <div className="text-xs text-theme-text-muted uppercase tracking-widest font-mono">
        {label}
      </div>
    </div>
  );
}

// Animated Stat with counting effect
function AnimatedStat({ label, endValue, duration = 2000, suffix = '', format = 'number' }: { 
  label: string; 
  endValue: number; 
  duration?: number;
  suffix?: string;
  format?: 'number' | 'time' | 'cost';
}) {
  const stat = useAnimatedCounter(endValue, duration);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stat.start();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [stat]);

  const displayValue = format === 'time' 
    ? `<${stat.count}ms`
    : format === 'cost'
    ? `${stat.count}x`
    : stat.count.toLocaleString();

  return (
    <div ref={ref} className="text-center p-6 cyber-card group">
      <div className="text-3xl font-display font-bold text-neon-cyan text-glow-cyan mb-2 transition-all duration-300 group-hover:scale-110">
        {displayValue}{suffix}
      </div>
      <div className="text-xs text-theme-text-muted uppercase tracking-widest font-mono">
        {label}
      </div>
    </div>
  );
}

export function DemoHero() {
  const scrollToDemo = () => {
    document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToUseCases = () => {
    document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050508] via-[#0a0a0f] to-[#111118]" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[150px] animate-float" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-orange/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-purple/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }} />
      
      {/* Scan Lines */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-neon-cyan/30 rounded-full bg-neon-cyan/5">
          <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          <span className="text-xs font-mono text-neon-cyan tracking-wider">LIVE ON DEVNET</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
          Try{' '}
          <span className="relative">
            <span className="text-neon-cyan text-glow-cyan">AgentMemory</span>
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-transparent" />
          </span>
          <br />
          <span className="text-neon-orange text-glow-orange">Live</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-theme-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
          Experience persistent memory for AI agents. 
          <span className="text-white"> Store, retrieve, and search memories</span> on Solana devnet with sub-millisecond latency.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button 
            onClick={scrollToDemo}
            className="cyber-btn group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Brain className="w-5 h-5" />
              Try Interactive Demo
            </span>
          </button>
          <button 
            onClick={scrollToUseCases}
            className="cyber-btn-cyan group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Activity className="w-5 h-5" />
              View Use Cases
            </span>
          </button>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <AnimatedStat label="Memories Stored" endValue={10847} duration={2500} />
          <AnimatedStat label="Retrieval Time" endValue={1} duration={1500} format="time" />
          <AnimatedStat label="Cost Reduction" endValue={100} duration={2000} format="cost" />
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {['On-Chain Storage', 'Semantic Search', 'Version History', 'Encrypted'].map((feature, i) => (
            <div 
              key={feature}
              className="px-4 py-2 border border-theme-border-primary rounded-lg bg-theme-bg-tertiary/50 text-sm text-theme-text-secondary font-mono"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="mt-16 animate-bounce">
          <div className="w-6 h-10 border-2 border-neon-cyan/50 rounded-full mx-auto flex justify-center pt-2">
            <div className="w-1 h-2 bg-neon-cyan rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
