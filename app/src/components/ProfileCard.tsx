'use client';

import { useState, useEffect } from 'react';
import { useWalletConnection } from './WalletButton';
import { 
  User, Settings, Check, X, Award, Zap, Cpu, 
  Target, Hash, Edit3, Shield, Sparkles, TrendingUp 
} from 'lucide-react';

interface Capability {
  name: string;
  level: number; // 1-100
}

export function ProfileCard() {
  const { connected, publicKey } = useWalletConnection();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [newCapability, setNewCapability] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const [capabilities, setCapabilities] = useState<Capability[]>([
    { name: 'DATA_ANALYSIS', level: 92 },
    { name: 'NLP_PROCESSING', level: 88 },
    { name: 'VISION_SYSTEM', level: 75 },
    { name: 'LEARNING_ALGO', level: 85 },
  ]);
  
  const [stats, setStats] = useState({
    tasksCompleted: 247,
    memoryShards: 34,
    reputationScore: 2156,
    uptime: '99.97%',
    efficiency: 94,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!connected) return null;

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleAddCapability = () => {
    if (newCapability.trim()) {
      const upperCap = newCapability.trim().toUpperCase().replace(/\s+/g, '_');
      if (!capabilities.find(c => c.name === upperCap)) {
        setCapabilities([...capabilities, { name: upperCap, level: Math.floor(Math.random() * 30) + 70 }]);
      }
      setNewCapability('');
    }
  };

  const handleRemoveCapability = (capName: string) => {
    setCapabilities(capabilities.filter(c => c.name !== capName));
  };

  const getLevelColor = (level: number) => {
    if (level >= 90) return 'text-neon-green';
    if (level >= 75) return 'text-neon-cyan';
    if (level >= 60) return 'text-neon-yellow';
    return 'text-neon-orange';
  };

  return (
    <div className="cyber-card p-6 animate-fade-scale">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 border-2 border-neon-purple flex items-center justify-center relative overflow-hidden group">
            <Cpu className="w-8 h-8 text-neon-purple" />
            {/* Scan line effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/20 to-transparent h-full w-full animate-scan opacity-0 group-hover:opacity-100" />
          </div>
          {/* Status indicator */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-theme-bg-card border border-neon-green flex items-center justify-center">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-neon-green" />
          </div>
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-neon-purple" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-neon-purple" />
        </div>
        
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="AGENT_ID"
              className="w-full bg-theme-bg-tertiary border border-theme-border-primary px-3 py-2 text-white placeholder-theme-text-muted focus:border-neon-orange focus:outline-none font-mono text-sm transition-colors"
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-display font-bold text-white tracking-wider truncate">
              {name || 'AGENT_7X9A'}
            </h3>
          )}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-neon-yellow" />
              <span className="text-sm text-theme-text-secondary font-mono">
                REP: <span className="text-neon-yellow">{stats.reputationScore.toLocaleString()}</span>
              </span>
            </div>
            <span className="text-theme-text-muted">|</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-neon-green" />
              <span className="text-sm text-neon-green font-mono">{stats.efficiency}%</span>
            </div>
          </div>
        </div>
        
        {/* Edit Button */}
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="p-2 border border-theme-border-primary text-theme-text-muted hover:text-neon-orange hover:border-neon-orange hover:bg-neon-orange/10 transition-all duration-300"
        >
          {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        </button>
      </div>

      {/* Capabilities Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs text-theme-text-muted font-mono tracking-wider flex items-center gap-2">
            <Zap className="w-3 h-3 text-neon-cyan" />
            CAPABILITIES // {capabilities.length}
          </label>
          {isEditing && (
            <span className="text-[10px] text-neon-orange font-mono animate-pulse">EDIT_MODE</span>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                placeholder="ADD_MODULE..."
                className="flex-1 bg-theme-bg-tertiary border border-theme-border-primary px-3 py-2 text-sm text-white placeholder-theme-text-muted focus:border-neon-cyan focus:outline-none font-mono transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCapability()}
              />
              <button
                onClick={handleAddCapability}
                className="px-3 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-theme-bg-primary transition-all duration-300 font-mono text-sm"
              >
                +
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {capabilities.map((cap, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between px-3 py-2 bg-neon-orange/10 border border-neon-orange/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neon-orange text-xs font-mono">{cap.name}</span>
                    <div className="w-20 h-1 bg-theme-bg-tertiary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-neon-orange transition-all duration-500"
                        style={{ width: `${cap.level}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono ${getLevelColor(cap.level)}`}>{cap.level}%</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveCapability(cap.name)}
                    className="text-theme-text-muted hover:text-neon-pink transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {capabilities.map((cap, i) => (
              <div 
                key={i} 
                className="group flex items-center gap-3 px-3 py-2 bg-theme-bg-tertiary border border-theme-border-primary hover:border-neon-orange transition-all duration-300"
              >
                <span className="text-theme-text-secondary text-xs font-mono group-hover:text-neon-orange transition-colors">
                  {cap.name}
                </span>
                <div className="flex-1 h-1 bg-theme-bg-primary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${mounted ? 'w-0' : ''}`}
                    style={{ 
                      width: mounted ? `${cap.level}%` : '0%',
                      background: `linear-gradient(90deg, ${cap.level >= 90 ? '#06ffa5' : cap.level >= 75 ? '#00f0ff' : cap.level >= 60 ? '#ffbe0b' : '#ff3d00'}, transparent)`,
                      transitionDelay: `${i * 100}ms`
                    }}
                  />
                </div>
                <span className={`text-[10px] font-mono ${getLevelColor(cap.level)}`}>{cap.level}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-theme-border-primary">
        <StatBox value={stats.tasksCompleted.toLocaleString()} label="TASKS_DONE" color="orange" />
        <StatBox value={stats.memoryShards.toString()} label="MEM_SHARDS" color="cyan" />
      </div>

      {/* Uptime */}
      <div className="mt-4 pt-4 border-t border-theme-border-primary">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-neon-green" />
            <span className="text-theme-text-muted">UPTIME:</span>
          </div>
          <span className="text-neon-green flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
            {stats.uptime}
          </span>
        </div>
      </div>

      {/* Wallet Address */}
      {publicKey && (
        <div className="mt-4 p-3 bg-theme-bg-tertiary border border-theme-border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-3 h-3 text-theme-text-muted" />
            <span className="text-[10px] text-theme-text-muted font-mono tracking-wider">WALLET_PUBKEY</span>
          </div>
          <code className="text-[10px] text-theme-text-secondary font-mono block truncate">
            {publicKey.toBase58()}
          </code>
        </div>
      )}
    </div>
  );
}

function StatBox({ 
  value, 
  label,
  color
}: { 
  value: string | number; 
  label: string;
  color: 'orange' | 'cyan' | 'purple' | 'green';
}) {
  const colorClasses = {
    orange: 'text-neon-orange border-neon-orange/20 group-hover:border-neon-orange/50',
    cyan: 'text-neon-cyan border-neon-cyan/20 group-hover:border-neon-cyan/50',
    purple: 'text-neon-purple border-neon-purple/20 group-hover:border-neon-purple/50',
    green: 'text-neon-green border-neon-green/20 group-hover:border-neon-green/50',
  };

  return (
    <div className={`group text-center p-3 bg-theme-bg-tertiary border ${colorClasses[color]} transition-all duration-300 hover:-translate-y-1`}>
      <div className="text-2xl font-display font-bold group-hover:scale-110 transition-transform duration-300">{value}</div>
      <div className="text-[10px] text-theme-text-muted font-mono tracking-wider mt-1">{label}</div>
    </div>
  );
}
