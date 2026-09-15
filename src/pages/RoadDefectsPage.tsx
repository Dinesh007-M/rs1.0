import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { RoadDefect } from '../types';
import { eventService } from '../services';
import { formatCoordinates, formatRelativeTime } from '../utils/formatters';
import {
  AlertTriangle,
  Wrench,
  Search,
  CheckCircle2,
  Layers,
  MapPin,
  Smartphone,
} from 'lucide-react';

export const RoadDefectsPage: React.FC = () => {
  const { setSelectedDefect, navigateTo, setIsMobileConnectModalOpen } = useApp();
  const [defects, setDefects] = useState<RoadDefect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadDefects = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await eventService.getDefects();
      setDefects(data);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDefects();

    // Subscribe to incoming detections from mobile cameras or edge devices
    const unsub = eventService.subscribe(() => {
      loadDefects(true);
    });

    return () => unsub();
  }, []);

  const filtered = defects.filter((d) => {
    const matchesCategory = categoryFilter === 'ALL' || d.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      d.road_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.road_segment_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return <LoadingSpinner label="Querying urban pavement defect registry..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Road Defects & Infrastructure Degradation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated detection and multi-bus triangulation of potholes, cracks, and road surface hazards.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            variant="primary"
            size="sm"
            onClick={() => navigateTo('maintenance')}
            icon={<Wrench className="w-3.5 h-3.5" />}
          >
            View Active Work Orders
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <div className="flex flex-wrap items-center gap-1">
          {([
            { id: 'ALL', label: 'All Defects' },
            { id: 'POTHOLE', label: '🕳️ Potholes' },
            { id: 'CRACK', label: '⚡ Cracks' },
            { id: 'ZEBRA_CROSSING', label: '🦓 Zebra Crossings' },
            { id: 'SIGNAGE', label: '🛑 Traffic Signs' },
            { id: 'WATERLOGGING', label: '💧 Waterlogging' },
            { id: 'MANHOLE', label: '🔘 Manholes' },
          ] as const).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search road name or segment..."
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Defects List */}
      <Card
        title="Detected Road Defects Catalogue"
        subtitle={`${filtered.length} defects identified across municipal routes`}
      >
        <Table<RoadDefect>
          data={filtered}
          keyExtractor={(d: RoadDefect) => d.defect_id}
          onRowClick={(d: RoadDefect) => setSelectedDefect(d)}
          columns={[
            {
              key: 'defect_id',
              header: 'Defect ID',
              render: (d: RoadDefect) => (
                <span className="font-mono text-xs font-semibold text-amber-400">{d.defect_id}</span>
              ),
            },
            {
              key: 'category',
              header: 'Category & Dimensions',
              render: (d: RoadDefect) => (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    {d.category === 'ZEBRA_CROSSING' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">
                        🦓 Zebra Crossing Hazard
                      </span>
                    ) : d.category === 'SIGNAGE' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold">
                        🛑 Roadside Traffic Sign
                      </span>
                    ) : (
                      <span>{d.category}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {d.category === 'ZEBRA_CROSSING' ? (
                      `Faded Markings • ${d.area_estimate_m2 || 18}m² crosswalk`
                    ) : d.category === 'SIGNAGE' ? (
                      'Tilted / Obstructed Regulatory Sign'
                    ) : (
                      <>
                        {d.depth_estimate_cm ? `Depth: ${d.depth_estimate_cm}cm • ` : ''}
                        {d.area_estimate_m2 ? `Area: ${d.area_estimate_m2}m²` : ''}
                      </>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'road_name',
              header: 'Road Segment & Location',
              render: (d: RoadDefect) => (
                <div className="space-y-0.5">
                  <div className="text-slate-200 font-medium">{d.road_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {d.road_segment_id} (Lane {d.lane_number})
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: 'priority_score',
              header: 'Priority Index',
              render: (d: RoadDefect) => (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-100">{d.priority_score}/100</span>
                  <div className="w-16 h-1.5 rounded bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        d.priority_score > 75
                          ? 'bg-rose-500'
                          : d.priority_score > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${d.priority_score}%` }}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'detection_count',
              header: 'Bus Passes',
              render: (d: RoadDefect) => (
                <span className="font-mono text-xs text-cyan-400 font-semibold">
                  {d.detection_count} passes
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (d: RoadDefect) => (
                <Badge
                  variant={
                    d.status === 'WORK_SCHEDULED'
                      ? 'warning'
                      : d.status === 'CONFIRMED'
                      ? 'info'
                      : d.status === 'REPAIRED'
                      ? 'success'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {d.status}
                </Badge>
              ),
            },
            {
              key: 'last_verified_at',
              header: 'Last Verified',
              render: (d: RoadDefect) => (
                <span className="text-xs text-slate-400">{formatRelativeTime(d.last_verified_at)}</span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
