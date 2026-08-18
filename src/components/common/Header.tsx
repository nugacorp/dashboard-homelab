import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Wifi,
  ExternalLink
} from 'lucide-react';
import { useHomelab, NavigationPage } from '../../context/HomelabContext';
import { StatusBadge } from '../ui/StatusBadge';

export const Header: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    overview,
    alerts,
    acknowledgeAlert,
    setIsHermesDrawerOpen,
    setIsCommandPaletteOpen,
    starlink
  } = useHomelab();

  const [showNotifications, setShowNotifications] = useState(false);
  const activeAlerts = alerts.filter(a => a.status !== 'resolved');

  const pageTitles: Record<NavigationPage, string> = {
    overview: 'NOC Overview',
    infrastructure: 'Infrastructure & Cluster',
    proxmox: 'Proxmox VE Nodes & VMs',
    vms: 'Virtual Machines',
    containers: 'LXC & Docker Containers',
    network: 'UniFi Network & Topology',
    unifi: 'UniFi SDN Controller',
    starlink: 'Starlink Telemetry',
    'smart-home': 'Smart Home & Rooms',
    cameras: 'Security Cameras & Frigate',
    storage: 'ZFS Storage Pools & Immich',
    services: 'Homelab Services Catalog',
    energy: 'Power & Smart Energy Grid',
    hermes: 'Hermes AI Assistant',
    alerts: 'Central Alert Manager',
    logs: 'Live Journal & Syslog Stream',
    settings: 'System Settings & Integrations'
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-xl md:px-6">
      {/* Left: Breadcrumb / Page Title */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-base font-bold text-slate-100 md:text-lg">
              {pageTitles[currentPage] || 'Overview'}
            </h1>
            <span className="hidden rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 sm:inline-block">
              LIVE
            </span>
          </div>
          <p className="hidden text-xs text-slate-400 sm:block">
            NUGA HOME • {overview.homeStatus} ({overview.healthScore}% Health)
          </p>
        </div>
      </div>

      {/* Center: Quick Command Palette Trigger */}
      <div className="hidden max-w-md flex-1 px-4 lg:block">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-900"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search nodes, VMs, devices, cameras, or ask Hermes...</span>
          </div>
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry pill, Notifications, Hermes trigger, User profile, Clock */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-slate-200 lg:hidden"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Starlink Live Indicator */}
        <div
          onClick={() => setCurrentPage('starlink')}
          className="hidden cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1 text-xs transition-colors hover:bg-slate-900 md:flex"
        >
          <Wifi className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-mono text-slate-200">{starlink.downloadMbps} Mbps</span>
          <span className="font-mono text-slate-400">({starlink.latencyMs}ms)</span>
        </div>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title="System Alerts"
          >
            <Bell className="h-4 w-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 font-mono text-[10px] font-bold text-slate-950">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div
              className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Active Alerts ({activeAlerts.length})
                </span>
                <button
                  onClick={() => {
                    setCurrentPage('alerts');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                {activeAlerts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No active alerts. Homelab nominal.</p>
                ) : (
                  activeAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <StatusBadge status={alert.severity} size="sm" showPulse={false} />
                        <span className="font-mono text-[10px] text-slate-400">{alert.timestamp}</span>
                      </div>
                      <p className="mt-1.5 font-medium text-slate-200">{alert.message}</p>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hermes Floating Drawer Toggle Button */}
        <button
          onClick={() => setIsHermesDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm shadow-cyan-500/10 transition-all hover:border-cyan-500/60 hover:bg-cyan-900/30"
          title="Open Hermes AI"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Hermes</span>
        </button>

        {/* Real-time Clock */}
        <div className="hidden border-l border-slate-800 pl-3 font-mono text-xs font-bold text-slate-300 md:block">
          {overview.lastUpdated}
        </div>
      </div>
    </header>
  );
};
