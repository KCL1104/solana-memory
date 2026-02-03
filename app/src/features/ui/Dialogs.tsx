'use client';

import { useState, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { TransactionResult } from '@/lib/agentMemory';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  type = 'warning',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: 'border-[#ff4444] text-[#ff4444]',
    warning: 'border-[#fbbf24] text-[#fbbf24]',
    info: 'border-[#00d4ff] text-[#00d4ff]',
  };

  const buttonColors = {
    danger: 'border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444]/10',
    warning: 'border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/10',
    info: 'border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="retro-card w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${colors[type]}`} />
            <h3 className="text-lg font-display font-bold text-white tracking-wider">
              {title}
            </h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-[#888] text-sm leading-relaxed">{message}</p>
        </div>
        
        <div className="p-4 border-t border-[#222] flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-[#333] text-[#888] hover:border-[#666] hover:text-white transition-colors font-mono text-sm tracking-wider disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 border ${buttonColors[type]} transition-colors font-mono text-sm tracking-wider flex items-center gap-2 disabled:opacity-50`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TransactionStatusDialogProps {
  result: TransactionResult | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  successMessage?: string;
  errorMessage?: string;
  explorerUrl?: string;
}

export function TransactionStatusDialog({
  result,
  isOpen,
  onClose,
  title = 'TRANSACTION_STATUS',
  successMessage = 'Transaction completed successfully',
  errorMessage = 'Transaction failed',
  explorerUrl = 'https://explorer.solana.com/tx',
}: TransactionStatusDialogProps) {
  if (!isOpen || !result) return null;

  const isSuccess = result.success;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="retro-card w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[#222]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-bold text-white tracking-wider">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-[#666] hover:text-[#ff6b35] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center border ${
            isSuccess ? 'border-[#4ade80] text-[#4ade80]' : 'border-[#ff4444] text-[#ff4444]'
          }`}>
            {isSuccess ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>
          
          <p className={`text-lg font-mono ${isSuccess ? 'text-[#4ade80]' : 'text-[#ff4444]'}`}>
            {isSuccess ? 'SUCCESS' : 'FAILED'}
          </p>
          
          <p className="text-[#888] text-sm mt-2">
            {isSuccess ? successMessage : (result.error || errorMessage)}
          </p>
          
          {result.signature && (
            <div className="mt-4 p-3 bg-[#111] border border-[#222]">
              <p className="text-[10px] text-[#666] font-mono mb-1">SIGNATURE</p>
              <code className="text-xs text-[#888] font-mono block truncate">
                {result.signature}
              </code>
              <a
                href={`${explorerUrl}/${result.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#00d4ff] hover:underline mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                View on Explorer
              </a>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[#222] flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#333] text-[#888] hover:border-[#666] hover:text-white transition-colors font-mono text-sm tracking-wider"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for confirm dialog
export function useConfirm() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    resolve: null,
    title: '',
    message: '',
    type: 'warning',
  });

  const confirm = useCallback((
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info' = 'warning'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        resolve,
        title,
        message,
        type,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  return {
    confirm,
    dialogProps: {
      isOpen: dialogState.isOpen,
      title: dialogState.title,
      message: dialogState.message,
      type: dialogState.type,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
