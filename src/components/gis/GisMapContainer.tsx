import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Bus, Event, RoadDefect } from '../../types';
import { formatCoordinates, getSeverityStyle } from '../../utils/formatters';
import {
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  Plus,
  Minus,
  RotateCcw,
  Bus as BusIcon,
  AlertTriangle,
  Flame,
  Droplets,
  Radio,
  Eye,
  Footprints,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface GisMapContainerProps {
  buses?: Bus[];
  events?: Event[];
  defects?: RoadDefect[];
  heightClass?: string;
  selectedBusId?: string;
  selectedEventId?: string;
  onSelectBus?: (bus: Bus) => void;
  onSelectEvent?: (event: Event) => void;
  id?: string;
}

export const GisMapContainer: React.FC<GisMapContainerProps> = ({
  buses = [],
  events = [],
  defects = [],
  heightClass = 'h-[540px]',
  selectedBusId,
  selectedEventId,
  onSelectBus,
  onSelectEvent,
  id,
}) => {
  const { setSelectedBus, setSelectedEvent } = useApp();

  // Map viewport state (Center around downtown corridor ~37.7820, -122.4120)
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 37.782,
    lng: -122.412,
  });
  const [zoom, setZoom] = useState<number>(14);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>(center);
  const [activeLayers, setActiveLayers] = useState({
    buses: true,
    defects: true,
    waterlogging: true,
    congestion: true,
    safety: true,
    grid: true,
  });

  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Dynamic projection bounds adapting to fleet coordinates (India, SF, or live GPS)
  const bounds = useMemo(() => {
    const points: Array<{ lat: number; lng: number }> = [];
    buses.forEach((b) => {
      if (b.current_lat && b.current_lng) points.push({ lat: b.current_lat, lng: b.current_lng });
    });
    events.forEach((e) => {
      if (e.latitude && e.longitude) points.push({ lat: e.latitude, lng: e.longitude });
    });

    if (points.length === 0) {
      return { minLat: 12.90, maxLat: 13.06, minLng: 77.50, maxLng: 77.72 };
    }

    // Check if points are predominantly Indian subcontinent
    const indianPoints = points.filter((p) => p.lat > 8 && p.lat < 36 && p.lng > 68 && p.lng < 92);
    const activePoints = indianPoints.length > 0 ? indianPoints : points;

    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;

    activePoints.forEach((p) => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const latPad = Math.max(0.015, latSpan * 0.25 || 0.03);
    const lngPad = Math.max(0.015, lngSpan * 0.25 || 0.03);

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
    };
  }, [buses, events]);

  const projectCoords = (lat: number, lng: number) => {
    const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
    const latSpan = bounds.maxLat - bounds.minLat || 0.01;
    const xPercent = ((lng - bounds.minLng) / lngSpan) * 100;
    // Latitude decreases as Y goes down in SVG
    const yPercent = (1 - (lat - bounds.minLat) / latSpan) * 100;
    return { x: Math.max(5, Math.min(95, xPercent)), y: Math.max(5, Math.min(95, yPercent)) };
  };

  const handleBusClick = (bus: Bus) => {
    if (onSelectBus) onSelectBus(bus);
    else setSelectedBus(bus);
  };

  const handleEventClick = (event: Event) => {
    if (onSelectEvent) onSelectEvent(event);
    else setSelectedEvent(event);
  };

  return (
    <div
      id={id}
      className={cn(
        'relative w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 select-none flex flex-col shadow-inner',
        heightClass
      )}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const lat = bounds.maxLat - y * (bounds.maxLat - bounds.minLat);
        const lng = bounds.minLng + x * (bounds.maxLng - bounds.minLng);
        setCursorCoords({ lat, lng });
      }}
    >
      {/* MAP CANVAS / SVG LAYER */}
      <div className="absolute inset-0 z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Grid Pattern */}
            <pattern id="gis-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(30, 41, 59, 0.45)"
                strokeWidth="1"
              />
            </pattern>
            {/* Radar Sweep Effect */}
            <radialGradient id="radar-sweep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.08)" />
              <stop offset="70%" stopColor="rgba(6, 182, 212, 0.02)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          {activeLayers.grid && <rect width="100%" height="100%" fill="url(#gis-grid)" />}
          <circle cx="50%" cy="50%" r="45%" fill="url(#radar-sweep)" />

          {/* Urban Road Corridors Simulation */}
          <g stroke="rgba(71, 85, 105, 0.5)" strokeWidth="3" strokeLinecap="round" fill="none">
            {/* Corridor A: Route 101 Arterial (Southwest to Northeast) */}
            <path
              d="M 15% 85% Q 40% 65% 50% 50% T 85% 20%"
              stroke="rgba(6, 182, 212, 0.35)"
              strokeWidth="5"
              strokeDasharray="4 4"
            />
            {/* Corridor B: Expressway (North to West approach) */}
            <path
              d="M 20% 15% Q 35% 25% 65% 35% T 90% 70%"
              stroke="rgba(148, 163, 184, 0.25)"
              strokeWidth="4"
            />
            {/* Corridor C: Harbor & Cross Sector Road */}
            <path
              d="M 10% 45% L 90% 55%"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="3"
            />
            <path
              d="M 45% 10% L 55% 90%"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="3"
            />
          </g>
        </svg>

        {/* ROAD DEFECTS & EVENTS MARKERS */}
        {events.map((evt) => {
          if (evt.event_type === 'ROAD_DEFECT' && !activeLayers.defects) return null;
          if (evt.event_type === 'WATERLOGGING' && !activeLayers.waterlogging) return null;
          if (evt.event_type === 'CONGESTION' && !activeLayers.congestion) return null;
          if (
            (evt.event_type === 'WRONG_WAY' || evt.event_type === 'PEDESTRIAN_RISK') &&
            !activeLayers.safety
          )
            return null;

          const { x, y } = projectCoords(evt.latitude, evt.longitude);
          const isSelected = selectedEventId === evt.event_id;
          const sevStyle = getSeverityStyle(evt.severity);

          return (
            <div
              key={evt.event_id}
              onClick={() => handleEventClick(evt)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
              title={`${evt.event_type}: ${evt.title || ''} (${evt.severity})`}
            >
              {/* Radar pulse ring for critical events */}
              {evt.severity === 'CRITICAL' && (
                <span className="absolute -inset-2 rounded-full bg-rose-500/30 animate-ping" />
              )}

              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center border transition-transform duration-200 group-hover:scale-125 shadow-lg',
                  isSelected
                    ? 'ring-2 ring-cyan-400 scale-125'
                    : 'group-hover:ring-1 group-hover:ring-slate-300',
                  evt.event_type === 'WATERLOGGING'
                    ? 'bg-blue-900 border-blue-400 text-blue-200'
                    : evt.event_type === 'WRONG_WAY'
                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                    : evt.event_type === 'CONGESTION'
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : evt.event_type === 'ZEBRA_CROSSING_PROBLEM'
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : evt.event_type === 'TRAFFIC_SIGN_PROBLEM'
                    ? 'bg-orange-950 border-orange-400 text-orange-300'
                    : 'bg-slate-900 border-amber-400 text-amber-300'
                )}
              >
                {evt.event_type === 'WATERLOGGING' ? (
                  <Droplets className="w-3.5 h-3.5" />
                ) : evt.event_type === 'CONGESTION' ? (
                  <Flame className="w-3.5 h-3.5" />
                ) : evt.event_type === 'ZEBRA_CROSSING_PROBLEM' ? (
                  <Footprints className="w-3.5 h-3.5" />
                ) : evt.event_type === 'TRAFFIC_SIGN_PROBLEM' ? (
                  <AlertOctagon className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Hover card */}
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-44 p-2 bg-slate-900/95 border border-slate-700 rounded shadow-xl text-[11px] text-slate-200 pointer-events-none z-30">
                <div className="font-semibold text-white truncate">{evt.title || evt.event_type}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Bus: {evt.bus_id} | Conf: {(evt.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                  {formatCoordinates(evt.latitude, evt.longitude)}
                </div>
              </div>
            </div>
          );
        })}

        {/* ACTIVE MOBILE BUS SENSORS */}
        {activeLayers.buses &&
          buses.map((bus) => {
            const { x, y } = projectCoords(bus.current_lat, bus.current_lng);
            const isSelected = selectedBusId === bus.bus_id;

            return (
              <div
                key={bus.bus_id}
                onClick={() => handleBusClick(bus)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              >
                {/* Heading indicator dot */}
                <div
                  className={cn(
                    'p-1.5 rounded-md border flex items-center gap-1 transition-all duration-300 group-hover:scale-110 shadow-lg',
                    isSelected
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/60'
                      : bus.operational_status === 'TELEMETRY_DEGRADED'
                      ? 'bg-amber-950 border-amber-600 text-amber-300'
                      : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-cyan-500'
                  )}
                >
                  <BusIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[10px] font-mono font-bold">{bus.fleet_number}</span>
                  <Navigation
                    className="w-2.5 h-2.5 text-slate-400"
                    style={{ transform: `rotate(${bus.heading_degrees}deg)` }}
                  />
                </div>

                {/* Bus Tooltip on hover */}
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 p-2 bg-slate-900 border border-slate-700 rounded shadow-xl text-[11px] text-slate-300 pointer-events-none z-30">
                  <div className="font-semibold text-white flex justify-between">
                    <span>{bus.bus_id}</span>
                    <span className="text-cyan-400 font-mono">{bus.speed_kmh} km/h</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{bus.route_name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Model: {bus.model_version} | Batt: {bus.battery_health_percent}%
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* TOP OVERLAY: GIS CONTROLS & STATUS HUD */}
      <div className="relative z-10 p-3 flex items-start justify-between pointer-events-none">
        {/* Live Network Scope Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-md text-xs font-mono text-slate-300 shadow-md">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-semibold text-slate-100">GIS COMMAND RADAR</span>
          <span className="text-slate-600">|</span>
          <span>{buses.length} Mobile Nodes</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400">{events.length} Detections</span>
        </div>

        {/* Action Buttons: Layers, Zoom, Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Layer Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="p-2 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 shadow transition-colors flex items-center gap-1.5 text-xs"
              title="Toggle GIS Map Layers"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Layers</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 mt-1.5 w-52 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-40 text-xs space-y-2">
                <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5">
                  GIS Layer Overlays
                </div>
                {Object.entries(activeLayers).map(([layerKey, enabled]) => (
                  <label
                    key={layerKey}
                    className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white"
                  >
                    <span className="capitalize">{layerKey}</span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() =>
                        setActiveLayers((prev) => ({
                          ...prev,
                          [layerKey]: !prev[layerKey as keyof typeof activeLayers],
                        }))
                      }
                      className="rounded accent-cyan-500"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center rounded bg-slate-900/90 border border-slate-800 shadow">
            <button
              onClick={() => setZoom((z) => Math.min(18, z + 1))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-l"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(10, z - 1))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-r"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM OVERLAY: COORDINATES HUD */}
      <div className="mt-auto relative z-10 p-3 flex items-end justify-between pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-sm border border-slate-800 px-3 py-1 rounded text-[11px] font-mono text-slate-400 space-x-3 shadow">
          <span>CENTER: {formatCoordinates(center.lat, center.lng)}</span>
          <span className="text-slate-600">|</span>
          <span>CURSOR: {formatCoordinates(cursorCoords.lat, cursorCoords.lng)}</span>
          <span className="text-slate-600">|</span>
          <span>ZOOM: {zoom}x</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>REAL-TIME INGESTION ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
