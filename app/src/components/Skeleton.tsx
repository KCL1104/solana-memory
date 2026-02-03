'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 骨架屏變體
   */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /**
   * 動畫效果
   */
  animation?: 'pulse' | 'wave' | 'none';
  /**
   * 寬度
   */
  width?: string | number;
  /**
   * 高度
   */
  height?: string | number;
}

/**
 * 基礎骨架屏組件
 */
export function Skeleton({
  variant = 'text',
  animation = 'pulse',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-[#222] relative overflow-hidden';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  const styles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={styles}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * 文本骨架屏 - 多行
 */
interface TextSkeletonProps {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: string;
  className?: string;
}

export function TextSkeleton({
  lines = 3,
  lineHeight = 16,
  gap = 8,
  lastLineWidth = '60%',
  className,
}: TextSkeletonProps) {
  return (
    <div 
      className={cn('space-y-2', className)}
      style={{ gap: `${gap}px` }}
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * 卡片骨架屏
 */
interface CardSkeletonProps {
  hasImage?: boolean;
  imageHeight?: number;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  hasImage = true,
  imageHeight = 160,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div 
      className={cn('cyber-card p-0 overflow-hidden', className)}
      role="status"
      aria-label="Loading card"
    >
      {hasImage && (
        <Skeleton variant="rectangular" height={imageHeight} className="w-full" />
      )}
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="80%" height={20} />
        <TextSkeleton lines={lines} lineHeight={12} gap={6} />
      </div>
    </div>
  );
}

/**
 * 記憶列表骨架屏
 */
export function MemoryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading memories">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 border border-[#222] bg-[#0a0a0f] flex items-center gap-4"
          style={{
            opacity: 1 - i * 0.15,
          }}
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="text" width="60%" height={12} />
          </div>
          <Skeleton variant="text" width={60} height={12} />
        </div>
      ))}
    </div>
  );
}

/**
 * 記憶詳情骨架屏
 */
export function MemoryDetailSkeleton() {
  return (
    <div className="cyber-card p-6" role="status" aria-label="Loading memory details">
      <div className="flex items-start gap-4 mb-6">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton variant="rounded" height={100} className="w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton variant="text" height={14} />
          <Skeleton variant="text" height={14} />
          <Skeleton variant="text" height={14} />
          <Skeleton variant="text" height={14} />
        </div>
      </div>
    </div>
  );
}

/**
 * 儀表板骨架屏
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      {/* 標題區 */}
      <div className="flex items-center justify-between pb-6 border-b border-[#222]">
        <div className="space-y-2">
          <Skeleton variant="text" width={200} height={28} />
          <Skeleton variant="text" width={150} height={14} />
        </div>
        <Skeleton variant="rounded" width={120} height={36} />
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} hasImage={false} lines={2} />
        ))}
      </div>

      {/* 主內容區 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <CardSkeleton hasImage={false} lines={4} />
          <CardSkeleton hasImage={false} lines={3} />
        </div>
        <div className="lg:col-span-2">
          <MemoryListSkeleton count={5} />
        </div>
      </div>
    </div>
  );
}

/**
 * 表單骨架屏
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="rounded" height={44} className="w-full" />
        </div>
      ))}
      <Skeleton variant="rounded" height={44} className="w-full mt-6" />
    </div>
  );
}

/**
 * 頁面加載骨架屏
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#050508]" role="status" aria-label="Loading page">
      {/* 導航欄骨架 */}
      <div className="border-b border-[#1a1a25] h-[72px] flex items-center px-4 sm:px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="space-y-1">
              <Skeleton variant="text" width={140} height={20} />
              <Skeleton variant="text" width={100} height={10} />
            </div>
          </div>
          <Skeleton variant="rounded" width={120} height={36} />
        </div>
      </div>

      {/* 主內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <DashboardSkeleton />
      </div>
    </div>
  );
}

/**
 * 英雄區骨架屏
 */
export function HeroSkeleton() {
  return (
    <div className="relative py-20 lg:py-32 text-center" role="status" aria-label="Loading hero section">
      <div className="space-y-8">
        <Skeleton variant="rounded" width={200} height={32} className="mx-auto" />
        <div className="space-y-4">
          <Skeleton variant="text" width="70%" height={60} className="mx-auto max-w-2xl" />
          <Skeleton variant="text" width="50%" height={60} className="mx-auto max-w-xl" />
        </div>
        <Skeleton variant="text" width="60%" height={20} className="mx-auto max-w-lg" />
        <div className="flex justify-center gap-4 pt-4">
          <Skeleton variant="rounded" width={140} height={48} />
          <Skeleton variant="rounded" width={140} height={48} />
        </div>
      </div>
    </div>
  );
}
