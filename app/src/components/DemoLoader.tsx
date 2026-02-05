'use client';

import { useState, useCallback } from 'react';
import { 
  Sparkles, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  TrendingUp,
  Tag,
  Star,
  ArrowRight
} from 'lucide-react';
import { demoMemories, toSDKFormat, DemoMemory } from '@/demo/data';

interface DemoLoaderProps {
  vaultId: string;
  onLoadComplete?: () => void;
  className?: string;
}

interface LoadProgress {
  total: number;
  loaded: number;
  failed: number;
  current?: string;
}

/**
 * DemoLoader - One-click demo data loading component
 * 
 * Features:
 * - Batch load demo memories
 * - Real-time progress tracking
 * - Category breakdown preview
 * - Success/failure feedback
 */
export function DemoLoader({ vaultId, onLoadComplete, className = '' }: DemoLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Simulate batch loading (replace with actual SDK call)
  const loadDemoData = useCallback(async () => {
    if (!vaultId) {
      alert('Please create or select a vault first');
      return;
    }

    setIsLoading(true);
    setProgress({ total: demoMemories.length, loaded: 0, failed: 0 });
    setIsComplete(false);

    try {
      // Simulate sequential loading with progress updates
      for (let i = 0; i < demoMemories.length; i++) {
        const memory = demoMemories[i];
        
        // Update current progress
        setProgress(prev => ({
          ...prev!,
          current: memory.key
        }));

        // Simulate API call delay (300-800ms per item)
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

        // Update loaded count
        setProgress(prev => ({
          ...prev!,
          loaded: prev!.loaded + 1
        }));
      }

      setIsComplete(true);
      onLoadComplete?.();
    } catch (error) {
      console.error('Failed to load demo data:', error);
      setProgress(prev => ({
        ...prev!,
        failed: (prev?.failed || 0) + 1
      }));
    } finally {
      setIsLoading(false);
    }
  }, [vaultId, onLoadComplete]);

  // Calculate progress percentage
  const progressPercent = progress 
    ? Math.round((progress.loaded / progress.total) * 100)
    : 0;

  // Get category distribution
  const categoryCounts = demoMemories.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`${className}`}>
      {/* Main Button */}
      {!isLoading && !isComplete && (
        <button
          onClick={() => setShowPreview(true)}
          className="group flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-neon-orange/20 to-neon-pink/20 
                     border border-neon-orange hover:border-neon-pink 
                     transition-all duration-300 hover:shadow-neon-orange"
        >
          <Sparkles className="w-5 h-5 text-neon-orange group-hover:animate-pulse" />
          <div className="text-left">
            <div className="text-sm font-display font-bold text-white tracking-wider">
              LOAD_DEMO_DATA
            </div>
            <div className="text-[10px] text-theme-text-muted font-mono">
              {demoMemories.length} MEMORIES // 8 CATEGORIES
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neon-orange ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Preview Modal */}
      {showPreview && !isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="cyber-card w-full max-w-2xl max-h-[80vh] overflow-auto animate-fade-scale">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-theme-border-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-neon-orange flex items-center justify-center">
                  <Database className="w-5 h-5 text-neon-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">DEMO_DATA_PREVIEW</h3>
                  <p className="text-xs text-theme-text-muted font-mono">
                    VAULT: {vaultId.slice(0, 8)}...{vaultId.slice(-8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-neon-orange/10 transition-colors"
              >
                <X className="w-5 h-5 text-theme-text-muted hover:text-neon-orange" />
              </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-theme-border-primary">
              <StatBox 
                icon={<Database className="w-4 h-4" />}
                value={demoMemories.length}
                label="Memories"
                color="orange"
              />
              <StatBox 
                icon={<Tag className="w-4 h-4" />}
                value={new Set(demoMemories.flatMap(m => m.tags)).size}
                label="Tags"
                color="cyan"
              />
              <StatBox 
                icon={<TrendingUp className="w-4 h-4" />}
                value={Object.keys(categoryCounts).length}
                label="Categories"
                color="pink"
              />
              <StatBox 
                icon={<Star className="w-4 h-4" />}
                value={Math.round(demoMemories.reduce((a, b) => a + b.importance, 0) / demoMemories.length)}
                label="Avg Importance"
                color="green"
              />
            </div>

            {/* Category Breakdown */}
            <div className="p-6 border-b border-theme-border-primary">
              <h4 className="text-xs text-theme-text-muted font-mono tracking-wider mb-4">
                CATEGORY_BREAKDOWN
              </h4>
              <div className="space-y-3">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <div key={category} className="flex items-center gap-4">
                    <div className="w-24 text-xs text-theme-text-secondary font-mono uppercase">
                      {category}
                    </div>
                    <div className="flex-1 h-2 bg-theme-bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-neon-orange to-neon-pink"
                        style={{ width: `${(count / demoMemories.length) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-xs text-theme-text-muted font-mono">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory Preview List */}
            <div className="p-6 max-h-64 overflow-auto">
              <h4 className="text-xs text-theme-text-muted font-mono tracking-wider mb-4">
                SAMPLE_MEMORIES
              </h4>
              <div className="space-y-2">
                {demoMemories.slice(0, 4).map((memory) => (
                  <MemoryPreviewItem key={memory.key} memory={memory} />
                ))}
                {demoMemories.length > 4 && (
                  <div className="text-center py-2 text-xs text-theme-text-muted font-mono">
                    +{demoMemories.length - 4} MORE MEMORIES
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-theme-border-primary">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm text-theme-text-muted hover:text-white transition-colors font-mono"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  loadDemoData();
                }}
                className="px-6 py-2 bg-neon-orange/20 border border-neon-orange text-neon-orange 
                           hover:bg-neon-orange hover:text-white transition-all duration-300
                           font-mono text-sm tracking-wider flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                LOAD_ALL_MEMORIES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Progress */}
      {isLoading && progress && (
        <div className="cyber-card p-6 w-full max-w-md animate-fade-scale">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-neon-orange animate-spin" />
              <span className="text-sm font-display text-white">LOADING_DEMO_DATA</span>
            </div>
            <span className="text-xs text-neon-orange font-mono">
              {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-theme-bg-secondary rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-neon-orange to-neon-pink transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current Item */}
          {progress.current && (
            <div className="text-xs text-theme-text-muted font-mono mb-2">
              {'>'} {progress.current}...
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-xs font-mono">
            <span className="text-neon-green">
              LOADED: {progress.loaded}/{progress.total}
            </span>
            {progress.failed > 0 && (
              <span className="text-neon-red">
                FAILED: {progress.failed}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Success State */}
      {isComplete && (
        <div className="cyber-card p-6 w-full max-w-md animate-fade-scale">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-neon-green" />
            <span className="text-lg font-display text-white">DEMO_DATA_LOADED</span>
          </div>
          
          <p className="text-sm text-theme-text-secondary mb-4">
            Successfully loaded <span className="text-neon-cyan">{demoMemories.length}</span> demo memories into your vault.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-theme-bg-secondary border border-theme-border-primary">
              <div className="text-2xl font-display text-neon-orange">{demoMemories.length}</div>
              <div className="text-[10px] text-theme-text-muted font-mono">TOTAL MEMORIES</div>
            </div>
            <div className="p-3 bg-theme-bg-secondary border border-theme-border-primary">
              <div className="text-2xl font-display text-neon-cyan">
                {new Set(demoMemories.flatMap(m => m.tags)).size}
              </div>
              <div className="text-[10px] text-theme-text-muted font-mono">UNIQUE TAGS</div>
            </div>
          </div>

          <button
            onClick={() => setIsComplete(false)}
            className="w-full py-2 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan 
                       hover:bg-neon-cyan hover:text-white transition-all duration-300
                       font-mono text-sm tracking-wider"
          >
            VIEW_DASHBOARD
          </button>
        </div>
      )}
    </div>
  );
}

// Helper Components

function StatBox({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: 'orange' | 'cyan' | 'pink' | 'green';
}) {
  const colorClasses = {
    orange: 'text-neon-orange border-neon-orange',
    cyan: 'text-neon-cyan border-neon-cyan',
    pink: 'text-neon-pink border-neon-pink',
    green: 'text-neon-green border-neon-green',
  };

  return (
    <div className="p-3 bg-theme-bg-secondary border border-theme-border-primary text-center">
      <div className={`w-8 h-8 mx-auto mb-2 border ${colorClasses[color]} flex items-center justify-center`}>
        {icon}
      </div>
      <div className={`text-xl font-display font-bold ${colorClasses[color].split(' ')[0]}`}>
        {value}
      </div>
      <div className="text-[10px] text-theme-text-muted font-mono tracking-wider">
        {label}
      </div>
    </div>
  );
}

function MemoryPreviewItem({ memory }: { memory: DemoMemory }) {
  return (
    <div className="p-3 bg-theme-bg-secondary border border-theme-border-primary hover:border-neon-orange/50 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-neon-orange font-mono">{memory.key}</span>
        <span className="text-[10px] text-theme-text-muted font-mono uppercase">
          {memory.category}
        </span>
      </div>
      <p className="text-xs text-theme-text-secondary mb-2 line-clamp-1">
        {memory.description}
      </p>
      <div className="flex items-center gap-2">
        {memory.tags.slice(0, 3).map(tag => (
          <span 
            key={tag} 
            className="text-[10px] px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan font-mono"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default DemoLoader;
