import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { Button } from './Button';
import { Radio, RefreshCw, Zap, WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { EventType } from '../../types';

export const DemoConfigModal: React.FC = () => {
  const {
    isDemoConfigModalOpen,
    setIsDemoConfigModalOpen,
    simulationConfig,
    updateSimulationConfig,
    injectDemoEvent,
  } = useApp();

  const handleToggleDemo = () => {
    updateSimulationConfig({ is_demo_mode: !simulationConfig.is_demo_mode });
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as typeof simulationConfig.network_condition;
    updateSimulationConfig({ network_condition: mode });
  };

  const handleMqttChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const state = e.target.value as typeof simulationConfig.mqtt_simulated_state;
    updateSimulationConfig({ mqtt_simulated_state: state });
  };

  const handleInjectSpecific = async (type: EventType) => {
    await injectDemoEvent();
  };

  return (
    <Modal
      isOpen={isDemoConfigModalOpen}
      onClose={() => setIsDemoConfigModalOpen(false)}
      title="Road Sense — Demo Mode & Simulation Controls"
      subtitle="Configure simulated edge bus sensors, GPS pulse frequency, network failure, and AI events."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateSimulationConfig({
                is_demo_mode: true,
                bus_count: 5,
                gps_tick_rate_ms: 3000,
                network_condition: 'OPTIMAL_5G',
                mqtt_simulated_state: 'CONNECTED',
              })
            }
          >
            Reset Defaults
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsDemoConfigModalOpen(false)}>
            Apply & Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-sm text-slate-300">
        {/* Master Demo Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div>
            <span className="font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Global Demo Mode Status
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Active simulation for buses, GPS ticks, and edge AI detections.
            </p>
          </div>
          <Button
            variant={simulationConfig.is_demo_mode ? 'danger' : 'primary'}
            size="sm"
            onClick={handleToggleDemo}
          >
            {simulationConfig.is_demo_mode ? 'Deactivate Demo' : 'Activate Demo'}
          </Button>
        </div>

        {/* Quick Event Generators */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Inject Simulated Detection
          </label>
          <p className="text-xs text-slate-400">
            Triggers an instant edge AI event from a moving bus with timestamp & GPS coordinates.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInjectSpecific('ROAD_DEFECT')}
              className="text-xs justify-start"
            >
              🚧 Pothole / Defect
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInjectSpecific('WATERLOGGING')}
              className="text-xs justify-start"
            >
              🌊 Waterlogging
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInjectSpecific('WRONG_WAY')}
              className="text-xs justify-start text-rose-300"
            >
              ⚠️ Wrong-Way Vehicle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInjectSpecific('CONGESTION')}
              className="text-xs justify-start"
            >
              🚗 Congestion Bottleneck
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInjectSpecific('PEDESTRIAN_RISK')}
              className="text-xs justify-start"
            >
              🚶 Pedestrian Hazard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInjectSpecific('MISSING_INFRASTRUCTURE')}
              className="text-xs justify-start"
            >
              🕳️ Missing Manhole/Sign
            </Button>
          </div>
        </div>

        {/* Telemetry & Network Simulation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Network Condition
            </label>
            <select
              value={simulationConfig.network_condition}
              onChange={handleNetworkChange}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="OPTIMAL_5G">Optimal 5G SA (Ultra Low Latency)</option>
              <option value="HIGH_LATENCY">High Latency (300ms - 800ms)</option>
              <option value="INTERMITTENT_DROPS">Intermittent Packet Drops</option>
              <option value="OFFLINE_QUEUE">Complete Network Drop (Local Queue)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Simulated MQTT Edge Broker
            </label>
            <select
              value={simulationConfig.mqtt_simulated_state}
              onChange={handleMqttChange}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="CONNECTED">Connected (EMQX / HiveMQ Cluster)</option>
              <option value="DEGRADED">Degraded (Retrying Handshakes)</option>
              <option value="DISCONNECTED">Disconnected (Simulate Offline Bus Cache)</option>
            </select>
          </div>
        </div>

        {/* GPS Pulse Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold uppercase tracking-wider text-slate-400">
              Simulated GPS Telemetry Frequency
            </label>
            <span className="font-mono text-cyan-400 font-semibold">
              {simulationConfig.gps_tick_rate_ms / 1000}s
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="10000"
            step="1000"
            value={simulationConfig.gps_tick_rate_ms}
            onChange={(e) =>
              updateSimulationConfig({ gps_tick_rate_ms: parseInt(e.target.value, 10) })
            }
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>1s (High precision)</span>
            <span>5s (Standard)</span>
            <span>10s (Battery saving)</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
