import React, { useMemo, useState } from 'react';
import {
  Search,
  Server,
  Cpu,
  Layers,
  Home,
  HardDrive,
  Grid,
  Bot,
  Bell,
  Settings,
  ArrowRight,
  ShieldCheck,
  Network,
} from 'lucide-react';
import { useHomelab, type NavigationPage } from '../../context/HomelabContext';

/**
 * Ctrl+K palette.
 *
 * Entries come from live Proxmox data. The previous version also advertised
 * "8 Live camera streams" and "12 TB ZFS Pool" as static strings; those are
 * gone along with the systems they described.
 */
interface PaletteItem {
  id: string;
  title: string;
  category: 'Páginas' | 'Máquinas virtuales' | 'Contenedores' | 'Nodos';
  icon: React.ComponentType<{ className?: string }>;
  page: NavigationPage;
  subtitle?: string;
}

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setCurrentPage, vms, containers, nodes } =
    useHomelab();

  const [query, setQuery] = useState('');

  const items = useMemo<PaletteItem[]>(() => {
    const all: PaletteItem[] = [
      { id: 'p-overview', title: 'Overview', category: 'Páginas', icon: ShieldCheck, page: 'overview' },
      { id: 'p-proxmox', title: 'Proxmox Cluster', category: 'Páginas', icon: Server, page: 'proxmox' },
      { id: 'p-vms', title: 'Máquinas virtuales', category: 'Páginas', icon: Cpu, page: 'vms' },
      { id: 'p-ct', title: 'Contenedores LXC', category: 'Páginas', icon: Layers, page: 'containers' },
      { id: 'p-net', title: 'Red', category: 'Páginas', icon: Network, page: 'network' },
      { id: 'p-home', title: 'Smart Home', category: 'Páginas', icon: Home, page: 'smart-home' },
      { id: 'p-storage', title: 'Almacenamiento', category: 'Páginas', icon: HardDrive, page: 'storage' },
      { id: 'p-services', title: 'Servicios', category: 'Páginas', icon: Grid, page: 'services' },
      { id: 'p-hermes', title: 'Hermes AI', category: 'Páginas', icon: Bot, page: 'hermes' },
      { id: 'p-alerts', title: 'Alertas', category: 'Páginas', icon: Bell, page: 'alerts' },
      { id: 'p-settings', title: 'Ajustes', category: 'Páginas', icon: Settings, page: 'settings' },
    ];

    for (const node of nodes.data ?? []) {
      all.push({
        id: `node-${node.id}`,
        title: node.name,
        category: 'Nodos',
        icon: Server,
        page: 'proxmox',
        subtitle: `${node.online ? 'online' : 'offline'}${node.ip ? ` · ${node.ip}` : ''}`,
      });
    }

    for (const vm of vms.data ?? []) {
      all.push({
        id: `vm-${vm.vmid}`,
        title: `${vm.name} (VM ${vm.vmid})`,
        category: 'Máquinas virtuales',
        icon: Cpu,
        page: 'vms',
        subtitle: `${vm.node} · ${vm.status}`,
      });
    }

    for (const ct of containers.data ?? []) {
      all.push({
        id: `ct-${ct.vmid}`,
        title: `${ct.name} (CT ${ct.vmid})`,
        category: 'Contenedores',
        icon: Layers,
        page: 'containers',
        subtitle: `${ct.node} · ${ct.status}`,
      });
    }

    return all;
  }, [vms.data, containers.data, nodes.data]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items.slice(0, 10);
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle?.toLowerCase().includes(q) ?? false) ||
        item.category.toLowerCase().includes(q),
    );
  }, [items, query]);

  if (!isCommandPaletteOpen) return null;

  const go = (item: PaletteItem) => {
    setCurrentPage(item.page);
    setIsCommandPaletteOpen(false);
    setQuery('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 p-4 pt-16 backdrop-blur-md"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5">
          <Search className="h-5 w-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nodos, VMs, contenedores o páginas…"
            className="flex-1 bg-transparent font-sans text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.length > 0) go(filtered[0]!);
            }}
          />
          <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Ningún recurso coincide con &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => go(item)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-800/80"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-slate-800 p-2 text-slate-400 group-hover:bg-slate-700 group-hover:text-cyan-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="truncate text-[11px] text-slate-400">{item.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                      {item.category}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:text-cyan-400 group-hover:opacity-100" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-4 py-2.5 text-[11px] text-slate-400">
          <span>
            <kbd className="font-mono text-slate-300">↵</kbd> para abrir
          </span>
          <span className="font-mono text-cyan-400">NUGA Quick Command</span>
        </div>
      </div>
    </div>
  );
};
