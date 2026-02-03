import { useCallback } from 'react';
import { PublicKey, Signer } from '@solana/web3.js';
import { useAppStore, useMemoryActions } from '../wallet/store';
import { AgentMemoryClient, MemoryMetadata, MemoryShard, TransactionResult, hashContent } from '@/lib/agentMemory';
import { useWallet } from '@solana/wallet-adapter-react';

export interface StoreMemoryParams {
  key: string;
  content: string;
  metadata: MemoryMetadata;
  vault: PublicKey;
  isEncrypted?: boolean;
}

export interface DeleteMemoryParams {
  key: string;
  vault: PublicKey;
}

export function useMemory() {
  const { client } = useAppStore();
  const { add, remove, update, setAll, markStale } = useMemoryActions();
  const wallet = useWallet();

  const storeMemory = useCallback(async (params: StoreMemoryParams): Promise<TransactionResult> => {
    if (!client || !wallet.publicKey || !wallet.signTransaction) {
      return {
        signature: '',
        success: false,
        error: 'Wallet not connected',
      };
    }

    try {
      const owner = wallet.publicKey;
      const contentHash = await hashContent(params.content);
      const contentSize = new Blob([params.content]).size;

      // Create signer
      const signer: Signer = {
        publicKey: wallet.publicKey,
        secretKey: new Uint8Array(64),
      };

      const { memoryPda, result } = await client.storeMemory(
        owner,
        params.vault,
        params.key,
        contentHash,
        contentSize,
        params.metadata,
        signer,
        params.isEncrypted ?? true
      );

      if (result.success) {
        // Fetch the stored memory
        const memoryData = await client.getMemoryShard(memoryPda);
        if (memoryData) {
          add(params.key, memoryData);
        }
        markStale();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        signature: '',
        success: false,
        error: errorMessage,
      };
    }
  }, [client, wallet.publicKey, wallet.signTransaction, add, markStale]);

  const deleteMemory = useCallback(async (params: DeleteMemoryParams): Promise<TransactionResult> => {
    if (!client || !wallet.publicKey || !wallet.signTransaction) {
      return {
        signature: '',
        success: false,
        error: 'Wallet not connected',
      };
    }

    try {
      const owner = wallet.publicKey;

      // Create signer
      const signer: Signer = {
        publicKey: wallet.publicKey,
        secretKey: new Uint8Array(64),
      };

      const result = await client.deleteMemory(
        owner,
        params.vault,
        params.key,
        signer
      );

      if (result.success) {
        remove(params.key);
        markStale();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        signature: '',
        success: false,
        error: errorMessage,
      };
    }
  }, [client, wallet.publicKey, wallet.signTransaction, remove, markStale]);

  const updateMemory = useCallback(async (params: StoreMemoryParams): Promise<TransactionResult> => {
    if (!client || !wallet.publicKey || !wallet.signTransaction) {
      return {
        signature: '',
        success: false,
        error: 'Wallet not connected',
      };
    }

    try {
      const owner = wallet.publicKey;
      const contentHash = await hashContent(params.content);
      const contentSize = new Blob([params.content]).size;

      // Create signer
      const signer: Signer = {
        publicKey: wallet.publicKey,
        secretKey: new Uint8Array(64),
      };

      const { memoryPda, result } = await client.updateMemory(
        owner,
        params.vault,
        params.key,
        contentHash,
        contentSize,
        params.metadata,
        signer
      );

      if (result.success) {
        // Fetch the updated memory
        const memoryData = await client.getMemoryShard(memoryPda);
        if (memoryData) {
          update(params.key, memoryData);
        }
        markStale();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        signature: '',
        success: false,
        error: errorMessage,
      };
    }
  }, [client, wallet.publicKey, wallet.signTransaction, update, markStale]);

  const fetchMemories = useCallback(async (vault: PublicKey): Promise<MemoryShard[]> => {
    if (!client) return [];

    try {
      const memoryAddresses = await client.listMemories(vault);
      const memories = await client.getMultipleMemoryShards(memoryAddresses);
      const validMemories = memories.filter((m): m is MemoryShard => m !== null);
      setAll(validMemories);
      return validMemories;
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      return [];
    }
  }, [client, setAll]);

  const getMemory = useCallback(async (memoryPda: PublicKey): Promise<MemoryShard | null> => {
    if (!client) return null;
    return await client.getMemoryShard(memoryPda);
  }, [client]);

  return {
    storeMemory,
    deleteMemory,
    updateMemory,
    fetchMemories,
    getMemory,
  };
}
