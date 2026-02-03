import { useCallback } from 'react';
import { PublicKey, Signer } from '@solana/web3.js';
import { useAppStore, useVaultActions } from '../wallet/store';
import { AgentMemoryClient, generateEncryptionKey, TransactionResult } from '@/lib/agentMemory';
import { useWallet } from '@solana/wallet-adapter-react';

export interface CreateVaultParams {
  agentKey?: PublicKey;
  encryptionPubkey?: Uint8Array;
}

export function useVault() {
  const { client } = useAppStore();
  const { setVault, setProfile, setExists, setLoading, setError } = useVaultActions();
  const wallet = useWallet();

  const createVault = useCallback(async (params: CreateVaultParams = {}): Promise<TransactionResult> => {
    if (!client || !wallet.publicKey || !wallet.signTransaction) {
      return {
        signature: '',
        success: false,
        error: 'Wallet not connected',
      };
    }

    setLoading(true);
    setError(null);

    try {
      const owner = wallet.publicKey;
      // Use owner as agent key if not provided
      const agentKey = params.agentKey || owner;
      // Generate encryption key if not provided
      const encryptionPubkey = params.encryptionPubkey || generateEncryptionKey();

      // Create a signer object from wallet
      const signer: Signer = {
        publicKey: wallet.publicKey,
        secretKey: new Uint8Array(64), // Placeholder, actual signing happens via wallet adapter
      };

      const { vault, profile, result } = await client.initializeVault(
        owner,
        agentKey,
        encryptionPubkey,
        signer
      );

      if (result.success) {
        // Fetch and set vault data
        const vaultData = await client.getVault(vault);
        const profileData = await client.getAgentProfile(profile);
        
        if (vaultData) {
          setVault(vaultData);
        }
        if (profileData) {
          setProfile(profileData);
        }
        setExists(true);
      } else {
        setError(result.error || 'Failed to create vault');
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
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey, wallet.signTransaction, setVault, setProfile, setExists, setLoading, setError]);

  const checkVaultExists = useCallback(async (): Promise<boolean> => {
    if (!client || !wallet.publicKey) return false;

    setLoading(true);
    try {
      const owner = wallet.publicKey;
      const agentKey = owner; // Default to owner
      const exists = await client.vaultExists(owner, agentKey);
      setExists(exists);
      
      if (exists) {
        const [vaultPda] = client.findVaultPda(owner, agentKey);
        const [profilePda] = client.findProfilePda(agentKey);
        
        const vaultData = await client.getVault(vaultPda);
        const profileData = await client.getAgentProfile(profilePda);
        
        if (vaultData) setVault(vaultData);
        if (profileData) setProfile(profileData);
      }
      
      return exists;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey, setVault, setProfile, setExists, setLoading, setError]);

  const refreshVault = useCallback(async () => {
    if (!client || !wallet.publicKey) return;

    setLoading(true);
    try {
      const owner = wallet.publicKey;
      const agentKey = owner;
      
      const [vaultPda] = client.findVaultPda(owner, agentKey);
      const [profilePda] = client.findProfilePda(agentKey);
      
      const vaultData = await client.getVault(vaultPda);
      const profileData = await client.getAgentProfile(profilePda);
      
      if (vaultData) setVault(vaultData);
      if (profileData) setProfile(profileData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey, setVault, setProfile, setLoading, setError]);

  return {
    createVault,
    checkVaultExists,
    refreshVault,
  };
}
