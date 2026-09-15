import { MaintenanceTask } from '../types';
import { IMaintenanceService } from './types';

function mapDbRowToTask(row: any): MaintenanceTask {
  let status: MaintenanceTask['status'] = 'CREW_DISPATCHED';
  const s = (row.status || '').toUpperCase();
  if (s === 'COMPLETED') status = 'COMPLETED';
  else if (s === 'IN_PROGRESS' || s === 'UNDER_REPAIR') status = 'UNDER_REPAIR';
  else if (s === 'SCHEDULED') status = 'SCHEDULED';
  else if (s === 'BACKLOG') status = 'BACKLOG';

  let priority: MaintenanceTask['priority'] = 'P2_24_HOURS';
  if (row.priority === 'CRITICAL' || row.priority === 'P1_IMMEDIATE') priority = 'P1_IMMEDIATE';
  else if (row.priority === 'LOW') priority = 'P4_ROUTINE';

  return {
    task_id: row.id,
    defect_id: row.defect_id,
    title: row.title || 'Road Repair Work Order',
    description: `Dispatched to ${row.contractor_name || 'PWD Crew'}. Asphalt Volume: ${row.asphalt_volume_m3 || 0.4}m³. SLA: ${row.sla_hours || 24}h.`,
    department: 'Municipal Public Works Department (PWD)',
    contractor_assigned: row.contractor_name || 'Apex Infrastructure Corp',
    priority,
    status,
    assigned_to: row.contractor_name || 'PWD Division 4 Team',
    target_completion_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    actual_completion_date: row.completed_at,
    latitude: 12.9716,
    longitude: 77.5946,
    location_name: 'Bengaluru Municipal Road Network',
    estimated_cost_usd: (row.asphalt_volume_m3 || 0.45) * 1800,
    created_at: row.created_at || new Date().toISOString(),
  };
}

class MaintenanceService implements IMaintenanceService {
  private tasks: MaintenanceTask[] = [];
  private isLoadedFromSupabase: boolean = false;
  private listeners: Array<() => void> = [];

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async loadFromSupabase(): Promise<void> {
    try {
      const res = await fetch('/api/work-orders');
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          this.tasks = rows.map(mapDbRowToTask);
          this.isLoadedFromSupabase = true;
        }
      }
    } catch (err: any) {
      console.warn('Supabase work-orders sync notice:', err.message);
    }
  }

  async getTasks(statusFilter?: MaintenanceTask['status']): Promise<MaintenanceTask[]> {
    if (!this.isLoadedFromSupabase || this.tasks.length === 0) {
      await this.loadFromSupabase();
    }
    if (statusFilter) {
      return this.tasks.filter((t) => t.status === statusFilter);
    }
    return [...this.tasks];
  }

  async getTaskById(taskId: string): Promise<MaintenanceTask | null> {
    const t = this.tasks.find((task) => task.task_id === taskId);
    if (t) return { ...t };
    await this.loadFromSupabase();
    return this.tasks.find((task) => task.task_id === taskId) || null;
  }

  async createTask(taskData: Omit<MaintenanceTask, 'task_id' | 'created_at'>): Promise<MaintenanceTask> {
    const taskId = `TASK-PWD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newTask: MaintenanceTask = {
      ...taskData,
      task_id: taskId,
      created_at: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);

    // Save to Supabase
    fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: taskId,
        defect_id: taskData.defect_id,
        title: taskData.title,
        priority: taskData.priority === 'P1_IMMEDIATE' ? 'CRITICAL' : 'HIGH',
        status: 'DISPATCHED',
        contractor_name: taskData.contractor_assigned || 'PWD Rapid Repair Crew',
        asphalt_volume_m3: 0.45,
        sla_hours: 24,
      }),
    }).catch((err) => console.warn('Supabase work-order insert error:', err));

    this.notify();
    return newTask;
  }

  async updateTaskStatus(taskId: string, status: MaintenanceTask['status']): Promise<MaintenanceTask> {
    const idx = this.tasks.findIndex((t) => t.task_id === taskId);
    if (idx !== -1) {
      this.tasks[idx] = {
        ...this.tasks[idx],
        status,
        ...(status === 'COMPLETED' ? { actual_completion_date: new Date().toISOString() } : {}),
      };
    }

    // Sync to Supabase
    fetch(`/api/work-orders/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      }),
    }).catch(() => {});

    this.notify();
    return idx !== -1 ? { ...this.tasks[idx] } : ({ task_id: taskId, status } as any);
  }
}

export const maintenanceService = new MaintenanceService();
