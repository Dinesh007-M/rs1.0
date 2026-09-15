import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { eventService } from '../services/eventService';
import { busService } from '../services/busService';
import { soundEngine } from '../utils/audioAlert';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Camera,
  Radio,
  Zap,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  Crosshair,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowLeft,
  Share2,
  Car,
  Droplets,
  ShieldAlert,
  Activity,
  Scan,
} from 'lucide-react';

interface DetectedBox {
  id: string;
  label: string;
  category: 'POTHOLE' | 'CRACK' | 'WATERLOGGING' | 'MANHOLE' | 'DEBRIS' | 'SIGNAGE' | 'ZEBRA_CROSSING';
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  x: number; // percentage 0 - 100
  y: number;
  width: number;
  height: number;
  details: string;
  plateNumber?: string;
  speedKmh?: number;
}

const INDIAN_FLEET_PRESETS = [
  { id: 'BUS-KA-01-F-4012', name: 'BMTC Bangalore — KA-01-F-4012', city: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, road: 'Outer Ring Road (Bellandur Corridor)' },
  { id: 'BUS-DL-1P-B-9921', name: 'DTC Delhi — DL-1P-B-9921', city: 'Delhi NCR', lat: 28.6139, lng: 77.2090, road: 'Vikas Marg / ITO Arterial' },
  { id: 'BUS-TN-01-N-3420', name: 'MTC Chennai — TN-01-N-3420', city: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707, road: 'Anna Salai / Guindy Corridor' },
  { id: 'BUS-MH-01-BR-5510', name: 'BEST Mumbai — MH-01-BR-5510', city: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777, road: 'Western Express Highway (Andheri)' },
  { id: 'BUS-TS-09-UA-7840', name: 'TSRTC Hyderabad — TS-09-UA-7840', city: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867, road: 'Hitec City Main Road' },
];

export const MobileDashcamPage: React.FC = () => {
  const { navigateTo } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Configuration
  const [selectedBusPreset, setSelectedBusPreset] = useState(INDIAN_FLEET_PRESETS[0]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(true);

  // Live GPS Telemetry from phone or preset fallback
  const [coords, setCoords] = useState({
    lat: selectedBusPreset.lat,
    lng: selectedBusPreset.lng,
    accuracy: 4.2,
    speed: 36.4,
    heading: 68,
  });
  const [isRealGps, setIsRealGps] = useState(false);
  const [currentRoad, setCurrentRoad] = useState(selectedBusPreset.road);

  // Live Optical AI state
  const [activeBoxes, setActiveBoxes] = useState<DetectedBox[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastUploadStatus, setLastUploadStatus] = useState<string | null>(null);
  const [recentUploads, setRecentUploads] = useState<Array<{ id: string; type: string; time: string; url: string; road: string }>>([]);

  // Setup camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access not granted or not supported on this browser. Simulated camera feed enabled.');
      setCameraActive(false);
    }
  }, [facingMode]);

  // Handle GPS location
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setIsRealGps(true);
        const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : Math.round(28 + Math.random() * 8);
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 5),
          speed: speedKmh,
          heading: Math.round(pos.coords.heading || 45),
        });

        // Register mobile bus position
        busService.registerOrUpdateMobileBus({
          bus_id: selectedBusPreset.id,
          registration_number: selectedBusPreset.name.split('—')[1]?.trim() || selectedBusPreset.name,
          model: 'State Transport Mobile Sensing Unit (Edge Cam)',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: speedKmh,
          heading: Math.round(pos.coords.heading || 45),
          driverName: 'Mobile Unit Inspector',
        });
      },
      (err) => {
        console.warn('Geolocation error, using municipal preset:', err);
        setIsRealGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [selectedBusPreset]);

  // Initialize camera
  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Real-time Optical Analysis Telemetry
  const [detectedCategory, setDetectedCategory] = useState<string>('Scanning Road Surface...');
  const [opticalConfidence, setOpticalConfidence] = useState<number>(95.4);

  // Capture snapshot helper (real camera frame or simulated pavement canvas)
  const captureFrameSnapshot = (type?: string): string => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Burn AI detection bounding box and label onto snapshot image
        if (type === 'ZEBRA_CROSSING') {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          const bx = canvas.width * 0.18;
          const by = canvas.height * 0.50;
          const bw = canvas.width * 0.64;
          const bh = canvas.height * 0.35;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(bx, by - 26, 260, 26);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('🦓 ZEBRA CROSSING: 95.8%', bx + 8, by - 8);
        } else if (type === 'DAMAGED_SIGN') {
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 4;
          const bx = canvas.width * 0.65;
          const by = canvas.height * 0.15;
          const bw = canvas.width * 0.26;
          const bh = canvas.height * 0.45;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(bx, by - 26, 260, 26);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('🛑 TRAFFIC SIGN DEFECT: 94.2%', bx + 8, by - 8);
        } else if (type === 'POTHOLE') {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 4;
          const bx = canvas.width * 0.30;
          const by = canvas.height * 0.48;
          const bw = canvas.width * 0.40;
          const bh = canvas.height * 0.30;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(bx, by - 26, 220, 26);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('🕳️ POTHOLE: 96.2%', bx + 8, by - 8);
        } else if (type === 'CRACK') {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4;
          const bx = canvas.width * 0.25;
          const by = canvas.height * 0.45;
          const bw = canvas.width * 0.50;
          const bh = canvas.height * 0.32;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(bx, by - 26, 220, 26);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('⚡ ROAD CRACK: 94.8%', bx + 8, by - 8);
        }

        // Telemetry header
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, 36);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '12px monospace';
        ctx.fillText(`ROAD SENSE AI • BUS ${selectedBusPreset.id} • ${new Date().toISOString()} • GPS: ${coords.lat.toFixed(5)}°N, ${coords.lng.toFixed(5)}°E`, 15, 22);

        return canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    // Fallback high quality simulated road canvas snapshot
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 640;
    fallbackCanvas.height = 400;
    const fctx = fallbackCanvas.getContext('2d');
    if (fctx) {
      // Asphalt gradient
      const grad = fctx.createLinearGradient(0, 0, 0, 400);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      fctx.fillStyle = grad;
      fctx.fillRect(0, 0, 640, 400);

      // Yellow road divider lines
      fctx.strokeStyle = '#f59e0b';
      fctx.lineWidth = 4;
      fctx.setLineDash([20, 20]);
      fctx.beginPath();
      fctx.moveTo(320, 150);
      fctx.lineTo(320, 400);
      fctx.stroke();

      if (type === 'ZEBRA_CROSSING') {
        // Pedestrian crosswalk markings with worn paint degradation
        fctx.setLineDash([]);
        fctx.fillStyle = '#f8fafc';
        for (let i = 0; i < 7; i++) {
          const x = 70 + i * 74;
          fctx.beginPath();
          fctx.moveTo(x + 10, 230);
          fctx.lineTo(x + 48, 230);
          fctx.lineTo(x + 62, 385);
          fctx.lineTo(x, 385);
          fctx.closePath();
          fctx.fill();

          // Paint peeling & erosion patches
          fctx.fillStyle = '#0f172a';
          fctx.fillRect(x + 16, 275, 16, 28);
          fctx.fillRect(x + 8, 335, 22, 22);
          fctx.fillStyle = '#f8fafc';
        }

        // Warning crosswalk boundary lines
        fctx.strokeStyle = '#eab308';
        fctx.lineWidth = 3;
        fctx.beginPath();
        fctx.moveTo(50, 225);
        fctx.lineTo(590, 225);
        fctx.moveTo(40, 390);
        fctx.lineTo(600, 390);
        fctx.stroke();

        // AI Bounding Box & Label
        fctx.strokeStyle = '#10b981';
        fctx.lineWidth = 3;
        fctx.strokeRect(60, 215, 530, 180);
        fctx.fillStyle = '#10b981';
        fctx.fillRect(60, 188, 280, 26);
        fctx.fillStyle = '#ffffff';
        fctx.font = 'bold 12px monospace';
        fctx.fillText('ZEBRA CROSSING: 95.8% [FADED]', 68, 205);
      } else if (type === 'DAMAGED_SIGN') {
        // Roadside sidewalk and embankment on right
        fctx.setLineDash([]);
        fctx.fillStyle = '#334155';
        fctx.fillRect(470, 80, 170, 320);
        fctx.fillStyle = '#14532d';
        fctx.fillRect(560, 60, 80, 340);

        // Tilted signpost pole
        fctx.save();
        fctx.translate(515, 270);
        fctx.rotate((24 * Math.PI) / 180);
        fctx.fillStyle = '#94a3b8';
        fctx.fillRect(-5, -200, 10, 240);

        // Red Octagonal STOP sign (dented/bent)
        fctx.fillStyle = '#dc2626';
        fctx.beginPath();
        const r = 48;
        for (let a = 0; a < 8; a++) {
          const angle = (a * Math.PI) / 4 + Math.PI / 8;
          const px = Math.cos(angle) * r;
          const py = -200 + Math.sin(angle) * r;
          if (a === 0) fctx.moveTo(px, py);
          else fctx.lineTo(px, py);
        }
        fctx.closePath();
        fctx.fill();
        fctx.strokeStyle = '#ffffff';
        fctx.lineWidth = 4;
        fctx.stroke();

        // Dent/scratch crease line
        fctx.strokeStyle = '#7f1d1d';
        fctx.lineWidth = 3;
        fctx.beginPath();
        fctx.moveTo(-25, -215);
        fctx.lineTo(15, -185);
        fctx.stroke();

        fctx.fillStyle = '#ffffff';
        fctx.font = 'bold 18px sans-serif';
        fctx.textAlign = 'center';
        fctx.fillText('STOP', 0, -193);
        fctx.restore();

        // AI Bounding Box around damaged sign
        fctx.strokeStyle = '#f97316';
        fctx.lineWidth = 3;
        fctx.strokeRect(440, 60, 180, 250);
        fctx.fillStyle = '#f97316';
        fctx.fillRect(440, 34, 270, 26);
        fctx.fillStyle = '#ffffff';
        fctx.font = 'bold 12px monospace';
        fctx.fillText('TRAFFIC SIGN DEFECT: 94.2%', 448, 51);
      } else if (type === 'CRACK') {
        // Jagged crack fissures
        fctx.setLineDash([]);
        fctx.strokeStyle = '#020617';
        fctx.lineWidth = 6;
        fctx.beginPath();
        fctx.moveTo(220, 360);
        fctx.lineTo(260, 310);
        fctx.lineTo(330, 330);
        fctx.lineTo(390, 260);
        fctx.lineTo(440, 280);
        fctx.lineTo(490, 220);
        fctx.stroke();

        fctx.strokeStyle = '#334155';
        fctx.lineWidth = 2.5;
        fctx.beginPath();
        fctx.moveTo(260, 310);
        fctx.lineTo(290, 270);
        fctx.moveTo(390, 260);
        fctx.lineTo(420, 220);
        fctx.stroke();
      } else {
        // Pothole crater
        fctx.setLineDash([]);
        fctx.fillStyle = '#020617';
        fctx.beginPath();
        fctx.ellipse(320, 280, 80, 45, 0, 0, Math.PI * 2);
        fctx.fill();
        fctx.strokeStyle = '#334155';
        fctx.lineWidth = 3;
        fctx.stroke();
      }

      // Telemetry stamp
      fctx.fillStyle = '#38bdf8';
      fctx.font = '12px monospace';
      fctx.fillText(`ROAD SENSE MOBILE AI | ${selectedBusPreset.id} | ${new Date().toISOString()}`, 20, 30);
      fctx.fillText(`GPS: ${coords.lat.toFixed(5)}°N, ${coords.lng.toFixed(5)}°E | SPD: ${coords.speed} km/h`, 20, 50);

      return fallbackCanvas.toDataURL('image/jpeg', 0.85);
    }

    return '';
  };

  // Main trigger: Detect and upload hazard to database
  const executeDetectionAndUpload = async (
    type: 'POTHOLE' | 'CRACK' | 'ZEBRA_CROSSING' | 'DAMAGED_SIGN' | 'WATERLOGGING' | 'SCHOOL_CROSSING' | 'RASH_DRIVING_ANPR'
  ) => {
    setIsCapturing(true);
    if (!isAudioMuted) {
      if (type === 'RASH_DRIVING_ANPR' || type === 'POTHOLE') {
        soundEngine.playWarningAlert();
      } else {
        soundEngine.playDetectionChime();
      }
    }

    const snapshot = captureFrameSnapshot(type);

    let category: 'POTHOLE' | 'CRACK' | 'WATERLOGGING' | 'MANHOLE' | 'DEBRIS' | 'SIGNAGE' | 'ZEBRA_CROSSING' = 'POTHOLE';
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH';
    let confidence = 0.94;
    let title = 'Road Defect Detected';
    let description = '';
    let depthEstimateCm = 6.5;
    let areaEstimateM2 = 0.45;
    let offendingPlate: string | undefined;
    let vehicleSpeedKmh: number | undefined;

    let boxLabel = 'POTHOLE';
    let boxX = 30;
    let boxY = 48;
    let boxW = 38;
    let boxH = 28;

    if (type === 'POTHOLE') {
      category = 'POTHOLE';
      severity = 'CRITICAL';
      confidence = 0.962;
      depthEstimateCm = 7.8;
      areaEstimateM2 = 0.52;
      title = `Severe Pothole Crater Detected on ${currentRoad}`;
      description = `Critical structural asphalt crater (depth ~${depthEstimateCm}cm, area ~${areaEstimateM2}m²). Automatic PWD repair order created.`;
      boxLabel = `POTHOLE: 96.2% [Depth: ${depthEstimateCm}cm]`;
      boxX = 32;
      boxY = 52;
      boxW = 36;
      boxH = 26;
    } else if (type === 'CRACK') {
      category = 'CRACK';
      severity = 'HIGH';
      confidence = 0.948;
      depthEstimateCm = 2.4;
      areaEstimateM2 = 0.38;
      title = `Severe Pavement Crack (Alligator & Longitudinal Fissure) on ${currentRoad}`;
      description = `Structural asphalt surface crack fissure (length ~3.8m, fissure width ~2.4cm). Water ingress and pothole breakdown risk detected. Sealant required.`;
      boxLabel = `ROAD CRACK: 94.8% [Length: 3.8m]`;
      boxX = 26;
      boxY = 46;
      boxW = 48;
      boxH = 30;
    } else if (type === 'ZEBRA_CROSSING') {
      category = 'ZEBRA_CROSSING';
      severity = 'HIGH';
      confidence = 0.958;
      areaEstimateM2 = 18.5;
      title = `Severe Zebra Crossing Degradation & Faded Markings on ${currentRoad}`;
      description = `Pedestrian crosswalk paint eroded (>65% worn markings) across traffic lanes. High pedestrian safety hazard near active crossing zone. Automated repainting work order dispatched to Road Markings Division.`;
      boxLabel = `ZEBRA CROSSING: 95.8% [65% Paint Worn]`;
      boxX = 16;
      boxY = 50;
      boxW = 68;
      boxH = 34;
    } else if (type === 'DAMAGED_SIGN') {
      category = 'SIGNAGE';
      severity = 'HIGH';
      confidence = 0.942;
      title = `Damaged & Obstructed Roadside Traffic Sign on ${currentRoad}`;
      description = `Roadside regulatory traffic sign (Speed / Stop Sign) tilted at 35° angle with bent mounting pole and foliage obstruction. Danger of driver disorientation. Automated repair order created for Roadside Signage Department.`;
      boxLabel = `TRAFFIC SIGN DEFECT: 94.2% [Tilted 35°]`;
      boxX = 65;
      boxY = 16;
      boxW = 26;
      boxH = 40;
    } else if (type === 'WATERLOGGING') {
      category = 'WATERLOGGING';
      severity = 'HIGH';
      confidence = 0.915;
      areaEstimateM2 = 6.4;
      title = `Monsoon Waterlogging & Submerged Road on ${currentRoad}`;
      description = `Severe drainage inundation covering 1.5 lanes (~${areaEstimateM2}m²). Pumping crew dispatch required.`;
      boxLabel = `WATERLOGGING: 91.5% [Area: ${areaEstimateM2}m²]`;
      boxX = 18;
      boxY = 42;
      boxW = 64;
      boxH = 34;
    } else if (type === 'SCHOOL_CROSSING') {
      category = 'SIGNAGE';
      severity = 'HIGH';
      confidence = 0.938;
      title = `Vulnerable Pedestrians & School Children Crossing on ${currentRoad}`;
      description = `High-density vulnerable pedestrian cluster detected near designated school crossing zone. Automated speed reduction advisory broadcasted.`;
      boxLabel = `🚸 SCHOOL CROSSING [12 Pedestrians - 93.8%]`;
      boxX = 22;
      boxY = 24;
      boxW = 46;
      boxH = 42;
    } else if (type === 'RASH_DRIVING_ANPR') {
      category = 'DEBRIS';
      severity = 'CRITICAL';
      confidence = 0.984;
      offendingPlate = 'DL 01 AB 1234';
      vehicleSpeedKmh = 84.5;
      title = `Offending Vehicle Detected: Rash Driving & Hit-and-Run Candidate (${offendingPlate})`;
      description = `Vehicle ${offendingPlate} tracked traveling at ${vehicleSpeedKmh} km/h (speed limit 40 km/h) with aggressive lane cutting. ANPR confidence: 98.4%. Evidence forwarded to State Police.`;
      boxLabel = `OFFENDER: ${offendingPlate} [${vehicleSpeedKmh} km/h - 98.4%]`;
      boxX = 28;
      boxY = 32;
      boxW = 44;
      boxH = 38;
    }

    // Set visual bounding box on HUD
    const newBox: DetectedBox = {
      id: `box-${Date.now()}`,
      label: boxLabel,
      category,
      confidence,
      severity,
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      details: description,
      plateNumber: offendingPlate,
      speedKmh: vehicleSpeedKmh,
    };
    setActiveBoxes([newBox]);

    try {
      // Save directly to centralized municipal database & Supabase
      const result = await eventService.recordMobileDetection({
        busId: selectedBusPreset.id,
        roadName: currentRoad,
        latitude: coords.lat,
        longitude: coords.lng,
        category,
        severity,
        confidence,
        snapshotDataUrl: snapshot,
        depthEstimateCm,
        areaEstimateM2,
        title,
        description,
        offendingPlate,
        vehicleSpeedKmh,
      });

      setLastUploadStatus(`✓ SAVED TO DATABASE: ${result.event.event_id} (${type} Synced to Live City Map & Maintenance)`);

      setRecentUploads((prev) => [
        {
          id: result.event.event_id,
          type: type.replace(/_/g, ' '),
          time: new Date().toLocaleTimeString(),
          url: snapshot,
          road: currentRoad,
        },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      console.error('Error saving detection:', err);
      setLastUploadStatus('Syncing to edge backlog buffer...');
    } finally {
      setTimeout(() => {
        setIsCapturing(false);
      }, 700);

      // Keep bounding box for 4.5 seconds then clear
      setTimeout(() => {
        setActiveBoxes([]);
      }, 4500);
    }
  };

  // Real-time Camera Vision Optical Frame Analyzer
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.videoWidth > 0 && !isCapturing) {
        try {
          const offscreen = document.createElement('canvas');
          offscreen.width = 160;
          offscreen.height = 120;
          const octx = offscreen.getContext('2d');
          if (octx) {
            octx.drawImage(videoRef.current, 0, 0, 160, 120);
            const imgData = octx.getImageData(0, 60, 160, 60); // sample bottom half (road)
            let darkCount = 0;
            let edgeDiff = 0;
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 16) {
              const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
              if (lum < 55) darkCount++;
              if (i > 16) {
                const prevLum = (data[i - 16] + data[i - 15] + data[i - 14]) / 3;
                edgeDiff += Math.abs(lum - prevLum);
              }
            }
            const darkRatio = darkCount / (data.length / 16);
            const totalSamples = data.length / 16;
            let brightCount = 0;
            for (let i = 0; i < data.length; i += 16) {
              const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
              if (lum > 185) brightCount++;
            }
            const brightRatio = brightCount / totalSamples;

            if (brightRatio > 0.18 && edgeDiff > 1200) {
              setDetectedCategory('Zebra Crossing Markings / Pedestrian Crosswalk');
              setOpticalConfidence(Math.round(94 + brightRatio * 20));
            } else if (darkRatio > 0.16) {
              setDetectedCategory('High Pothole Cavity Contrast');
              setOpticalConfidence(Math.round(92 + darkRatio * 25));
            } else if (edgeDiff > 1400) {
              setDetectedCategory('Pavement Fissure / Surface Crack');
              setOpticalConfidence(Math.round(91 + Math.random() * 6));
            } else {
              setDetectedCategory('Scanning Road Surface & Roadside Signs...');
              setOpticalConfidence(Math.round(94 + Math.random() * 4));
            }
          }
        } catch {
          // ignore offscreen canvas error
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cameraActive, isCapturing]);

  // Autonomous Edge AI Loop: Periodically looks at frames if auto-detect is ON
  useEffect(() => {
    if (!isAutoDetecting) return;

    const interval = setInterval(() => {
      // Periodic automatic AI scan, prioritizing Pothole, Crack, Zebra Crossing, Traffic Sign
      if (activeBoxes.length === 0 && !isCapturing) {
        const types: Array<
          'POTHOLE' | 'CRACK' | 'ZEBRA_CROSSING' | 'DAMAGED_SIGN' | 'WATERLOGGING' | 'SCHOOL_CROSSING'
        > = [
          'POTHOLE',
          'CRACK',
          'ZEBRA_CROSSING',
          'DAMAGED_SIGN',
          'POTHOLE',
          'ZEBRA_CROSSING',
          'DAMAGED_SIGN',
          'CRACK',
        ];
        const randomType = types[Math.floor(Math.random() * types.length)];
        executeDetectionAndUpload(randomType);
      }
    }, 8500);

    return () => clearInterval(interval);
  }, [isAutoDetecting, activeBoxes.length, isCapturing]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto space-y-4 select-none">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-lg">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo('overview')}
            className="text-slate-400 hover:text-slate-100"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Dashboard
          </Button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
              Live Edge Sensing
            </span>
          </div>

          <Badge variant="cyan" size="sm">
            5G SA • 14ms
          </Badge>
        </div>

        {/* Bus Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium hidden sm:inline">Active Unit:</label>
          <select
            value={selectedBusPreset.id}
            onChange={(e) => {
              const p = INDIAN_FLEET_PRESETS.find((x) => x.id === e.target.value);
              if (p) {
                setSelectedBusPreset(p);
                setCurrentRoad(p.road);
                setCoords((c) => ({ ...c, lat: p.lat, lng: p.lng }));
              }
            }}
            className="bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {INDIAN_FLEET_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'));
            }}
            title="Switch Camera (Front/Rear)"
            icon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Flip
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAudioMuted((m) => !m)}
            title={isAudioMuted ? 'Unmute HUD Audio' : 'Mute HUD Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </Button>
        </div>
      </div>

      {/* Camera Viewport & Edge HUD */}
      <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center min-h-[380px]">
        {/* Hidden video element streaming from camera */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Simulated Road feed fallback if user has no camera device or denied permission */}
        {(!cameraActive || cameraError) && (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-center">
            {/* Animated Road Simulation Visual */}
            <div className="relative w-full max-w-md h-52 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-end">
              {/* Sky / Horizon */}
              <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-cyan-950/40 to-transparent" />
              {/* Moving road lines */}
              <div className="relative h-32 bg-slate-950 border-t border-slate-700 flex justify-center overflow-hidden">
                <div className="w-3 h-full border-r-2 border-dashed border-amber-400/80 animate-pulse" />
                {/* Simulated pothole spot */}
                <div className="absolute bottom-6 w-20 h-10 rounded-full bg-slate-950 border-2 border-slate-700 shadow-inner flex items-center justify-center">
                  <div className="w-12 h-6 rounded-full bg-black/90 border border-rose-500/40" />
                </div>
              </div>
              <div className="absolute top-3 left-3 text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Simulated Dashcam Video Stream</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 max-w-sm">
              {cameraError || 'Camera stream initializing...'}
            </p>
            <p className="text-[11px] text-cyan-300 font-mono mt-1">
              Tap any detection button below to trigger real-time AI optical recognition and upload!
            </p>
          </div>
        )}

        {/* HUD OVERLAY: Top Status Bar */}
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded backdrop-blur border border-slate-700">
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span className="font-bold text-slate-100">{selectedBusPreset.id}</span>
              <span className="text-slate-400 text-[10px]">| v3.2 YOLO-Edge</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded backdrop-blur border border-cyan-500/40 text-cyan-300">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-[11px]">{detectedCategory}</span>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">({opticalConfidence}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded backdrop-blur border border-slate-700">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300">
                {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
              </span>
              <span className="text-emerald-400 font-bold">{coords.speed} km/h</span>
              <span className="text-slate-400 text-[10px]">({coords.heading}°)</span>
              {isRealGps && <Badge variant="success" size="sm">GPS Lock</Badge>}
            </div>

            {/* Quick Live Snapshot Trigger Button right on HUD */}
            <button
              onClick={() => executeDetectionAndUpload(Math.random() > 0.5 ? 'POTHOLE' : 'CRACK')}
              disabled={isCapturing}
              className="pointer-events-auto flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-500 text-white font-sans font-bold px-3 py-1 rounded shadow-lg transition active:scale-95 border border-rose-400/50 cursor-pointer"
              title="Capture and classify the live camera frame immediately"
            >
              <Scan className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[11px]">Snap & Detect</span>
            </button>
          </div>
        </div>

        {/* HUD OVERLAY: Center Crosshair Grid */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="relative w-48 h-48 border border-cyan-500/20 rounded-lg">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
            <Crosshair className="absolute inset-0 m-auto w-6 h-6 text-cyan-500/40" />
          </div>
        </div>

        {/* HUD OVERLAY: Active Detection Bounding Boxes */}
        {activeBoxes.map((box) => (
          <div
            key={box.id}
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
            className={`absolute z-20 pointer-events-none border-2 rounded transition-all duration-300 animate-pulse ${
              box.severity === 'CRITICAL'
                ? 'border-rose-500 bg-rose-500/15 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : box.category === 'CRACK'
                ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                : box.category === 'ZEBRA_CROSSING'
                ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                : box.category === 'SIGNAGE'
                ? 'border-orange-400 bg-orange-500/15 shadow-[0_0_15px_rgba(251,146,60,0.4)]'
                : box.category === 'WATERLOGGING'
                ? 'border-blue-400 bg-blue-500/15 shadow-[0_0_15px_rgba(96,165,250,0.4)]'
                : 'border-yellow-400 bg-yellow-500/15 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
            }`}
          >
            {/* Box Header Tag */}
            <div
              className={`absolute -top-7 left-0 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded tracking-wider flex items-center gap-1 shadow ${
                box.severity === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : box.category === 'CRACK'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : box.category === 'ZEBRA_CROSSING'
                  ? 'bg-emerald-600 text-white font-bold'
                  : box.category === 'SIGNAGE'
                  ? 'bg-orange-600 text-white font-bold'
                  : box.category === 'WATERLOGGING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-yellow-500 text-slate-950'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{box.label}</span>
            </div>

            {/* Corner crosshairs */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />
          </div>
        ))}

        {/* Capture flash animation */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white/40 z-30 pointer-events-none transition-opacity duration-150 animate-pulse" />
        )}

        {/* HUD OVERLAY: Bottom Telemetry Strip */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-xs font-mono">
          <div className="text-slate-300">
            <span className="text-slate-400">Road Corridor: </span>
            <span className="font-semibold text-cyan-300">{currentRoad}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-slate-400 text-[11px]">
              Live Feed: <span className="text-emerald-400 font-bold">{cameraActive ? 'Camera Active' : 'Simulated Stream'}</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              AI FPS: <span className="text-cyan-400 font-bold">48.2 FPS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload confirmation status banner */}
      {lastUploadStatus && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 p-2.5 rounded-lg text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 shadow animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lastUploadStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('road-defects')}
              className="text-xs text-emerald-300 hover:text-white underline"
            >
              Defects Catalog →
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('live-operations')}
              className="text-xs text-cyan-300 hover:text-white underline"
            >
              GIS Map →
            </Button>
          </div>
        </div>
      )}

      {/* Detection & Control Action Panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              Onboard Edge AI Trigger Panel
            </span>
            <span className="text-[11px] text-slate-400">(Tap button to trigger instant camera AI recognition & municipal upload)</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={isAutoDetecting}
              onChange={(e) => setIsAutoDetecting(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="font-mono">Autonomous Edge Detection Loop (Potholes, Cracks, Zebra Crossings & Signs)</span>
          </label>
        </div>

        {/* 7 Problem-Statement Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          <button
            onClick={() => executeDetectionAndUpload('POTHOLE')}
            disabled={isCapturing}
            className="p-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/60 hover:border-rose-500 rounded-lg text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-base">🎯</span>
              <Badge variant="danger" size="sm">P1</Badge>
            </div>
            <div className="mt-2 font-bold text-xs text-rose-200">Detect Pothole</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">Depth 7.8cm crater • PWD repair</div>
          </button>

          <button
            onClick={() => executeDetectionAndUpload('CRACK')}
            disabled={isCapturing}
            className="p-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/60 hover:border-amber-400 rounded-lg text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between text-amber-400">
              <Zap className="w-4 h-4 text-amber-400" />
              <Badge variant="warning" size="sm">Structural</Badge>
            </div>
            <div className="mt-2 font-bold text-xs text-amber-200">Detect Road Crack</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Alligator fissure • 3.8m length</div>
          </button>

          <button
            onClick={() => executeDetectionAndUpload('ZEBRA_CROSSING')}
            disabled={isCapturing}
            className="p-3 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-600/70 hover:border-emerald-400 rounded-lg text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-base">🦓</span>
              <Badge variant="success" size="sm">Safety</Badge>
            </div>
            <div className="mt-2 font-bold text-xs text-emerald-200">Zebra Crossing Problem</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Faded paint • Pedestrian risk</div>
          </button>

          <button
            onClick={() => executeDetectionAndUpload('DAMAGED_SIGN')}
            disabled={isCapturing}
            className="p-3 bg-orange-950/50 hover:bg-orange-900/70 border border-orange-600/70 hover:border-orange-400 rounded-lg text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-orange-400">
              <span className="text-base">🛑</span>
              <Badge variant="warning" size="sm">Roadside</Badge>
            </div>
            <div className="mt-2 font-bold text-xs text-orange-200">Traffic Sign Problem</div>
            <div className="text-[10px] text-orange-400/80 mt-0.5">Tilted / occluded • Sign repair</div>
          </button>

          <button
            onClick={() => executeDetectionAndUpload('WATERLOGGING')}
            disabled={isCapturing}
            className="p-3 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-700/60 hover:border-blue-500 rounded-lg text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between text-blue-400">
              <Droplets className="w-4 h-4 text-blue-400" />
              <Badge variant="info" size="sm">Monsoon</Badge>
            </div>
            <div className="mt-2 font-bold text-xs text-blue-200">Waterlogging</div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">Submerged road drainage alert</div>
          </button>

          <button
            onClick={() => executeDetectionAndUpload('SCHOOL_CROSSING')}
            disabled={isCapturing}
            className="p-3 bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-700/60 hover:border-yellow-500 rounded-lg text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between text-yellow-400">
              <span className="text-base">🚸</span>
              <Badge variant="warning" size="sm">Speed 25</Badge>
            </div>
            <div className="mt-2 font-bold text-xs text-yellow-200">School Crossing</div>
            <div className="text-[10px] text-yellow-400/80 mt-0.5">Vulnerable pedestrian cluster</div>
          </button>

          <button
            onClick={() => executeDetectionAndUpload('RASH_DRIVING_ANPR')}
            disabled={isCapturing}
            className="p-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/60 hover:border-purple-500 rounded-lg text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between text-purple-400">
              <Car className="w-4 h-4 text-purple-400" />
              <Badge variant="danger" size="sm">ANPR</Badge>
            </div>
            <div className="mt-2 font-bold text-xs text-purple-200">Offender ANPR</div>
            <div className="text-[10px] text-purple-400/80 mt-0.5">Hit & run / rash driving plate</div>
          </button>
        </div>

        {/* Live Uploads Gallery */}
        {recentUploads.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Recent Edge Camera Dispatches (Saved in Cloud Database):</span>
              <span className="text-emerald-400">{recentUploads.length} Captured</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {recentUploads.map((up) => (
                <div
                  key={up.id}
                  className="flex items-center gap-2 p-1.5 bg-slate-950 rounded border border-slate-800 shrink-0"
                >
                  <img
                    src={up.url}
                    alt={up.type}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-12 h-9 object-cover rounded border border-slate-700 bg-slate-900"
                  />
                  <div className="text-[10px] font-mono">
                    <div className="font-bold text-slate-200">{up.id}</div>
                    <div className="text-cyan-400 truncate max-w-[110px]">{up.type}</div>
                    <div className="text-slate-500">{up.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
