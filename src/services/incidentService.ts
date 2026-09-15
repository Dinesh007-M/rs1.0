import { MOCK_INCIDENTS } from '../data/mockData';
import { Incident } from '../types';
import { IIncidentService } from './types';

class IncidentService implements IIncidentService {
  private incidents: Incident[] = [...MOCK_INCIDENTS];

  async getIncidents(statusFilter?: Incident['status']): Promise<Incident[]> {
    if (statusFilter) {
      return this.incidents.filter((inc) => inc.status === statusFilter);
    }
    return [...this.incidents];
  }

  async getIncidentById(incidentId: string): Promise<Incident | null> {
    const inc = this.incidents.find((i) => i.incident_id === incidentId);
    return inc ? { ...inc } : null;
  }

  async updateIncidentStatus(incidentId: string, status: Incident['status'], note: string): Promise<Incident> {
    const idx = this.incidents.findIndex((i) => i.incident_id === incidentId);
    if (idx === -1) throw new Error(`Incident ${incidentId} not found`);

    const updated: Incident = {
      ...this.incidents[idx],
      status,
      updated_at: new Date().toISOString(),
      actions_taken: [
        ...this.incidents[idx].actions_taken,
        {
          timestamp: new Date().toISOString(),
          user: 'Cmdr. Elena Vance',
          note: note || `Status updated to ${status}`,
        },
      ],
    };

    this.incidents[idx] = updated;
    return updated;
  }

  async createIncident(data: Partial<Incident>): Promise<Incident> {
    const newInc: Incident = {
      incident_id: `INC-${Date.now().toString().slice(-4)}`,
      title: data.title || 'Mobile Sensing Incident',
      event_ids: data.event_ids || [],
      primary_event_type: data.primary_event_type || 'ROAD_DEFECT',
      severity: data.severity || 'HIGH',
      status: data.status || 'OPEN',
      latitude: data.latitude || 37.7749,
      longitude: data.longitude || -122.4194,
      address_or_crossroad: data.address_or_crossroad || 'Municipal Road Sector',
      reported_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_agency: data.assigned_agency || 'Metropolitan Traffic Control',
      impact_summary: data.impact_summary || 'Incident logged by Road Sense automated sensor mesh.',
      actions_taken: [
        {
          timestamp: new Date().toISOString(),
          user: 'Road Sense Intake',
          note: 'Incident created from verified sensor event stream.',
        },
      ],
    };

    this.incidents.unshift(newInc);
    return newInc;
  }
}

export const incidentService = new IncidentService();
