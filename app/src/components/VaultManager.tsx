'use client';

import { useState, useEffect } from 'react';
import { useWalletConnection } from './WalletButton';
import { 
  Plus, Lock, Database, Shield, Activity, Key, 
  Zap, HardDrive, Server, CheckCircle, AlertTriangle,
  Cpu, Clock, ChevronRight
} from 'lucide-react';

interface VaultMetrics {
  memoryCount: number;
  totalSize: number;
  createdAt: Date | null;
  lastAccess: Date | null;
  encryptionKey: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  healthScore: number;
}

export function VaultManager() {
  const { connected, publicKey } = useWalletConnection();
  const [hasVault, setHasVault] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [vaultInfo, setVaultInfo] = useState<VaultMetrics>({
    memoryCount: 0,
    totalSize: 0,
    createdAt: null,
    lastAccess: null,
    encryptionKey: '',
    syncStatus: 'synced',
    healthScore: 100,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!connected) return null;

  const handleCreateVault = async () => {
    setIsCreating(true);
    // Simulate blockchain interaction with steps
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setHasVault(true);
    setVaultInfo({
      memoryCount: Math.floor(Math.random() * 50) + 10,
      totalSize: Math.floor(Math.random() * 500000) + 100000,
      createdAt: new Date(),
      lastAccess: new Date(),
      encryptionKey: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}`,
      syncStatus: 'synced',
      healthScore: 98,
    });
    setIsCreating(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!hasVault) {
    return (
      <div className="cyber-card p-6 animate-fade-scale">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 border border-neon-orange flex items-center justify-center">
              <Database className="w-6 h-6 text-neon-orange" />
            </div>
            <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-neon-orange" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-neon-orange" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white tracking-wider">VAULT_STATUS</h3>
            <div className="flex items-center gap-2 text-[10px] text-neon-pink font-mono mt-1">
              <AlertTriangle className="w-3 h-3" />
              NO_ACTIVE_INSTANCE
            </div>
          </div>
        </div>
        
        {/* Info Cards */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-theme-bg-tertiary border border-theme-border-primary group hover:border-neon-orange/50 transition-colors">
            <Activity className="w-4 h-4 text-neon-orange mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm text-theme-text-secondary">Deploy on-chain storage contract</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-theme-text-muted font-mono">REQUIRES:</span>
                <span className="text-[10px] text-neon-cyan font-mono">0.001 SOL</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-theme-bg-tertiary border border-theme-border-primary group hover:border-neon-cyan/50 transition-colors">
            <Key className="w-4 h-4 text-neon-cyan mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm text-theme-text-secondary">Generate encryption keys</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-theme-text-muted font-mono">ALGORITHM:</span>
                <span className="text-[10px] text-neon-green font-mono">AES-256-GCM</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-theme-bg-tertiary border border-theme-border-primary group hover:border-neon-purple/50 transition-colors">
            <Shield className="w-4 h-4 text-neon-purple mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm text-theme-text-secondary">Initialize security protocols</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-theme-text-muted font-mono">LEVEL:</span>
                <span className="text-[10px] text-neon-purple font-mono">MAXIMUM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateVault}
          disabled={isCreating}
          className="w-full relative overflow-hidden py-4 border border-neon-orange text-neon-orange hover:bg-neon-orange hover:text-theme-bg-primary disabled:border-theme-border-primary disabled:text-theme-text-disabled disabled:hover:bg-transparent disabled:cursor-not-allowed font-display text-sm tracking-wider transition-all duration-300 group"
        >
          {isCreating ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="animate-pulse">DEPLOYING_CONTRACT...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>INITIALIZE_VAULT</span>
            </div>
          )}
          
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700" />
        </button>
        
        {/* Progress indicator when creating */}
        {isCreating && (
          <div className="mt-4">
            <div className="h-1 bg-theme-bg-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-neon-orange to-neon-cyan animate-pulse" style={{ width: '60%' }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-theme-text-muted font-mono">
              <span>COMPILING...</span>
              <span>60%</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cyber-card p-6 animate-fade-scale">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-12 h-12 border border-neon-green flex items-center justify-center">
            <Lock className="w-6 h-6 text-neon-green" />
          </div>
          <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-neon-green" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-neon-green" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-white tracking-wider">VAULT_ACTIVE</h3>
          <div className="flex items-center gap-2 text-xs text-neon-green font-mono mt-1">
            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-neon-green" />
            <span>OPERATIONAL</span>
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="space-y-1 mb-6">
        <MetricRow 
          icon={<Database className="w-4 h-4" />}
          label="MEMORY_SHARDS"
          value={vaultInfo.memoryCount.toString()}
          color="orange"
          highlight={vaultInfo.memoryCount > 30}
        />
        <MetricRow 
          icon={<HardDrive className="w-4 h-4" />}
          label="STORAGE_USED"
          value={formatSize(vaultInfo.totalSize)}
          color="cyan"
        />
        <MetricRow 
          icon={<Shield className="w-4 h-4" />}
          label="ENCRYPTION"
          value="AES-256"
          color="green"
        />
        <MetricRow 
          icon={<Zap className="w-4 h-4" />}
          label="CHAIN"
          value="SOLANA"
          color="purple"
        />
        <MetricRow 
          icon={<Activity className="w-4 h-4" />}
          label="HEALTH_SCORE"
          value={`${vaultInfo.healthScore}%`}
          color="orange"
          highlight={vaultInfo.healthScore > 95}
        />
      </div>

      {/* Encryption Key */}
      {vaultInfo.encryptionKey && (
        <div className="p-3 bg-theme-bg-tertiary border border-theme-border-primary mb-4 group hover:border-neon-cyan/50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-3 h-3 text-neon-cyan" />
            <span className="text-[10px] text-theme-text-muted font-mono tracking-wider">ENCRYPTION_KEY_HASH</span>
          </div>
          <code className="text-[10px] text-theme-text-secondary font-mono block truncate group-hover:text-neon-cyan transition-colors">
            {vaultInfo.encryptionKey.slice(0, 32)}...
          </code>
        </div>
      )}

      {/* Timestamps */}
      <div className="pt-4 border-t border-theme-border-primary space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-theme-text-muted" />
            <span className="text-theme-text-muted">DEPLOYED:</span>
          </div>
          <span className="text-theme-text-secondary">{formatDate(vaultInfo.createdAt)}</span>
        </div>
        <div className="flex justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-theme-text-muted" />
            <span className="text-theme-text-muted">LAST_ACCESS:</span>
          </div>
          <span className="text-theme-text-secondary">{formatDate(vaultInfo.lastAccess)}</span>
        </div>
      </div>

      {/* Sync Status */}
      <div className="mt-4 flex items-center gap-3 p-3 bg-neon-cyan/5 border border-neon-cyan/20">
        <Server className="w-4 h-4 text-neon-cyan" />
        <div className="flex-1">
          <span className="text-[10px] text-neon-cyan font-mono block">NODE_SYNCED // DEVNET</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-16 h-1 bg-theme-bg-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-neon-cyan animate-pulse" style={{ width: '100%' }} />
            </div>
            <span className="text-[10px] text-theme-text-muted font-mono">LATENCY: 24ms</span>
          </div>
        </div>
        <CheckCircle className="w-4 h-4 text-neon-green" />
      </div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="py-2 px-3 border border-theme-border-primary text-theme-text-muted hover:border-neon-orange hover:text-neon-orange transition-all duration-300 text-xs font-mono tracking-wider flex items-center justify-center gap-2 group">
          <Cpu className="w-3 h-3 group-hover:animate-spin" />
          OPTIMIZE
        </button>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="py-2 px-3 border border-theme-border-primary text-theme-text-muted hover:border-neon-cyan hover:text-neon-cyan transition-all duration-300 text-xs font-mono tracking-wider flex items-center justify-center gap-2 group"
        >
          DETAILS
          <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 p-4 bg-theme-bg-tertiary border border-theme-border-primary animate-fade-scale">
          <h4 className="text-xs font-mono text-theme-text-muted mb-3 tracking-wider">VAULT_DETAILS</h4>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-theme-text-muted">PROGRAM_ID:</span>
              <span className="text-neon-cyan">MemV2x...9A7B</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-muted">AUTHORITY:</span>
              <span className="text-neon-orange truncate max-w-24">{publicKey?.toBase58().slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-muted">RENT_EXEMPT:</span>
              <span className="text-neon-green">0.002 SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-muted">DATA_SIZE:</span>
              <span className="text-theme-text-secondary">1.2 MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ 
  icon, 
  label, 
  value,
  color,
  highlight = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  color: 'orange' | 'cyan' | 'green' | 'purple';
  highlight?: boolean;
}) {
  const colorClasses = {
    orange: 'text-neon-orange border-neon-orange/10 hover:border-neon-orange/30',
    cyan: 'text-neon-cyan border-neon-cyan/10 hover:border-neon-cyan/30',
    green: 'text-neon-green border-neon-green/10 hover:border-neon-green/30',
    purple: 'text-neon-purple border-neon-purple/10 hover:border-neon-purple/30',
  };

  const bgClasses = {
    orange: 'bg-neon-orange/5',
    cyan: 'bg-neon-cyan/5',
    green: 'bg-neon-green/5',
    purple: 'bg-neon-purple/5',
  };

  return (
    <div className={`flex items-center justify-between py-3 px-3 border-b border-theme-border-primary ${colorClasses[color]} ${bgClasses[color]} transition-all duration-300 group`}>
      <span className="flex items-center gap-2 text-sm text-theme-text-secondary group-hover:text-white transition-colors">
        {icon}
        {label}
      </span>
      <span className={`font-mono font-bold ${highlight ? 'text-glow-' + color : ''}`}>
        {value}
      </span>
    </div>
  );
}
