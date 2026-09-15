import React from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Activity, Server, Radio, Database, ShieldCheck, Cpu } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { systemStatus, simulationConfig } = useApp();

  const services = [
    {
      name: 'MQTT Edge Ingestion Cluster (EMQX/HiveMQ)',
      status: simulationConfig.mqtt_simulated_state === 'CONNECTED' ? 'OPERATIONAL' : 'DEGRADED',
      latency: `${systemStatus.ingestion_latency_ms} ms`,
      throughput: '1,420 pkts/sec',
      uptime: '99.98%',
    },
    {
      name: 'PostGIS Spatio-Temporal Mesh Database',
      status: 'OPERATIONAL',
      latency: '4.2 ms',
      throughput: '340 queries/sec',
      uptime: '100%',
    },
    {
      name: 'Edge AI Model Deployment Repository (OTA)',
      status: 'OPERATIONAL',
      latency: '22.0 ms',
      throughput: 'Idle',
      uptime: '99.95%',
    },
    {
      name: 'Municipal Public Works Work Order Bridge',
      status: 'OPERATIONAL',
      latency: '48.5 ms',
      throughput: '12 api/min',
      uptime: '99.90%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          System & Telemetry Pipeline Health
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Infrastructure health, message brokers, ingestion latency, and edge compute runtime status.
        </p>
      </div>

      {/* Top Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Edge Ingestion Latency"
          value={`${systemStatus.ingestion_latency_ms} ms`}
          subvalue="Target <150ms"
          variant="cyan"
          icon={<Radio className="w-5 h-5 text-cyan-400" />}
          change="Normal 5G SA"
          isPositive={true}
        />
        <StatCard
          title="Fleet Nodes Online"
          value={`${systemStatus.active_buses_count} / ${systemStatus.total_fleet_count}`}
          subvalue="GPS broadcasting"
          variant="emerald"
          icon={<Server className="w-5 h-5 text-emerald-400" />}
          change="100% scheduled fleet"
          isPositive={true}
        />
        <StatCard
          title="Packet Loss Ratio"
          value={simulationConfig.network_condition === 'OPTIMAL_5G' ? '0.01%' : '4.2%'}
          subvalue="Cellular uplink"
          variant="amber"
          icon={<Activity className="w-5 h-5 text-amber-400" />}
          change="Within SLA"
          isPositive={true}
        />
        <StatCard
          title="Edge Sync Backlog"
          value={systemStatus.edge_sync_backlog}
          subvalue="Pending buffer"
          variant="emerald"
          icon={<Database className="w-5 h-5 text-emerald-400" />}
          change="No backlog"
          isPositive={true}
        />
      </div>

      {/* Services Table */}
      <Card
        title="Core Services Operational Matrix"
        subtitle="Real-time health telemetry across the centralized intelligence cluster"
      >
        <div className="divide-y divide-slate-800">
          {services.map((svc) => (
            <div key={svc.name} className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-100">{svc.name}</div>
                <div className="text-slate-400 text-[11px] font-mono">
                  Latency: {svc.latency} • Throughput: {svc.throughput}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400 hidden sm:inline">Uptime: {svc.uptime}</span>
                <Badge variant={svc.status === 'OPERATIONAL' ? 'success' : 'warning'} size="sm">
                  {svc.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
