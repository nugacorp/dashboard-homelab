import React, { useState, useMemo } from 'react';
import {
  Search,
  Server,
  Cpu,
  Layers,
  Camera,
  Home,
  HardDrive,
  Grid,
  Bot,
  Bell,
  Settings,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useHomelab, NavigationPage } from '../../context/HomelabContext';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setCurrentPage,
    vms,
    containers,
    cameras,
    services,
    rooms,
    sendHermesMessage,
    setIsHermesDrawerOpen
  } = useHomelab();

  const [query, setQuery] = useState('');

  // Collect all searchable entities
  const items = useMemo(() => {
    const all: {
      id: string;
      title: string;
      category: 'Pages' | 'Virtual Machines' | 'Containers' | 'Cameras' | 'Services' | 'Rooms' | 'Hermes';
      icon: any;
      page?: NavigationPage;
      action?: () => void;
      subtitle?: string;
    }[] = [
      // Pages
      { id: 'p-overview', title: 'NOC Overview Dashboard', category: 'Pages', icon: ShieldCheck, page: 'overview', subtitle: 'Main health & telemetry center' },
      { id: 'p-proxmox', title: 'Proxmox Cluster (3 Nodes)', category: 'Pages', icon: Server, page: 'proxmox', subtitle: 'Hardware, load, nodes' },
      { id: 'p-vms', title: 'Virtual Machines Fleet', category: 'Pages', icon: Cpu, page: 'vms', subtitle: '14 VMs status and controls' },
      { id: 'p-containers', title: 'LXC & Docker Containers', category: 'Pages', icon: Layers, page: 'containers', subtitle: '22 Containers running' },
      { id: 'p-network', title: 'Network & Topology', category: 'Pages', icon: Server, page: 'network', subtitle: 'UDM-Pro & Starlink routing' },
      { id: 'p-smarthome', title: 'Smart Home & Rooms', category: 'Pages', icon: Home, page: 'smart-home', subtitle: 'Home Assistant lights, climate, locks' },
      { id: 'p-cameras', title: 'Security Cameras & Frigate', category: 'Pages', icon: Camera, page: 'cameras', subtitle: '8 Live camera streams' },
      { id: 'p-storage', title: 'Storage NAS & Immich', category: 'Pages', icon: HardDrive, page: 'storage', subtitle: '12 TB ZFS Pool & SMART' },
      { id: 'p-services', title: 'Homelab Services Catalog', category: 'Pages', icon: Grid, page: 'services', subtitle: '32 Services management' },
      { id: 'p-energy', title: 'Energy & Power Grid', category: 'Pages', icon: Server, page: 'energy', subtitle: '684W live power draw' },
      { id: 'p-alerts', title: 'Central Alert Manager', category: 'Pages', icon: Bell, page: 'alerts', subtitle: 'NOC alerts & resolution' },
      { id: 'p-settings', title: 'Settings & Integrations', category: 'Pages', icon: Settings, page: 'settings', subtitle: 'API tokens, permissions' }
    ];

    // Add VMs
    vms.forEach(vm => {
      all.push({
        id: `vm-${vm.vmid}`,
        title: `${vm.name} (VM ${vm.vmid})`,
        category: 'Virtual Machines',
        icon: Cpu,
        page: 'vms',
        subtitle: `${vm.os} • ${vm.node} • ${vm.ipAddress}`
      });
    });

    // Add Containers
    containers.forEach(c => {
      all.push({
        id: `ct-${c.vmid}`,
        title: `${c.name} (CT ${c.vmid})`,
        category: 'Containers',
        icon: Layers,
        page: 'containers',
        subtitle: `${c.node} • ${c.ipAddress}`
      });
    });

    // Add Cameras
    cameras.forEach(cam => {
      all.push({
        id: `cam-${cam.id}`,
        title: cam.name,
        category: 'Cameras',
        icon: Camera,
        page: 'cameras',
        subtitle: `${cam.location} • ${cam.resolution}`
      });
    });

    // Add Services
    services.forEach(srv => {
      all.push({
        id: `srv-${srv.id}`,
        title: srv.name,
        category: 'Services',
        icon: Grid,
        page: 'services',
        subtitle: `${srv.category} • Port ${srv.port} • ${srv.status}`
      });
    });

    // Add Rooms
    rooms.forEach(r => {
      all.push({
        id: `room-${r.id}`,
        title: `${r.name} Room`,
        category: 'Rooms',
        icon: Home,
        page: 'smart-home',
        subtitle: `${r.temperatureC}°C • ${r.lightsActive}/${r.lightsCount} Lights Active`
      });
    });

    return all;
  }, [vms, containers, cameras, services, rooms]);

  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return items.slice(0, 10);
    return items.filter(
      item =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.category || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 p-4 pt-16 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5">
          <Search className="h-5 w-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search nodes, VMs, services, cameras..."
            className="flex-1 bg-transparent font-sans text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && filtered.length > 0) {
                const first = filtered[0];
                if (first.page) {
                  setCurrentPage(first.page);
                } else if (first.action) {
                  first.action();
                }
                setIsCommandPaletteOpen(false);
              }
            }}
          />
          <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Ask Hermes Action Option if query typed */}
        {query.trim() && (
          <div className="border-b border-slate-800/80 bg-cyan-950/20 px-4 py-2">
            <button
              onClick={() => {
                sendHermesMessage(query);
                setIsCommandPaletteOpen(false);
                setIsHermesDrawerOpen(true);
              }}
              className="flex w-full items-center justify-between text-xs text-cyan-300 hover:underline"
            >
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-cyan-400" />
                <span>Ask Hermes AI: &quot;{query}&quot;</span>
              </div>
              <span className="font-mono text-[10px] text-cyan-500">Press Enter</span>
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching resources found for &quot;{query}&quot;
            </div>
          ) : (
            filtered.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.page) {
                      setCurrentPage(item.page);
                    } else if (item.action) {
                      item.action();
                    }
                    setIsCommandPaletteOpen(false);
                  }}
                  className="group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-800 p-2 text-slate-400 group-hover:bg-slate-700 group-hover:text-cyan-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                        {item.title}
                      </div>
                      {item.subtitle && <div className="text-[11px] text-slate-400">{item.subtitle}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                      {item.category}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-4 py-2.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono text-slate-300">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono text-slate-300">↵</kbd> to select
            </span>
          </div>
          <span className="font-mono text-cyan-400">NUGA Quick Command</span>
        </div>
      </div>
    </div>
  );
};
