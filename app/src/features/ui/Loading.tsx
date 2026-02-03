'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'cyan' | 'green' | 'purple';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const colorClasses = {
  orange: 'text-[#ff6b35]',
  cyan: 'text-[#00d4ff]',
  green: 'text-[#4ade80]',
  purple: 'text-[#b829dd]',
};

export function LoadingSpinner({ 
  size = 'md', 
  color = 'orange',
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
}

export function LoadingOverlay({ message = 'PROCESSING...', submessage }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-16 h-16 border-2 border-[#ff6b35]/20 border-t-[#ff6b35] rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-[#00d4ff] rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>
        <p className="text-[#ff6b35] font-mono text-lg tracking-wider animate-pulse">
          {message}
        </p>
        {submessage && (
          <p className="text-[#666] font-mono text-sm mt-2">
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: 'orange' | 'cyan' | 'green';
}

export function ProgressBar({ progress, label, color = 'orange' }: ProgressBarProps) {
  const colorClass = {
    orange: 'bg-[#ff6b35]',
    cyan: 'bg-[#00d4ff]',
    green: 'bg-[#4ade80]',
  }[color];

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs font-mono text-[#666] mb-1">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="h-2 bg-[#222] overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-[#222] ${className}`}
        />
      ))}
    </div>
  );
}
