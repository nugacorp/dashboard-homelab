import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Search,
  RotateCcw,
  Power,
  Terminal,
  Filter,
  Server,
  Layers,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { VirtualMachine } from '../types';

export const VMsPage: React.FC = () => {
  const { vms, restartVM, stopVM } = useHomelab();

  const [search, setSearch] = useState('');
  const [nodeFilter, setNodeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [consoleVM, setConsoleVM] = useState<VirtualMachine | null>(null);

  const filteredVMs = useMemo(() => {
    const q = (search || '').toLowerCase().trim();
    return vms.filter(vm => {
      const name = (vm.name || '').toLowerCase();
      const vmidStr = String(vm.vmid || '');
      const ip = (vm.ipAddress || '').toLowerCase();
      const os = (vm.os || '').toLowerCase();
      const status = (vm.status || '').toLowerCase();

      const matchSearch =
        q === '' ||
        name.includes(q) ||
        vmidStr.includes(q) ||
        ip.includes(q) ||
        os.includes(q);

      const matchNode = nodeFilter === 'ALL' || vm.node === nodeFilter;
      const matchStatus = statusFilter === 'ALL' || status === statusFilter.toLowerCase();

      return matchSearch && matchNode && matchStatus;
    });
  }, [vms, search, nodeFilter, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <h2 className="font-mono text-lg font-bold text-slate-100">Virtual Machine Fleet</h2>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-slate-300">
                {filteredVMs.length} / {vms.length} VMs
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proxmox QEMU/KVM instances across all 3 cluster nodes
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by VMID, name, IP, OS..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            <Filter className="h-3.5 w-3.5" />
            <span>Nodes:</span>
          </div>
          {['ALL', 'pve-node-01', 'pve-node-02', 'pve-node-03'].map(node => (
            <button
              key={node}
              onClick={() => setNodeFilter(node)}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                nodeFilter === node
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {node}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-2" />

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            <span>Status:</span>
          </div>
          {['ALL', 'running', 'stopped'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* VM Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 font-mono text-slate-400">
              <tr>
                <th className="px-4 py-3.5">VMID</th>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Node</th>
                <th className="px-4 py-3.5">OS</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5">vCPU</th>
                <th className="px-4 py-3.5">Memory (RAM)</th>
                <th className="px-4 py-3.5">Storage</th>
                <th className="px-4 py-3.5">Uptime</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVMs.map(vm => (
                <tr key={vm.vmid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-cyan-400">{vm.vmid}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-200">{vm.name}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">{vm.node}</td>
                  <td className="px-4 py-3.5 text-slate-300">{vm.os}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={vm.status} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">{vm.ipAddress}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">
                    {vm.cpuCores} vCPU ({vm.cpuUsagePct}%)
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">
                    {vm.ramUsedMb} / {vm.ramTotalMb} MB
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{vm.diskTotalGb} GB</td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">{vm.uptime}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setConsoleVM(vm)}
                        className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-cyan-300"
                        title="VNC Web Console"
                      >
                        <Terminal className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => restartVM(vm.vmid)}
                        className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-amber-300"
                        title="Restart VM"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => stopVM(vm.vmid)}
                        className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-rose-900/30 hover:text-rose-400 hover:border-rose-500/30"
                        title="Stop VM"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated noVNC Console Modal */}
      {consoleVM && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          onClick={() => setConsoleVM(null)}
        >
          <div
            className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span>noVNC Console • {consoleVM.name} (VM {consoleVM.vmid})</span>
              </div>
              <button
                onClick={() => setConsoleVM(null)}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 bg-black p-4 font-mono text-xs text-emerald-400 overflow-y-auto space-y-1">
              <div>[  0.000000] Linux version 6.5.0-homelab-pve (root@pve-node-01)</div>
              <div>[  0.024102] QEMU Virtual CPU version 2.5+ (x86_64)</div>
              <div>[  0.892011] systemd[1]: Detected architecture x86-64.</div>
              <div>[  1.204592] systemd[1]: Reached target Network (Pre).</div>
              <div>[  1.423091] eth0: link up, 10Gbps full-duplex</div>
              <div>[  1.821034] IP address: {consoleVM.ipAddress}/24 via UDM-Pro</div>
              <div>[  2.102390] Started Docker Application Container Engine.</div>
              <div>[  2.410291] login: ramiro (automatic tty1 session active)</div>
              <div className="mt-4 text-slate-200 font-bold">
                {consoleVM.name}:~$ htop --tree
              </div>
              <div className="text-cyan-300">
                Tasks: 38 total, 1 running, 37 sleeping | CPU: {consoleVM.cpuUsagePct}% | Mem: {consoleVM.ramUsedMb}MB/{consoleVM.ramTotalMb}MB
              </div>
              <div className="text-slate-400 mt-2">
                Type `help` or `exit` to interact with this VM session.
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2 text-[11px] text-slate-400">
              <span>Connected via WebSocket (Secure noVNC tunnel)</span>
              <button
                onClick={() => setConsoleVM(null)}
                className="rounded bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
