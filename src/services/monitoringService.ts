import { INITIAL_SYSTEM_STATUS, MOCK_DEVICE_HEALTH } from '../data/mockData';
import { AuditLog, DeviceHealth, SyncQueueItem, SystemStatus } from '../types';
import { IMonitoringService } from './types';

class MonitoringService implements IMonitoringService {
  private status: SystemStatus = { ...INITIAL_SYSTEM_STATUS };
  private deviceHealth: DeviceHealth[] = [...MOCK_DEVICE_HEALTH];
  private syncQueue: SyncQueueItem[] = [
    {
      queue_id: 'Q-901',
      bus_id: 'BUS-4015',
      payload_type: 'EVENT',
      payload_summary: 'Waterlogging event snapshot (1.2MB)',
      retry_count: 0,
      status: 'SYNCED',
      enqueued_at: new Date(Date.now() - 360000).toISOString(),
      synced_at: new Date(Date.now() - 355000).toISOString(),
    },
    {
      queue_id: 'Q-902',
      bus_id: 'BUS-3310',
      payload_type: 'EVIDENCE_BLOB',
      payload_summary: 'Thermal fault log & 30s video burst (4.8MB)',
      retry_count: 3,
      status: 'FAILED_RETRYING',
      enqueued_at: new Date(Date.now() - 1800000).toISOString(),
      error_message: 'MQTT edge broker timeout / low 4G signal (2 bars)',
    },
    {
      queue_id: 'Q-903',
      bus_id: 'BUS-6202',
      payload_type: 'GPS_BURST',
      payload_summary: '60s kinematic GPS burst buffer',
      retry_count: 0,
      status: 'QUEUED',
      enqueued_at: new Date(Date.now() - 30000).toISOString(),
    },
  ];

  private auditLogs: AuditLog[] = [
    {
      audit_id: 'AUD-001',
      user_id: 'usr-central-0941',
      user_name: 'Cmdr. Elena Vance',
      action: 'ESCALATE_INCIDENT',
      target_resource: 'INC-2026-0089',
      timestamp: new Date(Date.now() - 500000).toISOString(),
      ip_address: '10.240.12.88',
      details: { severity: 'CRITICAL', agency: 'CHP Unit 44' },
    },
    {
      audit_id: 'AUD-002',
      user_id: 'sys-edge-auto',
      user_name: 'Edge AI Consensus Engine',
      action: 'MERGE_DEFECT_RECORDS',
      target_resource: 'DEF-8821',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      ip_address: '127.0.0.1',
      details: { passesMerged: 3, roadSegment: 'SEG-CENTRAL-BLVD-E24' },
    },
  ];

  async getSystemStatus(): Promise<SystemStatus> {
    return { ...this.status, last_updated: new Date().toISOString() };
  }

  async getDeviceHealthList(): Promise<DeviceHealth[]> {
    return [...this.deviceHealth];
  }

  async getSyncQueue(): Promise<SyncQueueItem[]>{
    return [...this.syncQueue];
  }

  async getAuditLogs(limit: number = 20): Promise<AuditLog[]> {
    return this.auditLogs.slice(0, limit);
  }

  async simulateMqttPing(): Promise<{ latencyMs: number; brokerStatus: 'CONNECTED' | 'DISCONNECTED' }> {
    return {
      latencyMs: Math.floor(18 + Math.random() * 25),
      brokerStatus: this.status.mqtt_broker_status === 'DISCONNECTED' ? 'DISCONNECTED' : 'CONNECTED',
    };
  }

  updateSystemHealth(updates: Partial<SystemStatus>): void {
    this.status = { ...this.status, ...updates };
  }
}

export const monitoringService = new MonitoringService();
