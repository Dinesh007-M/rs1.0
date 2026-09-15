import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { eventService } from '../services';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Car,
  ShieldAlert,
  AlertTriangle,
  Radio,
  Clock,
  Navigation,
  Send,
  CheckCircle2,
  FileText,
  Search,
  Zap,
  Camera,
} from 'lucide-react';

interface AnprRecord {
  id: string;
  registrationPlate: string;
  vehicleType: 'SUV' | 'SEDAN' | 'HATCHBACK' | 'TWO_WHEELER' | 'AUTO_RICKSHAW' | 'TRUCK';
  offense: 'RASH_DRIVING' | 'HIT_AND_RUN_SUSPECT' | 'EXTREME_SPEEDING' | 'WRONG_WAY_DRIVING';
  confidenceScore: number; // 0.0 - 1.0
  recordedSpeedKmh: number;
  speedLimitKmh: number;
  timestamp: string;
  location: string;
  lat: number;
  lng: number;
  reportingBusId: string;
  cameraMount: string;
  status: 'PENDING_DISPATCH' | 'ESCALATED_POLICE' | 'INTERCEPT_COORDINATED';
  snapshotUrl: string;
}

const INITIAL_ANPR_RECORDS: AnprRecord[] = [
  {
    id: 'ANPR-2026-9901',
    registrationPlate: 'DL 01 AB 1234',
    vehicleType: 'SUV',
    offense: 'HIT_AND_RUN_SUSPECT',
    confidenceScore: 0.984,
    recordedSpeedKmh: 84.5,
    speedLimitKmh: 40.0,
    timestamp: 'Just now (2 mins ago)',
    location: 'Outer Ring Road (Near Bellandur Flyover)',
    lat: 12.9352,
    lng: 77.6744,
    reportingBusId: 'BUS-KA-01-F-4012',
    cameraMount: 'FRONT_WINDSHIELD_4K',
    status: 'PENDING_DISPATCH',
    snapshotUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ANPR-2026-9895',
    registrationPlate: 'KA 05 MN 5678',
    vehicleType: 'SEDAN',
    offense: 'RASH_DRIVING',
    confidenceScore: 0.967,
    recordedSpeedKmh: 76.2,
    speedLimitKmh: 50.0,
    timestamp: '18 minutes ago',
    location: 'Vikas Marg Arterial Expressway',
    lat: 28.6289,
    lng: 77.2410,
    reportingBusId: 'BUS-DL-1P-B-9921',
    cameraMount: 'CURBSIDE_DOOR',
    status: 'ESCALATED_POLICE',
    snapshotUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ANPR-2026-9882',
    registrationPlate: 'MH 02 CZ 9012',
    vehicleType: 'HATCHBACK',
    offense: 'WRONG_WAY_DRIVING',
    confidenceScore: 0.991,
    recordedSpeedKmh: 58.0,
    speedLimitKmh: 40.0,
    timestamp: '55 minutes ago',
    location: 'Western Express Highway Ramp',
    lat: 19.1136,
    lng: 72.8697,
    reportingBusId: 'BUS-MH-01-BR-5510',
    cameraMount: 'FRONT_WINDSHIELD_4K',
    status: 'INTERCEPT_COORDINATED',
    snapshotUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80',
  },
];

export const AnprTrackerPage: React.FC = () => {
  const { navigateTo } = useApp();
  const [records, setRecords] = useState<AnprRecord[]>(INITIAL_ANPR_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEscalating, setIsEscalating] = useState<string | null>(null);

  useEffect(() => {
    const unsub = eventService.subscribe((newEvent) => {
      if (
        newEvent.event_type === 'HIT_AND_RUN_CANDIDATE' ||
        newEvent.event_type === 'UNSAFE_DRIVING' ||
        (newEvent.metadata && (newEvent.metadata as any).offendingPlate)
      ) {
        const plate =
          (newEvent.metadata && (newEvent.metadata as any).offendingPlate) ||
          `KA 03 MN ${Math.floor(1000 + Math.random() * 9000)}`;
        const newRecord: AnprRecord = {
          id: newEvent.event_id,
          registrationPlate: plate,
          vehicleType: 'SUV',
          offense: 'RASH_DRIVING',
          confidenceScore: newEvent.confidence || 0.96,
          recordedSpeedKmh: 76.5,
          speedLimitKmh: 40.0,
          timestamp: 'Just now (Live Camera)',
          location: newEvent.title || 'Metropolitan Sector Road',
          lat: newEvent.latitude,
          lng: newEvent.longitude,
          reportingBusId: newEvent.bus_id,
          cameraMount: 'MOBILE_PHONE_AI_LENS',
          status: 'PENDING_DISPATCH',
          snapshotUrl: newEvent.evidence_uri,
        };
        setRecords((prev) => [newRecord, ...prev]);
      }
    });
    return () => unsub();
  }, []);

  const filteredRecords = records.filter(
    (r) =>
      r.registrationPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.offense.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEscalateToPolice = (recordId: string) => {
    setIsEscalating(recordId);
    setTimeout(() => {
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, status: 'ESCALATED_POLICE' } : r))
      );
      setIsEscalating(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Car className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">
              ANPR & Rash Driving / Hit-and-Run Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automatic License Plate Recognition (ANPR), offending vehicle trajectory tracking, and secure alert dispatch to State Traffic Police.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateTo('mobile-dashcam')}
            icon={<Camera className="w-4 h-4" />}
          >
            Launch Mobile Dashcam (Test ANPR)
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-purple-500/30 bg-purple-950/10">
          <div className="text-xs text-purple-400 font-medium">Offending Vehicles Tracked</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {records.length} Vehicles
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across active transit fleet cameras</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Mean OCR Confidence</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">98.1%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Edge YOLO-ANPR OCR pipeline</div>
        </Card>

        <Card className="p-4 border-rose-500/30 bg-rose-950/10">
          <div className="text-xs text-rose-400 font-medium">Hit-and-Run Suspects</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">1 Critical</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Evidence package compiled with GPS</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Police Highway Intercepts</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">2 Coordinated</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated FIR & challan dispatch</div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by Registration Plate (e.g. DL 01 AB 1234), Road Corridor, or Offense..."
          className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* ANPR Records Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
          Offending Vehicle Captures & ANPR License Records
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((r) => (
            <Card
              key={r.id}
              className={`p-5 border space-y-4 ${
                r.offense === 'HIT_AND_RUN_SUSPECT'
                  ? 'border-rose-500/50 bg-rose-950/10 shadow-lg'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* License Plate Display (Indian Number Plate Style) */}
                    <div className="inline-flex items-center border-2 border-amber-400 bg-amber-300 text-slate-950 px-2.5 py-1 rounded font-mono font-black text-sm tracking-wider shadow">
                      <span className="text-[10px] text-slate-800 mr-1 font-bold">IND</span>
                      {r.registrationPlate}
                    </div>

                    <Badge
                      variant={
                        r.offense === 'HIT_AND_RUN_SUSPECT'
                          ? 'danger'
                          : r.offense === 'WRONG_WAY_DRIVING'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {r.offense.replace(/_/g, ' ')}
                    </Badge>

                    <Badge variant="cyan" size="sm">
                      OCR: {(r.confidenceScore * 100).toFixed(1)}%
                    </Badge>

                    <Badge
                      variant={
                        r.status === 'ESCALATED_POLICE'
                          ? 'danger'
                          : r.status === 'INTERCEPT_COORDINATED'
                          ? 'success'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {r.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-300 font-mono flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" />
                      {r.location}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      GPS: {r.lat.toFixed(4)}°N, {r.lng.toFixed(4)}°E
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Sensed by: {r.reportingBusId}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-300">{r.timestamp}</div>
                  <div className="text-[11px] font-mono text-slate-500">{r.id}</div>
                </div>
              </div>

              {/* Snapshot and Telemetry Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                {/* Snapshot image with OCR bounding box overlay */}
                <div className="relative h-32 rounded overflow-hidden border border-slate-700 bg-slate-900">
                  <img
                    src={r.snapshotUrl}
                    alt={r.registrationPlate}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                  {/* Bounding box simulation over plate */}
                  <div className="absolute inset-x-8 bottom-3 h-8 border-2 border-amber-400 bg-amber-400/20 rounded flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-amber-200 bg-black/80 px-1 rounded">
                      ANPR LOCKED: {r.registrationPlate}
                    </span>
                  </div>
                </div>

                {/* Telemetry data */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Vehicle Category:</span>
                    <span className="font-bold text-white">{r.vehicleType}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Speed Limit:</span>
                    <span className="text-slate-400 font-bold">{r.speedLimitKmh} km/h</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Recorded Speed:</span>
                    <span className="text-rose-400 font-bold text-sm">
                      {r.recordedSpeedKmh} km/h (+{(r.recordedSpeedKmh - r.speedLimitKmh).toFixed(1)} km/h excess)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Camera Mount:</span>
                    <span className="text-slate-300">{r.cameraMount}</span>
                  </div>
                </div>

                {/* Legal / Enforcement Action */}
                <div className="space-y-2 flex flex-col justify-between">
                  <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Evidence Package
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Cryptographically hashed 4K frame, GPS lock (accuracy ±3m), and transit bus LiDAR point cloud.
                    </p>
                  </div>

                  <Button
                    variant={r.status === 'ESCALATED_POLICE' ? 'outline' : 'primary'}
                    size="sm"
                    className="w-full justify-center"
                    disabled={isEscalating === r.id || r.status === 'ESCALATED_POLICE'}
                    onClick={() => handleEscalateToPolice(r.id)}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    {isEscalating === r.id
                      ? 'Dispatching Secure Alert...'
                      : r.status === 'ESCALATED_POLICE'
                      ? 'Alert Sent to State Highway Police'
                      : 'Secure Alert to State Police Highway Patrol'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
