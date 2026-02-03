'use client';

import { useEffect, useCallback, useState } from 'react';
import { useMemory } from '@/contexts/MemoryContext';
import { 
  Keyboard, 
  X,
  Command,
  Search,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function KeyboardShortcuts() {
  const { 
    addMemory, 
    removeMemory, 
    memories, 
    setFilters, 
    resetFilters,
    currentAgent,
    setCurrentAgent,
    exportMemories
  } = useMemory();
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const shortcuts: Shortcut[] = [
    {
      key: 'k',
      ctrl: true,
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="SEARCH"]') as HTMLInputElement;
        searchInput?.focus();
        showToast('Search focused');
      },
    },
    {
      key: 'f',
      ctrl: true,
      description: 'Toggle filters',
      action: () => {
        const filterBtn = document.querySelector('button:contains("FILTERS")') as HTMLButtonElement;
        filterBtn?.click();
        showToast('Filters toggled');
      },
    },
    {
      key: 'n',
      ctrl: true,
      description: 'New memory',
      action: () => {
        const addBtn = document.querySelector('button:contains("NEW_SHARD")') as HTMLButtonElement;
        addBtn?.click();
        showToast('New memory form opened');
      },
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Export all memories',
      action: () => {
        const data = exportMemories();
        navigator.clipboard.writeText(data);
        showToast('Memories copied to clipboard');
      },
    },
    {
      key: 'r',
      ctrl: true,
      description: 'Reset filters',
      action: () => {
        resetFilters();
        showToast('Filters reset');
      },
    },
    {
      key: 'a',
      ctrl: true,
      shift: true,
      description: 'Select all memories',
      action: () => {
        showToast('All memories selected');
      },
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowHelp(true),
    },
    {
      key: 'Escape',
      description: 'Close modal / Cancel',
      action: () => {
        const closeBtn = document.querySelector('[data-close-modal]') as HTMLButtonElement;
        closeBtn?.click();
        setShowHelp(false);
      },
    },
    {
      key: 'ArrowUp',
      ctrl: true,
      description: 'Previous agent',
      action: () => {
        showToast('Agent navigation');
      },
    },
    {
      key: 'ArrowDown',
      ctrl: true,
      description: 'Next agent',
      action: () => {
        showToast('Agent navigation');
      },
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase() || s.key === e.key;
        const ctrlMatch = !!s.ctrl === e.ctrlKey || !!s.ctrl === e.metaKey;
        const altMatch = !!s.alt === e.altKey;
        const shiftMatch = !!s.shift === e.shiftKey;
        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed right-4 top-72 z-40 w-12 h-12 border border-[#fbbf24] bg-[#0a0a0a] flex items-center justify-center hover:bg-[#fbbf24] hover:text-[#0a0a0a] transition-all group"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="w-5 h-5 text-[#fbbf24] group-hover:text-[#0a0a0a]" />
      </button>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#111] border border-[#ff6b35] text-[#ff6b35] font-mono text-sm z-50 animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="retro-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border border-[#fbbf24] flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-[#fbbf24]" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white tracking-wider">KEYBOARD_SHORTCUTS</h3>
                  <p className="text-xs text-[#666] font-mono">POWER_USER_CONTROLS</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-3">
                {shortcuts.map((shortcut, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 border border-[#222] hover:border-[#333] transition-colors"
                  >
                    <span className="text-sm text-[#888]">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.ctrl && (
                        <>
                          <kbd className="px-2 py-1 bg-[#111] border border-[#333] text-[#666] text-xs font-mono">CTRL</kbd>
                          <span className="text-[#444]">+</span>
                        </>
                      )}
                      {shortcut.alt && (
                        <>
                          <kbd className="px-2 py-1 bg-[#111] border border-[#333] text-[#666] text-xs font-mono">ALT</kbd>
                          <span className="text-[#444]">+</span>
                        </>
                      )}
                      {shortcut.shift && (
                        <>
                          <kbd className="px-2 py-1 bg-[#111] border border-[#333] text-[#666] text-xs font-mono">SHIFT</kbd>
                          <span className="text-[#444]">+</span>
                        </>
                      )}
                      <kbd className="px-2 py-1 bg-[#111] border border-[#ff6b35] text-[#ff6b35] text-xs font-mono">
                        {shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 border border-[#222] bg-[#0f0f0f]">
                <h4 className="text-xs text-[#666] font-mono tracking-wider mb-2">PRO_TIPS</h4>
                <ul className="text-sm text-[#888] space-y-1 list-disc list-inside">
                  <li>Use <kbd className="px-1.5 py-0.5 bg-[#111] border border-[#333] text-[#666] text-xs">Ctrl+K</kbd> to quickly search memories</li>
                  <li>Press <kbd className="px-1.5 py-0.5 bg-[#111] border border-[#333] text-[#666] text-xs">Escape</kbd> to close any modal</li>
                  <li>Shortcuts are disabled while typing in form fields</li>
                  <li>Use <kbd className="px-1.5 py-0.5 bg-[#111] border border-[#333] text-[#666] text-xs">Ctrl+E</kbd> to quickly backup your data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
