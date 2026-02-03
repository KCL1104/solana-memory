'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  return (
    <WalletMultiButton 
      className="!bg-blue-600 hover:!bg-blue-500 !rounded-lg !font-medium !transition-colors"
      style={{
        backgroundColor: '#2563eb',
        borderRadius: '0.5rem',
        fontWeight: 500,
        padding: '0.5rem 1.5rem',
      }}
    />
  );
}

export function useWalletConnection() {
  const wallet = useWallet();
  const { connection } = useConnection();
  
  return {
    wallet,
    connection,
    connected: wallet.connected,
    connecting: wallet.connecting,
    publicKey: wallet.publicKey,
    disconnect: wallet.disconnect,
  };
}
