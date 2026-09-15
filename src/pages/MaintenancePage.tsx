import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { MaintenanceTask } from '../types';
import { maintenanceService } from '../services';
import { formatRelativeTime } from '../utils/formatters';
import { Wrench, CheckCircle2, Plus } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await maintenanceService.getTasks();
      setTasks(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const unsub = maintenanceService.subscribe(() => {
      loadTasks();
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (
    taskId: string,
    status: MaintenanceTask['status']
  ) => {
    await maintenanceService.updateTaskStatus(taskId, status);
    loadTasks();
    setSelectedTask(null);
  };

  if (isLoading) {
    return <LoadingSpinner label="Fetching public works work orders and maintenance dispatches..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            Infrastructure Maintenance & Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated work orders generated from bus AI defect triangulations dispatched to municipal crews.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => alert('New work order creation ready for dispatch.')}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Manual Work Order
        </Button>
      </div>

      <Card
        title="Active Municipal Maintenance Work Orders"
        subtitle={`${tasks.length} orders scheduled with highway and public works authorities`}
      >
        <Table<MaintenanceTask>
          data={tasks}
          keyExtractor={(t: MaintenanceTask) => t.task_id}
          onRowClick={(t: MaintenanceTask) => setSelectedTask(t)}
          columns={[
            {
              key: 'task_id',
              header: 'Work Order ID',
              render: (t: MaintenanceTask) => (
                <span className="font-mono text-xs font-bold text-amber-400">{t.task_id}</span>
              ),
            },
            {
              key: 'title',
              header: 'Scope of Repair',
              render: (t: MaintenanceTask) => (
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-100">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.description}</div>
                </div>
              ),
            },
            {
              key: 'priority',
              header: 'Priority',
              render: (t: MaintenanceTask) => (
                <Badge
                  variant={
                    t.priority === 'P1_IMMEDIATE'
                      ? 'danger'
                      : t.priority === 'P2_24_HOURS'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {t.priority}
                </Badge>
              ),
            },
            {
              key: 'department',
              header: 'Assigned Department',
              render: (t: MaintenanceTask) => (
                <div className="text-xs text-slate-300">
                  <div>{t.department}</div>
                  {t.assigned_to && (
                    <div className="text-[11px] text-slate-500">Crew: {t.assigned_to}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (t: MaintenanceTask) => (
                <Badge
                  variant={
                    t.status === 'COMPLETED'
                      ? 'success'
                      : t.status === 'UNDER_REPAIR' || t.status === 'CREW_DISPATCHED'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {t.status}
                </Badge>
              ),
            },
            {
              key: 'estimated_cost_usd',
              header: 'Est. Cost',
              render: (t: MaintenanceTask) => (
                <span className="font-mono text-xs text-slate-200">
                  {t.estimated_cost_usd ? `$${t.estimated_cost_usd.toLocaleString()}` : 'Pending'}
                </span>
              ),
            },
            {
              key: 'target_completion_date',
              header: 'Target Date',
              render: (t: MaintenanceTask) => (
                <span className="text-xs text-slate-400 font-mono">{t.target_completion_date}</span>
              ),
            },
          ]}
        />
      </Card>

      {/* Work Order Action Modal */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={`Work Order: ${selectedTask.task_id}`}
          subtitle={selectedTask.title}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                {selectedTask.status !== 'UNDER_REPAIR' && selectedTask.status !== 'COMPLETED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedTask.task_id, 'UNDER_REPAIR')}
                  >
                    Mark Under Repair
                  </Button>
                )}
                {selectedTask.status !== 'COMPLETED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedTask.task_id, 'COMPLETED')}
                    icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block font-medium">Department Assignment:</span>
              <p className="text-slate-200 text-sm font-semibold mt-0.5">{selectedTask.department}</p>
              <p className="text-slate-400 text-xs mt-1">
                Assigned Crew: {selectedTask.assigned_to || 'Pending allocation'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block">Estimated Budget</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  {selectedTask.estimated_cost_usd
                    ? `$${selectedTask.estimated_cost_usd.toLocaleString()} USD`
                    : 'Awaiting Quote'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block">Target Schedule</span>
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {selectedTask.target_completion_date}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
