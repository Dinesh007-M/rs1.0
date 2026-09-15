import React from 'react';
import { useApp } from '../context/AppContext';
import { NavigationPath } from '../types';
import {
  LayoutDashboard,
  Radio,
  AlertOctagon,
  AlertTriangle,
  Car,
  Bus,
  Cpu,
  Wrench,
  FileText,
  Bell,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Smartphone,
  School,
  Lock,
  Users,
  Play,
  Zap,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  id?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, id }) => {
  const { currentRoute, navigateTo, alerts, setIs17StepDemoOpen } = useApp();

  const navItems: Array<{
    path: NavigationPath;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeVariant?: 'danger' | 'warning' | 'info';
  }> = [
    { path: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    {
      path: 'mobile-dashcam',
      label: 'Mobile Bus Dashcam',
      icon: Smartphone,
      badge: 'LIVE AI',
      badgeVariant: 'info',
    },
    { path: 'live-operations', label: 'Live Operations GIS', icon: Radio },
    { path: 'road-defects', label: 'Road Defects Registry', icon: AlertTriangle, badge: 3, badgeVariant: 'warning' },
    { path: 'incidents', label: 'Incidents & Evidence', icon: AlertOctagon, badge: 2, badgeVariant: 'danger' },
    {
      path: 'school-safety',
      label: 'School Safety Zone',
      icon: School,
      badge: 'CHILDREN',
      badgeVariant: 'warning',
    },
    {
      path: 'anpr-tracker',
      label: 'ANPR & Rash Driving',
      icon: Car,
      badge: 'OFFENDER',
      badgeVariant: 'danger',
    },
    { path: 'traffic', label: 'Traffic & Density', icon: Activity },
    { path: 'fleet', label: 'Fleet & Cameras', icon: Bus, badge: '5 units' },
    { path: 'ai-detection', label: 'AI Inference Feed', icon: Cpu },
    { path: 'maintenance', label: 'Maintenance & PWD', icon: Wrench, badge: 2 },
    { path: 'reports', label: 'Reports & Analytics', icon: FileText },
    {
      path: 'alerts',
      label: 'Alerts & Escalations',
      icon: Bell,
      badge: alerts.length > 0 ? alerts.length : undefined,
      badgeVariant: 'danger',
    },
    { path: 'monitoring', label: 'System Monitoring', icon: Activity },
    { path: 'models', label: 'Edge AI Model Ops', icon: Cpu },
    { path: 'audit', label: 'Audit Trail & Compliance', icon: Lock },
    { path: 'users', label: 'User Access & RBAC', icon: Users },
    { path: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <aside
      id={id}
      className={cn(
        'bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 select-none shrink-0 z-30',
        isCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-slate-100 uppercase">
                Road Sense
              </span>
              <span className="block text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase">
                Urban Sensing Command
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-900 transition-colors hidden md:block"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Interactive 17-Step Demo Action Button */}
      {!isCollapsed ? (
        <div className="p-2.5 mx-2 my-2 rounded-lg bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent border border-amber-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              17-Step Verif. Demo
            </span>
            <span className="text-[10px] font-mono bg-amber-400/20 px-1 rounded text-amber-200">
              STEP 1-17
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight mb-2">
            Watch 3 buses verify defect, dispatch PWD, & reinspect road surface.
          </p>
          <button
            onClick={() => setIs17StepDemoOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            Launch Live Demo
          </button>
        </div>
      ) : (
        <div className="p-2 flex justify-center">
          <button
            onClick={() => setIs17StepDemoOpen(true)}
            className="w-10 h-10 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 flex items-center justify-center text-amber-300 cursor-pointer"
            title="Launch 17-Step Road Defect Verification Demo"
          >
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.path;

          return (
            <button
              key={item.path}
              id={`nav-${item.path}`}
              onClick={() => navigateTo(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group relative cursor-pointer',
                isActive
                  ? 'bg-slate-800/90 text-cyan-400 font-semibold border-l-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                )}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0',
                    item.badgeVariant === 'danger'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : item.badgeVariant === 'warning'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Control Room Agency Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-500 font-mono">
          <div className="truncate">GOVERNMENT OF INDIA</div>
          <div className="truncate text-slate-600">STATE SMART CITY TRANSIT</div>
        </div>
      )}
    </aside>
  );
};

