import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Alert,
  Bus,
  Event,
  Incident,
  NavigationPath,
  Notification,
  RoadDefect,
  SimulationConfig,
  SystemStatus,
  User,
  ThemeMode,
} from '../types';
import {
  alertService,
  authService,
  busService,
  eventService,
  incidentService,
  monitoringService,
  simulationService,
} from '../services';

interface AppContextType {
  // Navigation
  currentRoute: NavigationPath;
  navigateTo: (route: NavigationPath, params?: Record<string, string>) => void;
  routeParams: Record<string, string>;

  // Theme & Appearance
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // User & Auth
  currentUser: User | null;
  switchUserRole: (role: User['role']) => Promise<void>;

  // System & Status
  systemStatus: SystemStatus;
  refreshSystemStatus: () => Promise<void>;

  // Demo Mode & Simulation
  simulationConfig: SimulationConfig;
  updateSimulationConfig: (config: Partial<SimulationConfig>) => Promise<void>;
  injectDemoEvent: () => Promise<Event>;
  toggleDemoMode: () => void;
  isDemoConfigModalOpen: boolean;
  setIsDemoConfigModalOpen: (open: boolean) => void;
  isMobileConnectModalOpen: boolean;
  setIsMobileConnectModalOpen: (open: boolean) => void;
  is17StepDemoOpen: boolean;
  setIs17StepDemoOpen: (open: boolean) => void;
  isPrivacyMaskingEnabled: boolean;
  setIsPrivacyMaskingEnabled: (enabled: boolean) => void;

  // Alerts & Notifications
  alerts: Alert[];
  notifications: Notification[];
  dismissAlert: (alertId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;

  // Side Panel Inspector
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  selectedBus: Bus | null;
  setSelectedBus: (bus: Bus | null) => void;
  selectedDefect: RoadDefect | null;
  setSelectedDefect: (defect: RoadDefect | null) => void;
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;

  // Global Error & Network State
  globalError: string | null;
  setGlobalError: (err: string | null) => void;
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Route handling via URL hash or default
  const getInitialRoute = (): NavigationPath => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const validRoutes: NavigationPath[] = [
      'overview',
      'mobile-dashcam',
      'live-operations',
      'incidents',
      'road-defects',
      'school-safety',
      'anpr-tracker',
      'traffic',
      'fleet',
      'ai-detection',
      'maintenance',
      'reports',
      'alerts',
      'monitoring',
      'models',
      'audit',
      'users',
      'settings',
    ];
    return validRoutes.includes(hash as NavigationPath) ? (hash as NavigationPath) : 'overview';
  };

  const [currentRoute, setCurrentRoute] = useState<NavigationPath>(getInitialRoute);
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    platform_health: 'OPERATIONAL',
    active_buses_count: 4,
    total_fleet_count: 5,
    cameras_online_count: 6,
    total_cameras_count: 7,
    events_today_count: 342,
    ingestion_latency_ms: 124,
    mqtt_broker_status: 'CONNECTED',
    edge_sync_backlog: 25,
    last_updated: new Date().toISOString(),
  });

  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>(simulationService.getConfig());
  const [isDemoConfigModalOpen, setIsDemoConfigModalOpen] = useState(false);
  const [isMobileConnectModalOpen, setIsMobileConnectModalOpen] = useState(false);
  const [is17StepDemoOpen, setIs17StepDemoOpen] = useState(false);
  const [isPrivacyMaskingEnabled, setIsPrivacyMaskingEnabled] = useState(true);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Inspector states
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<RoadDefect | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Theme Management (Default: bharat-navy)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('roadsense_theme') as ThemeMode;
    return saved && ['bharat-navy', 'civic-light', 'tactical-emerald', 'slate-dark'].includes(saved)
      ? saved
      : 'bharat-navy';
  });

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('roadsense_theme', newTheme);
    } catch {
      // LocalStorage access quiet catch
    }
    document.documentElement.setAttribute('data-theme', newTheme);
    if (newTheme === 'civic-light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'civic-light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Synchronize hash with current route
  const navigateTo = useCallback((route: NavigationPath, params: Record<string, string> = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.location.hash = `#/${route}`;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '') as NavigationPath;
      if (hash && hash !== currentRoute) {
        setCurrentRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentRoute]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial data loading
  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser);
    monitoringService.getSystemStatus().then(setSystemStatus);
    alertService.getAlerts().then(setAlerts);
    alertService.getNotifications().then(setNotifications);

    // Subscribe to simulation changes
    const unsubSim = simulationService.subscribe(setSimulationConfig);
    const unsubAlerts = alertService.subscribeAlerts(setAlerts);
    const unsubNotifs = alertService.subscribeNotifications(setNotifications);

    // Subscribe to live edge events (including mobile dashcam captures)
    const unsubEvents = eventService.subscribe((newEvent) => {
      setSystemStatus((prev) => ({
        ...prev,
        events_today_count: prev.events_today_count + 1,
      }));

      // Add real-time notification
      const newNotif: Notification = {
        notification_id: `notif-${Date.now()}`,
        recipient_user_id: 'usr-central-0941',
        category: 'DEFECT_REPORT',
        title: `Edge AI Alert: ${newEvent.title || newEvent.event_type}`,
        body: `${newEvent.description || 'Road defect detected with camera snapshot.'} (Bus: ${newEvent.bus_id})`,
        read: false,
        created_at: new Date().toISOString(),
        related_entity_type: 'EVENT',
        related_entity_id: newEvent.event_id,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 20)]);
    });

    return () => {
      unsubSim();
      unsubAlerts();
      unsubNotifs();
      unsubEvents();
    };
  }, []);

  const refreshSystemStatus = useCallback(async () => {
    try {
      const status = await monitoringService.getSystemStatus();
      setSystemStatus(status);
    } catch {
      // Ignore or log quietly in background
    }
  }, []);

  const updateSimulationConfig = useCallback(async (newConfig: Partial<SimulationConfig>) => {
    const updated = await simulationService.updateConfig(newConfig);
    setSimulationConfig(updated);
  }, []);

  const toggleDemoMode = useCallback(() => {
    updateSimulationConfig({ is_demo_mode: !simulationConfig.is_demo_mode });
  }, [simulationConfig.is_demo_mode, updateSimulationConfig]);

  const injectDemoEvent = useCallback(async (): Promise<Event> => {
    const event = await simulationService.injectSyntheticEvent();
    setSystemStatus((prev) => ({
      ...prev,
      events_today_count: prev.events_today_count + 1,
    }));
    return event;
  }, []);

  const switchUserRole = useCallback(async (role: User['role']) => {
    const updated = await authService.switchRole(role);
    setCurrentUser(updated);
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    await alertService.dismissAlert(alertId);
    setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await alertService.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === id ? { ...n, read: true } : n))
    );
  }, []);

  // DEMO MODE GPS & BUS SIMULATION ENGINE TICKER
  useEffect(() => {
    if (!simulationConfig.is_demo_mode) return;

    const interval = setInterval(async () => {
      const buses = await busService.getBuses();
      buses.forEach((b) => {
        if (b.operational_status === 'ACTIVE_ON_ROUTE') {
          // Micro-movement along heading
          const rad = (b.heading_degrees * Math.PI) / 180;
          const deltaLat = Math.cos(rad) * 0.00015;
          const deltaLng = Math.sin(rad) * 0.00015;
          const newSpeed = Math.max(15, Math.min(58, b.speed_kmh + (Math.random() - 0.5) * 4));

          busService.updateBusPosition(
            b.bus_id,
            b.current_lat + deltaLat,
            b.current_lng + deltaLng,
            parseFloat(newSpeed.toFixed(1)),
            b.heading_degrees
          );
        }
      });
    }, simulationConfig.gps_tick_rate_ms || 3000);

    return () => clearInterval(interval);
  }, [simulationConfig.is_demo_mode, simulationConfig.gps_tick_rate_ms]);

  const value = useMemo(
    () => ({
      currentRoute,
      navigateTo,
      routeParams,
      currentUser,
      switchUserRole,
      systemStatus,
      refreshSystemStatus,
      simulationConfig,
      updateSimulationConfig,
      injectDemoEvent,
      toggleDemoMode,
      isDemoConfigModalOpen,
      setIsDemoConfigModalOpen,
      isMobileConnectModalOpen,
      setIsMobileConnectModalOpen,
      is17StepDemoOpen,
      setIs17StepDemoOpen,
      isPrivacyMaskingEnabled,
      setIsPrivacyMaskingEnabled,
      alerts,
      notifications,
      dismissAlert,
      markNotificationRead,
      isNotificationDrawerOpen,
      setIsNotificationDrawerOpen,
      selectedEvent,
      setSelectedEvent,
      selectedBus,
      setSelectedBus,
      selectedDefect,
      setSelectedDefect,
      selectedIncident,
      setSelectedIncident,
      globalError,
      setGlobalError,
      isOnline,
      theme,
      setTheme,
    }),
    [
      currentRoute,
      navigateTo,
      routeParams,
      currentUser,
      switchUserRole,
      systemStatus,
      refreshSystemStatus,
      simulationConfig,
      updateSimulationConfig,
      injectDemoEvent,
      toggleDemoMode,
      isDemoConfigModalOpen,
      isMobileConnectModalOpen,
      is17StepDemoOpen,
      isPrivacyMaskingEnabled,
      alerts,
      notifications,
      dismissAlert,
      markNotificationRead,
      isNotificationDrawerOpen,
      selectedEvent,
      selectedBus,
      selectedDefect,
      selectedIncident,
      globalError,
      isOnline,
      theme,
      setTheme,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
