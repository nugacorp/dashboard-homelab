import React from 'react';
import { Server, Thermometer, Clock, Cpu, HardDrive, Layers, ChevronRight } from 'lucide-react';
import { ProxmoxNode } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ResourceProgress } from '../ui/ResourceProgress';

export interface NodeCardProps {
  node: ProxmoxNode;
  onSelect?: () => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({ node, onSelect }) => {
  const ramPct = (node.ramUsedGb / node.ramTotalGb) * 100;
  const storagePct = (node.storageUsedTb / node.storageTotalTb) * 100;

  return (
    <div
      onClick={onSelect}
      className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4.5 backdrop-blur-md transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-900/95 hover:shadow-lg hover:shadow-cyan-950/20 cursor-pointer"
    >
      {/* Top Bar */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-slate-800 p-2 text-cyan-400 group-hover:bg-cyan-500/20">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-mono text-sm font-bold text-slate-100">{node.name}</h4>
              <StatusBadge status={node.status} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">{node.cpuModel}</p>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
      </div>

      {/* Thermals & Uptime Bar */}
      <div className="mt-3.5 flex items-center justify-between border-y border-slate-800/80 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Thermometer className={`h-3.5 w-3.5 ${node.temperatureC > 65 ? 'text-rose-400' : 'text-emerald-400'}`} />
          <span className="font-mono font-medium text-slate-200">{node.temperatureC}°C</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-mono text-[11px] text-slate-300">{node.uptimeString}</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          IP: <span className="text-slate-300">{node.ip}</span>
        </div>
      </div>

      {/* Resource Metrics */}
      <div className="mt-3.5 space-y-3">
        <ResourceProgress
          label="CPU Usage"
          percentage={node.cpuUsagePct}
          usedText={`${node.cpuUsagePct}%`}
          size="sm"
        />

        <ResourceProgress
          label="Memory (RAM)"
          percentage={ramPct}
          usedText={`${node.ramUsedGb.toFixed(1)} GB`}
          totalText={`${node.ramTotalGb} GB`}
          size="sm"
        />

        <ResourceProgress
          label="ZFS Local Storage"
          percentage={storagePct}
          usedText={`${node.storageUsedTb.toFixed(2)} TB`}
          totalText={`${node.storageTotalTb} TB`}
          size="sm"
        />
      </div>

      {/* Bottom Fleet Counts */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>VMs:</span>
          <span className="font-mono font-bold text-slate-200">
            {node.vmsRunning} / {node.vmsTotal}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          <span>Containers:</span>
          <span className="font-mono font-bold text-slate-200">
            {node.containersRunning} / {node.containersTotal}
          </span>
        </div>
      </div>
    </div>
  );
};
