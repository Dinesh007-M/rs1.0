import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
  id?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
  id,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div id={id} className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={cn(
            'w-screen bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col',
            widthStyles[width]
          )}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
            <div>
              <h3 className="text-base font-semibold text-slate-100">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
