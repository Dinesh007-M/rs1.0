import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  id,
}) => {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
    danger: 'bg-rose-950/70 text-rose-300 border-rose-700/60',
    info: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60',
    purple: 'bg-purple-950/70 text-purple-300 border-purple-700/60',
    neutral: 'bg-slate-900 text-slate-400 border-slate-800',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400 animate-pulse',
    info: 'bg-cyan-400',
    purple: 'bg-purple-400',
    neutral: 'bg-slate-500',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      id={id}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded border tracking-wide whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
