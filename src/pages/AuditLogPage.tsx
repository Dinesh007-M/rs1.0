import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  Lock,
  Clock,
  UserCheck,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AuditRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  targetResource: string;
  timestamp: string;
  ipAddress: string;
  result: 'SUCCESS' | 'DENIED_UNAUTHORIZED' | 'SECURITY_FLAG';
  justification: string;
}

const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'AUD-9921',
    userId: 'USR-OPERATOR-04',
    userName: 'Priya Sharma',
    userRole: 'Control Room Operator',
    action: 'INCIDENT_CONFIRMED',
    targetResource: 'INC-2026-4410 (Outer Ring Road Pothole)',
    timestamp: '2026-09-13 11:28:42 IST',
    ipAddress: '10.24.8.112 (Command Terminal 03)',
    result: 'SUCCESS',
    justification: 'Confirmed 3-bus optical cross-validation matching SLA threshold.',
  },
  {
    id: 'AUD-9919',
    userId: 'USR-TRAFFIC-09',
    userName: 'Rajesh Nair',
    userRole: 'Traffic Department Lead',
    action: 'ANPR_UNMASK_REQUEST',
    targetResource: 'VEH-DL01AB1234 (Hit-and-Run Suspect Plate)',
    timestamp: '2026-09-13 11:15:10 IST',
    ipAddress: '10.24.8.44 (Traffic Enforcement Console)',
    result: 'SUCCESS',
    justification: 'State Police FIR #4029 warrant compliance for dangerous driving.',
  },
  {
    id: 'AUD-9914',
    userId: 'USR-PWD-ADMIN',
    userName: 'Amitabh Verma',
    userRole: 'Road Maintenance Supervisor',
    action: 'MAINTENANCE_TASK_ASSIGNED',
    targetResource: 'TASK-PWD-2026-781 (Asphalt Patching)',
    timestamp: '2026-09-13 10:48:30 IST',
    ipAddress: '10.24.12.18 (PWD Field Operations)',
    result: 'SUCCESS',
    justification: 'Dispatched to Division 4 Rapid Pothole Repair Unit.',
  },
  {
    id: 'AUD-9908',
    userId: 'USR-VIEWER-02',
    userName: 'Anonymous Guest / Auditor',
    userRole: 'Public Viewer',
    action: 'UNAUTHORIZED_ANPR_ACCESS_ATTEMPT',
    targetResource: 'ANPR Database / Number Plate Raw Decrypt',
    timestamp: '2026-09-13 09:30:12 IST',
    ipAddress: '192.168.1.88 (External Browser)',
    result: 'DENIED_UNAUTHORIZED',
    justification: 'RBAC Policy Block: Public viewers cannot view unmasked plates.',
  },
  {
    id: 'AUD-9899',
    userId: 'USR-SYS-ADMIN',
    userName: 'Central Admin (DevOps)',
    userRole: 'System Administrator',
    action: 'AI_MODEL_OTA_ROLLBACK',
    targetResource: 'RoadSense-DefectDetector-YOLOv8',
    timestamp: '2026-09-13 08:12:05 IST',
    ipAddress: '10.24.0.1 (Root Infrastructure Console)',
    result: 'SUCCESS',
    justification: 'Rollback triggered after test bench validation.',
  },
];

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetResource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Timestamp,User,Role,Action,Resource,Result,IP,Justification']
        .concat(
          filteredLogs.map(
            (l) =>
              `"${l.id}","${l.timestamp}","${l.userName}","${l.userRole}","${l.action}","${l.targetResource}","${l.result}","${l.ipAddress}","${l.justification}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `road_sense_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Lock className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">
              Cryptographic Audit Log & Compliance Trail
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident operational audit trail. Logs every operator incident verification, ANPR unmasking, and municipal dispatch action.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export Signed Audit CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Logged Security Actions</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{logs.length} Events</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Immutable WORM storage</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">ANPR Decrypt Accesses</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">1 Authorized</div>
          <div className="text-[11px] text-slate-400 mt-0.5">High-confidence FIR compliance</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Access Violations Blocked</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">1 Blocked</div>
          <div className="text-[11px] text-slate-400 mt-0.5">RBAC unauthorized role attempt</div>
        </Card>

        <Card className="p-4 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Compliance Standard</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">ISO 27001 / DPDP</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Digital Personal Data Protection</div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User, Action, Resource, or Audit ID..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
        >
          <option value="ALL">All Logged Actions</option>
          <option value="INCIDENT_CONFIRMED">Incident Confirmed</option>
          <option value="ANPR_UNMASK_REQUEST">ANPR Unmask</option>
          <option value="MAINTENANCE_TASK_ASSIGNED">Maintenance Assigned</option>
          <option value="UNAUTHORIZED_ANPR_ACCESS_ATTEMPT">Blocked Violations</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <Card className="overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Audit ID & Time</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Action Performed</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">Status</th>
                <th className="p-3">Terminal / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 space-y-0.5">
                    <span className="text-cyan-400 font-bold block">{log.id}</span>
                    <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                  </td>
                  <td className="p-3 space-y-0.5">
                    <span className="text-slate-200 font-bold block">{log.userName}</span>
                    <span className="text-slate-400 text-[11px]">{log.userRole}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs">
                    <span className="text-slate-300 block truncate" title={log.targetResource}>
                      {log.targetResource}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate" title={log.justification}>
                      {log.justification}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        log.result === 'SUCCESS'
                          ? 'success'
                          : log.result === 'DENIED_UNAUTHORIZED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {log.result}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
