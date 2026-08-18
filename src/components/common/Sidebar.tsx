import React, { useState } from 'react';
import {
  LayoutDashboard,
  Server,
  Cpu,
  Layers,
  Network,
  Wifi,
  Radio,
  Home,
  Camera,
  HardDrive,
  Grid,
  Zap,
  Bot,
  Bell,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useHomelab, NavigationPage } from '../../context/HomelabContext';
import { StatusBadge } from '../ui/StatusBadge';

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, overview, alerts, cameras, vms, services } = useHomelab();
  const [collapsed, setCollapsed] = useState(false);

  const activeAlertsCount = alerts.filter(a => a.status !== 'resolved').length;

  const navItems = [
    { page: 'overview' as NavigationPage, label: 'Overview', icon: LayoutDashboard, badge: null },
    {
      page: 'proxmox' as NavigationPage,
      label: 'Proxmox Cluster',
      icon: Server,
      badge: '3 Nodes'
    },
    {
      page: 'vms' as NavigationPage,
      label: 'Virtual Machines',
      icon: Cpu,
      badge: `${vms.length}`
    },
    {
      page: 'containers' as NavigationPage,
      label: 'Containers (LXC)',
      icon: Layers,
      badge: '8 CTs'
    },
    {
      page: 'network' as NavigationPage,
      label: 'Network Topology',
      icon: Network,
      badge: null
    },
    {
      page: 'unifi' as NavigationPage,
      label: 'UniFi Network',
      icon: Wifi,
      badge: '42 Cl.'
    },
    {
      page: 'starlink' as NavigationPage,
      label: 'Starlink Uplink',
      icon: Radio,
      badge: '245M'
    },
    {
      page: 'smart-home' as NavigationPage,
      label: 'Smart Home',
      icon: Home,
      badge: '8 On'
    },
    {
      page: 'cameras' as NavigationPage,
      label: 'Cameras & NVR',
      icon: Camera,
      badge: `${cameras.length}`
    },
    {
      page: 'storage' as NavigationPage,
      label: 'Storage & Immich',
      icon: HardDrive,
      badge: '12 TB'
    },
    {
      page: 'services' as NavigationPage,
      label: 'Services & Docker',
      icon: Grid,
      badge: `${services.length}`
    },
    {
      page: 'energy' as NavigationPage,
      label: 'Energy & Power',
      icon: Zap,
      badge: '684W'
    },
    {
      page: 'hermes' as NavigationPage,
      label: 'Hermes AI',
      icon: Bot,
      badge: 'AI'
    },
    {
      page: 'alerts' as NavigationPage,
      label: 'Alerts',
      icon: Bell,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      page: 'logs' as NavigationPage,
      label: 'System Logs',
      icon: Terminal,
      badge: null
    },
    {
      page: 'settings' as NavigationPage,
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800/80 bg-slate-950 transition-all duration-300 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-600/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-mono text-sm font-extrabold tracking-wider text-slate-50">NUGA HOME</div>
              <div className="text-[10px] font-medium tracking-tight text-cyan-400">Command Center</div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200 md:block"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Powered by Hermes Subtitle banner */}
      {!collapsed && (
        <div className="border-b border-slate-900/60 bg-slate-900/40 px-4 py-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">Home Ops NOC</span>
            <span className="font-mono font-medium text-cyan-400">Powered by Hermes</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;

          return (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              title={collapsed ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:border hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-md border border-slate-700/60 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-300 ${
                        item.badgeColor || ''
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Bar */}
      <div className="border-t border-slate-800/80 p-3">
        <div
          onClick={() => setCurrentPage('settings')}
          className={`flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-900 ${
            collapsed ? 'justify-center p-1' : ''
          }`}
        >
          <div className="relative">
            <img
              src={overview.user.avatarUrl}
              alt={overview.user.name}
              className="h-8 w-8 rounded-full border border-slate-700 object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-500" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-mono text-xs font-bold text-slate-200">{overview.user.name}</div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>{overview.user.role}</span>
                <span>•</span>
                <span className="text-emerald-400">Online</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
