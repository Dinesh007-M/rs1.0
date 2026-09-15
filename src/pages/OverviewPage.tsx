import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { GisMapContainer } from '../components/gis/GisMapContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { Bus, Event, RoadDefect } from '../types';
import { busService, eventService, reportService } from '../services';
import { formatCoordinates, formatEventType, formatRelativeTime, getSeverityStyle } from '../utils/formatters';
import {
  Bus as BusIcon,
  AlertTriangle,
  Radio,
  Activity,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { navigateTo, setSelectedEvent, injectDemoEvent, setIsMobileConnectModalOpen } = useApp();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [defects, setDefects] = useState<RoadDefect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedBuses, fetchedEvents, fetchedDefects] = await Promise.all([
        busService.getBuses(),
        eventService.getEvents({ limit: 6 }),
        eventService.getDefects(),
      ]);
      setBuses(fetchedBuses);
      setEvents(fetchedEvents);
      setDefects(fetchedDefects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load command overview.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time edge detections (e.g. from mobile dashcams)
    const unsub = eventService.subscribe((newEvent) => {
      setEvents((prev) => [newEvent, ...prev.filter((e) => e.event_id !== newEvent.event_id).slice(0, 6)]);
      eventService.getDefects().then(setDefects);
      busService.getBuses().then(setBuses);
    });

    return () => unsub();
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Compiling city urban telemetry stream..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase">
            Urban Sensing Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time edge AI telemetry ingested from public transit mobile sensor nodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileConnectModalOpen(true)}
            icon={<Smartphone className="w-3.5 h-3.5 text-cyan-400" />}
            className="border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60"
          >
            Connect Phone Camera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const newEvt = await injectDemoEvent();
              setEvents((prev) => [newEvt, ...prev.slice(0, 5)]);
            }}
            icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Simulate Edge Detection
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateTo('live-operations')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Open Live GIS Radar
          </Button>
        </div>
      </div>

      {/* Primary Municipal KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Mobile Sensors"
          value={`${buses.filter((b) => b.operational_status === 'ACTIVE_ON_ROUTE').length} / ${buses.length}`}
          subvalue="Fleet buses"
          variant="cyan"
          icon={<BusIcon className="w-5 h-5 text-cyan-400" />}
          change="+1 deployed today"
          isPositive={true}
        />
        <StatCard
          title="Verified Potholes & Defects"
          value={defects.length}
          subvalue="Active work orders"
          variant="amber"
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          change="3 pending dispatch"
          isPositive={false}
        />
        <StatCard
          title="Critical Safety Incidents"
          value="2"
          subvalue="High-priority response"
          variant="rose"
          icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
          change="1 Wrong-Way alert active"
          isPositive={false}
        />
        <StatCard
          title="Urban Pavement Index"
          value="82.4"
          subvalue="/100 Quality Score"
          variant="emerald"
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          change="+4.2% vs last month"
          isPositive={true}
        />
      </div>

      {/* Central GIS Map Radar Snapshot */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Corridor Mesh Coverage & Live Sensor Positions
            </h2>
          </div>
          <button
            onClick={() => navigateTo('live-operations')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            Fullscreen GIS Console <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <GisMapContainer buses={buses} events={events} heightClass="h-[380px]" />
      </div>

      {/* Split Grid: Recent Edge Detections Stream & Road Segment Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Ingestion Stream (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Real-Time Detection Stream"
            subtitle="Latest anomalies and hazards processed by bus edge units"
            headerAction={
              <Button variant="ghost" size="sm" onClick={() => navigateTo('ai-detection')}>
                View All Stream
              </Button>
            }
          >
            <Table<Event>
              data={events}
              keyExtractor={(e: Event) => e.event_id}
              onRowClick={(e: Event) => setSelectedEvent(e)}
              columns={[
                {
                  key: 'event_type',
                  header: 'Type & Description',
                  render: (e: Event) => (
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{formatEventType(e.event_type)}</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{e.title}</div>
                    </div>
                  ),
                },
                {
                  key: 'severity',
                  header: 'Severity',
                  render: (e: Event) => (
                    <Badge variant={e.severity === 'CRITICAL' ? 'danger' : e.severity === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                      {e.severity}
                    </Badge>
                  ),
                },
                {
                  key: 'bus_id',
                  header: 'Sensor Node',
                  render: (e: Event) => (
                    <span className="font-mono text-xs text-cyan-400 font-semibold">{e.bus_id}</span>
                  ),
                },
                {
                  key: 'confidence',
                  header: 'Edge AI Conf.',
                  render: (e: Event) => (
                    <span className="font-mono text-xs text-slate-300">{(e.confidence * 100).toFixed(1)}%</span>
                  ),
                },
                {
                  key: 'timestamp',
                  header: 'Detected',
                  render: (e: Event) => (
                    <span className="text-xs text-slate-400">{formatRelativeTime(e.timestamp)}</span>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* Corridor Defect Density (1 Col) */}
        <div className="space-y-4">
          <Card
            title="Sector Road Health Index"
            subtitle="Pothole frequency per 10km transit line"
          >
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">Route 101 (Downtown Arterial)</span>
                  <span className="font-mono text-amber-400 font-semibold">1.8 defects/km</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded" style={{ width: '68%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">Route 204 (North Bay Expressway)</span>
                  <span className="font-mono text-emerald-400 font-semibold">0.4 defects/km</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded" style={{ width: '22%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">Route 308 (Industrial Port Corridor)</span>
                  <span className="font-mono text-rose-400 font-semibold">2.9 defects/km</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded" style={{ width: '84%' }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Total surveyed distance:</span>
              <span className="font-mono font-semibold text-slate-200">65.5 km</span>
            </div>
          </Card>

          <Card title="Quick Command Actions">
            <div className="space-y-2">
              <button
                onClick={() => navigateTo('incidents')}
                className="w-full p-2.5 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
              >
                <span>Dispatch Incident Crews</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => navigateTo('maintenance')}
                className="w-full p-2.5 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
              >
                <span>Review Maintenance Work Orders</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => navigateTo('reports')}
                className="w-full p-2.5 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
              >
                <span>Export Municipal Infrastructure Audit</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
