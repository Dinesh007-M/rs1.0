import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SystemStatusIndicator } from '../components/common/SystemStatusIndicator';
import { DemoModeBadge } from '../components/common/DemoModeBadge';
import { ThemeSelector } from '../components/common/ThemeSelector';
import {
  Bell,
  Search,
  User as UserIcon,
  ChevronDown,
  ShieldCheck,
  Command,
  Smartphone,
  Zap,
  Shield,
  Clock,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Role } from '../types';

interface TopNavProps {
  onToggleMobileMenu: () => void;
  id?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleMobileMenu, id }) => {
  const {
    currentUser,
    switchUserRole,
    alerts,
    notifications,
    setIsNotificationDrawerOpen,
    setIsMobileConnectModalOpen,
    setIs17StepDemoOpen,
    isPrivacyMaskingEnabled,
    setIsPrivacyMaskingEnabled,
    navigateTo,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length + alerts.length;

  const roles: Role[] = [
    'TRAFFIC_CONTROLLER',
    'MUNICIPAL_ADMIN',
    'MAINTENANCE_SUPERVISOR',
    'FLEET_MANAGER',
    'AI_SYSTEMS_ENGINEER',
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route matching or quick filter
    if (searchQuery.toLowerCase().includes('defect') || searchQuery.toLowerCase().includes('pothole')) {
      navigateTo('road-defects');
    } else if (searchQuery.toLowerCase().includes('incident') || searchQuery.toLowerCase().includes('wrong')) {
      navigateTo('incidents');
    } else if (searchQuery.toLowerCase().includes('bus') || searchQuery.toLowerCase().includes('fleet')) {
      navigateTo('fleet');
    } else {
      navigateTo('live-operations');
    }
  };

  return (
    <header
      id={id}
      className="h-16 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between gap-4 z-20 shrink-0"
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 md:hidden"
          aria-label="Open mobile menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Breadcrumbs />
      </div>

      {/* Middle: Live Clock & Search */}
      <div className="hidden lg:flex items-center gap-3 flex-1 max-w-md">
        {/* Real-time IST Command Clock */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{timeString} IST</span>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bus, defect, road, GPS (Press /)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
          <div className="absolute right-2.5 top-2 flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-800 px-1 py-0.5 rounded font-mono">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </form>
      </div>

      {/* Right: Telemetry Status, Demo Mode, Notifications, User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 17-Step Demo Runner */}
        <button
          onClick={() => setIs17StepDemoOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          title="Run 17-Step Autonomous Defect Verification Demo"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">17-Step Demo</span>
          <span className="sm:hidden">Demo</span>
        </button>

        {/* Mobile Camera Connect Button */}
        <button
          onClick={() => setIsMobileConnectModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-cyan-950/50"
          title="Connect Smartphone Camera to Fleet"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Connect Phone Camera</span>
          <span className="sm:hidden">Mobile</span>
        </button>

        {/* Privacy Masking Compliance Toggle */}
        <button
          onClick={() => setIsPrivacyMaskingEnabled(!isPrivacyMaskingEnabled)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-mono border transition-all cursor-pointer',
            isPrivacyMaskingEnabled
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
              : 'bg-rose-950/60 text-rose-300 border-rose-700/50'
          )}
          title={
            isPrivacyMaskingEnabled
              ? 'Privacy Shield Active: Faces & Non-offending plates masked'
              : 'Privacy Shield Disabled: Raw evidentiary stream'
          }
        >
          <Shield className="w-3 h-3 text-cyan-400" />
          <span className="hidden xl:inline">
            {isPrivacyMaskingEnabled ? 'Privacy: MASKED' : 'Privacy: RAW'}
          </span>
        </button>

        {/* Theme Palette Switcher */}
        <ThemeSelector />

        {/* System status indicator */}
        <SystemStatusIndicator />

        {/* Global Demo Mode indicator */}
        <DemoModeBadge />

        <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

        {/* Notifications trigger */}
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="relative p-2 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer"
          title="Open Notifications & Alerts"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* User Profile Area with Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-md hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300 text-xs font-semibold">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'EV'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-medium text-slate-200 leading-none">
                {currentUser?.name || 'Operator'}
              </div>
              <div className="text-[10px] text-cyan-400/90 font-mono mt-0.5 leading-none">
                {currentUser?.role?.replace(/_/g, ' ') || 'CONTROLLER'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* User Popover */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 text-xs">
              <div className="border-b border-slate-800 pb-2.5 mb-2.5">
                <div className="font-semibold text-slate-100">{currentUser?.name}</div>
                <div className="text-slate-400 text-[11px] truncate">{currentUser?.email}</div>
                <div className="text-[10px] text-cyan-400 font-mono mt-1">
                  Badge: {currentUser?.badge_number}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
                  Switch Active Role (RBAC)
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchUserRole(r);
                      setIsUserMenuOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded transition-colors flex items-center justify-between text-xs',
                      currentUser?.role === r
                        ? 'bg-cyan-950 text-cyan-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <span>{r.replace(/_/g, ' ')}</span>
                    {currentUser?.role === r && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

