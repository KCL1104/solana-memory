'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useMemory, MemoryType, SortOption } from '@/contexts/MemoryContext';
import { useNotify } from '@/features/ui/Notifications';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Tag,
  SlidersHorizontal,
  ChevronDown,
  SortAsc,
  SortDesc,
  Brain,
  Sparkles,
  Wand2,
  Clock,
  Zap
} from 'lucide-react';

const memoryTypes: MemoryType[] = ['conversation', 'learning', 'preference', 'task', 'knowledge', 'relationship', 'system'];

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'newest', label: 'Newest First', icon: <SortDesc className="w-4 h-4" /> },
  { value: 'oldest', label: 'Oldest First', icon: <SortAsc className="w-4 h-4" /> },
  { value: 'importance_high', label: 'Highest Importance', icon: <SortDesc className="w-4 h-4" /> },
  { value: 'importance_low', label: 'Lowest Importance', icon: <SortAsc className="w-4 h-4" /> },
  { value: 'size_large', label: 'Largest Size', icon: <SortDesc className="w-4 h-4" /> },
  { value: 'size_small', label: 'Smallest Size', icon: <SortAsc className="w-4 h-4" /> },
  { value: 'alphabetical', label: 'Alphabetical', icon: <SortAsc className="w-4 h-4" /> },
];

// Simulated semantic search suggestions
const semanticSuggestions = [
  "conversations about AI",
  "important tasks",
  "learning materials",
  "user preferences",
  "technical knowledge",
  "recent updates"
];

export function SemanticSearch() {
  const { filters, setFilters, resetFilters, sortOption, setSortOption, filteredMemories, memories } = useMemory();
  const notify = useNotify();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isSemanticMode, setIsSemanticMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFilterCount = [
    filters.types.length > 0,
    filters.startDate !== null,
    filters.endDate !== null,
    filters.minImportance > 0 || filters.maxImportance < 100,
    filters.tags.length > 0,
  ].filter(Boolean).length;

  const allTags = useMemo(() => 
    Array.from(new Set(memories.flatMap(m => m.tags))),
    [memories]
  );

  // Simulate semantic search
  const handleSemanticSearch = async (query: string) => {
    if (!query.trim() || !isSemanticMode) return;
    
    setIsSearching(true);
    notify.info('Semantic Search', 'Analyzing query meaning...');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real implementation, this would use embeddings/vector search
    // For now, we do intelligent keyword matching
    const lowerQuery = query.toLowerCase();
    
    // Smart type detection
    const typeMapping: Record<string, MemoryType[]> = {
      'conversation': ['conversation'],
      'chat': ['conversation'],
      'talk': ['conversation'],
      'learn': ['learning'],
      'study': ['learning'],
      'course': ['learning'],
      'prefer': ['preference'],
      'like': ['preference'],
      'setting': ['preference'],
      'task': ['task'],
      'todo': ['task'],
      'work': ['task'],
      'know': ['knowledge'],
      'info': ['knowledge'],
      'fact': ['knowledge'],
    };
    
    const detectedTypes: MemoryType[] = [];
    Object.entries(typeMapping).forEach(([keyword, types]) => {
      if (lowerQuery.includes(keyword)) {
        detectedTypes.push(...types);
      }
    });
    
    if (detectedTypes.length > 0) {
      setFilters({ types: Array.from(new Set(detectedTypes)) });
      notify.success('Semantic Match', `Detected types: ${detectedTypes.join(', ')}`);
    }
    
    setIsSearching(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters({ tags: [...filters.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFilters({ tags: filters.tags.filter(t => t !== tag) });
  };

  const toggleType = (type: MemoryType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    setFilters({ types: newTypes });
  };

  const currentSortLabel = sortOptions.find(o => o.value === sortOption)?.label || 'Sort';

  return (
    <div className="space-y-4">
      {/* Main Search Bar with Semantic Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSemanticMode ? (
              <Brain className="w-4 h-4 text-[#b829dd]" />
            ) : (
              <Search className="w-4 h-4 text-[#666]" />
            )}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={isSemanticMode ? "SEMANTIC_SEARCH... (e.g., 'conversations about AI')" : "SEARCH_MEMORY... (keywords, tags, content)"}
            value={filters.query}
            onChange={(e) => {
              setFilters({ query: e.target.value });
              if (isSemanticMode && e.target.value.length > 3) {
                setShowSuggestions(true);
              } else {
                setShowSuggestions(false);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && isSemanticMode) {
                handleSemanticSearch(filters.query);
                setShowSuggestions(false);
              }
            }}
            onFocus={() => filters.query.length > 3 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className={`w-full pl-11 pr-24 py-3 bg-[#111] border text-white placeholder-[#555] focus:outline-none font-mono text-sm transition-colors ${
              isSemanticMode 
                ? 'border-[#b829dd] focus:border-[#b829dd] shadow-[0_0_10px_rgba(184,41,221,0.2)]' 
                : 'border-[#333] focus:border-[#ff6b35]'
            }`}
          />
          
          {/* Semantic Toggle */}
          <button
            onClick={() => {
              setIsSemanticMode(!isSemanticMode);
              notify.info(isSemanticMode ? 'Standard Search' : 'Semantic Search', 
                isSemanticMode ? 'Switched to keyword search' : 'Switched to AI-powered semantic search');
            }}
            className={`absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono border transition-colors ${
              isSemanticMode 
                ? 'border-[#b829dd] text-[#b829dd] bg-[#b829dd]/10' 
                : 'border-[#333] text-[#666] hover:border-[#555]'
            }`}
          >
            {isSemanticMode ? 'AI' : 'STD'}
          </button>

          {/* Semantic Suggestions */}
          {showSuggestions && isSemanticMode && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#b829dd] z-50">
              <div className="p-2 text-xs text-[#666] font-mono border-b border-[#222]">
                <Sparkles className="w-3 h-3 inline mr-1" />
                TRY ASKING:
              </div>
              {semanticSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setFilters({ query: suggestion });
                    handleSemanticSearch(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-[#888] hover:bg-[#b829dd]/10 hover:text-[#b829dd] transition-colors font-mono flex items-center gap-2"
                >
                  <Wand2 className="w-3 h-3" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Searching Indicator */}
          {isSearching && (
            <div className="absolute right-16 top-1/2 -translate-y-1/2">
              <Zap className="w-4 h-4 text-[#b829dd] animate-pulse" />
            </div>
          )}
          
          {filters.query && !isSearching && (
            <button
              onClick={() => setFilters({ query: '' })}
              className="absolute right-16 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#ff4444]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-full sm:w-auto px-4 py-3 bg-[#111] border border-[#333] text-white hover:border-[#00d4ff] transition-colors font-mono text-sm flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#00d4ff]" />
            <span className="hidden sm:inline">{currentSortLabel}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-[#111] border border-[#333] z-50">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortOption(option.value);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-mono flex items-center gap-3 transition-colors ${
                    sortOption === option.value
                      ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                      : 'text-[#888] hover:bg-[#222] hover:text-white'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-3 border font-mono text-sm flex items-center gap-2 transition-colors ${
            isExpanded || activeFilterCount > 0
              ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
              : 'border-[#333] text-[#666] hover:border-[#555]'
          }`}
        >
          <Filter className="w-4 h-4" />
          FILTERS
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-[#ff6b35] text-[#0a0a0a] text-xs rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#666] font-mono">
        <span>
          SHOWING <span className="text-[#00d4ff]">{filteredMemories.length}</span> OF <span className="text-[#ff6b35]">{memories.length}</span> MEMORIES
        </span>
        {(filters.query || activeFilterCount > 0) && (
          <button
            onClick={resetFilters}
            className="text-[#ff6b35] hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            CLEAR_ALL
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border border-[#222] p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Type Filter */}
          <div>
            <label className="text-xs text-[#666] font-mono tracking-wider flex items-center gap-2 mb-3">
              <Filter className="w-3 h-3" />
              MEMORY_TYPES
            </label>
            <div className="flex flex-wrap gap-2">
              {memoryTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                    filters.types.includes(type)
                      ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                      : 'border-[#333] text-[#666] hover:border-[#555]'
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-xs text-[#666] font-mono tracking-wider flex items-center gap-2 mb-3">
              <Calendar className="w-3 h-3" />
              DATE_RANGE
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="date"
                value={filters.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFilters({ startDate: e.target.value ? new Date(e.target.value) : null })}
                className="px-3 py-2 bg-[#111] border border-[#333] text-white text-sm font-mono focus:border-[#ff6b35] focus:outline-none"
              />
              <span className="text-[#666] self-center">TO</span>
              <input
                type="date"
                value={filters.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFilters({ endDate: e.target.value ? new Date(e.target.value) : null })}
                className="px-3 py-2 bg-[#111] border border-[#333] text-white text-sm font-mono focus:border-[#ff6b35] focus:outline-none"
              />
            </div>
          </div>

          {/* Importance Range */}
          <div>
            <label className="text-xs text-[#666] font-mono tracking-wider flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-3 h-3" />
              IMPORTANCE_RANGE: {filters.minImportance} - {filters.maxImportance}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minImportance}
                onChange={(e) => setFilters({ minImportance: parseInt(e.target.value) })}
                className="flex-1 accent-[#ff6b35]"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.maxImportance}
                onChange={(e) => setFilters({ maxImportance: parseInt(e.target.value) })}
                className="flex-1 accent-[#ff6b35]"
              />
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="text-xs text-[#666] font-mono tracking-wider flex items-center gap-2 mb-3">
              <Tag className="w-3 h-3" />
              TAGS
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-[#ff6b35]/10 border border-[#ff6b35]/30 text-[#ff6b35] text-xs font-mono flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-[#ff4444]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="ADD_TAG..."
                className="flex-1 px-3 py-2 bg-[#111] border border-[#333] text-white text-sm font-mono placeholder-[#555] focus:border-[#ff6b35] focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                list="available-tags"
              />
              <datalist id="available-tags">
                {allTags.filter(t => !filters.tags.includes(t)).map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-3 py-2 border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] transition-colors font-mono text-sm"
              >
                ADD
              </button>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="pt-4 border-t border-[#222]">
            <span className="text-xs text-[#555] font-mono mr-3">QUICK_FILTERS:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  setFilters({ startDate: today, endDate: new Date() });
                }}
                className="px-2 py-1 text-xs border border-[#333] text-[#666] hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors font-mono"
              >
                <Clock className="w-3 h-3 inline mr-1" />
                TODAY
              </button>
              <button
                onClick={() => {
                  const weekAgo = new Date(Date.now() - 7 * 86400000);
                  setFilters({ startDate: weekAgo, endDate: new Date() });
                }}
                className="px-2 py-1 text-xs border border-[#333] text-[#666] hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors font-mono"
              >
                LAST_7_DAYS
              </button>
              <button
                onClick={() => setFilters({ minImportance: 80, maxImportance: 100 })}
                className="px-2 py-1 text-xs border border-[#333] text-[#666] hover:border-[#ff6b35] hover:text-[#ff6b35] transition-colors font-mono"
              >
                HIGH_IMPORTANCE
              </button>
              <button
                onClick={() => setFilters({ types: ['conversation'] })}
                className="px-2 py-1 text-xs border border-[#333] text-[#666] hover:border-[#b829dd] hover:text-[#b829dd] transition-colors font-mono"
              >
                CONVERSATIONS_ONLY
              </button>
              <button
                onClick={() => setFilters({ types: ['knowledge', 'learning'] })}
                className="px-2 py-1 text-xs border border-[#333] text-[#666] hover:border-[#4ade80] hover:text-[#4ade80] transition-colors font-mono"
              >
                KNOWLEDGE_BASE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
