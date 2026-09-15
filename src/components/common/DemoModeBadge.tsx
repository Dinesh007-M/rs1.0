import React from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export const DemoModeBadge: React.FC = () => {
  const { simulationConfig, setIsDemoConfigModalOpen, injectDemoEvent } = useApp();

  if (!simulationConfig.is_demo_mode) {
    return (
      <button
        onClick={() => setIsDemoConfigModalOpen(true)}
        className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200 transition-colors"
      >
        Enable Demo
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        id="demo-mode-badge"
        onClick={() => setIsDemoConfigModalOpen(true)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-bold tracking-wider cursor-pointer transition-all shadow-sm',
          'bg-amber-950/80 text-amber-300 border-amber-600/70 hover:bg-amber-900/90 shadow-amber-950/30'
        )}
        title="Click to configure Demo Mode simulation"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>DEMO MODE</span>
      </button>

      {/* Quick synthetic event injection button */}
      <button
        onClick={async () => {
          await injectDemoEvent();
        }}
        className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
        title="Inject random simulated event (Pothole, Waterlogging, Wrong-way, etc.)"
      >
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>+ Pulse Event</span>
      </button>
    </div>
  );
};
