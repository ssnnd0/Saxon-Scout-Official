import React from 'react';

export const Skeleton: React.FC<{ width?: string; height?: string; className?: string }> = ({
  width = 'w-full',
  height = 'h-4',
  className = ''
}) => (
  <div
    className={`${width} ${height} bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 rounded-lg animate-pulse ${className}`}
  />
);

export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="bg-white dark:bg-obsidian-light rounded-2xl p-6 space-y-4">
    <Skeleton width="w-2/3" height="h-6" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="h-4" width={i === lines - 1 ? 'w-1/2' : 'w-full'} />
    ))}
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} height="h-12" />
    ))}
  </div>
);
