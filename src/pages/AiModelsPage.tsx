import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Cpu,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface EdgeModel {
  id: string;
  name: string;
  architecture: string;
  currentVersion: string;
  previousVersion: string;
  targetTask: string;
  quantization: 'INT8_TENSORRT' | 'FP16_CUDA' | 'ONNX_RUNTIME';
  meanInferenceTimeMs: number;
  mAP50: number;
  accuracyScore: number;
  fleetRolloutPercent: number;
  status: 'ACTIVE_PRODUCTION' | 'CANARY_TEST' | 'ROLLING_OUT' | 'DEPRECATED';
  lastUpdated: string;
  classesDetected: string[];
}

const INITIAL_MODELS: EdgeModel[] = [
  {
    id: 'MDL-YOLO-01',
    name: 'RoadSense-DefectDetector-YOLOv8',
    architecture: 'YOLOv8-Nano (Optimized Edge Head)',
    currentVersion: 'v2.4.1',
    previousVersion: 'v2.3.8',
    targetTask: 'Road Asphalt Surface Hazards',
    quantization: 'INT8_TENSORRT',
    meanInferenceTimeMs: 22.4,
    mAP50: 0.948,
    accuracyScore: 94.8,
    fleetRolloutPercent: 100,
    status: 'ACTIVE_PRODUCTION',
    lastUpdated: '3 days ago',
    classesDetected: ['POTHOLE', 'LONGITUDINAL_CRACK', 'ALLIGATOR_CRACK', 'WATERLOGGING', 'MISSING_MANHOLE'],
  },
  {
    id: 'MDL-ANPR-02',
    name: 'RoadSense-ANPR-OCR-MobileNet',
    architecture: 'MobileNetV4-BiFPN + CTC Decoder',
    currentVersion: 'v1.8.2',
    previousVersion: 'v1.7.9',
    targetTask: 'Indian Registration Number Plates & OCR',
    quantization: 'FP16_CUDA',
    meanInferenceTimeMs: 14.8,
    mAP50: 0.976,
    accuracyScore: 97.6,
    fleetRolloutPercent: 85,
    status: 'ROLLING_OUT',
    lastUpdated: '12 hours ago',
    classesDetected: ['NUMBER_PLATE_IND', 'COMMERCIAL_YELLOW', 'PRIVATE_WHITE', 'ELECTRIC_GREEN'],
  },
  {
    id: 'MDL-PED-03',
    name: 'RoadSense-Pedestrian-SchoolCross-Tracker',
    architecture: 'ByteTrack + ShuffleNetV2',
    currentVersion: 'v3.1.0',
    previousVersion: 'v3.0.4',
    targetTask: 'School Children & Pedestrian Trajectory Risk',
    quantization: 'INT8_TENSORRT',
    meanInferenceTimeMs: 18.1,
    mAP50: 0.962,
    accuracyScore: 96.2,
    fleetRolloutPercent: 100,
    status: 'ACTIVE_PRODUCTION',
    lastUpdated: 'Yesterday',
    classesDetected: ['SCHOOL_CHILD', 'PEDESTRIAN_ADULT', 'BICYCLE', 'CROSSWALK_OBSTACLE'],
  },
  {
    id: 'MDL-TRAF-04',
    name: 'RoadSense-TrafficDensity-FlowNet',
    architecture: 'DeepLabV3-Lite (Corridor Flow)',
    currentVersion: 'v2.0.0-rc3',
    previousVersion: 'v1.9.1',
    targetTask: 'Multi-Lane Congestion & Speed Estimation',
    quantization: 'ONNX_RUNTIME',
    meanInferenceTimeMs: 31.0,
    mAP50: 0.912,
    accuracyScore: 91.2,
    fleetRolloutPercent: 25,
    status: 'CANARY_TEST',
    lastUpdated: '4 hours ago',
    classesDetected: ['BUS', 'TRUCK', 'CAR', 'AUTO_RICKSHAW', 'TWO_WHEELER', 'LANE_OCCUPANCY'],
  },
];

export const AiModelsPage: React.FC = () => {
  const [models, setModels] = useState<EdgeModel[]>(INITIAL_MODELS);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const handleRollback = (id: string) => {
    setActiveActionId(id);
    setTimeout(() => {
      setModels((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                currentVersion: m.previousVersion,
                status: 'ACTIVE_PRODUCTION',
                lastUpdated: 'Just now (Rolled back)',
              }
            : m
        )
      );
      setActiveActionId(null);
    }, 1200);
  };

  const handleDeployCanary = (id: string) => {
    setActiveActionId(id);
    setTimeout(() => {
      setModels((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                fleetRolloutPercent: 100,
                status: 'ACTIVE_PRODUCTION',
                lastUpdated: 'Just now (100% Rollout)',
              }
            : m
        )
      );
      setActiveActionId(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">
              Edge AI Model Management & OTA Rollout
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Over-The-Air (OTA) deployment, TensorRT quantization, inference latency benchmarking, and rollback orchestration for onboard bus GPUs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Model artifact upload dialog opened. Supports ONNX, TensorRT Plan, and PyTorch TorchScript weights.')}
            icon={<Upload className="w-4 h-4 text-cyan-400" />}
          >
            Upload Model Artifact (.engine / .onnx)
          </Button>
        </div>
      </div>

      {/* Model Ops Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Active Production Models</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {models.filter((m) => m.status === 'ACTIVE_PRODUCTION').length} Models
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dispatched to 5 live transit fleets</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Mean Edge GPU Latency</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">21.6 ms</div>
          <div className="text-[11px] text-slate-400 mt-0.5">NVIDIA Jetson / Snapdragon Edge</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Quantization Standard</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">INT8 / FP16</div>
          <div className="text-[11px] text-slate-400 mt-0.5">4.2x speedup over vanilla float32</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Canary Rollout Active</div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">1 Model</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Evaluating on 25% of fleet buses</div>
        </Card>
      </div>

      {/* Models List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Registered Edge Neural Network Models
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {models.map((m) => (
            <Card key={m.id} className="p-5 border border-slate-800 bg-slate-900/60 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-base">{m.name}</span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded">
                      {m.currentVersion}
                    </span>
                    <Badge
                      variant={
                        m.status === 'ACTIVE_PRODUCTION'
                          ? 'success'
                          : m.status === 'ROLLING_OUT'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {m.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Target: <span className="text-slate-200">{m.targetTask}</span> • Architecture: {m.architecture}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-400">Updated {m.lastUpdated}</div>
                  <div className="text-[11px] font-mono text-slate-500">ID: {m.id}</div>
                </div>
              </div>

              {/* Specs & Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Mean Latency</span>
                  <span className="text-emerald-400 font-bold text-sm">{m.meanInferenceTimeMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">mAP @ 0.50</span>
                  <span className="text-cyan-400 font-bold text-sm">{(m.mAP50 * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Engine Quantization</span>
                  <span className="text-amber-400 font-bold text-sm">{m.quantization}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Fleet OTA Rollout</span>
                  <span className="text-purple-400 font-bold text-sm">{m.fleetRolloutPercent}% of Buses</span>
                </div>
              </div>

              {/* Supported Classes */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Detection Classes:</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.classesDetected.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-mono">
                  Previous Stable Version: <span className="text-slate-300">{m.previousVersion}</span>
                </div>

                <div className="flex items-center gap-2">
                  {m.status === 'CANARY_TEST' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDeployCanary(m.id)}
                      disabled={activeActionId === m.id}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      {activeActionId === m.id ? 'Deploying...' : 'Deploy to 100% Production'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRollback(m.id)}
                    disabled={activeActionId === m.id}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-rose-400" />}
                  >
                    {activeActionId === m.id ? 'Rolling back...' : `Rollback to ${m.previousVersion}`}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
