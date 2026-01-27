import React from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  size = 'md',
  icon,
  className = ''
}) => {
  const variants = {
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>
      {icon}
      {children}
    </span>
  );
};

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'syncing' | 'error';
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  const config = {
    online: { color: 'bg-emerald-500', text: 'Online' },
    offline: { color: 'bg-red-500', text: 'Offline' },
    syncing: { color: 'bg-blue-500 animate-pulse', text: 'Syncing...' },
    error: { color: 'bg-red-500', text: 'Error' }
  };

  const { color, text } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {label || text}
      </span>
    </div>
  );
};
