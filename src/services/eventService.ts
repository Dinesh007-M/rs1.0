import { Event, EventSeverity, EventStatus, EventType, RoadDefect } from '../types';
import { IEventService } from './types';
import { maintenanceService } from './maintenanceService';
import { alertService } from './alertService';
import { uploadReportImageToStorage } from '../lib/supabase';

const EVENTS_STORAGE_KEY = 'roadsense_events_v2';
const DEFECTS_STORAGE_KEY = 'roadsense_defects_v2';

export interface MobileDetectionPayload {
  busId: string;
  roadName: string;
  latitude: number;
  longitude: number;
  category: 'POTHOLE' | 'CRACK' | 'WATERLOGGING' | 'MANHOLE' | 'DEBRIS' | 'SIGNAGE' | 'ZEBRA_CROSSING';
  severity: EventSeverity;
  confidence: number;
  snapshotDataUrl: string;
  depthEstimateCm?: number;
  areaEstimateM2?: number;
  title: string;
  description: string;
  offendingPlate?: string;
  vehicleSpeedKmh?: number;
  userId?: string;
}

type EventListener = (event: Event) => void;

function mapDbRowToEvent(row: any): Event {
  const isWater = row.defect_type === 'WATERLOGGING';
  const isCrack = row.defect_type && row.defect_type.includes('CRACK');
  const isZebra = row.defect_type && (row.defect_type.includes('ZEBRA') || row.defect_type.includes('CROSSING'));
  const isSign = row.defect_type && row.defect_type.includes('SIGN');
  const eventType: EventType = isWater
    ? 'WATERLOGGING'
    : isZebra
    ? 'ZEBRA_CROSSING_PROBLEM'
    : isSign
    ? 'TRAFFIC_SIGN_PROBLEM'
    : isCrack
    ? 'ROAD_DEFECT'
    : 'ROAD_DEFECT';

  let status: EventStatus = 'DETECTED';
  if (row.status === 'VERIFIED' || row.status === 'CONFIRMED') status = 'CONFIRMED';
  else if (row.status === 'REPAIRED') status = 'RESOLVED';
  else if (row.status === 'IN_REPAIR') status = 'INVESTIGATING';

  return {
    event_id: row.id,
    event_type: eventType,
    severity: (row.severity as EventSeverity) || 'MEDIUM',
    timestamp: row.created_at || new Date().toISOString(),
    bus_id: row.bus_id || 'BUS-402',
    route_id: 'RT-BENGALURU-EXP',
    road_segment_id: `SEG-${(row.address || 'MAIN').slice(0, 8).toUpperCase()}`,
    latitude: Number(row.latitude) || 12.9716,
    longitude: Number(row.longitude) || 77.5946,
    confidence: Number(row.confidence_score) || 0.94,
    confidence_score: Number(row.confidence_score) || 0.94,
    model_version: 'v2.4.1-EdgeYOLOv8',
    evidence_uri:
      row.image_url ||
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    status,
    created_at: row.created_at || new Date().toISOString(),
    title: `${(row.defect_type || 'Defect').replace(/_/g, ' ')} on ${row.address || 'Road'}`,
    description: `Reported by ${row.reported_by_name || 'Mobile Node'}. Verification count: ${row.verification_count || 1}.`,
    assigned_department: row.assigned_to,
    assigned_task_id: row.work_order_id,
    metadata: {
      source: 'SUPABASE_POSTGRES',
      user_id: row.user_id,
      depth_cm: 7.2,
      area_m2: 0.5,
      estimated_cost_inr: row.estimated_cost_inr,
      verification_count: row.verification_count,
    },
  };
}

function mapDbRowToDefect(row: any): RoadDefect {
  let category: RoadDefect['category'] = 'POTHOLE';
  const dtype = (row.defect_type || '').toUpperCase();
  if (dtype.includes('WATER')) category = 'WATERLOGGING';
  else if (dtype.includes('CRACK')) category = 'CRACK';
  else if (dtype.includes('MANHOLE')) category = 'MANHOLE';
  else if (dtype.includes('SIGN')) category = 'SIGNAGE';
  else if (dtype.includes('ZEBRA') || dtype.includes('CROSSING') || dtype.includes('CROSSWALK')) category = 'ZEBRA_CROSSING';
  else if (dtype.includes('DEBRIS')) category = 'DEBRIS';

  let status: RoadDefect['status'] = 'UNVERIFIED';
  if (row.status === 'REPAIRED') status = 'REPAIRED';
  else if (row.status === 'IN_REPAIR' || row.work_order_id) status = 'WORK_SCHEDULED';
  else if (row.status === 'VERIFIED') status = 'CONFIRMED';

  return {
    defect_id: row.id,
    original_event_id: row.id,
    category,
    depth_estimate_cm: 7.2,
    area_estimate_m2: 0.55,
    severity: (row.severity as EventSeverity) || 'MEDIUM',
    road_segment_id: `SEG-${(row.address || 'MAIN').slice(0, 8).toUpperCase()}`,
    road_name: row.address || 'City Road',
    lane_number: 1,
    latitude: Number(row.latitude) || 12.9716,
    longitude: Number(row.longitude) || 77.5946,
    first_detected_at: row.created_at || new Date().toISOString(),
    last_verified_at: row.updated_at || row.created_at || new Date().toISOString(),
    detection_count: row.verification_count || 1,
    bus_sightings: [row.bus_id || 'BUS-402'],
    status,
    priority_score: Math.min(
      99,
      Math.round(
        Number(row.confidence_score || 0.9) * 85 + (row.severity === 'CRITICAL' ? 14 : 5)
      )
    ),
    assigned_to: row.assigned_to,
    work_order_id: row.work_order_id,
    evidence_uris: [
      row.image_url ||
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    ],
  };
}

class EventService implements IEventService {
  private events: Event[] = [];
  private defects: RoadDefect[] = [];
  private listeners: Set<EventListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isLoadedFromSupabase: boolean = false;

  constructor() {
    this.initStorage();
    this.fetchFromSupabase();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('roadsense_mesh_sync');
        this.broadcastChannel.onmessage = (msg) => {
          if (msg.data && msg.data.type === 'NEW_EVENT' && msg.data.event) {
            this.handleIncomingBroadcast(msg.data.event, msg.data.defect);
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }

      window.addEventListener('storage', (e) => {
        if (e.key === EVENTS_STORAGE_KEY && e.newValue) {
          try {
            this.events = JSON.parse(e.newValue);
            this.notifyListeners(this.events[0]);
          } catch {
            // parse error
          }
        }
      });
    }
  }

  private initStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }
      const storedDefects = localStorage.getItem(DEFECTS_STORAGE_KEY);
      if (storedDefects) {
        this.defects = JSON.parse(storedDefects);
      }
    } catch {
      // Storage error
    }
  }

  public async fetchFromSupabase(userIdFilter?: string): Promise<void> {
    try {
      const url = userIdFilter
        ? `/api/defects?user_id=${encodeURIComponent(userIdFilter)}`
        : `/api/defects`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();

      if (Array.isArray(rows) && rows.length > 0) {
        this.events = rows.map(mapDbRowToEvent);
        this.defects = rows.map(mapDbRowToDefect);
        this.isLoadedFromSupabase = true;
        this.persist();
      }
    } catch (err: any) {
      console.warn('Supabase defects API sync notice:', err.message);
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(this.events.slice(0, 150)));
      localStorage.setItem(DEFECTS_STORAGE_KEY, JSON.stringify(this.defects.slice(0, 100)));
    } catch {
      // Storage quota
    }
  }

  private handleIncomingBroadcast(newEvent: Event, newDefect?: RoadDefect) {
    if (!this.events.some((e) => e.event_id === newEvent.event_id)) {
      this.events.unshift(newEvent);
    }
    if (newDefect && !this.defects.some((d) => d.defect_id === newDefect.defect_id)) {
      this.defects.unshift(newDefect);
    }
    this.notifyListeners(newEvent);
  }

  public subscribe(callback: EventListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: Event) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in event listener:', err);
      }
    });
  }

  async getEvents(filters?: {
    type?: EventType;
    status?: EventStatus;
    severity?: EventSeverity;
    busId?: string;
    limit?: number;
    userId?: string;
  }): Promise<Event[]> {
    if (!this.isLoadedFromSupabase) {
      await this.fetchFromSupabase(filters?.userId);
    }

    let result = [...this.events];

    if (filters?.type) {
      result = result.filter((e) => e.event_type === filters.type);
    }
    if (filters?.status) {
      result = result.filter((e) => e.status === filters.status);
    }
    if (filters?.severity) {
      result = result.filter((e) => e.severity === filters.severity);
    }
    if (filters?.busId) {
      result = result.filter((e) => e.bus_id === filters.busId);
    }
    if (filters?.userId) {
      result = result.filter((e) => e.metadata?.user_id === filters.userId);
    }

    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async getEventById(eventId: string): Promise<Event | null> {
    const ev = this.events.find((e) => e.event_id === eventId);
    if (ev) return { ...ev };

    try {
      const res = await fetch(`/api/defects/${eventId}`);
      if (res.ok) {
        const row = await res.json();
        return mapDbRowToEvent(row);
      }
    } catch {
      // ignore
    }
    return null;
  }

  async createEvent(eventData: Omit<Event, 'event_id' | 'created_at'>): Promise<Event> {
    const newEvent: Event = {
      ...eventData,
      event_id: `EVT-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
    };
    this.events.unshift(newEvent);

    // Save to Supabase
    fetch('/api/defects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newEvent.event_id,
        defect_type: newEvent.event_type,
        severity: newEvent.severity,
        confidence_score: newEvent.confidence_score,
        status: newEvent.status,
        latitude: newEvent.latitude,
        longitude: newEvent.longitude,
        address: newEvent.title,
        bus_id: newEvent.bus_id,
        image_url: newEvent.evidence_uri,
      }),
    }).catch((err) => console.warn('Supabase event insert sync:', err));

    this.persist();
    this.notifyListeners(newEvent);
    return newEvent;
  }

  async createMobileDetection(payload: MobileDetectionPayload): Promise<{ event: Event; defect?: RoadDefect }> {
    const eventId = `EVT-${Date.now().toString().slice(-6)}`;
    const defectId = `DEF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const isWater = payload.category === 'WATERLOGGING';
    const isZebra = payload.category === 'ZEBRA_CROSSING';
    const isSign = payload.category === 'SIGNAGE';
    const eventType: EventType = isWater
      ? 'WATERLOGGING'
      : isZebra
      ? 'ZEBRA_CROSSING_PROBLEM'
      : isSign
      ? 'TRAFFIC_SIGN_PROBLEM'
      : payload.offendingPlate
      ? 'UNSAFE_DRIVING'
      : 'ROAD_DEFECT';

    // 1. Asynchronously upload snapshot image to Supabase Storage if dataURL is provided
    let publicImageUrl = payload.snapshotDataUrl;
    if (payload.snapshotDataUrl.startsWith('data:image/')) {
      try {
        const byteString = atob(payload.snapshotDataUrl.split(',')[1]);
        const mimeString = payload.snapshotDataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const uploadRes = await uploadReportImageToStorage(blob, defectId);
        if (uploadRes.url) {
          publicImageUrl = uploadRes.url;
        }
      } catch (uploadErr) {
        console.warn('Storage image upload skipped, using data URL:', uploadErr);
      }
    }

    const newEvent: Event = {
      event_id: eventId,
      event_type: eventType,
      severity: payload.severity,
      timestamp: new Date().toISOString(),
      bus_id: payload.busId,
      route_id: 'RT-MUNICIPAL-FIELD',
      road_segment_id: `SEG-${payload.roadName.replace(/\s+/g, '-').slice(0, 8).toUpperCase()}`,
      latitude: payload.latitude,
      longitude: payload.longitude,
      confidence: payload.confidence,
      confidence_score: payload.confidence,
      model_version: 'v2.4.1-EdgeYOLOv8',
      evidence_uri: publicImageUrl,
      status: 'DETECTED',
      created_at: new Date().toISOString(),
      title: payload.title,
      description: payload.description,
      metadata: {
        source: 'MOBILE_ONBOARD_CAMERA',
        depth_cm: payload.depthEstimateCm,
        area_m2: payload.areaEstimateM2,
        offending_plate: payload.offendingPlate,
        vehicle_speed_kmh: payload.vehicleSpeedKmh,
        user_id: payload.userId,
      },
    };

    this.events.unshift(newEvent);

    let defect: RoadDefect | undefined;
    defect = {
      defect_id: defectId,
      original_event_id: eventId,
      category: payload.category,
      depth_estimate_cm: payload.depthEstimateCm,
      area_estimate_m2: payload.areaEstimateM2,
      severity: payload.severity,
      road_segment_id: newEvent.road_segment_id,
      road_name: payload.roadName,
      lane_number: 1,
      latitude: payload.latitude,
      longitude: payload.longitude,
      first_detected_at: newEvent.timestamp,
      last_verified_at: newEvent.timestamp,
      detection_count: 1,
      bus_sightings: [payload.busId],
      status: payload.severity === 'CRITICAL' ? 'WORK_SCHEDULED' : 'UNVERIFIED',
      priority_score: Math.min(
        99,
        Math.round(payload.confidence * 85 + (payload.severity === 'CRITICAL' ? 14 : 5))
      ),
      evidence_uris: [publicImageUrl],
    };
    this.defects.unshift(defect);

    // Save directly to Supabase PostgreSQL Database via server endpoint
    try {
      await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: defectId,
          defect_type: payload.category,
          severity: payload.severity,
          confidence_score: payload.confidence,
          status: payload.severity === 'CRITICAL' ? 'VERIFIED' : 'DETECTED',
          latitude: payload.latitude,
          longitude: payload.longitude,
          address: payload.roadName,
          bus_id: payload.busId,
          user_id: payload.userId || null,
          reported_by_name: `${payload.busId} Dashcam`,
          image_url: publicImageUrl,
          speed_kmh: payload.vehicleSpeedKmh || 30,
        }),
      });
    } catch (dbErr) {
      console.error('Failed to post defect to Supabase:', dbErr);
    }

    // Auto-create PWD / Road Markings / Signage work order for high/critical defect or specialized hazards
    if (payload.severity === 'CRITICAL' || payload.severity === 'HIGH' || isZebra || isSign) {
      const taskTitle = isZebra
        ? `Repaint & Restore Zebra Crossing: ${payload.roadName}`
        : isSign
        ? `Repair / Realign Roadside Traffic Sign: ${payload.roadName}`
        : `Emergency Repair: ${payload.category} at ${payload.roadName}`;

      const dept = isZebra
        ? 'Municipal Road Markings & Pedestrian Safety Division'
        : isSign
        ? 'Traffic Engineering & Roadside Signage Department'
        : 'Public Works & Municipal Road Repair Division';

      maintenanceService.createTask({
        title: taskTitle,
        description: `Auto-dispatched from Mobile Sensing Node ${payload.busId}. ${payload.description}`,
        department: dept,
        priority: payload.severity === 'CRITICAL' ? 'P1_IMMEDIATE' : 'P2_24_HOURS',
        status: 'CREW_DISPATCHED',
        defect_id: defectId,
        target_completion_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        latitude: payload.latitude,
        longitude: payload.longitude,
        location_name: payload.roadName,
        estimated_cost_usd: isZebra ? 480 : isSign ? 650 : 1200,
      }).catch(() => {});

      alertService.addAlert({
        alert_id: `ALT-${Date.now().toString().slice(-6)}`,
        source_type: 'AI_EVENT',
        title: isZebra
          ? `Pedestrian Hazard: Zebra Crossing on ${payload.roadName}`
          : isSign
          ? `Roadside Alert: Traffic Sign Problem on ${payload.roadName}`
          : `Edge Camera Alert: ${payload.category} on ${payload.roadName}`,
        message: payload.description || `${payload.category} detected by mobile camera unit ${payload.busId}`,
        severity: payload.severity,
        source_id: eventId,
        created_at: newEvent.timestamp,
        is_dismissed: false,
        action_link: `/road-defects`,
      }).catch(() => {});
    }

    this.persist();

    // Broadcast across browser windows & tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'NEW_EVENT',
          event: newEvent,
          defect,
        });
      } catch {
        // Broadcast error
      }
    }

    this.notifyListeners(newEvent);
    return { event: newEvent, defect };
  }

  // Alias for MobileDashcamPage compatibility
  recordMobileDetection = (payload: MobileDetectionPayload) => this.createMobileDetection(payload);

  async updateEventStatus(eventId: string, status: EventStatus, notes?: string): Promise<Event> {
    const idx = this.events.findIndex((e) => e.event_id === eventId);
    if (idx === -1) throw new Error(`Event ${eventId} not found`);

    this.events[idx] = {
      ...this.events[idx],
      status,
      ...(notes ? { verification_notes: notes } : {}),
      verified_at: new Date().toISOString(),
    };

    // Sync to Supabase
    fetch(`/api/defects/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: status === 'CONFIRMED' ? 'VERIFIED' : (status === 'RESOLVED' ? 'REPAIRED' : status),
      }),
    }).catch(() => {});

    this.persist();
    return { ...this.events[idx] };
  }

  async getDefects(userIdFilter?: string): Promise<RoadDefect[]> {
    if (!this.isLoadedFromSupabase) {
      await this.fetchFromSupabase(userIdFilter);
    }
    return [...this.defects];
  }

  async getDefectById(defectId: string): Promise<RoadDefect | null> {
    const d = this.defects.find((def) => def.defect_id === defectId);
    if (d) return { ...d };

    try {
      const res = await fetch(`/api/defects/${defectId}`);
      if (res.ok) {
        const row = await res.json();
        return mapDbRowToDefect(row);
      }
    } catch {
      // ignore
    }
    return null;
  }

  async deleteDefect(defectId: string): Promise<boolean> {
    this.defects = this.defects.filter((d) => d.defect_id !== defectId);
    this.events = this.events.filter((e) => e.event_id !== defectId);
    this.persist();

    try {
      const res = await fetch(`/api/defects/${defectId}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Injects or updates a cross-validated pothole event during live demo
   */
  async injectDemoPotholeCrossValidation(data?: {
    defectId?: string;
    roadName?: string;
    lat?: number;
    lng?: number;
    depthCm?: number;
    areaM2?: number;
    busIds?: string[];
    status?: 'CONFIRMED' | 'REPAIRED' | 'UNVERIFIED' | 'WORK_SCHEDULED';
  }): Promise<void> {
    const defectId = data?.defectId || 'DEF-2026-4410';
    const roadName = data?.roadName || 'MG Road near Brigade Junction, Bengaluru';
    const lat = data?.lat ?? 12.9754;
    const lng = data?.lng ?? 77.6045;
    const depthCm = data?.depthCm ?? 8.4;
    const areaM2 = data?.areaM2 ?? 0.62;
    const busIds = data?.busIds || ['BUS-402', 'BUS-108', 'BUS-215'];
    const status = data?.status || 'CONFIRMED';

    const existingIdx = this.defects.findIndex((d) => d.defect_id === defectId);
    const defectObj: RoadDefect = {
      defect_id: defectId,
      original_event_id: 'EVT-DEMO-MG-001',
      category: 'POTHOLE',
      severity: 'CRITICAL',
      road_segment_id: `SEG-${roadName.replace(/\s+/g, '-').slice(0, 8).toUpperCase()}`,
      road_name: roadName,
      lane_number: 2,
      latitude: lat,
      longitude: lng,
      first_detected_at: new Date(Date.now() - 3600000).toISOString(),
      last_verified_at: new Date().toISOString(),
      detection_count: busIds.length,
      bus_sightings: busIds,
      depth_estimate_cm: depthCm,
      area_estimate_m2: areaM2,
      status: status,
      priority_score: 96,
      assigned_to: 'PWD Executive Division - South Ward 4',
      work_order_id: 'TASK-PWD-2026-781',
      evidence_uris: [
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      ],
    };

    if (existingIdx >= 0) {
      this.defects[existingIdx] = defectObj;
    } else {
      this.defects.unshift(defectObj);
    }
    this.persist();

    // Persist cross-validation update to Supabase
    fetch(`/api/defects/${defectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_count: busIds.length,
        status: status === 'CONFIRMED' ? 'VERIFIED' : status,
        assigned_to: defectObj.assigned_to,
        work_order_id: defectObj.work_order_id,
      }),
    }).catch(() => {});
  }
}

export const eventService = new EventService();
