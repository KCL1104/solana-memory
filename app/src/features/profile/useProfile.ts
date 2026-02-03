import { useCallback } from 'react';
import { PublicKey, Signer } from '@solana/web3.js';
import { useAppStore, useVaultActions } from '../wallet/store';
import { AgentMemoryClient, TransactionResult } from '@/lib/agentMemory';
import { useWallet } from '@solana/wallet-adapter-react';

export interface UpdateProfileParams {
  profile: PublicKey;
  agentKey?: PublicKey;
  updates: {
    name?: string;
    capabilities?: string[];
    isPublic?: boolean;
  };
}

export function useProfile() {
  const { client } = useAppStore();
  const { setProfile, setError } = useVaultActions();
  const wallet = useWallet();

  const updateProfile = useCallback(async (params: UpdateProfileParams): Promise<TransactionResult> => {
    if (!client || !wallet.publicKey || !wallet.signTransaction) {
      return {
        signature: '',
        success: false,
        error: 'Wallet not connected',
      };
    }

    try {
      const owner = wallet.publicKey;
      const agentKey = params.agentKey || owner;

      // Create signer
      const signer: Signer = {
        publicKey: wallet.publicKey,
        secretKey: new Uint8Array(64),
      };

      const result = await client.updateProfile(
        agentKey,
        owner,
        params.profile,
        params.updates,
        signer
      );

      if (result.success) {
        // Fetch updated profile
        const profileData = await client.getAgentProfile(params.profile);
        if (profileData) {
          setProfile(profileData);
        }
      } else {
        setError(result.error || 'Failed to update profile');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return {
        signature: '',
        success: false,
        error: errorMessage,
      };
    }
  }, [client, wallet.publicKey, wallet.signTransaction, setProfile, setError]);

  const fetchProfile = useCallback(async (profilePda: PublicKey) => {
    if (!client) return null;

    try {
      const profileData = await client.getAgentProfile(profilePda);
      if (profileData) {
        setProfile(profileData);
      }
      return profileData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return null;
    }
  }, [client, setProfile, setError]);

  return {
    updateProfile,
    fetchProfile,
  };
}
