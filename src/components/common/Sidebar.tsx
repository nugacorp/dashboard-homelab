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
  ShieldCheck,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { useHomelab, type NavigationPage } from '../../context/HomelabContext';

/**
 * Navigation.
 *
 * Badges are derived from live data only. Pages whose upstream does not exist
 * yet carry a dim "n/c" marker instead of the invented counters the previous
 * version showed ("245M", "684W", "42 Cl.", "12 TB", "8 On").
 */

interface NavItem {
  page: NavigationPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
  /** Renders the badge in the muted "not configured" style. */
  muted?: boolean;
}

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    session,
    logout,
    nodes,
    vms,
    containers,
    homeAssistant,
    network,
    unifi,
    ready,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useHomelab();
  const [collapsed, setCollapsed] = useState(false);

  const count = (n: number | undefined | null) => (n === undefined || n === null ? null : String(n));
  const degraded = ready.data
    ? Object.values(ready.data.integrations).filter((i) => i.state === 'unavailable').length
    : 0;

  const navItems: NavItem[] = [
    { page: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { page: 'proxmox', label: 'Proxmox Cluster', icon: Server, badge: count(nodes.data?.length) },
    { page: 'vms', label: 'Virtual Machines', icon: Cpu, badge: count(vms.data?.length) },
    { page: 'containers', label: 'Contenedores LXC', icon: Layers, badge: count(containers.data?.length) },
    {
      page: 'network',
      label: 'Red',
      icon: Network,
      badge:
        network.phase === 'ok'
          ? 'OK'
          : network.phase === 'error'
            ? '!'
            : 'n/c',
      muted: network.phase !== 'ok',
    },
    {
      page: 'unifi',
      label: 'UniFi',
      icon: Wifi,
      badge:
        unifi.phase === 'ok'
          ? String(unifi.data?.devices.length ?? 0)
          : unifi.phase === 'error'
            ? '!'
            : 'n/c',
      muted: unifi.phase !== 'ok',
    },
    { page: 'starlink', label: 'Starlink', icon: Radio, badge: 'n/c', muted: true },
    {
      page: 'smart-home',
      label: 'Smart Home',
      icon: Home,
      badge: count(homeAssistant.data?.entitiesTotal),
    },
    { page: 'cameras', label: 'Cámaras', icon: Camera, badge: 'n/c', muted: true },
    { page: 'storage', label: 'Almacenamiento', icon: HardDrive, badge: null },
    { page: 'services', label: 'Servicios', icon: Grid, badge: null },
    { page: 'energy', label: 'Energía', icon: Zap, badge: 'n/c', muted: true },
    { page: 'hermes', label: 'Hermes AI', icon: Bot, badge: null },
    {
      page: 'alerts',
      label: 'Alertas',
      icon: Bell,
      badge: degraded > 0 ? String(degraded) : null,
    },
    { page: 'logs', label: 'Logs', icon: Terminal, badge: null },
    { page: 'settings', label: 'Ajustes', icon: Settings, badge: null },
  ];

  const handleNavigate = (page: NavigationPage) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  const badgeClass = (item: NavItem) =>
    item.muted
      ? 'border-slate-800 bg-slate-900/80 text-slate-600'
      : item.page === 'alerts'
        ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
        : 'border-slate-700/60 bg-slate-800/80 text-slate-300';

  const renderNav = (keyPrefix: string, showLabels: boolean) =>
    navItems.map((item) => {
      const Icon = item.icon;
      const isActive = currentPage === item.page;
      return (
        <button
          key={`${keyPrefix}-${item.page}`}
          onClick={() => handleNavigate(item.page)}
          title={!showLabels ? item.label : undefined}
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            isActive
              ? 'border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
              : 'text-slate-400 hover:border hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200'
          } ${!showLabels ? 'justify-center px-2' : ''}`}
        >
          <Icon
            className={`h-4 w-4 transition-colors ${
              isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          {showLabels && (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              {item.badge && (
                <span
                  className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${badgeClass(item)}`}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </button>
      );
    });

  const brand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-600/20">
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className="font-mono text-sm font-extrabold tracking-wider text-slate-50">NUGA HOME</div>
        <div className="text-[10px] font-medium tracking-tight text-cyan-400">Command Center</div>
      </div>
    </div>
  );

  const userFooter = (
    <div className="border-t border-slate-800/80 p-3">
      <div className="flex items-center gap-3 rounded-xl p-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-xs font-bold text-slate-200">
            {session.username ?? (session.authRequired ? 'Sesión' : 'Acceso local')}
          </div>
          <div className="text-[10px] text-slate-500">
            {session.authRequired ? 'Autenticado' : 'Auth desactivada'}
          </div>
        </div>
        {session.authRequired && (
          <button
            onClick={() => void logout()}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-rose-300"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
          {brand}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">{renderNav('mobile', true)}</nav>
        {userFooter}
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`relative hidden shrink-0 flex-col border-r border-slate-800/80 bg-slate-950 transition-all duration-300 md:flex ${
          collapsed ? 'w-[4.5rem]' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
          {!collapsed ? (
            brand
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            title={collapsed ? 'Expandir' : 'Contraer'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="border-b border-slate-900/60 bg-slate-900/40 px-4 py-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400">Home Ops NOC</span>
              <span className="font-mono font-medium text-cyan-400">nuga-ops</span>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">{renderNav('desktop', !collapsed)}</nav>
        {!collapsed && userFooter}
      </aside>
    </>
  );
};
