/**
 * ROAD SENSE — SERVICE REGISTRY
 * All services adhere to strict interfaces and can be hot-swapped for cloud APIs.
 */

export * from './types';
export { authService } from './authService';
export { busService } from './busService';
export { cameraService } from './cameraService';
export { gpsService } from './gpsService';
export { aiService } from './aiService';
export { trackingService } from './trackingService';
export { eventService } from './eventService';
export { verificationService } from './verificationService';
export { incidentService } from './incidentService';
export { maintenanceService } from './maintenanceService';
export { alertService } from './alertService';
export { reportService } from './reportService';
export { monitoringService } from './monitoringService';
export { simulationService } from './simulationService';
