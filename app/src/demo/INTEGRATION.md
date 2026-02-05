/**
 * DemoLoader Integration Guide
 * 
 * This file provides instructions for integrating the DemoLoader component
 * into the existing AgentMemory UI.
 */

/*
╔══════════════════════════════════════════════════════════════════════════╗
║  STEP 1: Update MemoryContext to add batch operations                     ║
╚══════════════════════════════════════════════════════════════════════════╝

Add to interface MemoryContextType in contexts/MemoryContext.tsx:

  // Batch operations
  addMemories: (memories: Array<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  batchImportDemoData: () => Promise<{ success: number; failed: number }>;

Add to MemoryProvider:

  const addMemories = useCallback((newMemories: Array<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const now = new Date();
    const memoriesToAdd: Memory[] = newMemories.map(memory => ({
      ...memory,
      id: `mem_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    }));
    setMemories(prev => [...memoriesToAdd, ...prev]);
    return memoriesToAdd.length;
  }, []);

  const batchImportDemoData = useCallback(async () => {
    const demoMemories = [
      {
        key: "user_preferences",
        type: "preference" as MemoryType,
        content: JSON.stringify({ theme: "dark", language: "zh-TW", notifications: true }),
        size: 85,
        encrypted: true,
        importance: 90,
        tags: ["ui", "settings", "personalization"],
        agentId: currentAgent?.id || 'agent_001',
      },
      // ... more demo memories
    ];
    
    const count = addMemories(demoMemories);
    return { success: count, failed: 0 };
  }, [addMemories, currentAgent]);

Add to context provider value:
  addMemories,
  batchImportDemoData,


╔══════════════════════════════════════════════════════════════════════════╗
║  STEP 2: Create useBatchOperations hook                                  ║
╚══════════════════════════════════════════════════════════════════════════╝

File: features/memory/useBatchOperations.ts

import { useState, useCallback } from 'react';
import { useMemory } from '@/contexts/MemoryContext';
import { DemoMemory, toSDKFormat } from '@/demo/data';

interface BatchProgress {
  total: number;
  loaded: number;
  failed: number;
  current?: string;
}

export function useBatchOperations() {
  const { addMemory } = useMemory();
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const batchCreateMemories = useCallback(async (
    memories: DemoMemory[],
    options?: { 
      onProgress?: (progress: BatchProgress) => void;
      delay?: number;
    }
  ) => {
    setIsLoading(true);
    const results = { success: 0, failed: 0 };
    
    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      setProgress({
        total: memories.length,
        loaded: i,
        failed: results.failed,
        current: memory.key,
      });

      try {
        addMemory({
          key: memory.key,
          type: memory.category as MemoryType,
          content: JSON.stringify(memory.content),
          size: JSON.stringify(memory.content).length,
          encrypted: true,
          importance: memory.importance,
          tags: memory.tags,
          agentId: 'agent_001',
        });
        results.success++;
      } catch (error) {
        results.failed++;
      }

      // Simulate network delay
      if (options?.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      options?.onProgress?.({
        total: memories.length,
        loaded: i + 1,
        failed: results.failed,
        current: memory.key,
      });
    }

    setProgress({
      total: memories.length,
      loaded: results.success,
      failed: results.failed,
    });
    setIsLoading(false);

    return results;
  }, [addMemory]);

  return {
    batchCreateMemories,
    progress,
    isLoading,
  };
}


╔══════════════════════════════════════════════════════════════════════════╗
║  STEP 3: Integrate DemoLoader into Dashboard                             ║
╚══════════════════════════════════════════════════════════════════════════╝

Update app/page.tsx:

1. Import the DemoLoader:
   import { DemoLoader } from '@/components/DemoLoader';

2. Add state for vault ID (or get from existing context):
   const [vaultId, setVaultId] = useState('demo-vault-001');

3. Add DemoLoader to the Dashboard view, after the Dashboard Header:
   
   {activeTab === 'overview' && (
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1 space-y-6">
         <ProfileCard />
         <DemoLoader 
           vaultId={vaultId} 
           onLoadComplete={() => {
             // Refresh memory list or show success toast
             console.log('Demo data loaded successfully');
           }}
         />
         <VaultManager />
       </div>
       <div className="lg:col-span-2">
         <MemoryBrowser />
       </div>
     </div>
   )}


╔══════════════════════════════════════════════════════════════════════════╗
║  STEP 4: Alternative - Add to Landing Page                               ║
╚══════════════════════════════════════════════════════════════════════════╝

To show DemoLoader on the landing page (before wallet connect):

1. Add after the Hero CTA Buttons:

   <div className="mt-8 pt-8 border-t border-theme-border-primary">
     <p className="text-xs text-theme-text-muted font-mono mb-4 tracking-wider">
       {'>'} SKIP_WALLET_CONNECT // LOAD_DEMO_DATA
     </p>
     <DemoLoader 
       vaultId="demo-preview-vault"
       onLoadComplete={() => setActiveTab('memory')}
       className="inline-block"
     />
   </div>


╔══════════════════════════════════════════════════════════════════════════╗
║  STEP 5: Update TypeScript Config (if needed)                            ║
╚══════════════════════════════════════════════════════════════════════════╝

Ensure tsconfig.json includes the demo path:

{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/demo/*": ["./src/demo/*"]
    }
  }
}


╔══════════════════════════════════════════════════════════════════════════╗
║  STEP 6: SDK Integration (Production)                                    ║
╚══════════════════════════════════════════════════════════════════════════╝

For production with AgentMemory SDK:

import { AgentMemoryClient } from '@moltdev-labs/agent-memory-sdk';
import { demoMemories, toSDKFormat } from '@/demo/data';

const client = new AgentMemoryClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// Batch create demo memories
async function loadDemoData(vaultId: string) {
  const batchRequest = {
    vaultId,
    memories: demoMemories.map(m => ({
      key: m.key,
      data: m.content,
      metadata: {
        tags: m.tags,
        labels: {
          category: m.category,
          importance: m.importance.toString(),
        }
      }
    }))
  };

  const result = await client.batchStore(batchRequest);
  return result;
}


╔══════════════════════════════════════════════════════════════════════════╗
║  USAGE EXAMPLES                                                           ║
╚══════════════════════════════════════════════════════════════════════════╝

1. Basic usage:
   <DemoLoader vaultId="my-vault" />

2. With completion callback:
   <DemoLoader 
     vaultId="my-vault" 
     onLoadComplete={() => toast.success('Demo data loaded!')}
   />

3. With custom styling:
   <DemoLoader 
     vaultId="my-vault" 
     className="w-full max-w-sm"
   />


╔══════════════════════════════════════════════════════════════════════════╗
║  FILES CREATED                                                            ║
╚══════════════════════════════════════════════════════════════════════════╝

✓ /home/node/.openclaw/workspace/agent-memory/app/src/demo/data.ts
✓ /home/node/.openclaw/workspace/agent-memory/app/src/demo/index.ts
✓ /home/node/.openclaw/workspace/agent-memory/app/src/components/DemoLoader.tsx
✓ /home/node/.openclaw/workspace/agent-memory/app/src/demo/INTEGRATION.md (this file)


╔══════════════════════════════════════════════════════════════════════════╗
║  NEXT STEPS                                                               ║
╚══════════════════════════════════════════════════════════════════════════╝

1. Follow STEP 1-3 to integrate DemoLoader into your UI
2. Test the demo data loading functionality
3. Customize demo memories in data.ts if needed
4. Add real SDK integration when backend is ready

For questions or support, refer to the AgentMemory SDK documentation.
*/

export {};
