'use client';

import { useState, useRef } from 'react';
import { useMemory, Memory } from '@/contexts/MemoryContext';
import { useNotify } from '@/features/ui/Notifications';
import { 
  Trash2, 
  Download, 
  Upload, 
  FileJson, 
  AlertCircle, 
  CheckCircle, 
  X,
  Copy,
  Save,
  ListChecks,
  XSquare,
  Filter,
  Zap,
  Clock,
  CheckSquare,
  Square
} from 'lucide-react';

interface BatchOperationsProps {
  onClose?: () => void;
}

export function BatchOperations({ onClose }: BatchOperationsProps) {
  const { 
    memories, 
    filteredMemories, 
    removeMemories, 
    exportMemories, 
    importMemories,
    resetFilters
  } = useMemory();
  const notify = useNotify();
  
  const [activeTab, setActiveTab] = useState<'delete' | 'export' | 'import'>('export');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState<'manual' | 'filtered' | 'all'>('manual');
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectMode === 'filtered') {
      setSelectedIds(filteredMemories.map(m => m.id));
    } else if (selectMode === 'all') {
      setSelectedIds(memories.map(m => m.id));
    }
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const selectFiltered = () => {
    setSelectMode('filtered');
    setSelectedIds(filteredMemories.map(m => m.id));
    notify.info('Selection Updated', `${filteredMemories.length} filtered memories selected`);
  };

  const selectAllMemories = () => {
    setSelectMode('all');
    setSelectedIds(memories.map(m => m.id));
    notify.info('Selection Updated', `${memories.length} total memories selected`);
  };

  // Delete handlers
  const handleDeleteConfirm = () => {
    setShowConfirmDelete(true);
  };

  const executeDelete = () => {
    if (selectedIds.length === 0) {
      notify.error('No Selection', 'Please select memories to delete');
      return;
    }

    removeMemories(selectedIds);
    notify.success('Batch Delete Complete', `Deleted ${selectedIds.length} memories`);
    setSelectedIds([]);
    setShowConfirmDelete(false);
    setSelectMode('manual');
  };

  // Export handlers
  const handleExport = () => {
    let ids: string[] | undefined;
    if (selectMode === 'filtered') {
      ids = filteredMemories.map(m => m.id);
    } else if (selectMode === 'manual' && selectedIds.length > 0) {
      ids = selectedIds;
    }
    
    const data = exportMemories(ids);
    setExportData(data);
    notify.success('Export Generated', `Exported ${ids?.length || memories.length} memories`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      notify.success('Copied', 'Export data copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      notify.error('Copy Failed', 'Failed to copy to clipboard');
    }
  };

  const downloadFile = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-memory-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success('Downloaded', 'File downloaded successfully');
  };

  // Import handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
      notify.info('File Loaded', `${file.name} ready for import`);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importData.trim()) {
      notify.error('No Data', 'Please provide JSON data to import');
      return;
    }
    
    const result = importMemories(importData);
    setImportResult(result);
    
    if (result.success > 0) {
      notify.success('Import Complete', `Successfully imported ${result.success} memories`);
      setImportData('');
    }
    if (result.failed > 0) {
      notify.warning('Import Issues', `${result.failed} memories failed to import`);
    }
  };

  const renderSelectionSummary = () => {
    const count = selectMode === 'filtered' 
      ? filteredMemories.length 
      : selectMode === 'all' 
        ? memories.length 
        : selectedIds.length;
    
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="text-[#666] font-mono">
          SELECTED: <span className="text-[#ff6b35]">{count}</span> MEMORIES
        </span>
        <span className="text-[#444]">|</span>
        <span className="text-[#666] font-mono">
          MODE: <span className="text-[#00d4ff]">{selectMode.toUpperCase()}</span>
        </span>
      </div>
    );
  };

  return (
    <div className="retro-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#222] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-[#00d4ff] flex items-center justify-center glow-cyan">
            <Zap className="w-5 h-5 text-[#00d4ff]" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white tracking-wider">BATCH_OPERATIONS</h3>
            <p className="text-xs text-[#666] font-mono">DELETE // EXPORT // IMPORT</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222]">
        <button
          onClick={() => {
            setActiveTab('delete');
            setExportData('');
            setImportResult(null);
          }}
          className={`flex-1 px-4 py-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'delete'
              ? 'bg-[#ff4444]/10 text-[#ff4444] border-b-2 border-[#ff4444]'
              : 'text-[#666] hover:text-[#888] hover:bg-[#111]'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          DELETE
        </button>
        <button
          onClick={() => {
            setActiveTab('export');
            setImportResult(null);
          }}
          className={`flex-1 px-4 py-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'export'
              ? 'bg-[#00d4ff]/10 text-[#00d4ff] border-b-2 border-[#00d4ff]'
              : 'text-[#666] hover:text-[#888] hover:bg-[#111]'
          }`}
        >
          <Download className="w-4 h-4" />
          EXPORT
        </button>
        <button
          onClick={() => {
            setActiveTab('import');
            setExportData('');
          }}
          className={`flex-1 px-4 py-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'import'
              ? 'bg-[#ff6b35]/10 text-[#ff6b35] border-b-2 border-[#ff6b35]'
              : 'text-[#666] hover:text-[#888] hover:bg-[#111]'
          }`}
        >
          <Upload className="w-4 h-4" />
          IMPORT
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Selection Controls (for delete/export) */}
        {(activeTab === 'delete' || activeTab === 'export') && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#666] font-mono">SELECTION_MODE:</span>
              <button
                onClick={() => setSelectMode('manual')}
                className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                  selectMode === 'manual'
                    ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                    : 'border-[#333] text-[#666] hover:border-[#555]'
                }`}
              >
                MANUAL
              </button>
              <button
                onClick={selectFiltered}
                className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                  selectMode === 'filtered'
                    ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                    : 'border-[#333] text-[#666] hover:border-[#555]'
                }`}
              >
                <Filter className="w-3 h-3 inline mr-1" />
                FILTERED ({filteredMemories.length})
              </button>
              <button
                onClick={selectAllMemories}
                className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                  selectMode === 'all'
                    ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                    : 'border-[#333] text-[#666] hover:border-[#555]'
                }`}
              >
                <ListChecks className="w-3 h-3 inline mr-1" />
                ALL ({memories.length})
              </button>
            </div>

            {renderSelectionSummary()}

            {/* Manual Selection List */}
            {selectMode === 'manual' && (
              <div className="border border-[#222] max-h-48 overflow-y-auto">
                <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#222] p-2 flex items-center justify-between">
                  <button
                    onClick={selectAll}
                    className="text-xs text-[#666] hover:text-[#00d4ff] font-mono flex items-center gap-1"
                  >
                    <ListChecks className="w-3 h-3" />
                    SELECT ALL
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-[#666] hover:text-[#ff4444] font-mono flex items-center gap-1"
                  >
                    <XSquare className="w-3 h-3" />
                    CLEAR
                  </button>
                </div>
                <div className="divide-y divide-[#222]">
                  {memories.map((memory) => (
                    <label
                      key={memory.id}
                      className="flex items-center gap-3 p-3 hover:bg-[#111] cursor-pointer"
                    >
                      {selectedIds.includes(memory.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#00d4ff]" />
                      ) : (
                        <Square className="w-5 h-5 text-[#444]" />
                      )}
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(memory.id)}
                        onChange={() => toggleSelection(memory.id)}
                        className="hidden"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#888] font-mono truncate block">{memory.key}</span>
                        <span className="text-xs text-[#666]">{memory.type} • {memory.tags.join(', ')}</span>
                      </div>
                      <span className="text-xs text-[#444] font-mono">{memory.size}B</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Tab */}
        {activeTab === 'delete' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#ff4444]/5 border border-[#ff4444]/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#ff4444] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#ff4444] mb-1">WARNING: DESTRUCTIVE ACTION</h4>
                  <p className="text-xs text-[#888]">
                    Deleting memories is permanent and cannot be undone. 
                    Consider exporting your data before deleting.
                  </p>
                </div>
              </div>
            </div>

            {showConfirmDelete ? (
              <div className="space-y-4">
                <div className="p-4 border border-[#ff4444]">
                  <p className="text-sm text-white mb-2">
                    Are you sure you want to delete <span className="text-[#ff4444] font-bold">{selectedIds.length}</span> memories?
                  </p>
                  <p className="text-xs text-[#666]">This action cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={executeDelete}
                    className="flex-1 py-3 border border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444] hover:text-white transition-all font-mono text-sm tracking-wider"
                  >
                    CONFIRM_DELETE
                  </button>
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="flex-1 py-3 border border-[#333] text-[#666] hover:border-[#888] hover:text-white transition-all font-mono text-sm tracking-wider"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDeleteConfirm}
                disabled={selectedIds.length === 0}
                className="w-full py-3 border border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444] hover:text-white disabled:border-[#333] disabled:text-[#555] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all font-mono text-sm tracking-wider flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                DELETE_SELECTED ({selectedIds.length})
              </button>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            {!exportData ? (
              <button
                onClick={handleExport}
                disabled={selectMode === 'manual' && selectedIds.length === 0}
                className="w-full py-3 border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all font-mono text-sm tracking-wider flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                GENERATE_EXPORT
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={exportData}
                    readOnly
                    rows={8}
                    className="w-full p-4 bg-[#0a0a0a] border border-[#333] text-[#888] font-mono text-xs resize-none focus:outline-none"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-[#111] border border-[#333] text-[#666] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-[#4ade80]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={downloadFile}
                    className="flex-1 py-3 border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-[#0a0a0a] transition-all font-mono text-sm tracking-wider flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    DOWNLOAD_FILE
                  </button>
                  <button
                    onClick={() => {
                      setExportData('');
                      setSelectedIds([]);
                      setSelectMode('manual');
                    }}
                    className="flex-1 py-3 border border-[#333] text-[#666] hover:border-[#ff4444] hover:text-[#ff4444] transition-all font-mono text-sm tracking-wider"
                  >
                    RESET
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-[#333] p-6 text-center hover:border-[#ff6b35] transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileJson className="w-8 h-8 text-[#666] mx-auto mb-3" />
              <p className="text-sm text-[#888] mb-2">Drop JSON file here or click to browse</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-[#0a0a0a] transition-colors font-mono text-sm"
              >
                SELECT_FILE
              </button>
            </div>

            {/* Or paste JSON */}
            <div className="text-center">
              <span className="text-xs text-[#555] font-mono">— OR —</span>
            </div>

            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste memory data JSON here..."
              rows={6}
              className="w-full p-4 bg-[#111] border border-[#333] text-white placeholder-[#555] font-mono text-sm resize-none focus:border-[#ff6b35] focus:outline-none"
            />

            {/* Import Result */}
            {importResult && (
              <div className={`p-4 border ${
                importResult.failed === 0 
                  ? 'border-[#4ade80]/30 bg-[#4ade80]/10' 
                  : importResult.success > 0 
                    ? 'border-[#fbbf24]/30 bg-[#fbbf24]/10'
                    : 'border-[#ff4444]/30 bg-[#ff4444]/10'
              }`}>
                <div className="flex items-center gap-3">
                  {importResult.failed === 0 ? (
                    <CheckCircle className="w-5 h-5 text-[#4ade80]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#fbbf24]" />
                  )}
                  <div>
                    <p className="text-sm text-white">
                      Imported: <span className="text-[#4ade80]">{importResult.success}</span> successful
                      {importResult.failed > 0 && (
                        <>, <span className="text-[#ff4444]">{importResult.failed}</span> failed</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={!importData.trim()}
              className="w-full py-3 border border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] transition-all font-mono text-sm tracking-wider flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              IMPORT_DATA
            </button>

            {/* Warning */}
            <div className="flex items-start gap-3 p-3 bg-[#ff6b35]/5 border border-[#ff6b35]/20">
              <AlertCircle className="w-4 h-4 text-[#ff6b35] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#888]">
                Importing will add memories to your current collection. Duplicate keys may be created. 
                Make sure to backup your data before importing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
