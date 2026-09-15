import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  Layers,
  Sparkles,
  MapPin,
  Calendar,
  Bus,
  ArrowRight,
} from 'lucide-react';

interface ReinspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectId?: string;
  roadName?: string;
}

export const ReinspectionModal: React.FC<ReinspectionModalProps> = ({
  isOpen,
  onClose,
  defectId = 'DEF-2026-0941',
  roadName = 'Outer Ring Road (Near Bellandur Flyover)',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [auditVerdict, setAuditVerdict] = useState<'FULLY_REPAIRED' | 'NEEDS_REWORK'>('FULLY_REPAIRED');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Autonomous Transit Optical Reinspection — ${defectId}`}
      size="xl"
    >
      <div className="space-y-5 select-none">
        {/* Header telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{roadName}</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Initial Discovery: Bus 102 (3 Sightings) | Post-Repair Scan: Bus 103 (Route 335)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              OPTICAL DELTA: 99.4% RESTORED
            </Badge>
          </div>
        </div>

        {/* Before / After Comparative Image Slider */}
        <div className="relative h-72 sm:h-88 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          {/* AFTER Image (Background) */}
          <img
            src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80"
            alt="After Repair Reinspection"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80';
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs px-2.5 py-1 rounded backdrop-blur-md">
            AFTER REINSPECTION (Bus 103 Camera)
          </div>

          {/* BEFORE Image (Clipped overlay) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-cyan-400 shadow-2xl"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000&auto=format&fit=crop&q=80"
              alt="Before Repair Defect"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000&auto=format&fit=crop&q=80';
              }}
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: '1000px', height: '100%' }}
            />
            <div className="absolute top-3 left-3 bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono text-xs px-2.5 py-1 rounded backdrop-blur-md">
              BEFORE DISPATCH (Initial Pothole 7.2cm)
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-x-0 bottom-4 w-11/12 mx-auto h-2 bg-slate-800/80 appearance-none rounded cursor-ew-resize accent-cyan-400 opacity-80 hover:opacity-100"
          />
        </div>

        {/* Reinspection Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Initial Cavity Depth</div>
            <div className="text-rose-400 font-bold text-lg">7.2 cm (Critical)</div>
            <div className="text-slate-500 text-[11px]">Area: 0.45 m² | Edge YOLO Conf: 96%</div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Post-Repair Laser / Optical</div>
            <div className="text-emerald-400 font-bold text-lg">0.0 cm (Level)</div>
            <div className="text-slate-500 text-[11px]">Cold-mix asphalt patch confirmed</div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Cost Saved by Autonomous Patrol</div>
            <div className="text-cyan-400 font-bold text-lg">₹ 4,500 / $55 USD</div>
            <div className="text-slate-500 text-[11px]">Eliminated manual survey car dispatch</div>
          </div>
        </div>

        {/* Formal Close / Reinspection Approval */}
        <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white block">Audit Recommendation:</span>
            Defect is confirmed eliminated by 2 scheduled transit buses. Safe for high-speed traffic.
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert(`Reinspection approved for ${defectId}. Municipal record permanently marked REPAIRED / VERIFIED.`);
                onClose();
              }}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            >
              Approve & Close Ticket
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
