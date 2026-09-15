import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { NavigationPath } from '../../types';
import { useApp } from '../../context/AppContext';

export const Breadcrumbs: React.FC = () => {
  const { currentRoute, navigateTo } = useApp();

  const routeNames: Record<NavigationPath, string> = {
    overview: 'Overview',
    'mobile-dashcam': 'Mobile Bus Dashcam (Camera AI)',
    'live-operations': 'Live Operations',
    incidents: 'Incidents',
    'road-defects': 'Road Defects',
    'school-safety': 'School Zone & Vulnerable Pedestrians',
    'anpr-tracker': 'ANPR & Offending Vehicle Tracker',
    traffic: 'Traffic & Congestion',
    fleet: 'Fleet & Mobile Sensors',
    'ai-detection': 'AI Detection',
    maintenance: 'Maintenance',
    reports: 'Reports',
    alerts: 'Alerts',
    monitoring: 'Monitoring',
    models: 'Edge AI Model Management',
    audit: 'Audit Trail & Compliance',
    users: 'User Access & RBAC',
    settings: 'Settings & Simulation',
  };

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-400 select-none">
      <button
        onClick={() => navigateTo('overview')}
        className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer"
        aria-label="Overview"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Road Sense</span>
      </button>

      <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

      <span className="font-semibold text-slate-200">{routeNames[currentRoute] || currentRoute}</span>
    </nav>
  );
};
