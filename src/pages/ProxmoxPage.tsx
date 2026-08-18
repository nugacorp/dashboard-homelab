import React, { useEffect, useState } from 'react';
import { Server, Thermometer, Activity, Clock, Lock, Cpu, Layers } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ResourceProgress } from '../components/ui/ResourceProgress';
import { ResourceGate } from '../components/common/ResourceGate';
import {
  formatBytes,
  formatPct,
  formatUptime,
  ratioPct,
  NOT_AVAILABLE,
} from '../lib/format';

/**
 * Proxmox cluster view.
 *
 * Read-only: the "Reboot Node" button is gone. Rebooting a hypervisor from a
 * dashboard whose token holds PVEAuditor would have failed anyway, and the old
 * button did not even call an API - it popped an alert().
 */
export const ProxmoxPage: React.FC = () => {
  const { cluster, nodes, vms, containers } = useHomelab();
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);

  const nodeList = nodes.data ?? [];
  useEffect(() => {
    if (nodeList.length === 0) return;
    if (!selectedNodeName || !nodeList.some((n) => n.name === selectedNodeName)) {
      setSelectedNodeName(nodeList[0]!.name);
    }
  }, [nodeList, selectedNodeName]);

  const selectedNode = nodeList.find((n) => n.name === selectedNodeName) ?? nodeList[0] ?? null;
  const nodeVMs = (vms.data ?? []).filter((v) => v.node === selectedNode?.name);
  const nodeCTs = (containers.data ?? []).filter((c) => c.node === selectedNode?.name);

  return (
    <div className="space-y-6 pb-12">
      <ResourceGate
        resource={cluster}
        name="Proxmox"
        notConfiguredDescription="El backend no tiene credenciales de Proxmox, así que no puede describir el cluster."
        notConfiguredRequirement="Define PVE_API_URL, PVE_TOKEN_ID, PVE_TOKEN_SECRET y, para verificar TLS, PVE_CA_CERT_PATH."
      >
        {(c) => (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono text-lg font-bold text-slate-100">
                      {c.name ?? 'Proxmox (standalone)'}
                    </h2>
                    <StatusBadge
                      status={c.quorate === null ? 'standalone' : c.quorate ? 'quorate' : 'no quorum'}
                      size="sm"
                      showPulse={c.quorate === true}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    {c.version ? `PVE ${c.version}` : 'Versión no reportada'} ·{' '}
                    {c.nodesOnline}/{c.nodesTotal} nodos online · {c.cpuCoresTotal} núcleos
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                <Pill label="CPU" value={formatPct(c.cpuUsagePct)} />
                <Pill
                  label="RAM"
                  value={`${formatBytes(c.memoryUsedBytes, 0)} / ${formatBytes(c.memoryTotalBytes, 0)}`}
                />
                <Pill label="Guests" value={`${c.guests.vmsTotal} VM · ${c.guests.lxcTotal} LXC`} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {nodeList.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNodeName(node.name)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                    selectedNode?.name === node.name
                      ? 'border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'border border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Server className="h-4 w-4" />
                  <span>{node.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {formatPct(node.cpuUsagePct, 0)}
                  </span>
                  <StatusBadge
                    status={node.online ? 'online' : 'offline'}
                    size="sm"
                    showPulse={false}
                  />
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
              <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span className="font-mono text-[11px] text-slate-400">
                Modo solo lectura: NUGA HOME usa un token con rol de auditoría. Las operaciones de
                encendido, apagado, reinicio y migración están deshabilitadas en el backend.
              </span>
            </div>
          </div>
        )}
      </ResourceGate>

      {selectedNode && (
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-base font-bold text-slate-100">{selectedNode.name}</h3>
                <StatusBadge status={selectedNode.online ? 'online' : 'offline'} />
              </div>
              <p className="text-xs text-slate-400">
                {selectedNode.cpuModel ?? NOT_AVAILABLE}
                {selectedNode.cpuCores !== null && ` · ${selectedNode.cpuCores} núcleos`}
                {selectedNode.kernelVersion && ` · ${selectedNode.kernelVersion}`}
              </p>
            </div>
            <div className="font-mono text-xs text-slate-400">
              IP: <span className="text-slate-200">{selectedNode.ip ?? NOT_AVAILABLE}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              icon={Clock}
              iconColor="text-slate-400"
              label="Uptime"
              value={formatUptime(selectedNode.uptimeSeconds)}
            />
            <Stat
              icon={Activity}
              iconColor="text-indigo-400"
              label="IO delay"
              value={formatPct(selectedNode.ioDelayPct)}
            />
            <Stat
              icon={Activity}
              iconColor="text-cyan-400"
              label="Load average"
              value={
                selectedNode.loadAverage
                  ? selectedNode.loadAverage.map((v) => v.toFixed(2)).join(' · ')
                  : NOT_AVAILABLE
              }
            />
            <Stat
              icon={Thermometer}
              iconColor="text-slate-600"
              label="Temperatura"
              value={NOT_AVAILABLE}
              note="La API de Proxmox no expone sensores"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-3">
            <ResourceProgress
              label="CPU"
              percentage={selectedNode.cpuUsagePct}
              usedText={formatPct(selectedNode.cpuUsagePct)}
            />
            <ResourceProgress
              label="Memoria"
              percentage={ratioPct(selectedNode.memoryUsedBytes, selectedNode.memoryTotalBytes)}
              usedText={formatBytes(selectedNode.memoryUsedBytes)}
              totalText={formatBytes(selectedNode.memoryTotalBytes)}
            />
            <ResourceProgress
              label="Disco raíz"
              percentage={ratioPct(selectedNode.rootfsUsedBytes, selectedNode.rootfsTotalBytes)}
              usedText={formatBytes(selectedNode.rootfsUsedBytes)}
              totalText={formatBytes(selectedNode.rootfsTotalBytes)}
            />
          </div>

          <GuestTable
            title={`Máquinas virtuales en ${selectedNode.name}`}
            icon={Cpu}
            rows={nodeVMs}
          />
          <GuestTable
            title={`Contenedores LXC en ${selectedNode.name}`}
            icon={Layers}
            rows={nodeCTs}
          />
        </div>
      )}
    </div>
  );
};

const Pill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
    <span className="text-slate-400">{label}:</span>{' '}
    <span className="font-bold text-slate-100">{value}</span>
  </div>
);

const Stat: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string;
  note?: string;
}> = ({ icon: Icon, iconColor, label, value, note }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <span>{label}</span>
    </div>
    <div className="mt-1 font-mono text-lg font-bold text-slate-100">{value}</div>
    {note && <div className="mt-0.5 text-[10px] leading-tight text-slate-600">{note}</div>}
  </div>
);

const GuestTable: React.FC<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: Array<{
    vmid: number;
    name: string;
    status: string;
    cpuCores: number | null;
    cpuUsagePct: number | null;
    memoryUsedBytes: number | null;
    memoryTotalBytes: number | null;
    uptimeSeconds: number | null;
  }>;
}> = ({ title, icon: Icon, rows }) => (
  <div>
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
        {title} ({rows.length})
      </h4>
    </div>

    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">vCPU</th>
            <th className="px-4 py-3">Memoria</th>
            <th className="px-4 py-3">CPU</th>
            <th className="px-4 py-3">Uptime</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                Ninguno en este nodo.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.vmid} className="hover:bg-slate-800/50">
                <td className="px-4 py-3 font-mono font-bold text-cyan-400">{row.vmid}</td>
                <td className="px-4 py-3 font-medium text-slate-200">{row.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} size="sm" showPulse={row.status === 'running'} />
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {row.cpuCores ?? NOT_AVAILABLE}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {formatBytes(row.memoryUsedBytes, 1)} / {formatBytes(row.memoryTotalBytes, 1)}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">{formatPct(row.cpuUsagePct)}</td>
                <td className="px-4 py-3 font-mono text-slate-400">
                  {formatUptime(row.uptimeSeconds)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
