'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Terminal } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 全局錯誤邊界組件
 * 捕獲 React 組件樹中的錯誤，防止應用崩潰
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 調用外部錯誤處理回調
    this.props.onError?.(error, errorInfo);

    // 發送錯誤到監控服務（如果有）
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      // 自定義 fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
          <div className="cyber-card max-w-2xl w-full p-8 md:p-12">
            {/* 錯誤圖標 */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 border-2 border-[#ff4444] flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-12 h-12 text-[#ff4444]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#ff4444] flex items-center justify-center">
                  <span className="text-[#050508] font-mono font-bold text-xs">!</span>
                </div>
              </div>
            </div>

            {/* 錯誤標題 */}
            <h1 className="text-3xl md:text-4xl font-display font-bold text-center text-white mb-4 tracking-wider">
              SYSTEM<span className="text-[#ff4444]">_ERROR</span>
            </h1>

            {/* 錯誤描述 */}
            <p className="text-center text-[#888] mb-8 max-w-md mx-auto">
              系統遇到意外錯誤。我們已記錄此問題，請嘗試重新加載頁面。
            </p>

            {/* 錯誤詳情（僅開發環境顯示） */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-4 bg-[#0a0a0f] border border-[#222] overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-4 h-4 text-[#ff6b35]" />
                  <span className="text-[#ff6b35] text-xs font-mono tracking-wider">ERROR_DETAILS</span>
                </div>
                <div className="font-mono text-xs text-[#ff4444] overflow-x-auto">
                  <p className="mb-2">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="text-[#666] whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="cyber-btn group flex items-center justify-center gap-2 px-6 py-3"
              >
                <RefreshCw className="w-4 h-4 group-hover:animate-spin" />
                <span>重新加載</span>
              </button>
              
              <Link
                href="/"
                onClick={this.handleReset}
                className="cyber-btn cyber-btn-cyan flex items-center justify-center gap-2 px-6 py-3"
              >
                <Home className="w-4 h-4" />
                <span>返回首頁</span>
              </Link>
            </div>

            {/* 錯誤代碼 */}
            <div className="mt-8 text-center">
              <code className="text-[10px] text-[#444] font-mono">
                ERR_CODE: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </code>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 局部錯誤邊界 - 用於特定組件區域
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
  onRetry?: () => void;
}

export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error(`Error in section ${this.props.sectionName}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onRetry?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="cyber-card p-6 border-[#ff4444]/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#ff4444]" />
            <h3 className="text-sm font-mono text-[#ff4444]">
              {this.props.sectionName}_ERROR
            </h3>
          </div>
          <p className="text-xs text-[#666] mb-4">
            此區塊加載失敗，請重試或刷新頁面
          </p>
          <button
            onClick={this.handleRetry}
            className="cyber-btn text-xs px-4 py-2"
          >
            <RefreshCw className="w-3 h-3 inline mr-2" />
            重試
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 異步錯誤處理 Hook
 */
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
    
    // 可以擴展為發送到錯誤追蹤服務
    return {
      message: errorMessage,
      timestamp: Date.now(),
      context,
    };
  };

  const wrapAsync = async <T,>(
    fn: () => Promise<T>,
    options?: {
      onError?: (error: unknown) => void;
      fallback?: T;
      context?: string;
    }
  ): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, options?.context);
      options?.onError?.(error);
      return options?.fallback;
    }
  };

  return { handleError, wrapAsync };
}
