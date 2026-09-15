import React from 'react';
import { useApp } from '../../context/AppContext';
import { SidePanel } from './SidePanel';
import { Badge } from './Badge';
import { Button } from './Button';
import { formatRelativeTime } from '../../utils/formatters';
import { AlertCircle, Bell, Check, Trash2, ArrowRight } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    alerts,
    notifications,
    dismissAlert,
    markNotificationRead,
    navigateTo,
  } = useApp();

  return (
    <SidePanel
      isOpen={isNotificationDrawerOpen}
      onClose={() => setIsNotificationDrawerOpen(false)}
      title="Notifications & Operational Alerts"
      subtitle="Priority mobile urban sensor triggers and telemetry dispatches"
      width="md"
    >
      <div className="space-y-6">
        {/* Active Emergency Alerts Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Active Critical Alerts ({alerts.length})
            </h4>
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center border border-dashed border-slate-800 rounded">
              No unresolved alerts at this time.
            </p>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="p-3 bg-slate-950/80 border border-rose-900/60 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-rose-300 flex-1">
                      {alert.title}
                    </span>
                    <Badge variant="danger" size="sm">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>{formatRelativeTime(alert.created_at)}</span>
                    <div className="flex items-center gap-2">
                      {alert.action_link && (
                        <button
                          onClick={() => {
                            setIsNotificationDrawerOpen(false);
                            navigateTo('incidents');
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-0.5"
                        >
                          Inspect <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => dismissAlert(alert.alert_id)}
                        className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                        title="Dismiss Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System & Audit Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              Intelligence Log Feed
            </h4>
          </div>

          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.notification_id}
                className={`p-3 rounded-lg border text-xs transition-colors ${
                  notif.read
                    ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                    : 'bg-slate-900/90 border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200">{notif.title}</span>
                  {!notif.read && (
                    <button
                      onClick={() => markNotificationRead(notif.notification_id)}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>
                <p className="text-slate-400 mt-1 leading-relaxed">{notif.body}</p>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  {formatRelativeTime(notif.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SidePanel>
  );
};
