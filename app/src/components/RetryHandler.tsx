'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, WifiOff, AlertCircle } from 'lucide-react';

interface RetryConfig {
  /** 最大重試次數 */
  maxRetries?: number;
  /** 重試延遲（毫秒） */
  retryDelay?: number;
  /** 延遲倍增因子 */
  backoffMultiplier?: number;
  /** 最大延遲 */
  maxDelay?: number;
}

const defaultConfig: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
};

interface UseRetryOptions<T> extends RetryConfig {
  /** 要執行的異步函數 */
  fn: () => Promise<T>;
  /** 成功回調 */
  onSuccess?: (data: T) => void;
  /** 錯誤回調 */
  onError?: (error: Error, retryCount: number) => void;
  /** 是否立即執行 */
  immediate?: boolean;
}

interface RetryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  retryCount: number;
  isRetrying: boolean;
}

/**
 * 重試 Hook
 */
export function useRetry<T>(options: UseRetryOptions<T>) {
  const config = { ...defaultConfig, ...options };
  const [state, setState] = useState<RetryState<T>>({
    data: null,
    error: null,
    isLoading: options.immediate !== false,
    retryCount: 0,
    isRetrying: false,
  });

  const execute = useCallback(async (isRetry = false) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isRetrying: isRetry,
    }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const data = await options.fn();
        setState({
          data,
          error: null,
          isLoading: false,
          retryCount: attempt,
          isRetrying: false,
        });
        options.onSuccess?.(data);
        return { success: true, data };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < config.maxRetries) {
          // 計算退避延遲
          const delay = Math.min(
            config.retryDelay * Math.pow(config.backoffMultiplier, attempt),
            config.maxDelay
          );
          
          setState(prev => ({
            ...prev,
            retryCount: attempt + 1,
          }));
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 所有重試都失敗了
    setState({
      data: null,
      error: lastError,
      isLoading: false,
      retryCount: config.maxRetries,
      isRetrying: false,
    });
    
    options.onError?.(lastError!, config.maxRetries);
    return { success: false, error: lastError };
  }, [options.fn, config, options.onSuccess, options.onError]);

  const retry = useCallback(() => {
    return execute(true);
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      retryCount: 0,
      isRetrying: false,
    });
  }, []);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
  };
}

/**
 * 網絡狀態監控
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const updateConnectionStatus = () => {
      const conn = (navigator as any).connection;
      if (conn) {
        setConnectionType(conn.effectiveType || 'unknown');
        setIsSlowConnection(conn.saveData || conn.effectiveType?.includes('2g'));
      }
    };

    setIsOnline(navigator.onLine);
    updateConnectionStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', updateConnectionStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  return { isOnline, connectionType, isSlowConnection };
}

/**
 * 錯誤重試組件
 */
interface ErrorRetryProps {
  children: React.ReactNode;
  /** 錯誤時顯示的內容 */
  error?: Error | null;
  /** 是否正在加載 */
  isLoading?: boolean;
  /** 是否正在重試 */
  isRetrying?: boolean;
  /** 重試次數 */
  retryCount?: number;
  /** 最大重試次數 */
  maxRetries?: number;
  /** 重試回調 */
  onRetry?: () => void;
  /** 自定義錯誤渲染 */
  renderError?: (props: { error: Error; onRetry: () => void; retryCount: number }) => React.ReactNode;
  /** 自定義加載渲染 */
  renderLoading?: () => React.ReactNode;
}

export function ErrorRetry({
  children,
  error,
  isLoading,
  isRetrying,
  retryCount = 0,
  maxRetries = 3,
  onRetry,
  renderError,
  renderLoading,
}: ErrorRetryProps) {
  if (isLoading) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className={`w-6 h-6 text-[#ff6b35] ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying && (
          <span className="ml-3 text-sm text-[#888] font-mono">
            重試中... ({retryCount}/{maxRetries})
          </span>
        )}
      </div>
    );
  }

  if (error) {
    if (renderError) {
      return <>{renderError({ error, onRetry: onRetry || (() => {}), retryCount })}</>;
    }

    return (
      <div className="cyber-card p-6 text-center">
        <AlertCircle className="w-10 h-10 text-[#ff4444] mx-auto mb-4" />
        <h3 className="text-lg font-display font-bold text-white mb-2">
          加載失敗
        </h3>
        <p className="text-sm text-[#888] mb-4">
          {error.message || '發生未知錯誤，請重試'}
        </p>
        {retryCount >= maxRetries ? (
          <p className="text-xs text-[#666] mb-4">
            已達最大重試次數，請檢查網絡連接後重試
          </p>
        ) : null}
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="cyber-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 inline mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? '重試中...' : '重試'}
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 離線提示組件
 */
export function OfflineNotice() {
  const { isOnline } = useNetworkStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // 恢復在線後延遲隱藏
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 border font-mono text-sm transition-all duration-300 ${
        isOnline
          ? 'bg-[#4ade80]/10 border-[#4ade80] text-[#4ade80]'
          : 'bg-[#ff4444]/10 border-[#ff4444] text-[#ff4444]'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>{isOnline ? '網絡已恢復' : '網絡連接已斷開'}</span>
      </div>
    </div>
  );
}

/**
 * 數據獲取組件（帶重試）
 */
interface DataFetcherProps<T> {
  /** 數據獲取函數 */
  fetcher: () => Promise<T>;
  /** 成功渲染 */
  render: (data: T) => React.ReactNode;
  /** 重試配置 */
  retryConfig?: RetryConfig;
  /** 緩存鍵（用於本地緩存） */
  cacheKey?: string;
  /** 緩存時間（毫秒） */
  cacheTime?: number;
}

export function DataFetcher<T>({
  fetcher,
  render,
  retryConfig,
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5分鐘
}: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const config = { ...defaultConfig, ...retryConfig };

  const fetchData = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // 檢查緩存
      if (cacheKey && !isRetry) {
        const cached = localStorage.getItem(`cache_${cacheKey}`);
        if (cached) {
          try {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < cacheTime) {
              setData(cachedData);
              setIsLoading(false);
              setIsRetrying(false);
              return;
            }
          } catch {
            // 緩存解析失敗，繼續獲取
          }
        }
      }

      const result = await fetcher();
      setData(result);

      // 保存緩存
      if (cacheKey) {
        localStorage.setItem(
          `cache_${cacheKey}`,
          JSON.stringify({ data: result, timestamp: Date.now() })
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [fetcher, cacheKey, cacheTime]);

  const retry = useCallback(() => {
    if (retryCount < config.maxRetries) {
      fetchData(true);
    }
  }, [fetchData, retryCount, config.maxRetries]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#888] font-mono text-sm">加載中...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorRetry
        error={error}
        onRetry={retry}
        isRetrying={isRetrying}
        retryCount={retryCount}
        maxRetries={config.maxRetries}
      />
    );
  }

  if (data) {
    return (
      <>
        {error && (
          <div className="mb-4 p-3 bg-[#ff4444]/10 border border-[#ff4444]/30 text-[#ff4444] text-sm">
            數據可能已過期，請刷新頁面
          </div>
        )}
        {render(data)}
      </>
    );
  }

  return null;
}

/**
 * 降級組件 - 當主要功能失敗時顯示備用內容
 */
interface FallbackProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  /** 條件判斷函數 */
  condition?: boolean | (() => boolean);
}

export function Fallback({ children, fallback, condition }: FallbackProps) {
  const shouldShowFallback = typeof condition === 'function' 
    ? condition() 
    : condition;

  if (shouldShowFallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * 漸進式加載組件
 */
interface ProgressiveLoadProps {
  children: React.ReactNode;
  /** 優先級：高優先級立即加載，低優先級延遲加載 */
  priority?: 'high' | 'low';
  /** 延遲時間（毫秒） */
  delay?: number;
  /** 佔位組件 */
  placeholder?: React.ReactNode;
}

export function ProgressiveLoad({
  children,
  priority = 'low',
  delay = 200,
  placeholder,
}: ProgressiveLoadProps) {
  const [shouldRender, setShouldRender] = useState(priority === 'high');

  useEffect(() => {
    if (priority === 'low') {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [priority, delay]);

  if (!shouldRender) {
    return <>{placeholder || <div className="min-h-[100px]" />}</>;
  }

  return <>{children}</>;
}
