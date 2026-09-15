import { MOCK_ALERTS, MOCK_NOTIFICATIONS } from '../data/mockData';
import { Alert, Notification } from '../types';
import { IAlertService } from './types';

class AlertService implements IAlertService {
  private alerts: Alert[] = [...MOCK_ALERTS];
  private notifications: Notification[] = [...MOCK_NOTIFICATIONS];
  private alertListeners: Array<(alerts: Alert[]) => void> = [];
  private notifListeners: Array<(notifs: Notification[]) => void> = [];

  async getAlerts(includeDismissed: boolean = false): Promise<Alert[]> {
    if (includeDismissed) return [...this.alerts];
    return this.alerts.filter((a) => !a.is_dismissed);
  }

  async addAlert(alert: Alert): Promise<void> {
    this.alerts.unshift(alert);
    this.alertListeners.forEach((l) => l([...this.alerts]));
  }

  async addNotification(notif: Notification): Promise<void> {
    this.notifications.unshift(notif);
    this.notifListeners.forEach((l) => l([...this.notifications]));
  }

  subscribeAlerts(listener: (alerts: Alert[]) => void): () => void {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== listener);
    };
  }

  subscribeNotifications(listener: (notifs: Notification[]) => void): () => void {
    this.notifListeners.push(listener);
    return () => {
      this.notifListeners = this.notifListeners.filter((l) => l !== listener);
    };
  }

  async dismissAlert(alertId: string): Promise<boolean> {
    const a = this.alerts.find((alert) => alert.alert_id === alertId);
    if (!a) return false;
    a.is_dismissed = true;
    this.alertListeners.forEach((l) => l([...this.alerts]));
    return true;
  }

  async acknowledgeAlert(alertId: string, user: string): Promise<Alert> {
    const a = this.alerts.find((alert) => alert.alert_id === alertId);
    if (!a) throw new Error(`Alert ${alertId} not found`);
    a.acknowledged_by = user;
    a.acknowledged_at = new Date().toISOString();
    this.alertListeners.forEach((l) => l([...this.alerts]));
    return { ...a };
  }

  async getNotifications(): Promise<Notification[]> {
    return [...this.notifications];
  }

  async markNotificationRead(notificationId: string): Promise<boolean> {
    const n = this.notifications.find((notif) => notif.notification_id === notificationId);
    if (!n) return false;
    n.read = true;
    this.notifListeners.forEach((l) => l([...this.notifications]));
    return true;
  }
}

export const alertService = new AlertService();
