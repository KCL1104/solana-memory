'use client';

import { useState, useCallback } from 'react';
import { useMemory, MemoryType } from '@/contexts/MemoryContext';
import { DemoMemory } from '@/demo/data';

export interface BatchProgress {
  total: number;
  loaded: number;
  failed: number;
  current?: string;
}

export interface BatchResult {
  success: number;
  failed: number;
  memories: string[];
}

/**
 * useBatchOperations - Hook for batch memory operations
 * 
 * Provides functions for creating multiple memories efficiently
 * with progress tracking.
 */
export function useBatchOperations() {
  const { addMemory, memories } = useMemory();
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<BatchResult | null>(null);

  /**
   * Batch create memories with progress tracking
   */
  const batchCreateMemories = useCallback(async (
    newMemories: DemoMemory[],
    options?: { 
      agentId?: string;
      onProgress?: (progress: BatchProgress) => void;
      delay?: number;
      continueOnError?: boolean;
    }
  ): Promise<BatchResult> => {
    setIsLoading(true);
    setLastResult(null);
    
    const results: BatchResult = { 
      success: 0, 
      failed: 0,
      memories: []
    };
    
    for (let i = 0; i < newMemories.length; i++) {
      const memory = newMemories[i];
      
      setProgress({
        total: newMemories.length,
        loaded: results.success,
        failed: results.failed,
        current: memory.key,
      });

      try {
        // Map category to MemoryType
        const typeMap: Record<string, MemoryType> = {
          preference: 'preference',
          routine: 'preference',
          project: 'task',
          calendar: 'knowledge',
          learning: 'learning',
          health: 'knowledge',
          knowledge: 'knowledge',
          travel: 'knowledge',
        };

        const content = typeof memory.content === 'string' 
          ? memory.content 
          : JSON.stringify(memory.content, null, 2);

        addMemory({
          key: memory.key,
          type: typeMap[memory.category] || 'knowledge',
          content,
          size: content.length,
          encrypted: true,
          importance: memory.importance,
          tags: memory.tags,
          agentId: options?.agentId || 'agent_001',
        });

        results.success++;
        results.memories.push(memory.key);
      } catch (error) {
        results.failed++;
        console.error(`Failed to create memory ${memory.key}:`, error);
        
        if (!options?.continueOnError) {
          break;
        }
      }

      // Simulate network delay for UX
      if (options?.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // Notify progress callback
      options?.onProgress?.({
        total: newMemories.length,
        loaded: results.success,
        failed: results.failed,
        current: memory.key,
      });
    }

    setProgress({
      total: newMemories.length,
      loaded: results.success,
      failed: results.failed,
    });
    
    setLastResult(results);
    setIsLoading(false);

    return results;
  }, [addMemory]);

  /**
   * Import demo data with default settings
   */
  const importDemoData = useCallback(async (
    demoMemories: DemoMemory[],
    options?: {
      agentId?: string;
      onProgress?: (progress: BatchProgress) => void;
    }
  ): Promise<BatchResult> => {
    return batchCreateMemories(demoMemories, {
      agentId: options?.agentId,
      onProgress: options?.onProgress,
      delay: 300, // 300ms delay between items for visual feedback
      continueOnError: true,
    });
  }, [batchCreateMemories]);

  /**
   * Check for duplicate keys
   */
  const checkDuplicates = useCallback((keys: string[]): string[] => {
    const existingKeys = new Set(memories.map(m => m.key));
    return keys.filter(key => existingKeys.has(key));
  }, [memories]);

  /**
   * Clear progress state
   */
  const clearProgress = useCallback(() => {
    setProgress(null);
    setLastResult(null);
  }, []);

  return {
    // State
    progress,
    isLoading,
    lastResult,
    
    // Actions
    batchCreateMemories,
    importDemoData,
    checkDuplicates,
    clearProgress,
  };
}

export default useBatchOperations;
