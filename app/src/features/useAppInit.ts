'use client';

import { useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AgentMemoryClient, AGENT_MEMORY_PROGRAM_ID } from '@/lib/agentMemory';
import { 
  useAppStore, 
  useWalletActions, 
  useVaultActions,
  useMemoryActions,
} from './wallet/store';
import { useNotify } from './ui/Notifications';

export function useAppInit() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setConnected, setConnecting, setDisconnecting } = useWalletActions();
  const { reset: resetVault, setExists } = useVaultActions();
  const { clear: clearMemories } = useMemoryActions();
  const { setClient, client } = useAppStore();
  const notify = useNotify();

  // Initialize client when connection changes
  useEffect(() => {
    if (connection && !client) {
      const newClient = new AgentMemoryClient(connection, AGENT_MEMORY_PROGRAM_ID);
      setClient(newClient);
    }
  }, [connection, client, setClient]);

  // Handle wallet state changes
  useEffect(() => {
    setConnected(wallet.connected, wallet.publicKey);
    setConnecting(wallet.connecting);
    setDisconnecting(wallet.disconnecting);
  }, [wallet.connected, wallet.publicKey, wallet.connecting, wallet.disconnecting, setConnected, setConnecting, setDisconnecting]);

  // Check vault existence when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey && client) {
      checkVault();
    }
  }, [wallet.connected, wallet.publicKey, client]);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!wallet.connected && !wallet.connecting) {
      resetVault();
      clearMemories();
    }
  }, [wallet.connected, wallet.connecting, resetVault, clearMemories]);

  const checkVault = useCallback(async () => {
    if (!client || !wallet.publicKey) return;

    try {
      const owner = wallet.publicKey;
      const agentKey = owner; // Default to owner
      const exists = await client.vaultExists(owner, agentKey);
      setExists(exists);

      if (exists) {
        // Fetch vault and profile data
        const [vaultPda] = client.findVaultPda(owner, agentKey);
        const [profilePda] = client.findProfilePda(agentKey);
        
        const vaultData = await client.getVault(vaultPda);
        const profileData = await client.getAgentProfile(profilePda);
        
        // Update store
        const { setVault, setProfile } = useAppStore.getState();
        if (vaultData) setVault(vaultData);
        if (profileData) setProfile(profileData);
      }
    } catch (error) {
      console.error('Failed to check vault:', error);
      notify.error('Vault Check Failed', 'Failed to check vault existence');
    }
  }, [client, wallet.publicKey, setExists, notify]);

  const refreshAll = useCallback(async () => {
    if (!client || !wallet.publicKey) {
      notify.error('Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      const owner = wallet.publicKey;
      const agentKey = owner;
      
      const [vaultPda] = client.findVaultPda(owner, agentKey);
      const [profilePda] = client.findProfilePda(agentKey);

      // Fetch vault data
      const vaultData = await client.getVault(vaultPda);
      const profileData = await client.getAgentProfile(profilePda);
      
      const { setVault, setProfile } = useAppStore.getState();
      if (vaultData) setVault(vaultData);
      if (profileData) setProfile(profileData);

      // Fetch memories if vault exists
      if (vaultData) {
        const memoryAddresses = await client.listMemories(vaultPda);
        if (memoryAddresses.length > 0) {
          const memories = await client.getMultipleMemoryShards(memoryAddresses);
          const { setMemories } = useAppStore.getState();
          setMemories(memories.filter((m): m is NonNullable<typeof m> => m !== null));
        }
      }

      notify.success('Refreshed', 'Data refreshed successfully');
    } catch (error) {
      notify.error('Refresh Failed', 'Failed to refresh data');
    }
  }, [client, wallet.publicKey, notify]);

  return {
    isReady: !!client && wallet.connected,
    refreshAll,
  };
}
