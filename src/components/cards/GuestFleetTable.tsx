import React, { useMemo, useState } from 'react';
import { Search, Filter, RotateCcw, Power, Lock } from 'lucide-react';
import type { ProxmoxGuestDto } from '@shared/api';
import { StatusBadge } from '../ui/StatusBadge';
import { formatBytes, formatPct, formatUptime, NOT_AVAILABLE } from '../../lib/format';

/**
 * Shared VM / LXC fleet table.
 *
 * The power buttons are rendered disabled rather than removed, so the read-only
 * posture is visible instead of merely absent. They are inert in the DOM: there
 * is no click handler, and the matching backend routes answer 403 NOT_ENABLED.
 *
 * Guest IP is not a column. Reading it requires the QEMU guest agent plus
 * privileges beyond PVEAuditor, so the old "IP Address" column could only ever
 * have been fiction.
 */
export interface GuestFleetTableProps {
  guests: ProxmoxGuestDto[];
  idLabel: string;
  searchPlaceholder: string;
}

export const GuestFleetTable: React.FC<GuestFleetTableProps> = ({
  guests,
  idLabel,
  searchPlaceholder,
}) => {
  const [search, setSearch] = useState('');
  const [nodeFilter, setNodeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const nodeNames = useMemo(
    () => ['ALL', ...Array.from(new Set(guests.map((g) => g.node))).sort()],
    [guests],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return guests.filter((g) => {
      const matchSearch =
        q === '' || g.name.toLowerCase().includes(q) || String(g.vmid).includes(q);
      const matchNode = nodeFilter === 'ALL' || g.node === nodeFilter;
      const matchStatus = statusFilter === 'ALL' || g.status === statusFilter;
      return matchSearch && matchNode && matchStatus;
    });
  }, [guests, search, nodeFilter, statusFilter]);

  return (
    <>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-slate-300">
            {filtered.length} / {guests.length}
          </span>

          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
          <div className="mr-2 flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Nodo:</span>
          </div>
          {nodeNames.map((node) => (
            <button
              key={node}
              onClick={() => setNodeFilter(node)}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                nodeFilter === node
                  ? 'border border-cyan-500/30 bg-cyan-500/20 font-bold text-cyan-300'
                  : 'border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {node === 'ALL' ? 'todos' : node}
            </button>
          ))}

          <div className="mx-2 h-4 w-px bg-slate-800" />

          <span className="mr-1 text-xs text-slate-400">Estado:</span>
          {['ALL', 'running', 'stopped'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'border border-cyan-500/30 bg-cyan-500/20 font-bold text-cyan-300'
                  : 'border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? 'todos' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 font-mono text-slate-400">
              <tr>
                <th className="px-4 py-3.5">{idLabel}</th>
                <th className="px-4 py-3.5">Nombre</th>
                <th className="px-4 py-3.5">Nodo</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5">vCPU</th>
                <th className="px-4 py-3.5">CPU</th>
                <th className="px-4 py-3.5">Memoria</th>
                <th className="px-4 py-3.5">Disco</th>
                <th className="px-4 py-3.5">Uptime</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                    Ningún resultado con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => (
                  <tr key={`${guest.type}-${guest.vmid}`} className="transition-colors hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-mono font-bold text-cyan-400">{guest.vmid}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-200">
                      {guest.name}
                      {guest.isTemplate && (
                        <span className="ml-2 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                          TEMPLATE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{guest.node}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={guest.status}
                        size="sm"
                        showPulse={guest.status === 'running'}
                      />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {guest.cpuCores ?? NOT_AVAILABLE}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {formatPct(guest.cpuUsagePct)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {formatBytes(guest.memoryUsedBytes, 1)} /{' '}
                      {formatBytes(guest.memoryTotalBytes, 1)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {formatBytes(guest.diskTotalBytes, 0)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">
                      {formatUptime(guest.uptimeSeconds)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <DisabledAction icon={RotateCcw} label="Reiniciar" />
                        <DisabledAction icon={Power} label="Apagar" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-1.5 border-t border-slate-800 bg-slate-950/60 px-4 py-2.5">
          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="font-mono text-[11px] text-slate-500">
            Control no habilitado — el backend responde 403 NOT_ENABLED a cualquier operación de
            escritura sobre Proxmox en esta versión.
          </span>
        </div>
      </div>
    </>
  );
};

const DisabledAction: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = ({ icon: Icon, label }) => (
  <span
    aria-disabled="true"
    title={`${label} — control no habilitado`}
    className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-700"
  >
    <Icon className="h-3.5 w-3.5" />
  </span>
);
