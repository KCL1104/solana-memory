'use client';

import { useWalletConnection } from '@solana/react-hooks';

export function WalletButton() {
  const { wallet, connected, connecting, connect, disconnect } = useWalletConnection();

  if (connected && wallet) {
    return (
      <button
        onClick={disconnect}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
      >
        {wallet.accounts[0]?.address.slice(0, 6)}...{wallet.accounts[0]?.address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={connecting}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg font-medium transition-colors"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
