'use client';

import { useState, useMemo } from 'react';
import { useMemory, MemoryType } from '@/contexts/MemoryContext';
import { useNotify } from '@/features/ui/Notifications';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Tag, 
  Database,
  Clock,
  Activity,
  X,
  Brain,
  Zap,
  Layers,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Share2,
  RefreshCw
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

export function MemoryAnalytics() {
  const { getAnalytics, filteredMemories, memories, resetFilters } = useMemory();
  const notify = useNotify();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'types' | 'timeline' | 'trends'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  const analytics = useMemo(() => getAnalytics(), [getAnalytics]);
  
  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    const now = new Date();
    const daysAgo7 = new Date(now.getTime() - 7 * 86400000);
    const daysAgo14 = new Date(now.getTime() - 14 * 86400000);
    
    const recentMemories = memories.filter(m => m.createdAt >= daysAgo7);
    const previousMemories = memories.filter(m => 
      m.createdAt >= daysAgo14 && m.createdAt < daysAgo7
    );
    
    const growth = previousMemories.length > 0 
      ? ((recentMemories.length - previousMemories.length) / previousMemories.length) * 100
      : 0;
    
    return {
      recentCount: recentMemories.length,
      previousCount: previousMemories.length,
      growth,
      trend: growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable'
    };
  }, [memories]);
  
  // Filter data by time range
  const filteredTimeline = useMemo(() => {
    const cutoff = {
      '7d': Date.now() - 7 * 86400000,
      '30d': Date.now() - 30 * 86400000,
      '90d': Date.now() - 90 * 86400000,
      'all': 0
    }[timeRange];
    
    return analytics.timeline.filter(t => new Date(t.date).getTime() >= cutoff);
  }, [analytics.timeline, timeRange]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleRefresh = () => {
    notify.info('Analytics Updated', 'Memory analytics have been refreshed');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-24 z-40 w-12 h-12 border border-[#ff6b35] bg-[#0a0a0a] flex items-center justify-center hover:bg-[#ff6b35] hover:text-[#0a0a0a] transition-all group"
        title="Memory Analytics"
      >
        <BarChart3 className="w-5 h-5 text-[#ff6b35] group-hover:text-[#0a0a0a]" />
      </button>
    );
  }

  const maxTagCount = Math.max(...analytics.tagCloud.map(t => t.count), 1);
  const maxTimelineCount = Math.max(...filteredTimeline.map(t => t.count), 1);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="retro-card w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-[#ff6b35] flex items-center justify-center glow-orange">
              <Activity className="w-5 h-5 text-[#ff6b35]" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white tracking-wider">MEMORY_ANALYTICS</h3>
              <p className="text-xs text-[#666] font-mono">
                <span className="text-[#00d4ff]">{analytics.totalMemories}</span> MEMORIES // 
                <span className="text-[#ff6b35]"> {formatSize(analytics.totalSize)}</span> TOTAL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-[#666] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#222]">
          {[
            { id: 'overview', label: 'OVERVIEW', icon: Activity },
            { id: 'types', label: 'TYPES', icon: PieChart },
            { id: 'timeline', label: 'TIMELINE', icon: TrendingUp },
            { id: 'trends', label: 'TRENDS', icon: Sparkles },
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
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  value={analytics.totalMemories.toString()} 
                  label="TOTAL_MEMORIES"
                  subValue={filteredMemories.length !== analytics.totalMemories ? `${filteredMemories.length} FILTERED` : undefined}
                  color="cyan"
                  icon={<Database className="w-5 h-5" />}
                />
                <StatCard 
                  value={formatSize(analytics.totalSize)} 
                  label="STORAGE_USED"
                  color="orange"
                  icon={<Layers className="w-5 h-5" />}
                />
                <StatCard 
                  value={Object.keys(analytics.typeDistribution).length.toString()} 
                  label="MEMORY_TYPES"
                  color="purple"
                  icon={<Brain className="w-5 h-5" />}
                />
                <StatCard 
                  value={analytics.tagCloud.length.toString()} 
                  label="UNIQUE_TAGS"
                  color="green"
                  icon={<Tag className="w-5 h-5" />}
                />
              </div>

              {/* Growth Metric */}
              <div className="border border-[#222] p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-mono tracking-wider text-[#888] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#fbbf24]" />
                    7_DAY_GROWTH
                  </h4>
                  <div className="flex items-center gap-2">
                    {growthMetrics.trend === 'up' && (
                      <span className="flex items-center gap-1 text-[#4ade80]">
                        <ArrowUpRight className="w-4 h-4" />
                        +{growthMetrics.growth.toFixed(1)}%
                      </span>
                    )}
                    {growthMetrics.trend === 'down' && (
                      <span className="flex items-center gap-1 text-[#ff4444]">
                        <ArrowDownRight className="w-4 h-4" />
                        {growthMetrics.growth.toFixed(1)}%
                      </span>
                    )}
                    {growthMetrics.trend === 'stable' && (
                      <span className="flex items-center gap-1 text-[#888]">
                        <Minus className="w-4 h-4" />
                        Stable
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-2xl font-display font-bold text-white">{growthMetrics.recentCount}</div>
                    <div className="text-xs text-[#666] font-mono">RECENT (7D)</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#444]" />
                  <div>
                    <div className="text-2xl font-display font-bold text-[#666]">{growthMetrics.previousCount}</div>
                    <div className="text-xs text-[#666] font-mono">PREVIOUS (7D)</div>
                  </div>
                </div>
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
                          <span className="text-xs text-[#666] w-28 font-mono">{typeLabels[type as MemoryType]}</span>
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

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <QuickStat 
                  label="AVG_SIZE"
                  value={analytics.totalMemories > 0 ? formatSize(Math.round(analytics.totalSize / analytics.totalMemories)) : '0B'}
                />
                <QuickStat 
                  label="AVG_IMPORTANCE"
                  value={`${Math.round(memories.reduce((acc, m) => acc + m.importance, 0) / Math.max(memories.length, 1))}/100`}
                />
                <QuickStat 
                  label="ENCRYPTED"
                  value={`${memories.filter(m => m.encrypted).length}`}
                />
              </div>
            </div>
          )}

          {activeTab === 'types' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(analytics.typeDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => {
                    const percentage = ((count / analytics.totalMemories) * 100).toFixed(1);
                    return (
                      <div 
                        key={type} 
                        className="border border-[#222] p-4 text-center hover:border-[#ff6b35] transition-colors group cursor-pointer"
                      >
                        <div 
                          className="w-16 h-16 mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110"
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
                        <span className="text-xs text-[#888] font-mono block">{typeLabels[type as MemoryType]}</span>
                        <span className="text-xs text-[#666] font-mono">{percentage}%</span>
                      </div>
                    );
                  })}
              </div>

              {/* Type Insights */}
              <div className="border border-[#222] p-4">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4">TYPE_INSIGHTS</h4>
                <div className="space-y-2 text-sm text-[#666]">
                  {Object.entries(analytics.typeDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([type, count], i) => (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-[#ff6b35]">#{i + 1}</span>
                        <span>{typeLabels[type as MemoryType]}</span>
                        <span className="text-[#444]">—</span>
                        <span>{count} memories</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#666] font-mono">TIME_RANGE:</span>
                {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs font-mono border transition-colors ${
                      timeRange === range
                        ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                        : 'border-[#333] text-[#666] hover:border-[#555]'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Activity Timeline */}
              <div className="border border-[#222] p-4">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#b829dd]" />
                  ACTIVITY_TIMELINE
                </h4>
                <div className="h-40 flex items-end gap-1 mb-2">
                  {filteredTimeline.map((point, i) => {
                    const height = maxTimelineCount > 0 ? (point.count / maxTimelineCount) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-[#b829dd]/30 hover:bg-[#b829dd]/50 transition-colors relative group"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#111] border border-[#333] text-xs text-[#888] opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                          {point.date}: {point.count} memories
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-[#555] mt-2 font-mono">
                  <span>{filteredTimeline[0]?.date || 'START'}</span>
                  <span>{filteredTimeline[filteredTimeline.length - 1]?.date || 'NOW'}</span>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="border border-[#222] p-4 max-h-64 overflow-y-auto">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4">DAILY_BREAKDOWN</h4>
                <div className="space-y-2">
                  {[...filteredTimeline].reverse().map((point, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm">
                      <span className="text-[#666] font-mono w-24">{point.date}</span>
                      <div className="flex-1 h-4 bg-[#111] relative overflow-hidden">
                        <div 
                          className="h-full bg-[#00d4ff]/50"
                          style={{ 
                            width: `${(point.count / maxTimelineCount) * 100}%`,
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

          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Tag Cloud */}
              <div className="border border-[#222] p-4">
                <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#4ade80]" />
                  TAG_CLOUD
                </h4>
                <div className="flex flex-wrap gap-3">
                  {analytics.tagCloud.map(({ tag, count }) => {
                    const size = 0.8 + (count / maxTagCount) * 1.2;
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

              {/* Agent Comparison */}
              {analytics.agentComparison.length > 1 && (
                <div className="border border-[#222] p-4">
                  <h4 className="text-sm font-mono tracking-wider text-[#888] mb-4 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#00d4ff]" />
                    AGENT_COMPARISON
                  </h4>
                  <div className="space-y-3">
                    {analytics.agentComparison.map((agent) => (
                      <div key={agent.agentId} className="flex items-center gap-4">
                        <span className="text-xs text-[#666] w-32 font-mono truncate">{agent.name}</span>
                        <div className="flex-1 flex items-center gap-4">
                          <div className="flex-1 h-6 bg-[#111] relative overflow-hidden">
                            <div 
                              className="h-full bg-[#00d4ff]/50"
                              style={{ 
                                width: `${(agent.memoryCount / Math.max(...analytics.agentComparison.map(a => a.memoryCount))) * 100}%`,
                              }}
                            />
                            <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-mono">
                              {agent.memoryCount} memories
                            </span>
                          </div>
                          <span className="text-xs text-[#666] font-mono w-16 text-right">{formatSize(agent.totalSize)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  value, 
  label, 
  subValue,
  color,
  icon
}: { 
  value: string; 
  label: string;
  subValue?: string;
  color: 'orange' | 'cyan' | 'purple' | 'green';
  icon: React.ReactNode;
}) {
  const colorClasses = {
    orange: 'border-[#ff6b35] text-[#ff6b35]',
    cyan: 'border-[#00d4ff] text-[#00d4ff]',
    purple: 'border-[#b829dd] text-[#b829dd]',
    green: 'border-[#4ade80] text-[#4ade80]',
  };

  return (
    <div className={`border ${colorClasses[color]} p-4 bg-[#0f0f0f]`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-display font-bold">{value}</div>
          <div className="text-[10px] text-[#666] font-mono tracking-wider mt-1">{label}</div>
          {subValue && (
            <div className="text-xs text-[#888] mt-1">{subValue}</div>
          )}
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#333] p-3 text-center">
      <div className="text-lg font-display font-bold text-white">{value}</div>
      <div className="text-[10px] text-[#666] font-mono tracking-wider">{label}</div>
    </div>
  );
}
