import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemeMode } from '../../types';
import { Palette, Sun, Moon, Shield, Zap, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ThemeOption {
  id: ThemeMode;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colors: {
    bg: string;
    card: string;
    accent: string;
    border: string;
  };
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'bharat-navy',
    name: 'Bharat Navy',
    subtitle: 'Indian Smart City Command',
    icon: Shield,
    colors: {
      bg: '#070d1e',
      card: '#0d1730',
      accent: '#38bdf8',
      border: '#1d3363',
    },
  },
  {
    id: 'civic-light',
    name: 'Civic Day Light',
    subtitle: 'Executive High-Contrast Day',
    icon: Sun,
    colors: {
      bg: '#f1f5f9',
      card: '#ffffff',
      accent: '#2563eb',
      border: '#cbd5e1',
    },
  },
  {
    id: 'tactical-emerald',
    name: 'Tactical Emerald',
    subtitle: 'Cyber Defense & Green Transit',
    icon: Zap,
    colors: {
      bg: '#060b09',
      card: '#0b1511',
      accent: '#10b981',
      border: '#1a382b',
    },
  },
  {
    id: 'slate-dark',
    name: 'Midnight Slate',
    subtitle: 'Classic Deep Gray Palette',
    icon: Moon,
    colors: {
      bg: '#020617',
      card: '#0f172a',
      accent: '#06b6d4',
      border: '#1e293b',
    },
  },
];

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
  const ActiveIcon = activeTheme.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all cursor-pointer shadow-xs',
          theme === 'civic-light'
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
        )}
        title="Change App Color Theme"
      >
        <Palette className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden xl:inline">{activeTheme.name}</span>
        <span
          className="w-2.5 h-2.5 rounded-full border border-white/20"
          style={{ backgroundColor: activeTheme.colors.accent }}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-72 p-2.5 rounded-xl border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150',
            theme === 'civic-light'
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
              : 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80'
          )}
        >
          <div className="px-2 py-1.5 mb-1.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Color Palette
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              4 THEMES
            </span>
          </div>

          <div className="space-y-1.5">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full p-2.5 rounded-lg text-left transition-all flex items-center justify-between gap-3 group cursor-pointer border',
                    isSelected
                      ? theme === 'civic-light'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                        : 'bg-slate-800/90 border-cyan-500/60 text-white font-medium'
                      : theme === 'civic-light'
                      ? 'border-transparent hover:bg-slate-100 text-slate-700'
                      : 'border-transparent hover:bg-slate-800/60 text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Visual Color Swatch */}
                    <div
                      className="w-7 h-7 rounded-md border flex items-center justify-center shadow-xs shrink-0"
                      style={{
                        backgroundColor: opt.colors.bg,
                        borderColor: opt.colors.border,
                      }}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: opt.colors.accent }}
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5 leading-tight">
                        <Icon className="w-3.5 h-3.5 opacity-80" />
                        <span>{opt.name}</span>
                      </div>
                      <div
                        className={cn(
                          'text-[10px] mt-0.5 leading-tight',
                          theme === 'civic-light' ? 'text-slate-500' : 'text-slate-400'
                        )}
                      >
                        {opt.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
