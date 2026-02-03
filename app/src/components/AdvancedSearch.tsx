'use client';

import { useState, useRef, useEffect } from 'react';
import { useMemory, MemoryType, SortOption } from '@/contexts/MemoryContext';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Tag,
  SlidersHorizontal,
  ChevronDown,
  SortAsc,
  SortDesc
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

export function AdvancedSearch() {
  const { filters, setFilters, resetFilters, sortOption, setSortOption, filteredMemories, memories } = useMemory();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const sortDropdownRef = useRef<HTMLDivElement>(null);

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

  const allTags = Array.from(new Set(memories.flatMap(m => m.tags)));

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
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
          <input
            type="text"
            placeholder="SEARCH_MEMORY... (keywords, tags, content)"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            className="w-full pl-11 pr-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#ff6b35] focus:outline-none font-mono text-sm transition-colors"
          />
          {filters.query && (
            <button
              onClick={() => setFilters({ query: '' })}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#ff4444]"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
