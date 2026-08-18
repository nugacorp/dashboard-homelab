import React from 'react';
import { Loader2 } from 'lucide-react';
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
import { LoginPage } from './pages/LoginPage';
import { CommandPalette } from './components/common/CommandPalette';
import { HermesDrawer } from './components/common/HermesDrawer';
import { MobileBottomBar } from './components/common/MobileBottomBar';

const AppContent: React.FC = () => {
  const { currentPage, session } = useHomelab();

  if (session.loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#020617] text-slate-400">
        <div className="flex items-center gap-2 font-mono text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          <span>Cargando NUGA HOME…</span>
        </div>
      </div>
    );
  }

  if (session.authRequired && !session.authenticated) {
    return <LoginPage />;
  }

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
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] font-sans text-slate-300">
      <Sidebar />
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto bg-[#020617] p-4 sm:p-6">{renderCurrentPage()}</div>
        <MobileBottomBar />
      </main>
      <HermesDrawer />
      <CommandPalette />
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
