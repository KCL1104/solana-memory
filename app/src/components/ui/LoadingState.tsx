'use client';

import { motion } from 'framer-motion';

interface LoadingStateProps {
  type: 'card' | 'list' | 'page' | 'grid' | 'search';
  count?: number;
}

export function LoadingState({ type, count = 3 }: LoadingStateProps) {
  if (type === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="animate-pulse bg-[#0d0d12] border border-[#1a1a25] p-6"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-[#1a1a25] rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#1a1a25] rounded w-3/4" />
            <div className="h-3 bg-[#1a1a25] rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-[#1a1a25] rounded w-full mb-2" />
        <div className="h-3 bg-[#1a1a25] rounded w-2/3" />
      </motion.div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="animate-pulse bg-[#0d0d12] border border-[#1a1a25] p-4 flex items-center gap-4"
          >
            <div className="w-8 h-8 bg-[#1a1a25] rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[#1a1a25] rounded w-1/3" />
              <div className="h-2 bg-[#1a1a25] rounded w-1/4" />
            </div>
            <div className="w-16 h-6 bg-[#1a1a25] rounded" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="animate-pulse bg-[#0d0d12] border border-[#1a1a25] p-6"
          >
            <div className="w-12 h-12 bg-[#1a1a25] rounded mb-4" />
            <div className="h-4 bg-[#1a1a25] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[#1a1a25] rounded w-full mb-1" />
            <div className="h-3 bg-[#1a1a25] rounded w-2/3" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'search') {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-[#0d0d12] border border-[#1a1a25] p-4">
          <div className="h-10 bg-[#1a1a25] rounded w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-10 bg-[#1a1a25] rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Page loading
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <motion.div
        className="relative w-20 h-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 border-2 border-[#1a1a25]" />
        <div className="absolute inset-0 border-2 border-[#ff3d00] border-t-transparent" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-sm text-[#606070] font-mono tracking-wider"
      >
        INITIALIZING_SYSTEM...
      </motion.p>
    </div>
  );
}

// Shimmer loading effect for cards
export function ShimmerCard() {
  return (
    <div className="relative overflow-hidden bg-[#0d0d12] border border-[#1a1a25] p-6">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="space-y-3">
        <div className="h-4 bg-[#1a1a25] rounded w-3/4" />
        <div className="h-3 bg-[#1a1a25] rounded w-full" />
        <div className="h-3 bg-[#1a1a25] rounded w-2/3" />
      </div>
    </div>
  );
}

// Skeleton for memory items
export function MemorySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#1a1a25]">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="p-4 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#1a1a25] rounded flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-4 bg-[#1a1a25] rounded w-1/3" />
                <div className="h-5 bg-[#1a1a25] rounded w-16" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 bg-[#1a1a25] rounded w-20" />
                <div className="h-3 bg-[#1a1a25] rounded w-16" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 bg-[#1a1a25] rounded w-12" />
                <div className="h-5 bg-[#1a1a25] rounded w-14" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-20 h-20 border border-[#333] flex items-center justify-center mb-6"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-display font-bold text-[#666] mb-2 tracking-wider">{title}</h3>
      <p className="text-sm text-[#555] font-mono mb-6 max-w-xs">{description}</p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="px-6 py-2 border border-[#ff3d00] text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-colors font-mono text-sm tracking-wider"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
