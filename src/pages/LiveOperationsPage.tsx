import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GisMapContainer } from '../components/gis/GisMapContainer';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Bus, Event, EventType } from '../types';
import { busService, eventService } from '../services';
import { formatEventType, formatRelativeTime, getSeverityStyle } from '../utils/formatters';
import {
  Radio,
  Bus as BusIcon,
  Filter,
  Sparkles,
  Navigation,
  Activity,
  Layers,
} from 'lucide-react';

export const LiveOperationsPage: React.FC = () => {
  const { setSelectedBus, setSelectedEvent, injectDemoEvent } = useApp();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTypeFilter, setActiveTypeFilter] = useState<EventType | 'ALL'>('ALL');
  const [selectedBusFocus, setSelectedBusFocus] = useState<Bus | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bList, eList] = await Promise.all([busService.getBuses(), eventService.getEvents()]);
      setBuses(bList);
      setEvents(eList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = eventService.subscribe((newEvent) => {
      setEvents((prev) => [newEvent, ...prev.filter((e) => e.event_id !== newEvent.event_id)]);
    });
    // Refresh periodically for live simulation
    const interval = setInterval(async () => {
      const bList = await busService.getBuses();
      setBuses(bList);
    }, 4000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const filteredEvents =
    activeTypeFilter === 'ALL'
      ? events
      : events.filter((e) => e.event_type === activeTypeFilter);

  if (isLoading) {
    return <LoadingSpinner label="Establishing live GIS satellite feed and edge bus links..." />;
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Filter Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            Live Urban Sensing Operations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming edge AI telemetry from active public transit buses across metropolitan sectors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Bar */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-md text-xs">
            <Filter className="w-3 h-3 text-slate-500 ml-1 mr-0.5" />
            {(['ALL', 'ROAD_DEFECT', 'WATERLOGGING', 'WRONG_WAY', 'CONGESTION'] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setActiveTypeFilter(type)}
                  className={`px-2 py-1 rounded transition-colors text-[11px] font-medium ${
                    activeTypeFilter === type
                      ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type === 'ALL' ? 'All Detections' : type.replace(/_/g, ' ')}
                </button>
              )
            )}
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
            + Pulse Edge Event
          </Button>
        </div>
      </div>

      {/* Main Command View: Interactive GIS Map Container + Live Telemetry Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Main Map (3 Cols) */}
        <div className="xl:col-span-3">
          <GisMapContainer
            buses={buses}
            events={filteredEvents}
            heightClass="h-[620px]"
            selectedBusId={selectedBusFocus?.bus_id}
            onSelectBus={(b) => {
              setSelectedBusFocus(b);
              setSelectedBus(b);
            }}
            onSelectEvent={(e) => setSelectedEvent(e)}
          />
        </div>

        {/* Live Active Nodes & Detections List (1 Col) */}
        <div className="space-y-4">
          {/* Mobile Bus Units Status */}
          <Card
            title="Mobile Sensor Nodes"
            subtitle={`${buses.length} buses streaming GPS & camera frames`}
          >
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {buses.map((bus) => {
                const isFocused = selectedBusFocus?.bus_id === bus.bus_id;
                return (
                  <div
                    key={bus.bus_id}
                    onClick={() => {
                      setSelectedBusFocus(bus);
                      setSelectedBus(bus);
                    }}
                    className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                      isFocused
                        ? 'bg-cyan-950/70 border-cyan-500 text-slate-100 ring-1 ring-cyan-400'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BusIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-semibold">{bus.bus_id}</span>
                      </div>
                      <Badge
                        variant={bus.operational_status === 'ACTIVE_ON_ROUTE' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {bus.speed_kmh} km/h
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">{bus.route_name}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5 pt-1 border-t border-slate-900">
                      <span>Model: {bus.model_version}</span>
                      <span className="flex items-center gap-1">
                        <Navigation
                          className="w-2.5 h-2.5 text-slate-400"
                          style={{ transform: `rotate(${bus.heading_degrees}deg)` }}
                        />
                        {bus.heading_degrees}°
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Real-Time Detection Feed */}
          <Card
            title="Live Edge Events"
            subtitle={`${filteredEvents.length} events logged in session`}
          >
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {filteredEvents.map((evt) => {
                const sev = getSeverityStyle(evt.severity);
                return (
                  <div
                    key={evt.event_id}
                    onClick={() => setSelectedEvent(evt)}
                    className="p-2.5 rounded bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-xs cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        {formatEventType(evt.event_type)}
                      </span>
                      <Badge variant={evt.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                        {evt.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{evt.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Bus: {evt.bus_id}</span>
                      <span>{formatRelativeTime(evt.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
