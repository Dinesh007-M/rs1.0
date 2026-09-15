import { Event, EventSeverity, EventType, SimulationConfig } from '../types';
import { eventService } from './eventService';
import { busService } from './busService';
import { ISimulationService } from './types';

export const INITIAL_SIMULATION_CONFIG: SimulationConfig = {
  is_demo_mode: true, // Activated by default for rich live demonstration
  bus_count: 5,
  gps_tick_rate_ms: 3000,
  detection_frequency_ms: 8000,
  network_condition: 'OPTIMAL_5G',
  mqtt_simulated_state: 'CONNECTED',
  auto_generate_events: true,
  event_types_filter: [
    'ROAD_DEFECT',
    'WATERLOGGING',
    'CONGESTION',
    'WRONG_WAY',
    'PEDESTRIAN_RISK',
    'MISSING_INFRASTRUCTURE',
    'UNSAFE_DRIVING',
  ],
  simulated_city: 'San Francisco Metro Urban Corridor',
};

class SimulationService implements ISimulationService {
  private config: SimulationConfig = { ...INITIAL_SIMULATION_CONFIG };
  private listeners: Array<(config: SimulationConfig) => void> = [];

  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<SimulationConfig>): Promise<SimulationConfig> {
    this.config = { ...this.config, ...newConfig };
    this.notifyListeners();
    return { ...this.config };
  }

  async resetSimulation(): Promise<void> {
    this.config = { ...INITIAL_SIMULATION_CONFIG };
    this.notifyListeners();
  }

  async triggerNetworkFailure(mode: SimulationConfig['network_condition']): Promise<void> {
    this.config.network_condition = mode;
    if (mode === 'OFFLINE_QUEUE') {
      this.config.mqtt_simulated_state = 'DISCONNECTED';
    } else if (mode === 'HIGH_LATENCY' || mode === 'INTERMITTENT_DROPS') {
      this.config.mqtt_simulated_state = 'DEGRADED';
    } else {
      this.config.mqtt_simulated_state = 'CONNECTED';
    }
    this.notifyListeners();
  }

  async injectSyntheticEvent(
    type?: EventType,
    severity?: EventSeverity
  ): Promise<Event> {
    const eventTypes: EventType[] = [
      'ROAD_DEFECT',
      'WATERLOGGING',
      'CONGESTION',
      'WRONG_WAY',
      'PEDESTRIAN_RISK',
      'MISSING_INFRASTRUCTURE',
      'UNSAFE_DRIVING',
    ];
    const selectedType = type || eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const severities: EventSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const selectedSeverity = severity || severities[Math.floor(Math.random() * severities.length)];

    const buses = await busService.getBuses();
    const randomBus = buses[Math.floor(Math.random() * buses.length)] || buses[0];

    // Jitter around bus current location
    const lat = randomBus.current_lat + (Math.random() - 0.5) * 0.006;
    const lng = randomBus.current_lng + (Math.random() - 0.5) * 0.006;

    const titles: Record<EventType, string> = {
      ROAD_DEFECT: 'High-Impact Pothole Cavity Detected',
      WATERLOGGING: 'Curb Drainage Backlog & Surface Flooding',
      CONGESTION: 'Lane Obstruction Causing Corridor Dwell Time',
      WRONG_WAY: 'Opposing Direction Vehicle Incursion Alert',
      HIT_AND_RUN_CANDIDATE: 'Unusual Stopping Pattern & Vehicle Impact Sound Burst',
      PEDESTRIAN_RISK: 'Pedestrian Crossing Through Blind Spot Curve',
      CAMERA_FAILURE: 'Sensor Frame Dropping / Optical Smear',
      UNSAFE_DRIVING: 'Rapid Deceleration & Erratic Swerve Detected',
      MISSING_INFRASTRUCTURE: 'Damaged Reflector Bollard / Missing Signboard',
      TRAFFIC_SIGN_PROBLEM: 'Damaged or Obstructed Roadside Regulatory Traffic Sign',
      ZEBRA_CROSSING_PROBLEM: 'Degraded / Faded Zebra Crossing Pedestrian Markings',
    };

    const newEvent = await eventService.createEvent({
      bus_id: randomBus.bus_id,
      camera_id: randomBus.cameras[0]?.camera_id || 'CAM-01',
      event_type: selectedType,
      severity: selectedSeverity,
      confidence: parseFloat((0.82 + Math.random() * 0.16).toFixed(3)),
      timestamp: new Date().toISOString(),
      latitude: parseFloat(lat.toFixed(5)),
      longitude: parseFloat(lng.toFixed(5)),
      road_segment_id: `SEG-${randomBus.route_id}-SIM`,
      model_version: 'RoadSense-Edge-v2.4.1',
      evidence_uri: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      status: 'DETECTED',
      title: titles[selectedType] || `Automated Detection: ${selectedType}`,
      description: `Synthetic detection generated in Demo Mode by mobile sensing node ${randomBus.bus_id}.`,
      assigned_department: 'Urban Intelligence Dispatch',
    });

    return newEvent;
  }

  subscribe(listener: (config: SimulationConfig) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l({ ...this.config }));
  }
}

export const simulationService = new SimulationService();
