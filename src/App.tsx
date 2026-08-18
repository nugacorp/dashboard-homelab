import React from 'react';
import { HomelabProvider, useHomelab } from './context/HomelabContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { OverviewPage } from './pages/OverviewPage';
import { ProxmoxPage } from './pages/ProxmoxPage';
import { VMsPage } from './pages/VMsPage';
import { ContainersPage } from './pages/ContainersPage';
import { NetworkPage } from './pages/NetworkPage';
import { UniFiPage } from './pages/UniFiPage';
import { StarlinkPage } from './pages/StarlinkPage';
import { SmartHomePage } from './pages/SmartHomePage';
import { CamerasPage } from './pages/CamerasPage';
import { StoragePage } from './pages/StoragePage';
import { ServicesPage } from './pages/ServicesPage';
import { EnergyPage } from './pages/EnergyPage';
import { HermesPage } from './pages/HermesPage';
import { AlertsPage } from './pages/AlertsPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CommandPalette } from './components/common/CommandPalette';
import { HermesDrawer } from './components/common/HermesDrawer';
import { LiveCameraModal } from './components/common/LiveCameraModal';
import { ConfirmationDialog } from './components/ui/ConfirmationDialog';

const AppContent: React.FC = () => {
  const { currentPage } = useHomelab();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'infrastructure':
      case 'proxmox':
        return <ProxmoxPage />;
      case 'vms':
        return <VMsPage />;
      case 'containers':
        return <ContainersPage />;
      case 'network':
        return <NetworkPage />;
      case 'unifi':
        return <UniFiPage />;
      case 'starlink':
        return <StarlinkPage />;
      case 'smart-home':
        return <SmartHomePage />;
      case 'cameras':
        return <CamerasPage />;
      case 'storage':
        return <StoragePage />;
      case 'services':
        return <ServicesPage />;
      case 'energy':
        return <EnergyPage />;
      case 'hermes':
        return <HermesPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'logs':
        return <LogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-300 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#020617]">
          {renderCurrentPage()}
        </div>
      </main>
      <HermesDrawer />
      <CommandPalette />
      <LiveCameraModal />
      <ConfirmationDialog />
    </div>
  );
};

export default function App() {
  return (
    <HomelabProvider>
      <AppContent />
    </HomelabProvider>
  );
}
