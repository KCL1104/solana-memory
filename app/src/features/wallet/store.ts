import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PublicKey, Connection } from '@solana/web3.js';
import { AgentMemoryClient, MemoryVault, MemoryShard, AgentProfile, TransactionResult } from '@/lib/agentMemory';

// Transaction status types
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

export interface TransactionState {
  id: string;
  status: TransactionStatus;
  signature?: string;
  error?: string;
  timestamp: number;
  description: string;
}

// Wallet connection state
interface WalletState {
  connected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  disconnecting: boolean;
}

// Vault state
interface VaultState {
  vault: MemoryVault | null;
  profile: AgentProfile | null;
  exists: boolean;
  loading: boolean;
  error: string | null;
}

// Memory cache state
interface MemoryCache {
  memories: Map<string, MemoryShard>;
  lastFetch: number;
  isStale: boolean;
}

// Main store state
interface AppState {
  // Wallet
  wallet: WalletState;
  setWalletConnected: (connected: boolean, publicKey: PublicKey | null) => void;
  setWalletConnecting: (connecting: boolean) => void;
  setWalletDisconnecting: (disconnecting: boolean) => void;

  // Vault
  vault: VaultState;
  setVault: (vault: MemoryVault | null) => void;
  setProfile: (profile: AgentProfile | null) => void;
  setVaultExists: (exists: boolean) => void;
  setVaultLoading: (loading: boolean) => void;
  setVaultError: (error: string | null) => void;
  resetVault: () => void;

  // Memories
  memories: MemoryCache;
  addMemory: (key: string, memory: MemoryShard) => void;
  removeMemory: (key: string) => void;
  updateMemory: (key: string, memory: MemoryShard) => void;
  setMemories: (memories: MemoryShard[]) => void;
  markMemoriesStale: () => void;
  clearMemories: () => void;

  // Transactions
  transactions: TransactionState[];
  addTransaction: (transaction: Omit<TransactionState, 'timestamp'>) => void;
  updateTransaction: (id: string, updates: Partial<TransactionState>) => void;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;
  getPendingTransactions: () => TransactionState[];

  // Client
  client: AgentMemoryClient | null;
  setClient: (client: AgentMemoryClient | null) => void;

  // UI State
  isInitializing: boolean;
  setIsInitializing: (value: boolean) => void;
  
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Create store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Wallet initial state
      wallet: {
        connected: false,
        publicKey: null,
        connecting: false,
        disconnecting: false,
      },
      setWalletConnected: (connected, publicKey) => 
        set((state) => ({ 
          wallet: { ...state.wallet, connected, publicKey } 
        })),
      setWalletConnecting: (connecting) => 
        set((state) => ({ 
          wallet: { ...state.wallet, connecting } 
        })),
      setWalletDisconnecting: (disconnecting) => 
        set((state) => ({ 
          wallet: { ...state.wallet, disconnecting } 
        })),

      // Vault initial state
      vault: {
        vault: null,
        profile: null,
        exists: false,
        loading: false,
        error: null,
      },
      setVault: (vault) => 
        set((state) => ({ 
          vault: { ...state.vault, vault, exists: !!vault } 
        })),
      setProfile: (profile) => 
        set((state) => ({ 
          vault: { ...state.vault, profile } 
        })),
      setVaultExists: (exists) => 
        set((state) => ({ 
          vault: { ...state.vault, exists } 
        })),
      setVaultLoading: (loading) => 
        set((state) => ({ 
          vault: { ...state.vault, loading } 
        })),
      setVaultError: (error) => 
        set((state) => ({ 
          vault: { ...state.vault, error } 
        })),
      resetVault: () => 
        set((state) => ({ 
          vault: { 
            vault: null, 
            profile: null, 
            exists: false, 
            loading: false, 
            error: null 
          } 
        })),

      // Memories initial state
      memories: {
        memories: new Map(),
        lastFetch: 0,
        isStale: true,
      },
      addMemory: (key, memory) => 
        set((state) => {
          const newMemories = new Map(state.memories.memories);
          newMemories.set(key, memory);
          return { 
            memories: { 
              ...state.memories, 
              memories: newMemories 
            } 
          };
        }),
      removeMemory: (key) => 
        set((state) => {
          const newMemories = new Map(state.memories.memories);
          newMemories.delete(key);
          return { 
            memories: { 
              ...state.memories, 
              memories: newMemories 
            } 
          };
        }),
      updateMemory: (key, memory) => 
        set((state) => {
          const newMemories = new Map(state.memories.memories);
          newMemories.set(key, memory);
          return { 
            memories: { 
              ...state.memories, 
              memories: newMemories 
            } 
          };
        }),
      setMemories: (memoriesArray) => 
        set((state) => {
          const newMemories = new Map();
          memoriesArray.forEach(memory => {
            newMemories.set(memory.key, memory);
          });
          return { 
            memories: { 
              memories: newMemories, 
              lastFetch: Date.now(), 
              isStale: false 
            } 
          };
        }),
      markMemoriesStale: () => 
        set((state) => ({ 
          memories: { ...state.memories, isStale: true } 
        })),
      clearMemories: () => 
        set((state) => ({ 
          memories: { 
            memories: new Map(), 
            lastFetch: 0, 
            isStale: true 
          } 
        })),

      // Transactions initial state
      transactions: [],
      addTransaction: (transaction) => 
        set((state) => ({ 
          transactions: [
            { ...transaction, timestamp: Date.now() },
            ...state.transactions.slice(0, 49), // Keep last 50
          ] 
        })),
      updateTransaction: (id, updates) => 
        set((state) => ({ 
          transactions: state.transactions.map(tx => 
            tx.id === id ? { ...tx, ...updates } : tx
          ) 
        })),
      removeTransaction: (id) => 
        set((state) => ({ 
          transactions: state.transactions.filter(tx => tx.id !== id) 
        })),
      clearTransactions: () => set({ transactions: [] }),
      getPendingTransactions: () => {
        return get().transactions.filter(tx => tx.status === 'pending');
      },

      // Client
      client: null,
      setClient: (client) => set({ client }),

      // UI State
      isInitializing: false,
      setIsInitializing: (value) => set({ isInitializing: value }),

      // Notifications
      notifications: [],
      addNotification: (notification) => 
        set((state) => ({ 
          notifications: [
            { 
              ...notification, 
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now() 
            },
            ...state.notifications.slice(0, 9), // Keep last 10
          ] 
        })),
      removeNotification: (id) => 
        set((state) => ({ 
          notifications: state.notifications.filter(n => n.id !== id) 
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'agent-memory-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist wallet connection status, not sensitive data
        wallet: {
          connected: state.wallet.connected,
          publicKey: state.wallet.publicKey?.toBase58() || null,
          connecting: false,
          disconnecting: false,
        },
        // Don't persist sensitive transaction data
        transactions: [],
      }),
    }
  )
);

// Helper hooks for specific slices
export const useWalletState = () => useAppStore((state) => state.wallet);
export const useVaultState = () => useAppStore((state) => state.vault);
export const useMemories = () => {
  const memories = useAppStore((state) => state.memories);
  return {
    memories: Array.from(memories.memories.values()),
    lastFetch: memories.lastFetch,
    isStale: memories.isStale,
  };
};
export const useTransactions = () => useAppStore((state) => state.transactions);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useAppClient = () => useAppStore((state) => state.client);

// Actions
export const useWalletActions = () => {
  const store = useAppStore();
  return {
    setConnected: store.setWalletConnected,
    setConnecting: store.setWalletConnecting,
    setDisconnecting: store.setWalletDisconnecting,
  };
};

export const useVaultActions = () => {
  const store = useAppStore();
  return {
    setVault: store.setVault,
    setProfile: store.setProfile,
    setExists: store.setVaultExists,
    setLoading: store.setVaultLoading,
    setError: store.setVaultError,
    reset: store.resetVault,
  };
};

export const useMemoryActions = () => {
  const store = useAppStore();
  return {
    add: store.addMemory,
    remove: store.removeMemory,
    update: store.updateMemory,
    setAll: store.setMemories,
    markStale: store.markMemoriesStale,
    clear: store.clearMemories,
  };
};

export const useTransactionActions = () => {
  const store = useAppStore();
  return {
    add: store.addTransaction,
    update: store.updateTransaction,
    remove: store.removeTransaction,
    clear: store.clearTransactions,
    getPending: store.getPendingTransactions,
  };
};

export const useNotificationActions = () => {
  const store = useAppStore();
  return {
    add: store.addNotification,
    remove: store.removeNotification,
    clear: store.clearNotifications,
  };
};
