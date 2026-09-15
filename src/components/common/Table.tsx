import React from 'react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  id?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  className,
  emptyMessage = 'No records found matching current query.',
  id,
}: TableProps<T>) {
  return (
    <div id={id} className={cn('w-full overflow-x-auto border border-slate-800 rounded-lg', className)}>
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-900/90 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800 tracking-wider">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const isClickable = Boolean(onRowClick);
              return (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'transition-colors',
                    isClickable
                      ? 'cursor-pointer hover:bg-slate-800/50 active:bg-slate-800/80'
                      : 'hover:bg-slate-900/30'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-slate-200', col.className)}>
                      {col.render
                        ? col.render(item)
                        : (item as Record<string, unknown>)[col.key]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
