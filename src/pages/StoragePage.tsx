import React from 'react';
import {
  HardDrive,
  Database,
  Image,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Archive,
  Layers
} from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ImmichCard } from '../components/cards/ImmichCard';
import { ResourceProgress } from '../components/ui/ResourceProgress';

export const StoragePage: React.FC = () => {
  const { storagePool, disks, immich, backups } = useHomelab();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-lg font-bold text-slate-100">{storagePool.name}</h2>
                  <StatusBadge status={storagePool.health} size="sm" />
                </div>
                <p className="text-xs text-slate-400">
                  TrueNAS SCALE • ZFS RAID-Z2 Topology • Compression: {storagePool.compression} (1.38x ratio)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5">
                <span className="text-slate-400">Used:</span>{' '}
                <span className="font-bold text-slate-100">{storagePool.usedTb} TB</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5">
                <span className="text-slate-400">Free:</span>{' '}
                <span className="font-bold text-emerald-400">{storagePool.freeTb} TB</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <ResourceProgress
              label="ZFS Main Tank Capacity"
              percentage={storagePool.usedPct}
              usedText={`${storagePool.usedTb} TB`}
              totalText={`${storagePool.totalTb} TB`}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Next scheduled scrub: <strong>Sunday at 02:00 AM</strong></span>
              <span>Last scrub result: <strong className="text-emerald-400">0 errors found</strong></span>
            </div>
          </div>
        </div>

        {/* Immich Photos Card */}
        <ImmichCard immich={immich} />
      </div>

      {/* Disks Hardware SMART Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-3.5 flex items-center justify-between">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Physical Disks & SMART Health ({disks.length} Drives)
          </h3>
          <span className="font-mono text-[11px] text-emerald-400">All SMART Self-Tests Passed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400">
              <tr>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Disk Model</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Node / Host</th>
                <th className="px-4 py-3">Temperature</th>
                <th className="px-4 py-3">Power On Hours</th>
                <th className="px-4 py-3">SMART Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {disks.map(disk => (
                <tr key={disk.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-bold text-cyan-400">{disk.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{disk.model}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{disk.type}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{disk.capacityTb} TB</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{disk.node}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{disk.temperatureC}°C</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{disk.powerOnHours.toLocaleString()} hrs</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={disk.smartStatus} size="sm" showPulse={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proxmox Backup Server Jobs */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Proxmox Backup Server (PBS) Jobs
            </h3>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Deduplication Ratio: 4.2x</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400">
              <tr>
                <th className="px-4 py-3">Job Name</th>
                <th className="px-4 py-3">Target Dataset</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Completed</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Backup Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {backups.map(b => (
                <tr key={b.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-200">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{b.target}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{b.lastRun}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{b.duration}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{b.sizeGb} GB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
