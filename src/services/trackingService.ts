import { TrackedObject } from '../types';
import { ITrackingService } from './types';

class TrackingService implements ITrackingService {
  private activeTracks: TrackedObject[] = [
    {
      track_id: 'TRK-901',
      detection_class: 'VEHICLE_WRONG_WAY',
      first_seen_timestamp: new Date(Date.now() - 600000).toISOString(),
      last_seen_timestamp: new Date(Date.now() - 580000).toISOString(),
      trajectory_points: [
        { lat: 37.8091, lng: -122.4331, timestamp: new Date(Date.now() - 600000).toISOString() },
        { lat: 37.8095, lng: -122.4335, timestamp: new Date(Date.now() - 590000).toISOString() },
        { lat: 37.8099, lng: -122.4339, timestamp: new Date(Date.now() - 580000).toISOString() },
      ],
      estimated_velocity_kmh: 46.2,
      risk_score: 0.98,
    },
    {
      track_id: 'TRK-902',
      detection_class: 'PEDESTRIAN',
      first_seen_timestamp: new Date(Date.now() - 1200000).toISOString(),
      last_seen_timestamp: new Date(Date.now() - 1195000).toISOString(),
      trajectory_points: [
        { lat: 37.7760, lng: -122.4180, timestamp: new Date(Date.now() - 1200000).toISOString() },
        { lat: 37.7761, lng: -122.4182, timestamp: new Date(Date.now() - 1195000).toISOString() },
      ],
      estimated_velocity_kmh: 4.8,
      risk_score: 0.89,
    },
  ];

  async getActiveTrackedObjects(): Promise<TrackedObject[]> {
    return [...this.activeTracks];
  }

  async getTrackedObjectById(trackId: string): Promise<TrackedObject | null> {
    const obj = this.activeTracks.find((t) => t.track_id === trackId);
    return obj ? { ...obj } : null;
  }
}

export const trackingService = new TrackingService();
