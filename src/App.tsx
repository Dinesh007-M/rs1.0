/**
 * ROAD SENSE — Central Urban Intelligence Platform
 * Mobile sensing bus network with edge AI, event detection, verification, and GIS operations.
 */
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './layouts/AppLayout';

// Page Views
import { OverviewPage } from './pages/OverviewPage';
import { MobileDashcamPage } from './pages/MobileDashcamPage';
import { LiveOperationsPage } from './pages/LiveOperationsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { RoadDefectsPage } from './pages/RoadDefectsPage';
import { SchoolSafetyPage } from './pages/SchoolSafetyPage';
import { AnprTrackerPage } from './pages/AnprTrackerPage';
import { TrafficPage } from './pages/TrafficPage';
import { FleetPage } from './pages/FleetPage';
import { AiDetectionPage } from './pages/AiDetectionPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { SettingsPage } from './pages/SettingsPage';
import { AiModelsPage } from './pages/AiModelsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { UsersPage } from './pages/UsersPage';

const AppContent: React.FC = () => {
  const { currentRoute } = useApp();

  const renderRoute = () => {
    switch (currentRoute) {
      case 'overview':
        return <OverviewPage />;
      case 'mobile-dashcam':
        return <MobileDashcamPage />;
      case 'live-operations':
        return <LiveOperationsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'road-defects':
        return <RoadDefectsPage />;
      case 'school-safety':
        return <SchoolSafetyPage />;
      case 'anpr-tracker':
        return <AnprTrackerPage />;
      case 'traffic':
        return <TrafficPage />;
      case 'fleet':
        return <FleetPage />;
      case 'ai-detection':
        return <AiDetectionPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'reports':
        return <ReportsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'monitoring':
        return <MonitoringPage />;
      case 'models':
        return <AiModelsPage />;
      case 'audit':
        return <AuditLogPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return <AppLayout>{renderRoute()}</AppLayout>;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
