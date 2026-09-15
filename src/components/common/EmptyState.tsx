import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
  id,
}) => {
  return (
    <div
      id={id}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg',
        className
      )}
    >
      <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
