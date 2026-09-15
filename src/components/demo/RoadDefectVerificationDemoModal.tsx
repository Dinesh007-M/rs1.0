import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { eventService } from '../../services/eventService';
import { maintenanceService } from '../../services/maintenanceService';
import { soundEngine } from '../../utils/audioAlert';
import { useApp } from '../../context/AppContext';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Bus,
  Eye,
  Layers,
  Wrench,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface RoadDefectVerificationDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepInfo {
  step: number;
  title: string;
  category: 'BUS_DETECTION' | 'CROSS_VALIDATION' | 'DISPATCH' | 'MAINTENANCE' | 'REINSPECTION';
  busId?: string;
  confidence?: number;
  statusText: string;
  description: string;
  systemAction: string;
  imageUrl: string;
}

const DEMO_STEPS: StepInfo[] = [
  {
    step: 1,
    title: 'Bus 102 Traverses Sector Corridor',
    category: 'BUS_DETECTION',
    busId: 'BUS-KA-01-F-4012',
    confidence: 0,
    statusText: 'ROUTE_PATROL_ACTIVE',
    description: 'BMTC Bus 102 is operating normally along Outer Ring Road at 38 km/h. Onboard windshield 4K camera is capturing 30 FPS into local TensorRT edge GPU buffer.',
    systemAction: 'Inference pipeline processing frames in 28ms; road surface nominal.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 2,
    title: 'CAM-102-FRONT Detects Pothole (First Observation)',
    category: 'BUS_DETECTION',
    busId: 'BUS-KA-01-F-4012',
    confidence: 0.72,
    statusText: 'CANDIDATE_OBSERVATION_1',
    description: 'Optical YOLOv8 edge model triggers detection: Severe asphalt cavity detected at Lat 12.9352, Lng 77.6245. Single observation confidence is 72%. Marked as UNCONFIRMED CANDIDATE.',
    systemAction: 'Candidate event queued into local Edge SQLite buffer and broadcast via MQTT to Central Gateway.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 3,
    title: 'Bus 105 Traverses Same Segment (Second Observation)',
    category: 'BUS_DETECTION',
    busId: 'BUS-DL-1P-B-9921',
    confidence: 0.86,
    statusText: 'CANDIDATE_OBSERVATION_2',
    description: '14 minutes later, Bus 105 passes through the exact same GPS bounding corridor (Δ = 2.4 meters). Windshield camera independently flags the defect with 86% confidence.',
    systemAction: 'Central spatial deduplication engine matches road segment and correlates GPS timestamps.',
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 4,
    title: 'Bus 107 Traverses Segment (Third Independent Quorum)',
    category: 'BUS_DETECTION',
    busId: 'BUS-TN-01-N-3420',
    confidence: 0.96,
    statusText: 'CANDIDATE_OBSERVATION_3',
    description: 'Bus 107 encounters the same location. Independent edge detection records 96% confidence with depth estimation of 7.2 cm. 3 independent bus sightings now logged.',
    systemAction: 'Quorum reached: Observation count = 3. Bayesian confidence fusion exceeds 0.95 threshold.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 5,
    title: 'Fleet Cross-Validation Engine Combines Observations',
    category: 'CROSS_VALIDATION',
    confidence: 0.982,
    statusText: 'FLEET_CROSS_VALIDATED',
    description: 'Core Axiom: "One Detection ≠ One Verified Event". Spatial-temporal correlation engine merges the 3 independent observations, eliminating false positives from shadows or debris.',
    systemAction: 'Status elevated from CANDIDATE to VERIFIED ROAD DEFECT.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 6,
    title: 'Severity Escalation to HIGH Priority',
    category: 'CROSS_VALIDATION',
    confidence: 0.982,
    statusText: 'HIGH_SEVERITY_CONFIRMED',
    description: 'Due to repeated transit vehicle impacts and high traffic volume on this arterial road, predictive degradation algorithm upgrades defect to HIGH priority (Score: 88/100).',
    systemAction: 'Defect record DEF-ORR-2026-094 updated with High Urgency flag.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 7,
    title: 'Pinned to Municipal GIS Map with Live Cluster',
    category: 'CROSS_VALIDATION',
    confidence: 0.982,
    statusText: 'GIS_LAYER_SYNCHRONIZED',
    description: 'The verified hazard is placed on the city GIS map at Outer Ring Road. Nearby buses receive real-time driver cabin telemetry warnings to slow down.',
    systemAction: 'PostGIS spatial index updated; GIS layer redrawn across all operator consoles.',
    imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 8,
    title: 'High-Priority Alert Dispatched to Municipal Command Center',
    category: 'DISPATCH',
    statusText: 'COMMAND_CENTER_NOTIFIED',
    description: 'Sound chime and banner alert dispatched to the Control Room console. Alert contains verified location, 3 bus camera snapshots, and road structural index.',
    systemAction: 'Notification center and audio engine fired.',
    imageUrl: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?auto=format&fit=crop&w=800&q=80',
  },
  {
    step: 9,
    title: 'Control Room Operator Opens Incident & Reviews Evidence',
    category: 'DISPATCH',
    statusText: 'OPERATOR_ACKNOWLEDGED',
    description: 'Operator inspects cryptographic telemetry: timestamps from Bus 102, 105, and 107. Bounding box and depth estimate confirmed genuine.',
    systemAction: 'Audit log entry written: "USR-OP-01 ACKNOWLEDGED DEFECT INCIDENT".',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    step: 10,
    title: 'Operator Confirms Incident for Maintenance Dispatch',
    category: 'DISPATCH',
    statusText: 'INCIDENT_VERIFIED_BY_HUMAN',
    description: 'Human-in-the-loop verification protocol completed. Operator clicks "Approve Work Order". Incident status moves to DISPATCH_READY.',
    systemAction: 'State machine advances to PWD municipal procurement contract.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 11,
    title: 'Automated PWD Maintenance Work Order Generated',
    category: 'MAINTENANCE',
    statusText: 'WORK_ORDER_CREATED',
    description: 'Public Works Department work order TASK-PWD-2026-781 generated with estimated asphalt fill volume (0.45 m³) and target completion SLA of 24 Hours.',
    systemAction: 'Maintenance record generated with status CREW_DISPATCHED.',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 12,
    title: 'Assigned to Municipal Road Maintenance Division',
    category: 'MAINTENANCE',
    statusText: 'CONTRACTOR_NOTIFIED',
    description: 'Assigned to Division 4 Arterial Rapid Repair Team. Work order dispatched to field supervisor tablet with GPS route navigation.',
    systemAction: 'SMS and API webhook sent to contractor portal.',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 13,
    title: 'Field Crew Arrives on Site — Status: IN PROGRESS',
    category: 'MAINTENANCE',
    statusText: 'IN_PROGRESS',
    description: 'Road repair team sets up safety cones on Outer Ring Road. Cold-mix asphalt patching and mechanical compactor deployed to restore smooth surface.',
    systemAction: 'Live task timer started; traffic flow monitored by transit cameras.',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 14,
    title: 'Contractor Completes Patch & Uploads Repair Proof',
    category: 'MAINTENANCE',
    statusText: 'REPAIR_COMPLETED_PENDING_REINSPECTION',
    description: 'Contractor uploads geo-tagged photo proof showing hot-mix compaction. Task marked COMPLETED by contractor, but pending optical audit.',
    systemAction: 'Audit status set to REINSPECTION_REQUIRED.',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 15,
    title: 'Automated Bus Reinspection Triggered',
    category: 'REINSPECTION',
    statusText: 'REINSPECTION_SCHEDULED',
    description: 'Instead of sending expensive manual city inspection cars, Road Sense tasks the next scheduled transit buses on Route 335 to inspect the road automatically.',
    systemAction: 'Geofence watch trigger activated for incoming buses.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 16,
    title: 'Future Bus 103 Scans Repaired Road Location',
    category: 'REINSPECTION',
    busId: 'BUS-KA-01-F-4012',
    statusText: 'OPTICAL_SCAN_EVALUATED',
    description: 'Bus 103 traverses the location 3 hours later. Edge AI camera scans the road surface: Defect cavity depth = 0.0 cm. Smooth asphalt index confirmed.',
    systemAction: 'Before/After optical comparison delta verified 99.4% smooth.',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=700&auto=format&fit=crop&q=80',
  },
  {
    step: 17,
    title: 'Closed & Verified: "REPAIRED / VERIFIED"',
    category: 'REINSPECTION',
    statusText: 'RESOLVED_VERIFIED_CLOSED',
    description: 'End-to-end autonomous municipal loop closed! Road Sense permanently archives the ticket as REPAIRED & VERIFIED. The city saved 80% in inspection costs and repaired the road in under 24 hours.',
    systemAction: 'Ticket closed, audit log completed, citizen KPI dashboard updated.',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=700&auto=format&fit=crop&q=80',
  },
];

export const RoadDefectVerificationDemoModal: React.FC<RoadDefectVerificationDemoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { navigateTo } = useApp();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeedMs, setPlaySpeedMs] = useState(3000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const step = DEMO_STEPS[currentStepIndex];

  // Auto-play interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < DEMO_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
          soundEngine.playDetectionChime();
        } else {
          setIsPlaying(false);
          soundEngine.playSuccessTone();
        }
      }, playSpeedMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, playSpeedMs]);

  // Execute actual database injections on certain key milestones
  useEffect(() => {
    if (step.step === 5) {
      // Verified defect
      eventService.injectDemoPotholeCrossValidation();
    } else if (step.step === 11) {
      // Work order generated
      maintenanceService.createTask({
        title: 'Emergency Pothole Repair (Outer Ring Road)',
        description: 'Automated dispatch following 3-bus optical cross-validation confirmation.',
        department: 'Public Works Department (Zone 4)',
        priority: 'P1_IMMEDIATE',
        status: 'CREW_DISPATCHED',
        defect_id: 'DEF-ORR-2026-094',
        target_completion_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        latitude: 12.9352,
        longitude: 77.6245,
        location_name: 'Outer Ring Road (Near Bellandur Flyover)',
        estimated_cost_usd: 1200,
      }).catch(() => {});
    }
  }, [step.step]);

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      soundEngine.playDetectionChime();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Road Defect Verification & Maintenance Lifecycle Demo (17-Step Autonomous Loop)"
      size="xl"
    >
      <div className="space-y-5 select-none">
        {/* Header Ribbon & Axiom */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span>Autonomous Municipal Closed Loop</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  "One Detection ≠ One Verified Event"
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Step {step.step} of {DEMO_STEPS.length} — {step.category.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Reset Demo to Step 1"
            >
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>

            <Button
              variant={isPlaying ? 'danger' : 'primary'}
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              icon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isPlaying ? 'Pause' : 'Auto Play'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentStepIndex === DEMO_STEPS.length - 1}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>

        {/* 17-Step Mini Progress Ribbon */}
        <div className="grid grid-cols-17 gap-1">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(idx);
              }}
              title={`Step ${s.step}: ${s.title}`}
              className={`h-2 rounded-sm transition-all ${
                idx === currentStepIndex
                  ? 'bg-cyan-400 ring-2 ring-cyan-400/40'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Main Stage: Optical Feed & Telemetry Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Visual Screen (Bus Optical View or Document) */}
          <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative group">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
              <img
                src={step.imageUrl}
                alt={step.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* High-Tech HUD Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Corner HUD Telemetry */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded border border-slate-700 text-xs font-mono space-y-0.5">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  OPTICAL SENSOR FEED: {step.busId || 'MUNICIPAL CENTRAL GIS'}
                </div>
                <div className="text-[10px] text-slate-300">
                  LAT 12.9352°N | LNG 77.6245°E | SPD 38.4 km/h
                </div>
              </div>

              {/* Multi-Bus Observation Progression Meter */}
              {step.step >= 2 && step.step <= 5 && (
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-lg border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Cross-Validation Progression:
                    </span>
                    <span className="text-cyan-300 font-bold">
                      {step.step === 2 && '1 of 3 Sightings (72%)'}
                      {step.step === 3 && '2 of 3 Sightings (86%)'}
                      {step.step === 4 && '3 of 3 Sightings (96%)'}
                      {step.step === 5 && 'QUORUM VERIFIED (98.2%)'}
                    </span>
                  </div>

                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        step.step >= 5 ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                      style={{
                        width:
                          step.step === 2
                            ? '33%'
                            : step.step === 3
                            ? '66%'
                            : step.step === 4
                            ? '95%'
                            : '100%',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Status Badge in HUD */}
              <div className="absolute top-3 right-3">
                <Badge
                  variant={
                    step.step >= 16
                      ? 'success'
                      : step.step >= 11
                      ? 'info'
                      : step.step >= 5
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {step.statusText}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Column: Step Telemetry, Explanation & Municipal Action */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                  STEP {step.step} OF 17
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  SLA: &lt; 24h Resolution
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 leading-snug">
                {step.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {step.description}
              </p>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Real System Architecture Execution:
                </div>
                <div className="text-xs font-mono text-cyan-300">
                  {step.systemAction}
                </div>
              </div>
            </div>

            {/* Quick Actions for Current Step */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400 font-mono">
                {currentStepIndex < DEMO_STEPS.length - 1 ? (
                  <span>Next: {DEMO_STEPS[currentStepIndex + 1].title}</span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Lifecycle Verified!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {step.step >= 11 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      navigateTo('maintenance');
                    }}
                    icon={<Wrench className="w-3.5 h-3.5 text-amber-400" />}
                  >
                    View in PWD Queue
                  </Button>
                )}
                {step.step >= 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      navigateTo('road-defects');
                    }}
                    icon={<MapPin className="w-3.5 h-3.5 text-cyan-400" />}
                  >
                    View on GIS Map
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
