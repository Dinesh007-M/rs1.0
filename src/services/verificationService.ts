import { eventService } from './eventService';
import { incidentService } from './incidentService';
import { maintenanceService } from './maintenanceService';
import { Event, Incident, MaintenanceTask } from '../types';
import { IVerificationService } from './types';

class VerificationService implements IVerificationService {
  async verifyEvent(
    eventId: string,
    verifiedBy: string,
    verdict: 'VALIDATE' | 'REJECT',
    notes: string
  ): Promise<Event> {
    const status = verdict === 'VALIDATE' ? 'VALIDATED' : 'REJECTED';
    const updated = await eventService.updateEventStatus(eventId, status, notes);
    updated.verified_by = verifiedBy;
    return updated;
  }

  async escalateToIncident(eventId: string, title: string, agency: string): Promise<Incident> {
    const event = await eventService.getEventById(eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);

    const incident = await incidentService.createIncident({
      title,
      event_ids: [eventId],
      primary_event_type: event.event_type,
      severity: event.severity,
      status: 'OPEN',
      latitude: event.latitude,
      longitude: event.longitude,
      address_or_crossroad: `Sector GPS: ${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`,
      assigned_agency: agency,
      impact_summary: `Escalated from Event ${event.event_id} (${event.event_type}) with confidence ${(event.confidence * 100).toFixed(1)}%`,
    });

    await eventService.updateEventStatus(eventId, 'PUBLISHED', `Escalated to Incident ${incident.incident_id}`);
    return incident;
  }

  async assignToMaintenance(
    eventId: string,
    department: string,
    priority: MaintenanceTask['priority']
  ): Promise<MaintenanceTask> {
    const event = await eventService.getEventById(eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);

    const task = await maintenanceService.createTask({
      defect_id: event.event_id,
      title: `Repair: ${event.title || event.event_type} (${event.road_segment_id})`,
      description: event.description || `Generated from sensing network event ${event.event_id}`,
      department,
      priority,
      status: 'SCHEDULED',
      target_completion_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      latitude: event.latitude,
      longitude: event.longitude,
      location_name: `Road Segment ${event.road_segment_id}`,
      estimated_cost_usd: priority === 'P1_IMMEDIATE' ? 1500 : 750,
    });

    await eventService.updateEventStatus(eventId, 'ASSIGNED', `Assigned to Task ${task.task_id}`);
    return task;
  }
}

export const verificationService = new VerificationService();
