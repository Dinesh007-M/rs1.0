import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useApp } from '../context/AppContext';
import {
  Users,
  Shield,
  UserPlus,
  Key,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Building,
  ShieldCheck,
} from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Control Room Operator' | 'Traffic Department' | 'Road Maintenance Department' | 'Viewer';
  department: string;
  status: 'ACTIVE' | 'DISABLED' | 'PASSWORD_RESET_REQUIRED';
  lastLogin: string;
  badgeNumber: string;
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: 'USR-01',
    name: 'Vikramaditya Rao',
    email: 'admin.rao@smartcity.gov.in',
    role: 'Administrator',
    department: 'Municipal Digital Command Center',
    status: 'ACTIVE',
    lastLogin: 'Today, 09:15 AM',
    badgeNumber: 'MUNI-ADM-001',
  },
  {
    id: 'USR-02',
    name: 'Priya Sharma',
    email: 'priya.sharma@transit.gov.in',
    role: 'Control Room Operator',
    department: 'Urban Transport & Transit Operations',
    status: 'ACTIVE',
    lastLogin: 'Today, 08:30 AM',
    badgeNumber: 'TRANS-OP-044',
  },
  {
    id: 'USR-03',
    name: 'Rajesh Nair',
    email: 'rajesh.nair@trafficpolice.gov.in',
    role: 'Traffic Department',
    department: 'State Highway & City Traffic Police',
    status: 'ACTIVE',
    lastLogin: 'Yesterday, 04:10 PM',
    badgeNumber: 'POL-TRAF-109',
  },
  {
    id: 'USR-04',
    name: 'Amitabh Verma',
    email: 'amitabh.verma@pwd.gov.in',
    role: 'Road Maintenance Department',
    department: 'Public Works Department (Civil Roads)',
    status: 'ACTIVE',
    lastLogin: 'Yesterday, 11:20 AM',
    badgeNumber: 'PWD-ENG-302',
  },
  {
    id: 'USR-05',
    name: 'Citizen / Civic Auditor',
    email: 'auditor.external@transparency.org',
    role: 'Viewer',
    department: 'Civic Transparency & Public Safety',
    status: 'ACTIVE',
    lastLogin: '3 days ago',
    badgeNumber: 'AUD-EXT-992',
  },
];

export const UsersPage: React.FC = () => {
  const { currentUser, switchUserRole } = useApp();
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  const filteredUsers = users.filter(
    (u) => selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter
  );

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }
          : u
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">
              User Access & Role-Based Permissions (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Departmental identity access management. Grants least-privilege clearance for incident confirmation, ANPR enforcement, and road repair procurement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => alert('Add User Dialog opened. Integrates with municipal Active Directory / SSO.')}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Provision New User
          </Button>
        </div>
      </div>

      {/* RBAC Overview Matrix */}
      <Card className="p-4 border-slate-800 bg-slate-900/60 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Departmental Security Clearance & Permission Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Role</th>
                <th className="p-2.5 text-center">Live GIS Operations</th>
                <th className="p-2.5 text-center">Confirm Incidents</th>
                <th className="p-2.5 text-center">Unmask ANPR Plates</th>
                <th className="p-2.5 text-center">Issue PWD Work Order</th>
                <th className="p-2.5 text-center">Deploy Edge AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-2.5 font-bold text-white">Administrator</td>
                <td className="p-2.5 text-center text-emerald-400 font-bold">FULL</td>
                <td className="p-2.5 text-center text-emerald-400 font-bold">FULL</td>
                <td className="p-2.5 text-center text-emerald-400 font-bold">FULL</td>
                <td className="p-2.5 text-center text-emerald-400 font-bold">FULL</td>
                <td className="p-2.5 text-center text-emerald-400 font-bold">FULL</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-cyan-300">Control Room Operator</td>
                <td className="p-2.5 text-center text-emerald-400">READ/WRITE</td>
                <td className="p-2.5 text-center text-emerald-400">YES</td>
                <td className="p-2.5 text-center text-amber-400">MASKED ONLY</td>
                <td className="p-2.5 text-center text-emerald-400">DISPATCH</td>
                <td className="p-2.5 text-center text-rose-400">NO</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-purple-300">Traffic Department</td>
                <td className="p-2.5 text-center text-emerald-400">READ</td>
                <td className="p-2.5 text-center text-emerald-400">TRAFFIC ONLY</td>
                <td className="p-2.5 text-center text-emerald-400 font-bold">AUTHORIZED</td>
                <td className="p-2.5 text-center text-slate-500">NO</td>
                <td className="p-2.5 text-center text-rose-400">NO</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-amber-300">Road Maintenance (PWD)</td>
                <td className="p-2.5 text-center text-emerald-400">DEFECTS ONLY</td>
                <td className="p-2.5 text-center text-slate-500">NO</td>
                <td className="p-2.5 text-center text-rose-400">NO</td>
                <td className="p-2.5 text-center text-emerald-400 font-bold">EXECUTE/CLOSE</td>
                <td className="p-2.5 text-center text-rose-400">NO</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-400">Viewer</td>
                <td className="p-2.5 text-center text-slate-400">READ ONLY</td>
                <td className="p-2.5 text-center text-rose-400">NO</td>
                <td className="p-2.5 text-center text-rose-400">BLURRED</td>
                <td className="p-2.5 text-center text-rose-400">NO</td>
                <td className="p-2.5 text-center text-rose-400">NO</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Users Registry List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Active Municipal Accounts ({filteredUsers.length})
          </h2>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Municipal Roles</option>
            <option value="Administrator">Administrator</option>
            <option value="Control Room Operator">Control Room Operator</option>
            <option value="Traffic Department">Traffic Department</option>
            <option value="Road Maintenance Department">Road Maintenance Department</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="p-4 border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{u.name}</span>
                    <Badge
                      variant={
                        u.role === 'Administrator'
                          ? 'info'
                          : u.role === 'Control Room Operator'
                          ? 'cyan'
                          : u.role === 'Traffic Department'
                          ? 'purple'
                          : u.role === 'Road Maintenance Department'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {u.role}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{u.email}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{u.department}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                    {u.status}
                  </Badge>
                  <div className="text-[10px] text-slate-500 font-mono">Badge: {u.badgeNumber}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Last login: {u.lastLogin}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(u.id)}
                  >
                    {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
