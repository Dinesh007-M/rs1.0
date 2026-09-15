import React from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Settings, Sparkles, Wifi, Radio, Cpu, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    simulationConfig,
    updateSimulationConfig,
    setIsDemoConfigModalOpen,
    injectDemoEvent,
  } = useApp();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Settings & Simulation Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure edge sensing parameters, global simulation mode, GPS frequency, and MQTT failure testing.
        </p>
      </div>

      {/* Global Simulation Card */}
      <Card
        title="Demo Mode & Edge Sensing Simulator"
        subtitle="Control synthetic telemetry, moving buses, GPS frequency, and edge AI detections"
        headerAction={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDemoConfigModalOpen(true)}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Open Simulator Console
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-100 block">Simulation Status</span>
              <p className="text-slate-400 mt-0.5">
                Generates continuous GPS updates and synthetic camera detections.
              </p>
            </div>
            <Badge variant={simulationConfig.is_demo_mode ? 'warning' : 'neutral'} size="sm">
              {simulationConfig.is_demo_mode ? 'DEMO MODE ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="text-slate-500 font-medium">GPS Tick Interval</span>
              <div className="font-mono text-base font-bold text-cyan-400">
                {simulationConfig.gps_tick_rate_ms / 1000}s
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="text-slate-500 font-medium">Network Condition</span>
              <div className="font-mono text-base font-bold text-slate-200">
                {simulationConfig.network_condition}
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="text-slate-500 font-medium">MQTT Simulated State</span>
              <div className="font-mono text-base font-bold text-emerald-400">
                {simulationConfig.mqtt_simulated_state}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await injectDemoEvent();
              }}
              icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
            >
              Inject Single Test Event
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                updateSimulationConfig({
                  is_demo_mode: true,
                  gps_tick_rate_ms: 3000,
                  network_condition: 'OPTIMAL_5G',
                  mqtt_simulated_state: 'CONNECTED',
                });
              }}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Reset Simulation Defaults
            </Button>
          </div>
        </div>
      </Card>

      {/* Threshold & Detection Filters */}
      <Card
        title="Municipal Urban Sensing Thresholds"
        subtitle="Edge inference confidence thresholds before sending upstream over cellular"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Minimum Confidence Threshold (Potholes)</label>
            <input
              type="text"
              defaultValue="0.75 (75%)"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
              disabled
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Wrong-Way Trajectory Sensitivity</label>
            <input
              type="text"
              defaultValue="0.90 (High Confidence Immediate Trigger)"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
              disabled
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
