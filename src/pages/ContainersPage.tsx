import React, { useState } from 'react';
import { Layers, Search, Server, RotateCcw, Power, Filter, Terminal } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';

export const ContainersPage: React.FC = () => {
  const { containers, dockerContainers, requestConfirmation } = useHomelab();
  const [tab, setTab] = useState<'LXC' | 'DOCKER'>('LXC');
  const [search, setSearch] = useState('');

  const q = (search || '').toLowerCase().trim();

  const filteredLXC = containers.filter(
    c =>
      q === '' ||
      (c.name || '').toLowerCase().includes(q) ||
      String(c.vmid || '').includes(q) ||
      (c.ipAddress || '').includes(q)
  );

  const filteredDocker = dockerContainers.filter(
    d =>
      q === '' ||
      (d.name || '').toLowerCase().includes(q) ||
      (d.image || '').toLowerCase().includes(q) ||
      (d.node || d.host || '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h2 className="font-mono text-lg font-bold text-slate-100">Containers Fleet</h2>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-slate-300">
                {containers.length} LXC • {dockerContainers.length} Docker
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-efficiency LXC containers and Docker microservices
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search containers by name, image, IP..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setTab('LXC')}
            className={`rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
              tab === 'LXC'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            LXC System Containers ({containers.length})
          </button>
          <button
            onClick={() => setTab('DOCKER')}
            className={`rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
              tab === 'DOCKER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Docker Containers ({dockerContainers.length})
          </button>
        </div>
      </div>

      {/* Tables based on selected Tab */}
      {tab === 'LXC' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 font-mono text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">CT ID</th>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Node</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">IP Address</th>
                  <th className="px-4 py-3.5">Cores</th>
                  <th className="px-4 py-3.5">RAM Usage</th>
                  <th className="px-4 py-3.5">CPU %</th>
                  <th className="px-4 py-3.5">Uptime</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLXC.map(ct => (
                  <tr key={ct.vmid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-400">{ct.vmid}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-200">{ct.name}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{ct.node}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={ct.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{ct.ipAddress}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{ct.cores || 2} Cores</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {ct.ramUsedMb || ct.memoryUsedMb || 256} / {ct.ramTotalMb || ct.memoryTotalMb || 1024} MB
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{ct.cpuUsagePct}%</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{ct.uptime}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() =>
                          requestConfirmation({
                            title: 'Restart LXC Container',
                            action: `Restart Container (${ct.name})`,
                            resource: `CT ${ct.vmid} (${ct.ipAddress})`,
                            impact: 'Container processes will restart in approx 5 seconds.',
                            onConfirm: () => {}
                          })
                        }
                        className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-amber-300"
                        title="Restart Container"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 font-mono text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Container</th>
                  <th className="px-4 py-3.5">Image</th>
                  <th className="px-4 py-3.5">Node Host</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Port Bindings</th>
                  <th className="px-4 py-3.5">CPU %</th>
                  <th className="px-4 py-3.5">Memory</th>
                  <th className="px-4 py-3.5">Uptime</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocker.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-200">{doc.name}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{doc.image}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{doc.node || doc.host}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-cyan-400">
                      {Array.isArray(doc.ports)
                        ? (doc.ports.length > 0 ? doc.ports.join(', ') : 'Host network')
                        : (doc.ports || 'Host network')}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{doc.cpuUsagePct ?? doc.cpuPct}%</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{doc.memoryUsedMb ?? doc.ramMb} MB</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{doc.uptime}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() =>
                          requestConfirmation({
                            title: 'Restart Docker Container',
                            action: `Restart Container (${doc.name})`,
                            resource: `${doc.name} (${doc.image})`,
                            impact: 'Container daemon will recreate process in 2 seconds.',
                            onConfirm: () => {}
                          })
                        }
                        className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-amber-300"
                        title="Restart Container"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
