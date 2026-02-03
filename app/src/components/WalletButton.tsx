'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const [isHovered, setIsHovered] = useState(false);

  if (connected && publicKey) {
    return (
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          className="flex items-center gap-3 px-5 py-3 border border-neon-orange bg-transparent hover:bg-neon-orange/10 transition-all duration-300 font-mono text-sm"
        >
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-neon-green" />
          <span className="text-neon-orange">
            {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
          </span>
          <ChevronDown className={`w-4 h-4 text-neon-orange transition-transform duration-300 ${isHovered ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Dropdown */}
        <div className={`absolute top-full right-0 mt-2 w-48 cyber-card transform transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'}`}>
          <div className="p-2">
            <div className="px-3 py-2 text-xs text-theme-text-muted font-mono border-b border-theme-border-primary mb-2">
              <span className="block truncate">{publicKey.toBase58()}</span>
            </div>
            <button
              onClick={disconnect}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neon-pink hover:bg-neon-pink/10 transition-colors font-mono"
            >
              <LogOut className="w-4 h-4" />
              DISCONNECT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WalletMultiButton 
      className="!bg-transparent !border !border-neon-orange !text-neon-orange !font-display !text-sm !font-semibold !tracking-wider !px-6 !py-3 !rounded-none hover:!bg-neon-orange/10 hover:!shadow-neon-orange !transition-all !duration-300"
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
