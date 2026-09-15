import { MOCK_BUSES } from '../data/mockData';
import { GPSReading } from '../types';
import { IGpsService } from './types';

class GpsService implements IGpsService {
  async getLatestReadings(): Promise<GPSReading[]> {
    return MOCK_BUSES.map((b) => ({
      reading_id: `GPS-${b.bus_id}-${Date.now()}`,
      bus_id: b.bus_id,
      timestamp: b.last_ping_timestamp,
      latitude: b.current_lat,
      longitude: b.current_lng,
      altitude_m: 14.5,
      speed_kmh: b.speed_kmh,
      heading_degrees: b.heading_degrees,
      accuracy_meters: 1.2,
      satellites_in_view: 18,
      road_segment_id: `SEG-${b.route_id}-L1`,
    }));
  }

  async getReadingByBus(busId: string): Promise<GPSReading | null> {
    const bus = MOCK_BUSES.find((b) => b.bus_id === busId);
    if (!bus) return null;
    return {
      reading_id: `GPS-${bus.bus_id}-${Date.now()}`,
      bus_id: bus.bus_id,
      timestamp: bus.last_ping_timestamp,
      latitude: bus.current_lat,
      longitude: bus.current_lng,
      altitude_m: 14.5,
      speed_kmh: bus.speed_kmh,
      heading_degrees: bus.heading_degrees,
      accuracy_meters: 1.2,
      satellites_in_view: 18,
      road_segment_id: `SEG-${bus.route_id}-L1`,
    };
  }

  async getHistoricalBreadcrumbs(busId: string, limit: number = 20): Promise<GPSReading[]> {
    const bus = MOCK_BUSES.find((b) => b.bus_id === busId) || MOCK_BUSES[0];
    const breadcrumbs: GPSReading[] = [];
    const now = Date.now();

    for (let i = 0; i < limit; i++) {
      const offset = i * 0.0012;
      breadcrumbs.push({
        reading_id: `GPS-HIST-${bus.bus_id}-${i}`,
        bus_id: bus.bus_id,
        timestamp: new Date(now - i * 15000).toISOString(),
        latitude: bus.current_lat - offset * Math.cos(bus.heading_degrees * (Math.PI / 180)),
        longitude: bus.current_lng - offset * Math.sin(bus.heading_degrees * (Math.PI / 180)),
        altitude_m: 14 + Math.sin(i) * 2,
        speed_kmh: Math.max(10, bus.speed_kmh - (i % 5)),
        heading_degrees: bus.heading_degrees,
        accuracy_meters: 1.4,
        satellites_in_view: 16,
        road_segment_id: `SEG-${bus.route_id}`,
      });
    }

    return breadcrumbs;
  }
}

export const gpsService = new GpsService();
