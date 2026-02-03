'use client';

import { useEffect, useCallback } from 'react';
import { useNotifications, useNotificationActions } from '../wallet/store';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-[#4ade80] text-[#4ade80] bg-[#4ade80]/10',
  error: 'border-[#ff4444] text-[#ff4444] bg-[#ff4444]/10',
  warning: 'border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/10',
  info: 'border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff]/10',
};

export function NotificationContainer() {
  const notifications = useNotifications();
  const { remove } = useNotificationActions();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
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
    type: 'success' | 'error' | 'warning' | 'info';
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

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const Icon = icons[notification.type];
  const colorClass = colors[notification.type];

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(onClose, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onClose]);

  return (
    <div
      className={`p-4 border ${colorClass} shadow-lg animate-in slide-in-from-right duration-300`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-mono font-bold text-sm">{notification.title}</h4>
          <p className="text-xs text-[#888] mt-1">{notification.message}</p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-xs font-mono underline hover:no-underline opacity-80 hover:opacity-100"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Hook to show notifications
export function useNotify() {
  const { add } = useNotificationActions();

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
      duration: options?.duration ?? 5000,
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

  return { success, error, warning, info, notify };
}
