import { MOCK_BUSES, MOCK_ROUTES } from '../data/mockData';
import { Bus, Route } from '../types';
import { IBusService } from './types';

function mapDbRowToBus(row: any): Bus {
  return {
    bus_id: row.id,
    registration_number: `KA-01-F-${row.id.slice(-4)}`,
    fleet_number: `FL-MUNI-${row.id.slice(-3)}`,
    operator: 'Bengaluru Metropolitan Transport Corporation (BMTC)',
    model: row.edge_device || 'Tata Starbus EV (NVIDIA Orin Edge)',
    route_id: 'RT-101',
    route_name: row.route_number || 'Majestic - Whitefield Corridor',
    operational_status: row.status === 'IDLE_CHARGING' ? 'MAINTENANCE_DEPOT' : 'ACTIVE_ON_ROUTE',
    cameras: [
      {
        camera_id: `${row.id}-CAM-FRONT`,
        bus_id: row.id,
        mount_position: 'FRONT_WINDSHIELD',
        resolution: '1080p',
        fps: Math.round(row.fps || 30),
        fov_degrees: 110,
        status: 'ONLINE',
        last_frame_timestamp: row.last_heartbeat || new Date().toISOString(),
        edge_inference_enabled: true,
        temperature_celsius: row.thermal_status === 'COOLING' ? 32.0 : 41.5,
      },
    ],
    edge_unit_id: `EDGE-${row.id.slice(-3)}`,
    model_version: 'v2.4.1-EdgeYOLOv8',
    current_driver_name: row.driver_name || 'Designated Driver',
    speed_kmh: Number(row.speed) || 30.0,
    heading_degrees: 85,
    current_lat: Number(row.latitude) || 12.9716,
    current_lng: Number(row.longitude) || 77.5946,
    last_ping_timestamp: row.last_heartbeat || new Date().toISOString(),
    sync_queue_pending: 0,
    battery_health_percent: 96,
  };
}

class BusService implements IBusService {
  private buses: Bus[] = [...MOCK_BUSES];
  private routes: Route[] = [...MOCK_ROUTES];
  private isLoadedFromSupabase: boolean = false;

  constructor() {
    this.loadFromSupabase();
  }

  async loadFromSupabase(): Promise<void> {
    try {
      const res = await fetch('/api/buses');
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          this.buses = rows.map(mapDbRowToBus);
          this.isLoadedFromSupabase = true;
        }
      }
    } catch (err: any) {
      console.warn('Supabase buses sync notice:', err.message);
    }
  }

  async getBuses(): Promise<Bus[]> {
    if (!this.isLoadedFromSupabase) {
      await this.loadFromSupabase();
    }
    return [...this.buses];
  }

  async getBusById(busId: string): Promise<Bus | null> {
    const found = this.buses.find((b) => b.bus_id === busId);
    return found ? { ...found } : null;
  }

  async getRoutes(): Promise<Route[]> {
    return [...this.routes];
  }

  async updateBusStatus(busId: string, status: Bus['operational_status']): Promise<Bus> {
    const idx = this.buses.findIndex((b) => b.bus_id === busId);
    if (idx === -1) throw new Error(`Bus ${busId} not found`);
    this.buses[idx] = { ...this.buses[idx], operational_status: status };
    return { ...this.buses[idx] };
  }

  async getBusTelemetry(busId: string): Promise<{ speed: number; heading: number; lat: number; lng: number }> {
    const bus = await this.getBusById(busId);
    if (!bus) throw new Error(`Bus ${busId} not found`);
    return {
      speed: bus.speed_kmh,
      heading: bus.heading_degrees,
      lat: bus.current_lat,
      lng: bus.current_lng,
    };
  }

  // Register or update dynamic mobile camera bus
  registerOrUpdateMobileBus(busData: {
    bus_id: string;
    registration_number: string;
    model: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    driverName?: string;
  }): Bus {
    const idx = this.buses.findIndex((b) => b.bus_id === busData.bus_id);
    if (idx !== -1) {
      this.buses[idx] = {
        ...this.buses[idx],
        current_lat: busData.lat,
        current_lng: busData.lng,
        speed_kmh: busData.speed,
        heading_degrees: busData.heading,
        last_ping_timestamp: new Date().toISOString(),
        operational_status: 'ACTIVE_ON_ROUTE',
      };

      // Sync telemetry to Supabase
      fetch('/api/buses/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: busData.bus_id,
          latitude: busData.lat,
          longitude: busData.lng,
          speed: busData.speed,
        }),
      }).catch(() => {});

      return { ...this.buses[idx] };
    }

    const newBus: Bus = {
      bus_id: busData.bus_id,
      registration_number: busData.registration_number,
      fleet_number: `FL-MOB-${busData.bus_id.slice(-4)}`,
      operator: 'State Transport Corporation (Mobile Unit)',
      model: busData.model || 'Smartphone Mobile Dashcam Unit',
      route_id: 'RT-101',
      route_name: 'Metro Urban Sensing Corridor',
      operational_status: 'ACTIVE_ON_ROUTE',
      cameras: [
        {
          camera_id: `${busData.bus_id}-CAM-FRONT`,
          bus_id: busData.bus_id,
          mount_position: 'FRONT_WINDSHIELD',
          resolution: '1080p',
          fps: 30,
          fov_degrees: 110,
          status: 'ONLINE',
          last_frame_timestamp: new Date().toISOString(),
          edge_inference_enabled: true,
          temperature_celsius: 36.2,
        },
      ],
      edge_unit_id: `EDGE-MOB-${busData.bus_id.slice(-4)}`,
      model_version: 'v2.4.1-EdgeYOLOv8',
      current_driver_name: busData.driverName || 'Mobile Operator (Active)',
      speed_kmh: busData.speed,
      heading_degrees: busData.heading,
      current_lat: busData.lat,
      current_lng: busData.lng,
      last_ping_timestamp: new Date().toISOString(),
      sync_queue_pending: 0,
      battery_health_percent: 98,
    };

    this.buses.unshift(newBus);

    // Sync new mobile sensing node to Supabase
    fetch('/api/buses/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: busData.bus_id,
        latitude: busData.lat,
        longitude: busData.lng,
        speed: busData.speed,
        status: 'ACTIVE_EN_ROUTE',
      }),
    }).catch(() => {});

    return newBus;
  }

  updateBusPosition(busId: string, lat: number, lng: number, speed: number, heading: number): void {
    const idx = this.buses.findIndex((b) => b.bus_id === busId);
    if (idx !== -1) {
      this.buses[idx] = {
        ...this.buses[idx],
        current_lat: lat,
        current_lng: lng,
        speed_kmh: speed,
        heading_degrees: heading,
        last_ping_timestamp: new Date().toISOString(),
      };
    }
  }
}

export const busService = new BusService();
