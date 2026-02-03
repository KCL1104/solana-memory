'use client';

import { useEffect, useCallback } from 'react';
import { useNotifications, useNotificationActions, useTransactions } from '@/features/wallet/store';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const colors = {
  success: 'border-[#4ade80] text-[#4ade80] bg-[#4ade80]/10',
  error: 'border-[#ff4444] text-[#ff4444] bg-[#ff4444]/10',
  warning: 'border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/10',
  info: 'border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff]/10',
  loading: 'border-[#b829dd] text-[#b829dd] bg-[#b829dd]/10',
};

export function ToastContainer() {
  const notifications = useNotifications();
  const transactions = useTransactions();
  const { remove } = useNotificationActions();

  // Filter to only show the most recent 5 notifications
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {/* Transaction Status Notifications */}
      {transactions
        .filter(tx => tx.status === 'pending' || tx.status === 'success' || tx.status === 'error')
        .slice(0, 2)
        .map((tx) => (
          <TransactionToast 
            key={tx.id} 
            transaction={{
              ...tx,
              status: tx.status as 'pending' | 'success' | 'error'
            }}
          />
        ))}
      
      {/* Regular Notifications */}
      {recentNotifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onClose={() => remove(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'loading';
    title: string;
    message: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  onClose: () => void;
}

function ToastItem({ notification, onClose }: NotificationItemProps) {
  const Icon = icons[notification.type];
  const colorClass = colors[notification.type];

  useEffect(() => {
    if (notification.duration && notification.duration > 0 && notification.type !== 'loading') {
      const timer = setTimeout(onClose, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.type, onClose]);

  return (
    <div
      className={`p-4 border ${colorClass} shadow-lg animate-in slide-in-from-right-full duration-300 backdrop-blur-sm`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${notification.type === 'loading' ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <h4 className="font-mono font-bold text-sm text-white">{notification.title}</h4>
          <p className="text-xs text-[#aaa] mt-1 leading-relaxed">{notification.message}</p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-xs font-mono underline hover:no-underline opacity-80 hover:opacity-100 transition-opacity"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface TransactionToastProps {
  transaction: {
    id: string;
    status: 'pending' | 'success' | 'error';
    signature?: string;
    error?: string;
    description: string;
  };
}

function TransactionToast({ transaction }: TransactionToastProps) {
  const { update, remove } = useTransactionActions();

  // Simulate transaction completion for demo
  useEffect(() => {
    if (transaction.status === 'pending') {
      const timer = setTimeout(() => {
        // Randomly succeed or fail for demo purposes
        const success = Math.random() > 0.1;
        update(transaction.id, {
          status: success ? 'success' : 'error',
          signature: success ? `${Math.random().toString(36).substring(2, 15)}...` : undefined,
          error: success ? undefined : 'Transaction failed: Network congestion',
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [transaction.id, transaction.status, update]);

  const getExplorerUrl = (signature: string) => {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  };

  return (
    <div
      className={`p-4 border ${
        transaction.status === 'pending' ? colors.loading :
        transaction.status === 'success' ? colors.success :
        colors.error
      } shadow-lg animate-in slide-in-from-right-full duration-300 backdrop-blur-sm`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {transaction.status === 'pending' ? (
          <Loader2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin text-[#b829dd]" />
        ) : transaction.status === 'success' ? (
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#4ade80]" />
        ) : (
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#ff4444]" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-mono font-bold text-sm text-white">
            {transaction.status === 'pending' ? 'Transaction Pending' :
             transaction.status === 'success' ? 'Transaction Confirmed' :
             'Transaction Failed'}
          </h4>
          <p className="text-xs text-[#aaa] mt-1 leading-relaxed">{transaction.description}</p>
          {transaction.signature && (
            <a
              href={getExplorerUrl(transaction.signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs font-mono text-[#00d4ff] hover:underline flex items-center gap-1"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {transaction.error && (
            <p className="mt-2 text-xs text-[#ff4444]">{transaction.error}</p>
          )}
        </div>
        {transaction.status !== 'pending' && (
          <button
            onClick={() => remove(transaction.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Hook to show notifications
export function useNotify() {
  const { add } = useNotificationActions();
  const { add: addTransaction } = useTransactionActions();

  const notify = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    add({
      type,
      title,
      message,
      duration: options?.duration ?? (type === 'error' ? 8000 : 5000),
      action: options?.action,
    });
  }, [add]);

  const success = useCallback((title: string, message: string, options?: { duration?: number }) => {
    notify('success', title, message, options);
  }, [notify]);

  const error = useCallback((title: string, message: string, options?: { duration?: number }) => {
    notify('error', title, message, { ...options, duration: options?.duration ?? 8000 });
  }, [notify]);

  const warning = useCallback((title: string, message: string, options?: { duration?: number }) => {
    notify('warning', title, message, options);
  }, [notify]);

  const info = useCallback((title: string, message: string, options?: { duration?: number }) => {
    notify('info', title, message, options);
  }, [notify]);

  const loading = useCallback((title: string, message: string) => {
    notify('info', title, message, { duration: 0 }); // No auto-dismiss, use 'info' instead of 'loading'
  }, [notify]);

  // Transaction notification helper
  const transaction = useCallback((description: string) => {
    const id = `tx_${Date.now()}`;
    addTransaction({
      id,
      status: 'pending',
      description,
    });
    return id;
  }, [addTransaction]);

  return { success, error, warning, info, loading, transaction, notify };
}

// Import hook for transaction actions
import { useTransactionActions } from '@/features/wallet/store';
