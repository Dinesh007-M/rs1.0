import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { eventService } from '../services';
import {
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  School,
  Clock,
  Navigation,
  Volume2,
  CheckCircle2,
  Eye,
  Radio,
  BellRing,
} from 'lucide-react';

interface SchoolCrossingEvent {
  id: string;
  schoolName: string;
  zoneSpeedLimit: number;
  detectedPedestriansCount: number;
  childrenCount: number;
  busId: string;
  roadName: string;
  status: 'ACTIVE_RISK' | 'CLEARED' | 'ENFORCEMENT_DISPATCHED';
  timestamp: string;
  confidence: number;
  surroundingTrafficSpeedKmh: number;
  driverAdvisorySent: boolean;
  snapshotUrl: string;
}

const INITIAL_EVENTS: SchoolCrossingEvent[] = [
  {
    id: 'SCH-EVT-8821',
    schoolName: 'Kendriya Vidyalaya & St. Joseph Higher Secondary',
    zoneSpeedLimit: 25,
    detectedPedestriansCount: 16,
    childrenCount: 14,
    busId: 'BUS-KA-01-F-4012',
    roadName: 'Outer Ring Road (Sector 4 Gate)',
    status: 'ACTIVE_RISK',
    timestamp: 'Just now (1 min ago)',
    confidence: 0.964,
    surroundingTrafficSpeedKmh: 48.2,
    driverAdvisorySent: true,
    snapshotUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'SCH-EVT-8819',
    schoolName: 'Delhi Public School Metro Campus',
    zoneSpeedLimit: 20,
    detectedPedestriansCount: 22,
    childrenCount: 19,
    busId: 'BUS-DL-1P-B-9921',
    roadName: 'Vikas Marg School Crossing',
    status: 'ENFORCEMENT_DISPATCHED',
    timestamp: '14 minutes ago',
    confidence: 0.948,
    surroundingTrafficSpeedKmh: 54.0,
    driverAdvisorySent: true,
    snapshotUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'SCH-EVT-8815',
    schoolName: 'National Public Model School',
    zoneSpeedLimit: 25,
    detectedPedestriansCount: 8,
    childrenCount: 7,
    busId: 'BUS-TN-01-N-3420',
    roadName: 'Anna Salai Gate 2',
    status: 'CLEARED',
    timestamp: '42 minutes ago',
    confidence: 0.912,
    surroundingTrafficSpeedKmh: 24.5,
    driverAdvisorySent: true,
    snapshotUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
  },
];

export const SchoolSafetyPage: React.FC = () => {
  const { navigateTo } = useApp();
  const [events, setEvents] = useState<SchoolCrossingEvent[]>(INITIAL_EVENTS);
  const [broadcastActive, setBroadcastActive] = useState<string | null>(null);

  useEffect(() => {
    const unsub = eventService.subscribe((newEvent) => {
      if (
        newEvent.event_type === 'PEDESTRIAN_RISK' ||
        newEvent.event_type === 'ZEBRA_CROSSING_PROBLEM' ||
        (newEvent.title && (newEvent.title.toLowerCase().includes('school') || newEvent.title.toLowerCase().includes('crossing') || newEvent.title.toLowerCase().includes('zebra'))) ||
        (newEvent.description && (newEvent.description.toLowerCase().includes('pedestrian') || newEvent.description.toLowerCase().includes('zebra') || newEvent.description.toLowerCase().includes('crosswalk')))
      ) {
        const newSchoolEvt: SchoolCrossingEvent = {
          id: newEvent.event_id,
          schoolName: newEvent.title || 'Civic School Crossing Corridor',
          zoneSpeedLimit: 25,
          detectedPedestriansCount: 14,
          childrenCount: 12,
          busId: newEvent.bus_id,
          roadName: newEvent.title || 'Metropolitan Sector Road',
          status: 'ACTIVE_RISK',
          timestamp: 'Just now (Live Camera)',
          confidence: newEvent.confidence || 0.95,
          surroundingTrafficSpeedKmh: 42.5,
          driverAdvisorySent: false,
          snapshotUrl: newEvent.evidence_uri,
        };
        setEvents((prev) => [newSchoolEvt, ...prev]);
      }
    });
    return () => unsub();
  }, []);

  const handleSendZoneAdvisory = (eventId: string) => {
    setBroadcastActive(eventId);
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, driverAdvisorySent: true, status: 'ENFORCEMENT_DISPATCHED' } : e))
      );
      setBroadcastActive(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <School className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">
              Vulnerable Pedestrians & School Zone Safety
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time bus camera optical detection of school children crossing roads, pedestrian clusters, and traffic speed violations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateTo('mobile-dashcam')}
            icon={<Eye className="w-4 h-4" />}
          >
            Launch Mobile Dashcam AI
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-amber-500/30 bg-amber-950/10">
          <div className="text-xs text-amber-400 font-medium">Active High-Risk School Zones</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">3 Zones</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Under live bus camera surveillance</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Children Detected Crossing</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">47 Students</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Peak arrival hours (07:30 - 09:15)</div>
        </Card>

        <Card className="p-4 border-rose-500/30 bg-rose-950/10">
          <div className="text-xs text-rose-400 font-medium">Speed Limit Violations</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">14 Vehicles</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Exceeding 25 km/h school zone cap</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Driver Warnings Dispatched</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">100% Broadcast</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In-cabin HUD chimes for transit buses</div>
        </Card>
      </div>

      {/* Live School Safety Events Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            Live School Pedestrian Incidents (Bus Optical Telemetry)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((evt) => (
            <Card
              key={evt.id}
              className={`p-5 border space-y-4 ${
                evt.status === 'ACTIVE_RISK'
                  ? 'border-amber-500/40 bg-slate-900/90 shadow-lg shadow-amber-950/20'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        evt.status === 'ACTIVE_RISK'
                          ? 'warning'
                          : evt.status === 'ENFORCEMENT_DISPATCHED'
                          ? 'danger'
                          : 'success'
                      }
                      size="sm"
                    >
                      {evt.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="font-mono text-xs text-slate-400">{evt.id}</span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">{evt.schoolName}</h3>
                  <div className="text-xs text-cyan-400 font-mono flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{evt.roadName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-300">{evt.timestamp}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Bus: {evt.busId}</div>
                </div>
              </div>

              {/* Optical Snapshot & Detection Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <div className="relative h-28 rounded overflow-hidden border border-slate-700 bg-slate-900">
                  <img
                    src={evt.snapshotUrl}
                    alt={evt.schoolName}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-mono font-bold text-[9px] rounded">
                    AI Conf: {(evt.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-amber-300 font-mono text-[9px] rounded">
                    {evt.childrenCount} Children Crossing
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Total Pedestrians:</span>
                    <span className="font-bold text-white">{evt.detectedPedestriansCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Zone Speed Limit:</span>
                    <span className="text-amber-400 font-bold">{evt.zoneSpeedLimit} km/h</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Traffic Speed:</span>
                    <span
                      className={`font-bold ${
                        evt.surroundingTrafficSpeedKmh > evt.zoneSpeedLimit
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {evt.surroundingTrafficSpeedKmh} km/h
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Driver Warning:</span>
                    <span className="text-emerald-400">
                      {evt.driverAdvisorySent ? 'Transmitted' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Automated School Crossing Guard Escalation
                </span>

                <Button
                  variant={evt.status === 'ENFORCEMENT_DISPATCHED' ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleSendZoneAdvisory(evt.id)}
                  disabled={broadcastActive === evt.id || evt.status === 'ENFORCEMENT_DISPATCHED'}
                  icon={<BellRing className="w-3.5 h-3.5" />}
                >
                  {broadcastActive === evt.id
                    ? 'Broadcasting...'
                    : evt.status === 'ENFORCEMENT_DISPATCHED'
                    ? 'Patrol Dispatched'
                    : 'Dispatch Traffic Marshals'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
