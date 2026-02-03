'use client';

import { useState, useMemo } from 'react';
import { useMemory, MemoryType } from '@/contexts/MemoryContext';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Tag, 
  Database,
  Clock,
  Activity,
  X,
  ChevronRight
} from 'lucide-react';

const typeColors: Record<MemoryType, string> = {
  conversation: '#00d4ff',
  learning: '#4ade80',
  preference: '#fbbf24',
  task: '#b829dd',
  knowledge: '#ff6b35',
  relationship: '#f472b6',
  system: '#94a3b8',
};

const typeLabels: Record<MemoryType, string> = {
  conversation: 'CONVERSATION',
  learning: 'LEARNING',
  preference: 'PREFERENCE',
  task: 'TASK',
  knowledge: 'KNOWLEDGE',
  relationship: 'RELATIONSHIP',
  system: 'SYSTEM',
};

export function AnalyticsDashboard() {
  const { getAnalytics, filteredMemories } = useMemory();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'types' | 'timeline' | 'tags'>('overview');
  
  const analytics = useMemo(() => getAnalytics(), [getAnalytics]);
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-24 z-40 w-12 h-12 border border-[#ff6b35] bg-[#0a0a0a] flex items-center justify-center hover:bg-[#ff6b35] hover:text-[#0a0a0a] transition-all group"
        title="Analytics Dashboard"
      >
        <BarChart3 className="w-5 h-5 text-[#ff6b35] group-hover:text-[#0a0a0a]" />
      </button>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const maxTagCount = Math.max(...analytics.tagCloud.map(t => t.count), 1);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="retro-card w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-[#ff6b35] flex items-center justify-center glow-orange">
              <BarChart3 className="w-5 h-5 text-[#ff6b35]" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white tracking-wider">ANALYTICS_DASHBOARD</h3>
              <p className="text-xs text-[#666] font-mono">
                <span className="text-[#00d4ff]">{analytics.totalMemories}</span> MEMORIES // 
                <span className="text-[#ff6b35]"> {formatSize(analytics.totalSize)}</span> TOTAL
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#222]">
          {[
            { id: 'overview', label: 'OVERVIEW', icon: Activity },
            { id: 'types', label: 'TYPES', icon: PieChart },
            { id: 'timeline', label: 'TIMELINE', icon: TrendingUp },
            { id: 'tags', label: 'TAGS', icon: Tag },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-colors ${
                activeTab === id
                  ? 'bg-[#ff6b35]/10 text-[#ff6b35] border-b-2 border-[#ff6b35]'
                  : 'text-[#666] hover:text-[#888] hover:bg-[#111]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  value={analytics.totalMemories.toString()} 
                  label="TOTAL_MEMORIES"
                  subValue={filteredMemories.length !== analytics.totalMemories ? `${filteredMemories.length} FILTERED` : undefined}
                  color="cyan"
                />
                <StatCard 
                  value={formatSize(analytics.totalSize)} 
                  label="STORAGE_USED"
                  color="orange"
                />
                <StatCard 
                  value={Object.keys(analytics.typeDistribution).length.toString()} 
                  label="MEMORY_TYPES"
                  color="purple"
                />
                <StatCard 
                  value={analytics.tagCloud.length.toString()} 
                  label="UNIQUE_TAGS"
                  color="green"
                />
              </div>

              {/* Memory Type Distribution */}
              <div className="border border-[#222] p-4">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#ff6b35]" />
                  TYPE_DISTRIBUTION
                </h4>
                <div className="space-y-3">
                  {Object.entries(analytics.typeDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, count]) => {
                      const percentage = (count / analytics.totalMemories) * 100;
                      return (
                        <div key={type} className="flex items-center gap-4">
                          <span className="text-xs text-[#666] w-24 font-mono">{typeLabels[type as MemoryType]}</span>
                          <div className="flex-1 h-6 bg-[#111] relative overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: typeColors[type as MemoryType],
                              }}
                            />
                            <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-mono">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Storage Growth */}
              <div className="border border-[#222] p-4">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00d4ff]" />
                  STORAGE_GROWTH
                </h4>
                <div className="h-32 flex items-end gap-1">
                  {analytics.storageGrowth.slice(-30).map((point, i) => {
                    const maxSize = Math.max(...analytics.storageGrowth.map(p => p.size), 1);
                    const height = (point.size / maxSize) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-[#00d4ff]/30 hover:bg-[#00d4ff]/50 transition-colors relative group"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#111] border border-[#333] text-xs text-[#888] opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                          {point.date}: {formatSize(point.size)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-[#555] mt-2 font-mono">
                  <span>{analytics.storageGrowth[0]?.date || 'START'}</span>
                  <span>{analytics.storageGrowth[analytics.storageGrowth.length - 1]?.date || 'NOW'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'types' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(analytics.typeDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="border border-[#222] p-4 text-center hover:border-[#ff6b35] transition-colors">
                      <div 
                        className="w-12 h-12 mx-auto mb-3 flex items-center justify-center"
                        style={{ 
                          border: `2px solid ${typeColors[type as MemoryType]}`,
                          boxShadow: `0 0 20px ${typeColors[type as MemoryType]}30`,
                        }}
                      >
                        <span 
                          className="text-2xl font-display font-bold"
                          style={{ color: typeColors[type as MemoryType] }}
                        >
                          {count}
                        </span>
                      </div>
                      <span className="text-xs text-[#888] font-mono">{typeLabels[type as MemoryType]}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="border border-[#222] p-4">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#b829dd]" />
                  ACTIVITY_TIMELINE
                </h4>
                <div className="space-y-2">
                  {analytics.timeline.slice(-50).map((point, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm">
                      <span className="text-[#666] font-mono w-24">{point.date}</span>
                      <div className="flex-1 h-4 bg-[#111] relative overflow-hidden">
                        <div 
                          className="h-full bg-[#b829dd]/50"
                          style={{ 
                            width: `${Math.min((point.count / Math.max(...analytics.timeline.map(p => p.count))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[#888] font-mono w-12 text-right">{point.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-6">
              <div className="border border-[#222] p-4">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#4ade80]" />
                  TAG_CLOUD
                </h4>
                <div className="flex flex-wrap gap-3">
                  {analytics.tagCloud.map(({ tag, count }) => {
                    const size = 0.8 + (count / maxTagCount) * 1.5;
                    const opacity = 0.5 + (count / maxTagCount) * 0.5;
                    return (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-[#111] border border-[#333] text-[#4ade80] hover:border-[#4ade80] hover:bg-[#4ade80]/10 transition-all cursor-default"
                        style={{ 
                          fontSize: `${size}rem`,
                          opacity,
                        }}
                      >
                        {tag} ({count})
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Tag List */}
              <div className="border border-[#222] p-4">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4">TAG_BREAKDOWN</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {analytics.tagCloud.map(({ tag, count }) => (
                    <div key={tag} className="flex items-center justify-between px-3 py-2 bg-[#111] border border-[#222]">
                      <span className="text-sm text-[#888]">{tag}</span>
                      <span className="text-xs text-[#4ade80] font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  value, 
  label, 
  subValue,
  color 
}: { 
  value: string; 
  label: string;
  subValue?: string;
  color: 'orange' | 'cyan' | 'purple' | 'green';
}) {
  const colorClasses = {
    orange: 'border-[#ff6b35] text-[#ff6b35]',
    cyan: 'border-[#00d4ff] text-[#00d4ff]',
    purple: 'border-[#b829dd] text-[#b829dd]',
    green: 'border-[#4ade80] text-[#4ade80]',
  };

  return (
    <div className={`border ${colorClasses[color]} p-4 bg-[#0f0f0f]`}>
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-[10px] text-[#666] font-mono tracking-wider mt-1">{label}</div>
      {subValue && (
        <div className="text-xs text-[#888] mt-1">{subValue}</div>
      )}
    </div>
  );
}
