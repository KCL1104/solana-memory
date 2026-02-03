'use client';

import { useState, useRef } from 'react';
import { useMemory } from '@/contexts/MemoryContext';
import { 
  Download, 
  Upload, 
  FileJson, 
  AlertCircle, 
  CheckCircle, 
  X,
  Copy,
  Save
} from 'lucide-react';

export function ImportExport() {
  const { exportMemories, importMemories, memories, filteredMemories } = useMemory();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportMode, setExportMode] = useState<'all' | 'filtered' | 'selected'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    let ids: string[] | undefined;
    if (exportMode === 'filtered') {
      ids = filteredMemories.map(m => m.id);
    } else if (exportMode === 'selected') {
      ids = selectedIds;
    }
    const data = exportMemories(ids);
    setExportData(data);
  };

  const handleImport = () => {
    if (!importData.trim()) return;
    const result = importMemories(importData);
    setImportResult(result);
    if (result.success > 0) {
      setImportData('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-40 z-40 w-12 h-12 border border-[#00d4ff] bg-[#0a0a0a] flex items-center justify-center hover:bg-[#00d4ff] hover:text-[#0a0a0a] transition-all group"
        title="Import / Export"
      >
        <FileJson className="w-5 h-5 text-[#00d4ff] group-hover:text-[#0a0a0a]" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="retro-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-[#00d4ff] flex items-center justify-center glow-cyan">
              <FileJson className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white tracking-wider">DATA_TRANSFER</h3>
              <p className="text-xs text-[#666] font-mono">EXPORT // IMPORT // BACKUP</p>
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
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              {/* Export Options */}
              <div>
                <label className="text-xs text-[#666] font-mono tracking-wider mb-3 block">EXPORT_SCOPE</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'all', label: 'ALL_MEMORIES', count: memories.length },
                    { value: 'filtered', label: 'FILTERED', count: filteredMemories.length },
                    { value: 'selected', label: 'SELECTED', count: selectedIds.length },
                  ].map(({ value, label, count }) => (
                    <button
                      key={value}
                      onClick={() => setExportMode(value as typeof exportMode)}
                      disabled={value === 'selected' && selectedIds.length === 0}
                      className={`p-4 border text-center transition-colors ${
                        exportMode === value
                          ? 'border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]'
                          : 'border-[#333] text-[#666] hover:border-[#555]'
                      } ${value === 'selected' && selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-2xl font-display font-bold">{count}</div>
                      <div className="text-[10px] font-mono mt-1">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Memory Selection (when selected mode) */}
              {exportMode === 'selected' && (
                <div>
                  <label className="text-xs text-[#666] font-mono tracking-wider mb-3 block">SELECT_MEMORIES</label>
                  <div className="max-h-48 overflow-y-auto border border-[#222] p-2 space-y-1">
                    {memories.map((memory) => (
                      <label
                        key={memory.id}
                        className="flex items-center gap-3 p-2 hover:bg-[#111] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(memory.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, memory.id]);
                            } else {
                              setSelectedIds(selectedIds.filter(id => id !== memory.id));
                            }
                          }}
                          className="w-4 h-4 accent-[#00d4ff]"
                        />
                        <span className="text-sm text-[#888] font-mono truncate">{memory.key}</span>
                        <span className="text-xs text-[#666] ml-auto">{memory.type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {!exportData && (
                <button
                  onClick={handleExport}
                  disabled={exportMode === 'selected' && selectedIds.length === 0}
                  className="w-full py-3 border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] transition-all font-mono text-sm tracking-wider"
                >
                  GENERATE_EXPORT
                </button>
              )}

              {/* Export Result */}
              {exportData && (
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={exportData}
                      readOnly
                      rows={10}
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
                      }}
                      className="flex-1 py-3 border border-[#333] text-[#666] hover:border-[#ff4444] hover:text-[#ff4444] transition-all font-mono text-sm tracking-wider"
                    >
                      RESET
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="text-xs text-[#666] font-mono tracking-wider mb-3 block">UPLOAD_FILE</label>
                <div className="border-2 border-dashed border-[#333] p-8 text-center hover:border-[#ff6b35] transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-[#666] mx-auto mb-3" />
                  <p className="text-sm text-[#888] mb-2">Drop JSON file here or click to browse</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-[#0a0a0a] transition-colors font-mono text-sm"
                  >
                    SELECT_FILE
                  </button>
                </div>
              </div>

              {/* Or paste JSON */}
              <div className="text-center">
                <span className="text-xs text-[#555] font-mono">— OR —</span>
              </div>

              <div>
                <label className="text-xs text-[#666] font-mono tracking-wider mb-3 block">PASTE_JSON</label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste memory data JSON here..."
                  rows={8}
                  className="w-full p-4 bg-[#111] border border-[#333] text-white placeholder-[#555] font-mono text-sm resize-none focus:border-[#ff6b35] focus:outline-none"
                />
              </div>

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
                className="w-full py-3 border border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] transition-all font-mono text-sm tracking-wider"
              >
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
    </div>
  );
}
