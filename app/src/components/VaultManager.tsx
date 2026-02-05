'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletConnection } from './WalletButton';
import { 
  Plus, Lock, Database, Shield, Activity, Key, 
  Zap, HardDrive, Server, CheckCircle, AlertTriangle,
  Cpu, Clock, ChevronRight, Wallet, Sparkles,
  RefreshCw, TrendingUp, LockOpen
} from 'lucide-react';

interface VaultMetrics {
  memoryCount: number;
  totalSize: number;
  createdAt: Date | null;
  lastAccess: Date | null;
  encryptionKey: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  healthScore: number;
}

// Animated progress bar component
const ProgressBar = ({ progress, color = 'cyan' }: { progress: number; color?: 'cyan' | 'orange' | 'green' | 'pink' }) => {
  const colorClasses = {
    cyan: 'from-neon-cyan to-neon-purple',
    orange: 'from-neon-orange to-neon-yellow',
    green: 'from-neon-green to-neon-cyan',
    pink: 'from-neon-pink to-neon-purple',
  };

  return (
    <div className="h-2 bg-[#1a1a25] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
      />
    </div>
  );
};

// Status indicator with pulse animation
const StatusIndicator = ({ status }: { status: VaultMetrics['syncStatus'] }) => {
  const config = {
    synced: { color: 'text-neon-green', bg: 'bg-neon-green', label: 'ONLINE' },
    syncing: { color: 'text-neon-yellow', bg: 'bg-neon-yellow', label: 'SYNCING' },
    error: { color: 'text-neon-pink', bg: 'bg-neon-pink', label: 'ERROR' },
    offline: { color: 'text-[#666]', bg: 'bg-[#666]', label: 'OFFLINE' },
  };

  const { color, bg, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${bg} ${status === 'synced' ? 'animate-pulse' : ''}`} />
        {status === 'synced' && (
          <div className={`absolute inset-0 rounded-full ${bg} animate-ping opacity-50`} />
        )}
      </div>
      <span className={`text-xs font-mono ${color}`}>{label}</span>
    </div>
  );
};

export function VaultManager() {
  const { connected, publicKey } = useWalletConnection();
  const [hasVault, setHasVault] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [vaultInfo, setVaultInfo] = useState<VaultMetrics>({
    memoryCount: 0,
    totalSize: 0,
    createdAt: null,
    lastAccess: null,
    encryptionKey: '',
    syncStatus: 'offline',
    healthScore: 100,
  });

  const creationSteps = [
    'GENERATING_KEYS...',
    'COMPILING_CONTRACT...',
    'DEPLOYING_TO_CHAIN...',
    'INITIALIZING_VAULT...',
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulate step progression during vault creation
  useEffect(() => {
    if (isCreating) {
      const interval = setInterval(() => {
        setCreationStep(prev => {
          if (prev >= creationSteps.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 600);
      return () => clearInterval(interval);
    }
  }, [isCreating]);

  if (!connected) return null;

  const handleCreateVault = async () => {
    setIsCreating(true);
    setCreationStep(0);
    
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
    setCreationStep(0);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="cyber-card p-4 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <div className="relative">
            <motion.div 
              animate={{ 
                boxShadow: isCreating 
                  ? ['0 0 5px rgba(255, 61, 0, 0.5)', '0 0 20px rgba(255, 61, 0, 0.8)', '0 0 5px rgba(255, 61, 0, 0.5)']
                  : '0 0 5px rgba(255, 61, 0, 0.5)'
              }}
              transition={{ duration: 1.5, repeat: isCreating ? Infinity : 0 }}
              className="w-10 h-10 sm:w-12 sm:h-12 border border-neon-orange flex items-center justify-center"
            >
              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-neon-orange" />
            </motion.div>
            <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-neon-orange" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-neon-orange" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wider">VAULT_STATUS</h3>
            <div className="flex items-center gap-2 text-[10px] text-neon-pink font-mono mt-1">
              <AlertTriangle className="w-3 h-3" />
              NO_ACTIVE_INSTANCE
            </div>
          </div>
        </div>
        
        {/* Info Cards */}
        <div className="space-y-3 mb-6">
          {[
            { icon: Activity, color: 'orange', title: 'Deploy on-chain storage contract', cost: '0.001 SOL' },
            { icon: Key, color: 'cyan', title: 'Generate encryption keys', cost: 'AES-256-GCM' },
            { icon: Shield, color: 'purple', title: 'Initialize security protocols', cost: 'MAXIMUM' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ x: 4 }}
              className={`flex items-start gap-3 p-3 bg-theme-bg-tertiary border border-theme-border-primary group hover:border-neon-${item.color}/50 transition-colors`}
            >
              <item.icon className={`w-4 h-4 text-neon-${item.color} mt-0.5 group-hover:scale-110 transition-transform`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-theme-text-secondary">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-theme-text-muted font-mono">{i === 0 ? 'REQUIRES:' : i === 1 ? 'ALGORITHM:' : 'LEVEL:'}</span>
                  <span className={`text-[10px] text-neon-${item.color} font-mono`}>{item.cost}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateVault}
          disabled={isCreating}
          className="w-full relative overflow-hidden py-4 border border-neon-orange text-neon-orange hover:bg-neon-orange hover:text-theme-bg-primary disabled:border-theme-border-primary disabled:text-theme-text-disabled disabled:hover:bg-transparent disabled:cursor-not-allowed font-display text-sm tracking-wider transition-all duration-300 group"
        >
          {isCreating ? (
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              />
              <span className="animate-pulse">{creationSteps[creationStep]}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>INITIALIZE_VAULT</span>
            </div>
          )}
          
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700" />
        </motion.button>
        
        {/* Progress indicator when creating */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <ProgressBar progress={((creationStep + 1) / creationSteps.length) * 100} color="orange" />
              <div className="flex justify-between mt-2 text-[10px] text-theme-text-muted font-mono">
                <span>STEP {creationStep + 1} OF {creationSteps.length}</span>
                <span>{Math.round(((creationStep + 1) / creationSteps.length) * 100)}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="cyber-card p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6">
        <div className="relative">
          <motion.div 
            animate={{ 
              boxShadow: ['0 0 5px rgba(6, 255, 165, 0.5)', '0 0 15px rgba(6, 255, 165, 0.8)', '0 0 5px rgba(6, 255, 165, 0.5)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 sm:w-12 sm:h-12 border border-neon-green flex items-center justify-center"
          >
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-neon-green" />
          </motion.div>
          <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-neon-green" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-neon-green" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wider">VAULT_ACTIVE</h3>
          <div className="flex items-center gap-2 text-xs mt-1">
            <StatusIndicator status={vaultInfo.syncStatus} />
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
          icon={<TrendingUp className="w-4 h-4" />}
          label="HEALTH_SCORE"
          value={`${vaultInfo.healthScore}%`}
          color="orange"
          highlight={vaultInfo.healthScore > 95}
        />
      </div>

      {/* Storage Usage Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-mono text-theme-text-muted mb-2">
          <span>STORAGE_USAGE</span>
          <span>{formatSize(vaultInfo.totalSize)} / 10 MB</span>
        </div>
        <ProgressBar progress={(vaultInfo.totalSize / (10 * 1024 * 1024)) * 100} color="cyan" />
      </div>

      {/* Encryption Key */}
      {vaultInfo.encryptionKey && (
        <motion.div 
          whileHover={{ borderColor: 'rgba(0, 240, 255, 0.3)' }}
          className="p-3 bg-theme-bg-tertiary border border-theme-border-primary mb-4 group transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-3 h-3 text-neon-cyan" />
            <span className="text-[10px] text-theme-text-muted font-mono tracking-wider">ENCRYPTION_KEY_HASH</span>
          </div>
          <code className="text-[10px] text-theme-text-secondary font-mono block truncate group-hover:text-neon-cyan transition-colors">
            {vaultInfo.encryptionKey.slice(0, 32)}...
          </code>
        </motion.div>
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
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="mt-4 flex items-center gap-3 p-3 bg-neon-cyan/5 border border-neon-cyan/20"
      >
        <Server className="w-4 h-4 text-neon-cyan" />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-neon-cyan font-mono block">NODE_SYNCED // DEVNET</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-16 h-1 bg-theme-bg-tertiary rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-full bg-neon-cyan" 
              />
            </div>
            <span className="text-[10px] text-theme-text-muted font-mono">LATENCY: 24ms</span>
          </div>
        </div>
        <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" />
      </motion.div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="py-2 px-3 border border-theme-border-primary text-theme-text-muted hover:border-neon-orange hover:text-neon-orange transition-all duration-300 text-xs font-mono tracking-wider flex items-center justify-center gap-2 group"
        >
          <Cpu className="w-3 h-3 group-hover:animate-spin" />
          <span className="hidden sm:inline">OPTIMIZE</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDetails(!showDetails)}
          className="py-2 px-3 border border-theme-border-primary text-theme-text-muted hover:border-neon-cyan hover:text-neon-cyan transition-all duration-300 text-xs font-mono tracking-wider flex items-center justify-center gap-2 group"
        >
          <span className="hidden sm:inline">DETAILS</span>
          <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`} />
        </motion.button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-theme-bg-tertiary border border-theme-border-primary">
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

  const glowClasses = {
    orange: 'text-glow-orange',
    cyan: 'text-glow-cyan',
    green: 'text-glow-green',
    purple: 'text-glow-purple',
  };

  return (
    <motion.div 
      whileHover={{ x: 4 }}
      className={`flex items-center justify-between py-3 px-3 border-b border-theme-border-primary ${colorClasses[color]} ${bgClasses[color]} transition-all duration-300 group cursor-default`}
    >
      <span className="flex items-center gap-2 text-sm text-theme-text-secondary group-hover:text-white transition-colors">
        {icon}
        {label}
      </span>
      <span className={`font-mono font-bold ${highlight ? glowClasses[color] : ''}`}>
        {value}
      </span>
    </motion.div>
  );
}
