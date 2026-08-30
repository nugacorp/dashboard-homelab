import React, { useEffect, useState } from 'react';
import { Search, Bell, Sparkles, Menu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useHomelab, type NavigationPage } from '../../context/HomelabContext';

const PAGE_TITLES: Record<NavigationPage, string> = {
  overview: 'NOC Overview',
  infrastructure: 'Infraestructura',
  proxmox: 'Proxmox VE',
  vms: 'Máquinas virtuales',
  containers: 'Contenedores LXC',
  network: 'Red',
  unifi: 'UniFi',
  starlink: 'Starlink',
  'smart-home': 'Smart Home',
  cameras: 'Cámaras',
  storage: 'Almacenamiento',
  services: 'Servicios',
  energy: 'Energía',
  hermes: 'Hermes AI',
  alerts: 'Alertas',
  logs: 'Logs',
  settings: 'Ajustes',
};

/**
 * Top bar.
 *
 * The old header advertised a health score and a live Starlink pill, both
 * fabricated. It now shows the real cluster state and the count of integrations
 * currently reporting a failure.
 */
export const Header: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    cluster,
    ready,
    setIsHermesDrawerOpen,
    setIsCommandPaletteOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useHomelab();

  const [showNotifications, setShowNotifications] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const clock = now.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const failing = ready.data
    ? (Object.entries(ready.data.integrations) as [string, { state: string; detail: string }][])
        .filter(([, health]) => health.state === 'unavailable')
    : [];

  const clusterLabel = (() => {
    if (cluster.phase === 'ok' && cluster.data) {
      const c = cluster.data;
      return `${c.name ?? 'Proxmox'} · ${c.nodesOnline}/${c.nodesTotal} nodos`;
    }
    if (cluster.phase === 'not_configured') return 'Proxmox no configurado';
    if (cluster.phase === 'error') return 'Proxmox no disponible';
    return 'Consultando Proxmox…';
  })();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Abrir navegación"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-mono text-base font-bold text-slate-100 md:text-lg">
              {PAGE_TITLES[currentPage]}
            </h1>
            {cluster.stale && (
              <span className="hidden rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300 sm:inline-block">
                STALE
              </span>
            )}
          </div>
          <p className="hidden truncate text-xs text-slate-400 sm:block">NUGA HOME · {clusterLabel}</p>
        </div>
      </div>

      <div className="hidden max-w-md flex-1 px-4 lg:block">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-900"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Buscar nodos, VMs, contenedores…</span>
          </div>
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
            Ctrl + K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-slate-200 lg:hidden"
          title="Buscar"
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title="Estado de integraciones"
          >
            <Bell className="h-4 w-4" />
            {failing.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 font-mono text-[10px] font-bold text-slate-950">
                {failing.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Integraciones con fallo ({failing.length})
                </span>
                <button
                  onClick={() => {
                    setCurrentPage('alerts');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Ver todo
                </button>
              </div>
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                {failing.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Ninguna integración configurada está fallando.</span>
                  </div>
                ) : (
                  failing.map(([key, health]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-rose-500/25 bg-rose-950/20 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-1.5 font-mono font-bold text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{key}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{health.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsHermesDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm shadow-cyan-500/10 transition-all hover:border-cyan-500/60 hover:bg-cyan-900/30"
          title="Abrir Hermes"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Hermes</span>
        </button>

        <div className="hidden border-l border-slate-800 pl-3 font-mono text-xs font-bold text-slate-300 md:block">
          {clock}
        </div>
      </div>
    </header>
  );
};
