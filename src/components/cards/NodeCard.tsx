import React from 'react';
import { Server, Clock, Cpu, Layers, ChevronRight, Activity } from 'lucide-react';
import type { ProxmoxNodeDto } from '@shared/api';
import { StatusBadge } from '../ui/StatusBadge';
import { ResourceProgress } from '../ui/ResourceProgress';
import { formatBytes, formatPct, formatUptime, ratioPct, NOT_AVAILABLE } from '../../lib/format';

export interface NodeCardProps {
  node: ProxmoxNodeDto;
  onSelect?: () => void;
}

/**
 * One Proxmox node.
 *
 * The old version showed a CPU package temperature. The Proxmox API does not
 * expose sensor data, so that row is gone rather than filled with a number.
 * IO delay, which pvestatd genuinely reports, took its place.
 */
export const NodeCard: React.FC<NodeCardProps> = ({ node, onSelect }) => {
  const ramPct = ratioPct(node.memoryUsedBytes, node.memoryTotalBytes);
  const rootfsPct = ratioPct(node.rootfsUsedBytes, node.rootfsTotalBytes);

  return (
    <div
      onClick={onSelect}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur-md transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-900/95 hover:shadow-lg hover:shadow-cyan-950/20"
    >
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="rounded-xl bg-slate-800 p-2 text-cyan-400 group-hover:bg-cyan-500/20">
            <Server className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-mono text-sm font-bold text-slate-100">{node.name}</h4>
              <StatusBadge status={node.online ? 'online' : 'offline'} size="sm" />
            </div>
            <p className="truncate text-[11px] text-slate-400" title={node.cpuModel ?? undefined}>
              {node.cpuModel ?? NOT_AVAILABLE}
              {node.cpuCores !== null && ` · ${node.cpuCores} vCPU`}
            </p>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
      </div>

      <div className="mt-3.5 flex items-center justify-between border-y border-slate-800/80 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-mono text-[11px] text-slate-300">{formatUptime(node.uptimeSeconds)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-mono text-[11px] text-slate-300">
            IO {formatPct(node.ioDelayPct)}
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          <span className="text-slate-300">{node.ip ?? NOT_AVAILABLE}</span>
        </div>
      </div>

      <div className="mt-3.5 space-y-3">
        <ResourceProgress
          label="CPU"
          percentage={node.cpuUsagePct}
          usedText={formatPct(node.cpuUsagePct)}
          size="sm"
        />
        <ResourceProgress
          label="Memoria"
          percentage={ramPct}
          usedText={formatBytes(node.memoryUsedBytes)}
          totalText={formatBytes(node.memoryTotalBytes)}
          size="sm"
        />
        <ResourceProgress
          label="Disco raíz"
          percentage={rootfsPct}
          usedText={formatBytes(node.rootfsUsedBytes)}
          totalText={formatBytes(node.rootfsTotalBytes)}
          size="sm"
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>VMs:</span>
          <span className="font-mono font-bold text-slate-200">
            {node.guests.vmsRunning} / {node.guests.vmsTotal}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          <span>LXC:</span>
          <span className="font-mono font-bold text-slate-200">
            {node.guests.lxcRunning} / {node.guests.lxcTotal}
          </span>
        </div>
      </div>
    </div>
  );
};
