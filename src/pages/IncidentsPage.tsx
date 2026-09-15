import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { Incident } from '../types';
import { incidentService } from '../services';
import { formatCoordinates, formatRelativeTime } from '../utils/formatters';
import {
  AlertOctagon,
  ShieldAlert,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  FileCheck,
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const { setSelectedIncident } = useApp();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Incident['status'] | 'ALL'>('ALL');
  const [selectedForAction, setSelectedForAction] = useState<Incident | null>(null);
  const [actionNote, setActionNote] = useState('');

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await incidentService.getIncidents(
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setIncidents(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [statusFilter]);

  const handleUpdateStatus = async (newStatus: Incident['status']) => {
    if (!selectedForAction) return;
    await incidentService.updateIncidentStatus(
      selectedForAction.incident_id,
      newStatus,
      actionNote || `Status shifted to ${newStatus}`
    );
    setSelectedForAction(null);
    setActionNote('');
    loadIncidents();
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading priority urban incident registry..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            Urban Incident Management & Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Critical traffic hazards, opposite-flow vehicles, and safety alerts escalated from bus sensors.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-md text-xs">
          {(['ALL', 'OPEN', 'INVESTIGATING', 'DISPATCHED', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-cyan-400 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table */}
      <Card
        title="Active Incidents Queue"
        subtitle={`${incidents.length} priority records under municipal coordination`}
      >
        <Table<Incident>
          data={incidents}
          keyExtractor={(inc: Incident) => inc.incident_id}
          onRowClick={(inc: Incident) => setSelectedForAction(inc)}
          columns={[
            {
              key: 'incident_id',
              header: 'Incident ID',
              render: (inc: Incident) => (
                <span className="font-mono text-xs font-semibold text-cyan-400">{inc.incident_id}</span>
              ),
            },
            {
              key: 'title',
              header: 'Incident Title & Impact',
              render: (inc: Incident) => (
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-100">{inc.title}</div>
                  <div className="text-xs text-slate-400 truncate max-w-sm">{inc.impact_summary}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{inc.address_or_crossroad}</span>
                  </div>
                </div>
              ),
            },
            {
              key: 'severity',
              header: 'Severity',
              render: (inc: Incident) => (
                <Badge variant={inc.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                  {inc.severity}
                </Badge>
              ),
            },
            {
              key: 'assigned_agency',
              header: 'Assigned Agency / Unit',
              render: (inc: Incident) => (
                <div className="text-xs text-slate-300">
                  <div>{inc.assigned_agency}</div>
                  {inc.lead_responder && (
                    <div className="text-[11px] text-slate-500">Lead: {inc.lead_responder}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (inc: Incident) => (
                <Badge
                  variant={
                    inc.status === 'DISPATCHED'
                      ? 'success'
                      : inc.status === 'INVESTIGATING'
                      ? 'warning'
                      : inc.status === 'OPEN'
                      ? 'danger'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {inc.status}
                </Badge>
              ),
            },
            {
              key: 'reported_at',
              header: 'Reported',
              render: (inc: Incident) => (
                <span className="text-xs text-slate-400">{formatRelativeTime(inc.reported_at)}</span>
              ),
            },
          ]}
        />
      </Card>

      {/* Incident Detail & Action Modal */}
      {selectedForAction && (
        <Modal
          isOpen={Boolean(selectedForAction)}
          onClose={() => setSelectedForAction(null)}
          title={`Incident Command: ${selectedForAction.incident_id}`}
          subtitle={selectedForAction.title}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="ghost" size="sm" onClick={() => setSelectedForAction(null)}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {selectedForAction.status !== 'DISPATCHED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus('DISPATCHED')}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Dispatch Response Unit
                  </Button>
                )}
                {selectedForAction.status !== 'CLOSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus('CLOSED')}
                    icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Resolve & Close
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="text-slate-500 font-medium">Impact Assessment:</span>
              <p className="text-slate-200">{selectedForAction.impact_summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block">Assigned Agency</span>
                <span className="font-semibold text-slate-200">{selectedForAction.assigned_agency}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block">Coordinates</span>
                <span className="font-mono text-slate-200">
                  {formatCoordinates(selectedForAction.latitude, selectedForAction.longitude)}
                </span>
              </div>
            </div>

            {/* Actions Log */}
            <div>
              <span className="text-slate-400 uppercase font-semibold tracking-wider block mb-2">
                Response Activity Log
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedForAction.actions_taken.map((act, i) => (
                  <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
                    <div className="flex justify-between text-slate-400">
                      <span className="font-medium text-slate-200">{act.user}</span>
                      <span className="text-slate-500">{formatRelativeTime(act.timestamp)}</span>
                    </div>
                    <p className="text-slate-300">{act.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator Dispatch Note */}
            <div className="space-y-1 pt-2">
              <label className="text-slate-400 font-semibold">Log Operator Instruction / Note:</label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Enter dispatch notes, radio codes, or highway advisory text..."
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                rows={2}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
