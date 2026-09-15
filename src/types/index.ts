/**
 * ROAD SENSE — TYPE SYSTEM & CANONICAL DEFINITIONS
 * AI-Powered Mobile Urban Sensing Network
 */

// ============================================================================
// 1. ROLES & USERS
// ============================================================================

export type Role = 
  | 'MUNICIPAL_ADMIN'
  | 'TRAFFIC_CONTROLLER'
  | 'MAINTENANCE_SUPERVISOR'
  | 'FLEET_MANAGER'
  | 'AI_SYSTEMS_ENGINEER'
  | 'FIELD_INSPECTOR'
  | 'CENTRAL_ADMIN'
  | 'FIELD_RESPONDER'
  | 'DATA_ANALYST';

export interface User {
  id: string;
  user_id?: string;
  name: string;
  full_name?: string;
  email: string;
  role: Role;
  department: string;
  avatar_url?: string;
  badge_number?: string;
  last_active_at?: string;
  last_login?: string;
  is_online?: boolean;
  mfa_enabled?: boolean;
  permissions?: string[];
  created_at?: string;
}

// ============================================================================
// 2. FLEET, BUSES, CAMERAS & ROUTES
// ============================================================================

export type BusOperationalStatus = 
  | 'ACTIVE_ON_ROUTE'
  | 'DEPOT_STANDBY'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'TELEMETRY_DEGRADED'
  | 'MAINTENANCE_DEPOT'
  | 'IDLE_CHARGING';

export interface Camera {
  camera_id: string;
  bus_id: string;
  mount_position: 'FRONT_WINDSHIELD' | 'DRIVER_FACING' | 'REAR' | 'CURBSIDE_DOOR';
  resolution: '1080p' | '4K' | '720p';
  fps: number;
  fov_degrees: number;
  status: 'ONLINE' | 'OFFLINE' | 'OCCLUDED' | 'FRAME_DROP' | 'CALIBRATING';
  last_frame_timestamp: string;
  edge_inference_enabled: boolean;
  temperature_celsius: number;
}

export interface Bus {
  bus_id: string;
  registration_number: string;
  fleet_number: string;
  operator: string;
  model: string;
  route_id: string;
  route_name: string;
  operational_status: BusOperationalStatus;
  cameras: Camera[];
  edge_unit_id: string;
  model_version: string;
  current_driver_name: string;
  speed_kmh: number;
  heading_degrees: number;
  current_lat: number;
  current_lng: number;
  last_ping_timestamp: string;
  sync_queue_pending: number;
  battery_health_percent: number;
}

export interface Route {
  route_id: string;
  route_code: string;
  name: string;
  corridor: string;
  length_km: number;
  assigned_bus_count: number;
  waypoints: Array<{ lat: number; lng: number; stop_name?: string }>;
  average_speed_kmh: number;
  congestion_index: number; // 0.0 - 1.0
  active_defects_count: number;
}

// ============================================================================
// 3. TELEMETRY & GPS
// ============================================================================

export interface GPSReading {
  reading_id: string;
  bus_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude_m: number;
  speed_kmh: number;
  heading_degrees: number;
  accuracy_meters: number;
  satellites_in_view: number;
  road_segment_id: string;
}

// ============================================================================
// 4. EDGE AI DETECTIONS & TRACKED OBJECTS
// ============================================================================

export type DetectionClass =
  | 'POTHOLE'
  | 'CRACK_LONGITUDINAL'
  | 'CRACK_ALLIGATOR'
  | 'WATERLOG_PUDDLE'
  | 'WATERLOG_DEEP'
  | 'MISSING_MANHOLE_COVER'
  | 'DAMAGED_SIGN'
  | 'FADED_LANE_MARKING'
  | 'FADED_ZEBRA_CROSSING'
  | 'PEDESTRIAN'
  | 'CYCLIST'
  | 'VEHICLE_WRONG_WAY'
  | 'DEBRIS_ON_ROAD';

export interface BoundingBox {
  x_min: number; // Normalized 0.0 to 1.0
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface Detection {
  detection_id: string;
  bus_id: string;
  camera_id: string;
  timestamp: string;
  detection_class: DetectionClass;
  confidence: number;
  bounding_box: BoundingBox;
  model_version: string;
  inference_time_ms: number;
  latitude: number;
  longitude: number;
  road_segment_id: string;
}

export interface TrackedObject {
  track_id: string;
  detection_class: DetectionClass;
  first_seen_timestamp: string;
  last_seen_timestamp: string;
  trajectory_points: Array<{ lat: number; lng: number; timestamp: string }>;
  estimated_velocity_kmh: number;
  risk_score: number;
}

// ============================================================================
// 5. CORE EVENT TYPE (CANONICAL)
// ============================================================================

export type EventType =
  | 'ROAD_DEFECT'
  | 'WATERLOGGING'
  | 'CONGESTION'
  | 'WRONG_WAY'
  | 'HIT_AND_RUN_CANDIDATE'
  | 'PEDESTRIAN_RISK'
  | 'CAMERA_FAILURE'
  | 'UNSAFE_DRIVING'
  | 'MISSING_INFRASTRUCTURE'
  | 'TRAFFIC_SIGN_PROBLEM'
  | 'ZEBRA_CROSSING_PROBLEM';

export type EventStatus =
  | 'DETECTED'
  | 'CANDIDATE'
  | 'VALIDATED'
  | 'PUBLISHED'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CONFIRMED'
  | 'INVESTIGATING';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Event {
  event_id: string;
  bus_id: string;
  camera_id?: string;
  route_id?: string;
  event_type: EventType;
  severity: EventSeverity;
  confidence: number; // 0.0 to 1.0
  confidence_score?: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  road_segment_id: string;
  model_version: string;
  evidence_uri: string;
  status: EventStatus;
  created_at: string;
  // Extended fields for command room intelligence
  title?: string;
  description?: string;
  verified_by?: string;
  verified_at?: string;
  assigned_department?: string;
  assigned_task_id?: string;
  verification_notes?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// 6. INCIDENTS, EVIDENCE & ROAD DEFECTS
// ============================================================================

export interface Evidence {
  evidence_id: string;
  event_id: string;
  type: 'IMAGE_SNAPSHOT' | 'VIDEO_CLIP_5SEC' | 'LIDAR_POINT_CLOUD' | 'IMU_BURST';
  uri: string;
  thumbnail_uri: string;
  captured_at: string;
  file_size_kb: number;
  encryption_hash: string;
  bounding_boxes?: BoundingBox[];
}

export interface Incident {
  incident_id: string;
  title: string;
  event_ids: string[];
  primary_event_type: EventType;
  severity: EventSeverity;
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED' | 'DISPATCHED' | 'CLOSED';
  latitude: number;
  longitude: number;
  address_or_crossroad: string;
  reported_at: string;
  updated_at: string;
  lead_responder?: string;
  assigned_agency: string; // e.g. "Metropolitan Traffic Police", "Public Works Dept"
  impact_summary: string;
  actions_taken: Array<{ timestamp: string; user: string; note: string }>;
}

export interface RoadDefect {
  defect_id: string;
  original_event_id: string;
  category: 'POTHOLE' | 'CRACK' | 'WATERLOGGING' | 'MANHOLE' | 'DEBRIS' | 'SIGNAGE' | 'ZEBRA_CROSSING';
  depth_estimate_cm?: number;
  area_estimate_m2?: number;
  severity: EventSeverity;
  road_segment_id: string;
  road_name: string;
  lane_number: number;
  latitude: number;
  longitude: number;
  first_detected_at: string;
  last_verified_at: string;
  detection_count: number; // how many bus passes verified this
  bus_sightings: string[];
  status: 'UNVERIFIED' | 'CONFIRMED' | 'WORK_SCHEDULED' | 'REPAIRED' | 'ARCHIVED';
  priority_score: number; // 0 - 100 calculated by municipal algorithm
  assigned_to?: string;
  work_order_id?: string;
  evidence_uris?: string[];
}

// ============================================================================
// 7. MAINTENANCE & WORK ORDERS
// ============================================================================

export type MaintenancePriority = 'P1_IMMEDIATE' | 'P2_24_HOURS' | 'P3_WEEKLY' | 'P4_ROUTINE';

export interface MaintenanceTask {
  task_id: string;
  defect_id?: string;
  incident_id?: string;
  title: string;
  description: string;
  department: string;
  contractor_assigned?: string;
  priority: MaintenancePriority;
  status: 'BACKLOG' | 'SCHEDULED' | 'CREW_DISPATCHED' | 'UNDER_REPAIR' | 'COMPLETED' | 'INSPECTION_PENDING';
  assigned_to?: string;
  target_completion_date: string;
  actual_completion_date?: string;
  latitude: number;
  longitude: number;
  location_name: string;
  estimated_cost_usd?: number;
  repair_evidence_uri?: string;
  created_at: string;
}

// ============================================================================
// 8. ALERTS & NOTIFICATIONS
// ============================================================================

export interface Alert {
  alert_id: string;
  source_type: 'AI_EVENT' | 'FLEET_ANOMALY' | 'CAMERA_FAILURE' | 'SYSTEM_THRESHOLD';
  title: string;
  message: string;
  severity: EventSeverity;
  source_id: string; // event_id or bus_id
  created_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  is_dismissed: boolean;
  action_link?: string;
}

export interface Notification {
  notification_id: string;
  recipient_role?: Role;
  recipient_user_id?: string;
  category: 'URGENT_INCIDENT' | 'DEFECT_REPORT' | 'HARDWARE_ALERT' | 'SYSTEM_UPDATE';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  related_entity_type?: 'EVENT' | 'INCIDENT' | 'BUS' | 'TASK';
  related_entity_id?: string;
}

// ============================================================================
// 9. HARDWARE, MODEL VERSION, SYNC QUEUE & AUDIT
// ============================================================================

export interface ModelVersion {
  version_id: string;
  name: string; // e.g., "RoadSense-Edge-YOLOv8-v2.4"
  model_type: 'OBJECT_DETECTION' | 'SEGMENTATION' | 'CLASSIFICATION';
  framework: 'TensorRT' | 'ONNX' | 'TFLite';
  release_date: string;
  deployed_fleet_count: number;
  inference_latency_ms: number;
  accuracy_map50: number; // Mean average precision
  status: 'ACTIVE' | 'CANARY' | 'DEPRECATED' | 'TRAINING';
  checksum: string;
}

export interface DeviceHealth {
  device_id: string;
  bus_id: string;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  gpu_temperature_c: number;
  storage_free_gb: number;
  network_signal_bars: number;
  network_type: '5G_SA' | '4G_LTE' | 'OFFLINE_CACHE';
  mqtt_connection_status: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
  uptime_seconds: number;
  last_heartbeat: string;
}

export interface SyncQueueItem {
  queue_id: string;
  bus_id: string;
  payload_type: 'EVENT' | 'GPS_BURST' | 'CAMERA_HEARTBEAT' | 'EVIDENCE_BLOB';
  payload_summary: string;
  retry_count: number;
  status: 'QUEUED' | 'UPLOADING' | 'FAILED_RETRYING' | 'SYNCED';
  enqueued_at: string;
  synced_at?: string;
  error_message?: string;
}

export interface AuditLog {
  audit_id: string;
  user_id: string;
  user_name: string;
  action: string;
  target_resource: string;
  timestamp: string;
  ip_address: string;
  details: Record<string, unknown>;
}

// ============================================================================
// 10. SYSTEM STATUS & DEMO SIMULATION
// ============================================================================

export interface SystemStatus {
  platform_health: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  active_buses_count: number;
  total_fleet_count: number;
  cameras_online_count: number;
  total_cameras_count: number;
  events_today_count: number;
  ingestion_latency_ms: number;
  mqtt_broker_status: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  edge_sync_backlog: number;
  last_updated: string;
}

export interface SimulationConfig {
  is_demo_mode: boolean;
  bus_count: number;
  gps_tick_rate_ms: number;
  detection_frequency_ms: number;
  network_condition: 'OPTIMAL_5G' | 'HIGH_LATENCY' | 'INTERMITTENT_DROPS' | 'OFFLINE_QUEUE';
  mqtt_simulated_state: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  auto_generate_events: boolean;
  event_types_filter: EventType[];
  simulated_city: string;
}

// ============================================================================
// 11. NAVIGATION & ROUTING
// ============================================================================

export type NavigationPath =
  | 'overview'
  | 'mobile-dashcam'
  | 'live-operations'
  | 'incidents'
  | 'road-defects'
  | 'school-safety'
  | 'anpr-tracker'
  | 'traffic'
  | 'fleet'
  | 'ai-detection'
  | 'maintenance'
  | 'reports'
  | 'alerts'
  | 'monitoring'
  | 'models'
  | 'audit'
  | 'users'
  | 'settings';

export type ThemeMode = 'bharat-navy' | 'civic-light' | 'tactical-emerald' | 'slate-dark';
