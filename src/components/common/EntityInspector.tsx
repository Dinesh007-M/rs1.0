import React from 'react';
import { useApp } from '../../context/AppContext';
import { SidePanel } from './SidePanel';
import { Badge } from './Badge';
import { Button } from './Button';
import {
  formatCoordinates,
  formatEventType,
  formatPercentage,
  formatTimestamp,
  getSeverityStyle,
  getStatusStyle,
} from '../../utils/formatters';
import {
  AlertTriangle,
  Bus,
  Camera,
  CheckCircle2,
  Cpu,
  ExternalLink,
  MapPin,
  ShieldAlert,
  Wrench,
  XCircle,
} from 'lucide-react';
import { verificationService, eventService } from '../../services';

export const EntityInspector: React.FC = () => {
  const {
    selectedEvent,
    setSelectedEvent,
    selectedBus,
    setSelectedBus,
    selectedDefect,
    setSelectedDefect,
    selectedIncident,
    setSelectedIncident,
    navigateTo,
  } = useApp();

  // 1. EVENT INSPECTOR
  if (selectedEvent) {
    const sevStyle = getSeverityStyle(selectedEvent.severity);
    const statStyle = getStatusStyle(selectedEvent.status);

    const handleVerify = async (verdict: 'VALIDATE' | 'REJECT') => {
      const updated = await verificationService.verifyEvent(
        selectedEvent.event_id,
        'Cmdr. Elena Vance',
        verdict,
        verdict === 'VALIDATE' ? 'Verified by control room operator.' : 'Rejected as false positive.'
      );
      setSelectedEvent(updated);
    };

    const handleEscalate = async () => {
      const inc = await verificationService.escalateToIncident(
        selectedEvent.event_id,
        `Emergency Priority: ${selectedEvent.title || selectedEvent.event_type}`,
        selectedEvent.assigned_department || 'Metropolitan Transit Police'
      );
      setSelectedEvent(null);
      setSelectedIncident(inc);
      navigateTo('incidents');
    };

    const handleAssignMaintenance = async () => {
      await verificationService.assignToMaintenance(
        selectedEvent.event_id,
        'Metropolitan Public Works',
        selectedEvent.severity === 'CRITICAL' ? 'P1_IMMEDIATE' : 'P2_24_HOURS'
      );
      const refreshed = await eventService.getEventById(selectedEvent.event_id);
      setSelectedEvent(refreshed);
    };

    return (
      <SidePanel
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Event Intelligence Inspector"
        subtitle={`ID: ${selectedEvent.event_id} • Bus: ${selectedEvent.bus_id}`}
        width="lg"
      >
        <div className="space-y-6 text-sm text-slate-300">
          {/* Header Status & Severity */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${sevStyle.dot}`} />
              <span className="font-semibold text-slate-100">{formatEventType(selectedEvent.event_type)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={selectedEvent.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                {selectedEvent.severity}
              </Badge>
              <Badge variant="neutral" size="sm">
                {selectedEvent.status}
              </Badge>
            </div>
          </div>

          {/* Description & Confidence */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
              Event Details
            </h4>
            <p className="text-slate-200 text-sm font-medium">{selectedEvent.title || 'Sensor Event'}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedEvent.description}</p>
          </div>

          {/* Evidence Imagery (if available) */}
          {selectedEvent.evidence_uri && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  Edge Optical Evidence
                </span>
                <span className="font-mono text-[10px] text-slate-500">Camera: {selectedEvent.camera_id}</span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 aspect-video group">
                <img
                  src={selectedEvent.evidence_uri}
                  alt="Edge Camera Evidence"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-cyan-950/20 pointer-events-none" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-cyan-800/80">
                  AI Bounding Box • Conf {formatPercentage(selectedEvent.confidence)}
                </div>
              </div>
            </div>
          )}

          {/* Telemetry & Geographic Attributes */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Coordinates</span>
              <span className="font-mono text-slate-200">
                {formatCoordinates(selectedEvent.latitude, selectedEvent.longitude)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Detection Confidence</span>
              <span className="font-mono font-bold text-cyan-400">
                {formatPercentage(selectedEvent.confidence)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Road Segment ID</span>
              <span className="font-mono text-slate-200">{selectedEvent.road_segment_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Edge Model</span>
              <span className="font-mono text-slate-300">{selectedEvent.model_version}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Timestamp</span>
              <span className="font-mono text-slate-300">{formatTimestamp(selectedEvent.timestamp)}</span>
            </div>
          </div>

          {/* Verification Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Control Room Verification Workflow
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleVerify('VALIDATE')}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Validate Event
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVerify('REJECT')}
                icon={<XCircle className="w-3.5 h-3.5 text-rose-400" />}
              >
                Reject False Positive
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleEscalate}
                icon={<ShieldAlert className="w-3.5 h-3.5" />}
              >
                Escalate to Incident
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAssignMaintenance}
                icon={<Wrench className="w-3.5 h-3.5 text-amber-400" />}
              >
                Dispatch Repair
              </Button>
            </div>
          </div>
        </div>
      </SidePanel>
    );
  }

  // 2. BUS INSPECTOR
  if (selectedBus) {
    return (
      <SidePanel
        isOpen={Boolean(selectedBus)}
        onClose={() => setSelectedBus(null)}
        title={`Mobile Sensing Unit: ${selectedBus.bus_id}`}
        subtitle={`${selectedBus.model} • Fleet: ${selectedBus.fleet_number}`}
        width="lg"
      >
        <div className="space-y-6 text-sm text-slate-300">
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-100">{selectedBus.registration_number}</span>
            </div>
            <Badge
              variant={
                selectedBus.operational_status === 'ACTIVE_ON_ROUTE'
                  ? 'success'
                  : selectedBus.operational_status === 'TELEMETRY_DEGRADED'
                  ? 'warning'
                  : 'neutral'
              }
              size="sm"
            >
              {selectedBus.operational_status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs">
              <span className="text-slate-500 block">Kinematic Speed</span>
              <span className="font-mono text-base font-bold text-cyan-400">{selectedBus.speed_kmh} km/h</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs">
              <span className="text-slate-500 block">Heading</span>
              <span className="font-mono text-base font-bold text-slate-200">{selectedBus.heading_degrees}°</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs">
              <span className="text-slate-500 block">Battery / State</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                {selectedBus.battery_health_percent}%
              </span>
            </div>
          </div>

          {/* Route & Driver */}
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-1.5 text-xs">
            <div>
              <span className="text-slate-500">Route Assignment: </span>
              <span className="font-medium text-slate-200">{selectedBus.route_name}</span>
            </div>
            <div>
              <span className="text-slate-500">Operator / Driver: </span>
              <span className="text-slate-300">{selectedBus.current_driver_name}</span>
            </div>
            <div>
              <span className="text-slate-500">Edge Inference Unit: </span>
              <span className="font-mono text-cyan-400">{selectedBus.edge_unit_id}</span>
            </div>
          </div>

          {/* Mounted Cameras */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              Connected Edge Cameras ({selectedBus.cameras.length})
            </h4>
            <div className="space-y-2">
              {selectedBus.cameras.map((cam) => (
                <div
                  key={cam.camera_id}
                  className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{cam.mount_position}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {cam.resolution} @ {cam.fps}fps • FOV {cam.fov_degrees}° • Temp {cam.temperature_celsius}°C
                    </div>
                  </div>
                  <Badge variant={cam.status === 'ONLINE' ? 'success' : 'warning'} size="sm">
                    {cam.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SidePanel>
    );
  }

  // 3. DEFECT INSPECTOR
  if (selectedDefect) {
    return (
      <SidePanel
        isOpen={Boolean(selectedDefect)}
        onClose={() => setSelectedDefect(null)}
        title={`Road Defect: ${selectedDefect.defect_id}`}
        subtitle={`${selectedDefect.category} on ${selectedDefect.road_name}`}
        width="md"
      >
        <div className="space-y-5 text-sm text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-slate-100">{selectedDefect.road_name}</span>
            <Badge variant="warning" size="sm">
              Priority Score: {selectedDefect.priority_score}/100
            </Badge>
          </div>

          {/* Defect Optical Evidence Picture */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                Bus Camera Evidence Snapshot
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Segment: {selectedDefect.road_segment_id}
              </span>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 aspect-video group">
              <img
                src={
                  (selectedDefect.evidence_uris && selectedDefect.evidence_uris[0]) ||
                  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
                }
                alt={`Road Defect ${selectedDefect.defect_id}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-cyan-950/20 pointer-events-none" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-cyan-800/80">
                AI Detection Box • {selectedDefect.category} (Lane {selectedDefect.lane_number})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-500 block">Depth Estimate</span>
              <span className="font-mono font-bold text-slate-200">
                {selectedDefect.depth_estimate_cm ? `${selectedDefect.depth_estimate_cm} cm` : 'Surface'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-500 block">Estimated Area</span>
              <span className="font-mono font-bold text-slate-200">{selectedDefect.area_estimate_m2} m²</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-500 block">Multi-Bus Passes</span>
              <span className="font-mono font-bold text-cyan-400">{selectedDefect.detection_count} Passes</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-500 block">Status</span>
              <span className="font-mono font-bold text-emerald-400">{selectedDefect.status}</span>
            </div>
          </div>
        </div>
      </SidePanel>
    );
  }

  return null;
};
