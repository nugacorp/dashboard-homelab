import React, { useState } from 'react';
import {
  Server,
  Cpu,
  Layers,
  Thermometer,
  RotateCcw,
  Power,
  HardDrive,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ResourceProgress } from '../components/ui/ResourceProgress';

export const ProxmoxPage: React.FC = () => {
  const { cluster, nodes, vms, containers, requestConfirmation, setCurrentPage } = useHomelab();
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || 'pve-01');

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
  const nodeVMs = vms.filter(v => v.node === selectedNode?.name);
  const nodeCTs = containers.filter(c => c.node === selectedNode?.name);

  return (
    <div className="space-y-6 pb-12">
      {/* Cluster Overview Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-lg font-bold text-slate-100">{cluster.name}</h2>
                <StatusBadge status={cluster.quorumStatus} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                PVE v{cluster.pveVersion} • 3 Physical Nodes • Corosync Quorum Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">Avg CPU:</span>{' '}
              <span className="font-bold text-slate-100">{cluster.cpuUsageAvgPct}%</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">RAM:</span>{' '}
              <span className="font-bold text-slate-100">
                {cluster.ramUsedGb} / {cluster.ramTotalGb} GB
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">Storage:</span>{' '}
              <span className="font-bold text-slate-100">
                {cluster.storageUsedTb} / {cluster.storageTotalTb} TB
              </span>
            </div>
          </div>
        </div>

        {/* Node Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {nodes.map(node => (
            <button
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                selectedNodeId === node.id
                  ? 'border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'border border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Server className="h-4 w-4" />
              <span>{node.name}</span>
              <span className="font-mono text-[11px] text-slate-400">({node.cpuUsagePct}% CPU)</span>
              <StatusBadge status={node.status} size="sm" showPulse={false} />
            </button>
          ))}
        </div>
      </div>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-base font-bold text-slate-100">{selectedNode.name}</h3>
                <StatusBadge status={selectedNode.status} />
              </div>
              <p className="text-xs text-slate-400">
                {selectedNode.cpuModel} ({selectedNode.cpuCores} Cores / {selectedNode.cpuThreads} Threads) • Kernel {selectedNode.kernel}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  requestConfirmation({
                    title: 'Reboot Proxmox Node',
                    action: `Reboot Physical Host (${selectedNode.name})`,
                    resource: `${selectedNode.name} (${selectedNode.ip})`,
                    impact: `Will migrate or halt ${nodeVMs.length} VMs and ${nodeCTs.length} LXC containers hosted on this node.`,
                    onConfirm: () => alert(`Reboot signal dispatched to ${selectedNode.name}`)
                  })
                }
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/30"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reboot Node</span>
              </button>
            </div>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Thermometer className="h-4 w-4 text-rose-400" />
                <span>Package Temp</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-100">
                {selectedNode.temperatureC}°C
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Uptime</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-100">
                {selectedNode.uptimeString}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ArrowUpDown className="h-4 w-4 text-cyan-400" />
                <span>Network I/O</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-100">
                {selectedNode.networkRxMbps} <span className="text-xs font-normal text-slate-400">Mbps</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Activity className="h-4 w-4 text-indigo-400" />
                <span>IO Delay</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-100">
                {selectedNode.ioDelayPct}%
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <ResourceProgress
              label="CPU Allocation & Load"
              percentage={selectedNode.cpuUsagePct}
              usedText={`${selectedNode.cpuUsagePct}%`}
            />

            <ResourceProgress
              label="RAM Memory"
              percentage={(selectedNode.ramUsedGb / selectedNode.ramTotalGb) * 100}
              usedText={`${selectedNode.ramUsedGb.toFixed(1)} GB`}
              totalText={`${selectedNode.ramTotalGb} GB`}
            />

            <ResourceProgress
              label="Local Storage (ZFS/LVM)"
              percentage={(selectedNode.storageUsedTb / selectedNode.storageTotalTb) * 100}
              usedText={`${selectedNode.storageUsedTb.toFixed(2)} TB`}
              totalText={`${selectedNode.storageTotalTb} TB`}
            />
          </div>

          {/* Virtual Machines hosted on this node */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Virtual Machines on {selectedNode.name} ({nodeVMs.length})
              </h4>
              <button
                onClick={() => setCurrentPage('vms')}
                className="text-xs text-cyan-400 hover:underline"
              >
                View Full VM Fleet
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400">
                  <tr>
                    <th className="px-4 py-3">VMID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">vCPU</th>
                    <th className="px-4 py-3">Memory</th>
                    <th className="px-4 py-3">CPU %</th>
                    <th className="px-4 py-3">Uptime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {nodeVMs.map(vm => (
                    <tr key={vm.vmid} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{vm.vmid}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{vm.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={vm.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{vm.ipAddress}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{vm.cores} Cores</td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {vm.memoryUsedMb} / {vm.memoryTotalMb} MB
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{vm.cpuUsagePct}%</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{vm.uptime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
