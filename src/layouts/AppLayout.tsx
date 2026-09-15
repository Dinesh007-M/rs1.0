import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { NotificationDrawer } from '../components/common/NotificationDrawer';
import { DemoConfigModal } from '../components/common/DemoConfigModal';
import { EntityInspector } from '../components/common/EntityInspector';
import { MobileConnectModal } from '../components/common/MobileConnectModal';
import { RoadDefectVerificationDemoModal } from '../components/demo/RoadDefectVerificationDemoModal';
import { useApp } from '../context/AppContext';
import { AlertTriangle, WifiOff } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    isOnline,
    simulationConfig,
    isMobileConnectModalOpen,
    setIsMobileConnectModalOpen,
    is17StepDemoOpen,
    setIs17StepDemoOpen,
  } = useApp();

  const isNetworkSimulatedOffline = simulationConfig.network_condition === 'OFFLINE_QUEUE';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 h-full bg-slate-950 shadow-2xl z-10 flex flex-col">
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Offline / Simulated Disconnect Banner */}
        {(!isOnline || isNetworkSimulatedOffline) && (
          <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {isNetworkSimulatedOffline
                  ? 'SIMULATION ALERT: Edge Mesh Disconnected. Events queue locally on buses until MQTT reconnects.'
                  : 'Browser offline: Sensing updates paused.'}
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-amber-300">
              LOCAL CACHE ACTIVE
            </span>
          </div>
        )}

        {/* Scrollable Viewport Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 space-y-6">
          {children}
        </main>
      </div>

      {/* Slide-out Modals & Trays */}
      <NotificationDrawer />
      <DemoConfigModal />
      <EntityInspector />
      <MobileConnectModal
        isOpen={isMobileConnectModalOpen}
        onClose={() => setIsMobileConnectModalOpen(false)}
      />
      <RoadDefectVerificationDemoModal
        isOpen={is17StepDemoOpen}
        onClose={() => setIs17StepDemoOpen(false)}
      />
    </div>
  );
};

