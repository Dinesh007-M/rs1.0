import React from 'react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subvalue?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
  id?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subvalue,
  change,
  isPositive,
  icon,
  variant = 'slate',
  className,
  id,
}) => {
  const accentBorders = {
    cyan: 'border-l-4 border-l-cyan-500',
    emerald: 'border-l-4 border-l-emerald-500',
    amber: 'border-l-4 border-l-amber-500',
    rose: 'border-l-4 border-l-rose-500',
    slate: 'border-l-4 border-l-slate-600',
  };

  return (
    <div
      id={id}
      className={cn(
        'bg-slate-900/90 border border-slate-800 p-4 rounded-lg flex items-start justify-between shadow-sm relative overflow-hidden',
        accentBorders[variant],
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase font-medium tracking-wider text-slate-400">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">{value}</span>
          {subvalue && <span className="text-xs text-slate-400 font-mono">{subvalue}</span>}
        </div>
        {change && (
          <p
            className={cn(
              'text-xs font-medium inline-flex items-center gap-1',
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{change}</span>
          </p>
        )}
      </div>

      {icon && (
        <div className="p-2 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
};
