import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { formatRelativeTime } from '../utils/formatters';
import { Bell, AlertOctagon, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { alerts, dismissAlert, navigateTo } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filtered = alerts.filter(
    (a) => filterSeverity === 'ALL' || a.severity === filterSeverity
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400" />
            Operational Alerts & Triggers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time threshold triggers evaluated against streaming edge telemetry.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-md text-xs">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filterSeverity === sev
                  ? 'bg-rose-950 text-rose-300 font-semibold border border-rose-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <Card
        title="Active Emergency & Telemetry Alerts"
        subtitle={`${filtered.length} active notifications requiring operator action`}
      >
        <Table
          data={filtered}
          keyExtractor={(a) => a.alert_id}
          columns={[
            {
              key: 'alert_id',
              header: 'Alert ID',
              render: (a) => <span className="font-mono text-xs text-rose-400 font-bold">{a.alert_id}</span>,
            },
            {
              key: 'title',
              header: 'Trigger Condition',
              render: (a) => (
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-100">{a.title}</div>
                  <div className="text-xs text-slate-400">{a.message}</div>
                </div>
              ),
            },
            {
              key: 'severity',
              header: 'Severity',
              render: (a) => (
                <Badge variant={a.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                  {a.severity}
                </Badge>
              ),
            },
            {
              key: 'created_at',
              header: 'Triggered',
              render: (a) => <span className="text-xs text-slate-400">{formatRelativeTime(a.created_at)}</span>,
            },
            {
              key: 'actions',
              header: 'Action',
              render: (a) => (
                <div className="flex items-center gap-2">
                  {a.action_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo('incidents')}
                      icon={<ArrowRight className="w-3 h-3" />}
                    >
                      Inspect
                    </Button>
                  )}
                  <button
                    onClick={() => dismissAlert(a.alert_id)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Dismiss alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
