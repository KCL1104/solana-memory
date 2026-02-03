'use client';

import React, { useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import { useAppInit } from '@/features/useAppInit';
import { NotificationContainer } from '@/features/ui/Notifications';
import { ThemeProvider } from '@/components/ThemeProvider';

// App initialization wrapper
function AppInit({ children }: { children: React.ReactNode }) {
  useAppInit();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Configure supported wallets - dynamically imported to avoid SSR issues
  const wallets = useMemo(
    () => {
      if (typeof window === 'undefined') return [];
      const { PhantomWalletAdapter } = require('@solana/wallet-adapter-phantom');
      const { SolflareWalletAdapter } = require('@solana/wallet-adapter-solflare');
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
      ];
    },
    []
  );

  return (
    <ThemeProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <AppInit>
              {children}
              <NotificationContainer />
            </AppInit>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}
