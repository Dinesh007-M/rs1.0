import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className,
  bodyClassName,
  headerClassName,
  id,
}) => {
  return (
    <div
      id={id}
      className={cn(
        'bg-slate-900/90 border border-slate-800 rounded-lg shadow-sm flex flex-col',
        className
      )}
    >
      {(title || headerAction) && (
        <div
          className={cn(
            'px-4 py-3 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0',
            headerClassName
          )}
        >
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-100 tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}
      <div className={cn('p-4 flex-1', bodyClassName)}>{children}</div>
    </div>
  );
};
