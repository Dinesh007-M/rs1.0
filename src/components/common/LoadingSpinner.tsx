import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  id?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Ingesting real-time urban telemetry...',
  className,
  id,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      id={id}
      className={cn('flex flex-col items-center justify-center py-12 px-4 gap-3 text-slate-400', className)}
    >
      <Loader2 className={cn('animate-spin text-cyan-400', sizeMap[size])} />
      {label && <p className="text-xs font-mono tracking-wide text-slate-400">{label}</p>}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{
  rows?: number;
  className?: string;
  id?: string;
}> = ({ rows = 4, className, id }) => {
  return (
    <div id={id} className={cn('space-y-3 p-4 bg-slate-900/60 border border-slate-800 rounded-lg', className)}>
      <div className="h-4 bg-slate-800 rounded w-1/4 animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-9 bg-slate-800/60 rounded animate-pulse w-full"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
};
