import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Bus, BusOperationalStatus } from '../types';
import { busService } from '../services';
import { formatRelativeTime } from '../utils/formatters';
import { Bus as BusIcon, Camera, Cpu, BatteryCharging, Radio, Navigation } from 'lucide-react';

export const FleetPage: React.FC = () => {
  const { setSelectedBus } = useApp();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBuses = async () => {
    setIsLoading(true);
    try {
      const data = await busService.getBuses();
      setBuses(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBuses();
  }, []);

  const handleStatusChange = async (busId: string, status: BusOperationalStatus) => {
    await busService.updateBusStatus(busId, status);
    loadBuses();
  };

  if (isLoading) {
    return <LoadingSpinner label="Contacting mobile edge fleet units via 5G MQTT broker..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <BusIcon className="w-5 h-5 text-cyan-400" />
            Fleet & Mobile Urban Sensor Units
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hardware status, edge computer health, mounted camera arrays, and over-the-air model deployment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded">
          <span className="text-slate-400">Total Units:</span>
          <span className="text-cyan-400 font-bold">{buses.length}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Cameras:</span>
          <span className="text-emerald-400 font-bold">
            {buses.reduce((acc, b) => acc + b.cameras.length, 0)}
          </span>
        </div>
      </div>

      <Card
        title="Active Fleet Registry"
        subtitle="Click any bus row to inspect telemetry, camera frames, and edge Jetson hardware"
      >
        <Table<Bus>
          data={buses}
          keyExtractor={(b: Bus) => b.bus_id}
          onRowClick={(b: Bus) => setSelectedBus(b)}
          columns={[
            {
              key: 'bus_id',
              header: 'Bus ID & Fleet',
              render: (b: Bus) => (
                <div className="space-y-0.5">
                  <div className="font-mono font-bold text-xs text-cyan-400">{b.bus_id}</div>
                  <div className="text-[11px] text-slate-400">{b.model}</div>
                </div>
              ),
            },
            {
              key: 'route_name',
              header: 'Assigned Route',
              render: (b: Bus) => (
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-200">{b.route_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Driver: {b.current_driver_name}</div>
                </div>
              ),
            },
            {
              key: 'operational_status',
              header: 'Status',
              render: (b: Bus) => (
                <Badge
                  variant={
                    b.operational_status === 'ACTIVE_ON_ROUTE'
                      ? 'success'
                      : b.operational_status === 'TELEMETRY_DEGRADED'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {b.operational_status}
                </Badge>
              ),
            },
            {
              key: 'edge_unit_id',
              header: 'Edge Computer',
              render: (b: Bus) => (
                <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{b.edge_unit_id}</span>
                </div>
              ),
            },
            {
              key: 'cameras',
              header: 'Cameras',
              render: (b: Bus) => (
                <div className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-xs text-slate-200">{b.cameras.length} Online</span>
                </div>
              ),
            },
            {
              key: 'battery_health_percent',
              header: 'Battery',
              render: (b: Bus) => (
                <span className="font-mono text-xs text-emerald-400 font-semibold">
                  {b.battery_health_percent}%
                </span>
              ),
            },
            {
              key: 'speed_kmh',
              header: 'Telemetry',
              render: (b: Bus) => (
                <div className="font-mono text-xs text-slate-300">
                  {b.speed_kmh} km/h • {b.heading_degrees}°
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
