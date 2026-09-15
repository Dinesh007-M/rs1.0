import { EventSeverity, EventStatus, EventType, MaintenancePriority } from '../types';

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return isoString;
  }
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

export function formatPercentage(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

export function getSeverityStyle(severity: EventSeverity): {
  badge: string;
  dot: string;
  border: string;
  bg: string;
  text: string;
} {
  switch (severity) {
    case 'CRITICAL':
      return {
        badge: 'bg-rose-950/70 text-rose-300 border-rose-700/60 shadow-rose-950/50',
        dot: 'bg-rose-500 shadow-rose-500/50 animate-pulse',
        border: 'border-rose-700/50',
        bg: 'bg-rose-950/20',
        text: 'text-rose-400',
      };
    case 'HIGH':
      return {
        badge: 'bg-amber-950/70 text-amber-300 border-amber-700/60 shadow-amber-950/50',
        dot: 'bg-amber-500 shadow-amber-500/50',
        border: 'border-amber-700/50',
        bg: 'bg-amber-950/20',
        text: 'text-amber-400',
      };
    case 'MEDIUM':
      return {
        badge: 'bg-blue-950/70 text-blue-300 border-blue-700/60 shadow-blue-950/50',
        dot: 'bg-blue-500 shadow-blue-500/50',
        border: 'border-blue-700/50',
        bg: 'bg-blue-950/20',
        text: 'text-blue-400',
      };
    case 'LOW':
    default:
      return {
        badge: 'bg-slate-800/80 text-slate-300 border-slate-700 shadow-slate-900/50',
        dot: 'bg-slate-400',
        border: 'border-slate-700',
        bg: 'bg-slate-900/20',
        text: 'text-slate-400',
      };
  }
}

export function getStatusStyle(status: EventStatus): {
  badge: string;
  dot: string;
} {
  switch (status) {
    case 'PUBLISHED':
    case 'VALIDATED':
      return { badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50', dot: 'bg-emerald-400' };
    case 'ACKNOWLEDGED':
    case 'ASSIGNED':
      return { badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50', dot: 'bg-cyan-400' };
    case 'RESOLVED':
      return { badge: 'bg-purple-950/60 text-purple-300 border-purple-700/50', dot: 'bg-purple-400' };
    case 'REJECTED':
      return { badge: 'bg-slate-800 text-slate-400 border-slate-700', dot: 'bg-slate-500' };
    case 'CANDIDATE':
      return { badge: 'bg-amber-950/60 text-amber-300 border-amber-700/50', dot: 'bg-amber-400' };
    case 'DETECTED':
    default:
      return { badge: 'bg-slate-900 text-slate-300 border-slate-700', dot: 'bg-slate-400' };
  }
}

export function formatEventType(type: EventType): string {
  switch (type) {
    case 'ROAD_DEFECT':
      return 'Road Defect / Pothole';
    case 'WATERLOGGING':
      return 'Waterlogging / Flooding';
    case 'CONGESTION':
      return 'Traffic Bottleneck';
    case 'WRONG_WAY':
      return 'Wrong-Way Vehicle';
    case 'HIT_AND_RUN_CANDIDATE':
      return 'Hit & Run Candidate';
    case 'PEDESTRIAN_RISK':
      return 'Pedestrian Hazard';
    case 'CAMERA_FAILURE':
      return 'Edge Camera Degraded';
    case 'UNSAFE_DRIVING':
      return 'Unsafe Maneuver';
    case 'MISSING_INFRASTRUCTURE':
      return 'Missing Infrastructure';
    case 'ZEBRA_CROSSING_PROBLEM':
      return 'Zebra Crossing / Crosswalk Hazard';
    case 'TRAFFIC_SIGN_PROBLEM':
      return 'Roadside Traffic Sign Defect';
    default:
      return type;
  }
}

export function getPriorityStyle(priority: MaintenancePriority): string {
  switch (priority) {
    case 'P1_IMMEDIATE':
      return 'bg-rose-950/80 text-rose-300 border-rose-700/70 font-semibold';
    case 'P2_24_HOURS':
      return 'bg-amber-950/80 text-amber-300 border-amber-700/70';
    case 'P3_WEEKLY':
      return 'bg-blue-950/80 text-blue-300 border-blue-700/70';
    case 'P4_ROUTINE':
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}
