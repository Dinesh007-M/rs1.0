import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Route } from '../types';
import { busService } from '../services';
import { Car, Activity, Zap, TrendingDown, Clock, ShieldAlert } from 'lucide-react';

export const TrafficPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    busService.getRoutes().then((data) => {
      setRoutes(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Compiling corridor transit velocities and congestion bottlenecks..." />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
          <Car className="w-5 h-5 text-cyan-400" />
          Traffic Congestion & Corridor Flow
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Bus kinematic speeds, choke points, and roadside obstructions inferred from fleet telemetry.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Average Fleet Velocity"
          value="34.0 km/h"
          subvalue="Across all routes"
          variant="cyan"
          icon={<Activity className="w-5 h-5 text-cyan-400" />}
          change="+2.4 km/h vs peak"
          isPositive={true}
        />
        <StatCard
          title="Corridor Choke Points"
          value="3"
          subvalue="Obstructions active"
          variant="amber"
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          change="Route 101 delayed 11m"
          isPositive={false}
        />
        <StatCard
          title="Congestion Hotspot Index"
          value="0.48"
          subvalue="Moderate flow"
          variant="emerald"
          icon={<Zap className="w-5 h-5 text-emerald-400" />}
          change="-0.06 improvement"
          isPositive={true}
        />
      </div>

      {/* Corridors Table */}
      <Card
        title="Monitored Transit Corridors"
        subtitle="Real-time traffic metrics derived from mobile sensing buses"
      >
        <Table<Route>
          data={routes}
          keyExtractor={(r: Route) => r.route_id}
          columns={[
            {
              key: 'route_code',
              header: 'Route',
              render: (r: Route) => (
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800">
                  Line {r.route_code}
                </span>
              ),
            },
            {
              key: 'name',
              header: 'Corridor Name & Extent',
              render: (r: Route) => (
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-100">{r.name}</div>
                  <div className="text-xs text-slate-400">{r.corridor}</div>
                </div>
              ),
            },
            {
              key: 'average_speed_kmh',
              header: 'Current Avg Speed',
              render: (r: Route) => (
                <span className="font-mono text-xs font-semibold text-slate-200">
                  {r.average_speed_kmh} km/h
                </span>
              ),
            },
            {
              key: 'congestion_index',
              header: 'Congestion Level',
              render: (r: Route) => (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${
                        r.congestion_index > 0.6
                          ? 'bg-rose-500'
                          : r.congestion_index > 0.4
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${r.congestion_index * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-300">
                    {(r.congestion_index * 100).toFixed(0)}%
                  </span>
                </div>
              ),
            },
            {
              key: 'active_defects_count',
              header: 'Active Road Defects',
              render: (r: Route) => (
                <Badge variant={r.active_defects_count > 4 ? 'warning' : 'neutral'} size="sm">
                  {r.active_defects_count} defects
                </Badge>
              ),
            },
            {
              key: 'assigned_bus_count',
              header: 'Assigned Sensors',
              render: (r: Route) => (
                <span className="font-mono text-xs text-cyan-400 font-medium">
                  {r.assigned_bus_count} buses
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
