/**
 * ROAD SENSE — SERVICE CONTRACTS & INTERFACES
 * Designed to allow seamless replacement of mock services with real backend endpoints.
 */

import {
  Alert,
  AuditLog,
  Bus,
  Camera,
  DeviceHealth,
  Event,
  EventSeverity,
  EventStatus,
  EventType,
  GPSReading,
  Incident,
  MaintenanceTask,
  ModelVersion,
  Notification,
  RoadDefect,
  Route,
  SimulationConfig,
  SyncQueueItem,
  SystemStatus,
  TrackedObject,
  User,
} from '../types';

export interface IAuthService {
  getCurrentUser(): Promise<User>;
  updateUser(user: Partial<User>): Promise<User>;
  switchRole(role: User['role']): Promise<User>;
}

export interface IBusService {
  getBuses(): Promise<Bus[]>;
  getBusById(busId: string): Promise<Bus | null>;
  getRoutes(): Promise<Route[]>;
  updateBusStatus(busId: string, status: Bus['operational_status']): Promise<Bus>;
  getBusTelemetry(busId: string): Promise<{ speed: number; heading: number; lat: number; lng: number }>;
}

export interface ICameraService {
  getCameras(): Promise<Camera[]>;
  getCamerasByBusId(busId: string): Promise<Camera[]>;
  restartCamera(cameraId: string): Promise<boolean>;
  setInferenceState(cameraId: string, enabled: boolean): Promise<boolean>;
}

export interface IGpsService {
  getLatestReadings(): Promise<GPSReading[]>;
  getReadingByBus(busId: string): Promise<GPSReading | null>;
  getHistoricalBreadcrumbs(busId: string, limit?: number): Promise<GPSReading[]>;
}

export interface IAiService {
  getModelVersions(): Promise<ModelVersion[]>;
  deployModelToFleet(versionId: string, busIds: string[]): Promise<boolean>;
  getInferenceMetrics(): Promise<{
    averageLatencyMs: number;
    detectionsLastHour: number;
    falsePositiveRatePercent: number;
    activeModels: number;
  }>;
}

export interface ITrackingService {
  getActiveTrackedObjects(): Promise<TrackedObject[]>;
  getTrackedObjectById(trackId: string): Promise<TrackedObject | null>;
}

export interface IEventService {
  getEvents(filters?: {
    type?: EventType;
    status?: EventStatus;
    severity?: EventSeverity;
    busId?: string;
    limit?: number;
  }): Promise<Event[]>;
  getEventById(eventId: string): Promise<Event | null>;
  createEvent(event: Omit<Event, 'event_id' | 'created_at'>): Promise<Event>;
  updateEventStatus(eventId: string, status: EventStatus, notes?: string): Promise<Event>;
  getDefects(): Promise<RoadDefect[]>;
  getDefectById(defectId: string): Promise<RoadDefect | null>;
}

export interface IVerificationService {
  verifyEvent(eventId: string, verifiedBy: string, verdict: 'VALIDATE' | 'REJECT', notes: string): Promise<Event>;
  escalateToIncident(eventId: string, title: string, agency: string): Promise<Incident>;
  assignToMaintenance(eventId: string, department: string, priority: MaintenanceTask['priority']): Promise<MaintenanceTask>;
}

export interface IIncidentService {
  getIncidents(statusFilter?: Incident['status']): Promise<Incident[]>;
  getIncidentById(incidentId: string): Promise<Incident | null>;
  updateIncidentStatus(incidentId: string, status: Incident['status'], note: string): Promise<Incident>;
  createIncident(data: Partial<Incident>): Promise<Incident>;
}

export interface IMaintenanceService {
  getTasks(statusFilter?: MaintenanceTask['status']): Promise<MaintenanceTask[]>;
  getTaskById(taskId: string): Promise<MaintenanceTask | null>;
  createTask(task: Omit<MaintenanceTask, 'task_id' | 'created_at'>): Promise<MaintenanceTask>;
  updateTaskStatus(taskId: string, status: MaintenanceTask['status']): Promise<MaintenanceTask>;
}

export interface IAlertService {
  getAlerts(includeDismissed?: boolean): Promise<Alert[]>;
  dismissAlert(alertId: string): Promise<boolean>;
  acknowledgeAlert(alertId: string, user: string): Promise<Alert>;
  getNotifications(): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<boolean>;
}

export interface IReportService {
  getUrbanHealthSummary(): Promise<{
    roadQualityIndex: number; // 0-100
    potholeDensityPerKm: number;
    hazardResolutionRatePercent: number;
    inspectedRoadKm: number;
    dailyDetectedDefectsCount: number;
    trendComparedToLastMonth: number;
  }>;
  generateReport(reportType: 'ROAD_DAMAGE' | 'SAFETY_AUDIT' | 'FLEET_HEALTH', dateRange: string): Promise<{
    reportId: string;
    downloadUrl: string;
    generatedAt: string;
    metrics: Record<string, unknown>;
  }>;
  exportData(format: 'DEFECTS_CSV' | 'RAW_EVENTS_JSON' | 'REPORT_CSV'): Promise<Blob>;
}

export interface IMonitoringService {
  getSystemStatus(): Promise<SystemStatus>;
  getDeviceHealthList(): Promise<DeviceHealth[]>;
  getSyncQueue(): Promise<SyncQueueItem[]>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  simulateMqttPing(): Promise<{ latencyMs: number; brokerStatus: 'CONNECTED' | 'DISCONNECTED' }>;
}

export interface ISimulationService {
  getConfig(): SimulationConfig;
  updateConfig(config: Partial<SimulationConfig>): Promise<SimulationConfig>;
  resetSimulation(): Promise<void>;
  injectSyntheticEvent(type?: EventType, severity?: EventSeverity): Promise<Event>;
  triggerNetworkFailure(mode: SimulationConfig['network_condition']): Promise<void>;
}
