import { MOCK_BUSES } from '../data/mockData';
import { Camera } from '../types';
import { ICameraService } from './types';

class CameraService implements ICameraService {
  private cameras: Camera[] = MOCK_BUSES.flatMap((b) => b.cameras);

  async getCameras(): Promise<Camera[]> {
    return [...this.cameras];
  }

  async getCamerasByBusId(busId: string): Promise<Camera[]> {
    return this.cameras.filter((c) => c.bus_id === busId);
  }

  async restartCamera(cameraId: string): Promise<boolean> {
    const cam = this.cameras.find((c) => c.camera_id === cameraId);
    if (!cam) return false;
    cam.status = 'ONLINE';
    cam.last_frame_timestamp = new Date().toISOString();
    return true;
  }

  async setInferenceState(cameraId: string, enabled: boolean): Promise<boolean> {
    const cam = this.cameras.find((c) => c.camera_id === cameraId);
    if (!cam) return false;
    cam.edge_inference_enabled = enabled;
    return true;
  }
}

export const cameraService = new CameraService();
