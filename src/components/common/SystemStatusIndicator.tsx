import React from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, Radio, Wifi, WifiOff, Database } from 'lucide-react';
import { cn } from '../../utils/cn';

export const SystemStatusIndicator: React.FC = () => {
  const { systemStatus, simulationConfig, isOnline } = useApp();

  const isDegraded =
    !isOnline ||
    systemStatus.platform_health !== 'OPERATIONAL' ||
    simulationConfig.network_condition === 'OFFLINE_QUEUE' ||
    simulationConfig.mqtt_simulated_state === 'DISCONNECTED';

  return (
    <div className="flex items-center gap-2.5 text-xs font-mono">
      {/* Supabase PostgreSQL & Storage Live Badge */}
      <div
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded border bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
        title="Supabase PostgreSQL, Auth & Storage Connected"
      >
        <Database className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium text-[11px]">SUPABASE LIVE</span>
      </div>

      {/* Network / Ingestion Status */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded border',
          isDegraded
            ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
            : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
        )}
        title={`Platform: ${systemStatus.platform_health} | Ingestion: ${systemStatus.ingestion_latency_ms}ms`}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            isDegraded ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
          )}
        />
        <span className="font-semibold tracking-wider">
          {isDegraded ? 'EDGE DEGRADED' : 'SYSTEM OPERATIONAL'}
        </span>
      </div>

      {/* Latency & Ingestion Metric (hidden on small screens) */}
      <div className="hidden lg:flex items-center gap-2 text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        <span>{systemStatus.ingestion_latency_ms}ms</span>
        <span className="text-slate-600">|</span>
        <Radio className="w-3.5 h-3.5 text-emerald-400" />
        <span>{systemStatus.active_buses_count}/{systemStatus.total_fleet_count} Buses</span>
      </div>

      {/* Network status */}
      <div className="hidden md:flex items-center gap-1 text-slate-400">
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-400" title="Connected" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-rose-400" title="Offline" />
        )}
      </div>
    </div>
  );
};
