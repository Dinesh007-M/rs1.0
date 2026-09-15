import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ModelVersion, Event } from '../types';
import { aiService, eventService } from '../services';
import { formatEventType, formatPercentage, formatRelativeTime } from '../utils/formatters';
import { Cpu, Zap, Target, CheckCircle, Sparkles } from 'lucide-react';

export const AiDetectionPage: React.FC = () => {
  const { setSelectedEvent, injectDemoEvent } = useApp();
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mList, eList] = await Promise.all([
        aiService.getModelVersions(),
        eventService.getEvents({ limit: 10 }),
      ]);
      setModels(mList);
      setEvents(eList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = eventService.subscribe((newEvent) => {
      setEvents((prev) => [newEvent, ...prev.filter((e) => e.event_id !== newEvent.event_id).slice(0, 9)]);
    });
    return () => unsub();
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Querying onboard neural inference engines & model weights..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Edge AI Detection & Neural Architecture
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time optical object detection and semantic segmentation running on bus edge compute units.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const newEvt = await injectDemoEvent();
            setEvents((prev) => [newEvt, ...prev]);
          }}
          icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
        >
          Test Edge Inference Loop
        </Button>
      </div>

      {/* Model Performance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Edge Inference Latency"
          value="18.4 ms"
          subvalue="Mean per frame"
          variant="cyan"
          icon={<Zap className="w-5 h-5 text-cyan-400" />}
          change="~54 FPS capability"
          isPositive={true}
        />
        <StatCard
          title="Mean Average Precision"
          value="94.2%"
          subvalue="mAP@0.5 IoU"
          variant="emerald"
          icon={<Target className="w-5 h-5 text-emerald-400" />}
          change="+1.8% vs previous"
          isPositive={true}
        />
        <StatCard
          title="Fleet Model Sync"
          value="5 / 5"
          subvalue="Buses updated"
          variant="amber"
          icon={<CheckCircle className="w-5 h-5 text-amber-400" />}
          change="Latest weights active"
          isPositive={true}
        />
      </div>

      {/* Deployed Models Registry */}
      <Card
        title="Deployed Neural Network Architectures"
        subtitle="Edge models loaded inside NVIDIA Jetson runtimes across transit fleet"
      >
        <Table<ModelVersion>
          data={models}
          keyExtractor={(m: ModelVersion) => m.version_id}
          columns={[
            {
              key: 'name',
              header: 'Model Architecture',
              render: (m: ModelVersion) => (
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-100">{m.name}</div>
                  <div className="text-xs text-slate-400 font-mono">ID: {m.version_id}</div>
                </div>
              ),
            },
            {
              key: 'model_type',
              header: 'Task Type',
              render: (m: ModelVersion) => (
                <Badge variant="info" size="sm">
                  {m.model_type}
                </Badge>
              ),
            },
            {
              key: 'framework',
              header: 'Runtime Framework',
              render: (m: ModelVersion) => (
                <span className="font-mono text-xs text-slate-300 font-semibold">{m.framework}</span>
              ),
            },
            {
              key: 'inference_latency_ms',
              header: 'Latency',
              render: (m: ModelVersion) => (
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {m.inference_latency_ms} ms
                </span>
              ),
            },
            {
              key: 'accuracy_map50',
              header: 'mAP@50 Accuracy',
              render: (m: ModelVersion) => (
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {(m.accuracy_map50 * 100).toFixed(1)}%
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Deployment Status',
              render: (m: ModelVersion) => (
                <Badge
                  variant={m.status === 'ACTIVE' ? 'success' : m.status === 'CANARY' ? 'warning' : 'neutral'}
                  size="sm"
                >
                  {m.status} ({m.deployed_fleet_count} buses)
                </Badge>
              ),
            },
          ]}
        />
      </Card>

      {/* Raw Event Stream */}
      <Card
        title="Edge Optical Ingestion Log"
        subtitle="Click any item to view optical snapshot, camera ID, and verification workflow"
      >
        <Table<Event>
          data={events}
          keyExtractor={(e: Event) => e.event_id}
          onRowClick={(e: Event) => setSelectedEvent(e)}
          columns={[
            {
              key: 'event_id',
              header: 'Event ID',
              render: (e: Event) => <span className="font-mono text-xs text-cyan-400">{e.event_id}</span>,
            },
            {
              key: 'event_type',
              header: 'Detected Phenomenon',
              render: (e: Event) => (
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">{formatEventType(e.event_type)}</div>
                  <div className="text-xs text-slate-400 truncate max-w-xs">{e.title}</div>
                </div>
              ),
            },
            {
              key: 'confidence',
              header: 'Model Confidence',
              render: (e: Event) => (
                <span className="font-mono text-xs font-bold text-slate-200">
                  {formatPercentage(e.confidence)}
                </span>
              ),
            },
            {
              key: 'model_version',
              header: 'Inference Engine',
              render: (e: Event) => (
                <span className="font-mono text-xs text-slate-400">{e.model_version}</span>
              ),
            },
            {
              key: 'timestamp',
              header: 'Timestamp',
              render: (e: Event) => (
                <span className="text-xs text-slate-400">{formatRelativeTime(e.timestamp)}</span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
