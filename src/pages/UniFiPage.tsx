import React, { useState } from 'react';
import { Wifi, Search, Signal, Shield, Activity, Laptop, Smartphone, Tv, Server, HardDrive, Router, Radio } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';

export const UniFiPage: React.FC = () => {
  const { unifi } = useHomelab();
  const [search, setSearch] = useState('');
  const [vlanFilter, setVlanFilter] = useState('ALL');

  const clientsList = unifi.clients || [];
  const query = (search || '').toLowerCase().trim();

  const filteredClients = clientsList.filter(cl => {
    const hostname = (cl.hostname || cl.name || '').toLowerCase();
    const ip = (cl.ip || '').toLowerCase();
    const mac = (cl.mac || '').toLowerCase();
    const vlanStr = String(cl.vlan || '');

    const matchSearch =
      query === '' ||
      hostname.includes(query) ||
      ip.includes(query) ||
      mac.includes(query);

    const matchVlan = vlanFilter === 'ALL' || vlanStr.includes(vlanFilter) || vlanStr === vlanFilter;

    return matchSearch && matchVlan;
  });

  const getClientIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('laptop') || t.includes('desktop') || t.includes('pc')) return <Laptop className="h-4 w-4 text-cyan-400" />;
    if (t.includes('phone') || t.includes('mobile')) return <Smartphone className="h-4 w-4 text-blue-400" />;
    if (t.includes('tv') || t.includes('media')) return <Tv className="h-4 w-4 text-purple-400" />;
    if (t.includes('camera')) return <Radio className="h-4 w-4 text-amber-400" />;
    if (t.includes('server') || t.includes('iot')) return <Server className="h-4 w-4 text-emerald-400" />;
    return <Wifi className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/20 p-2.5 text-blue-400">
              <Wifi className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-lg font-bold text-slate-100">UniFi Network Controller</h2>
                <StatusBadge status="99% WiFi Experience" size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                UniFi OS v4.0.6 • {unifi.accessPointsCount || unifi.activeAPs || 4} Access Points • {unifi.switchesCount || unifi.activeSwitches || 3} Switches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">Connected:</span>{' '}
              <span className="font-bold text-slate-100">{unifi.connectedClients || 42} Clients</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">Threats Blocked:</span>{' '}
              <span className="font-bold text-emerald-400">{unifi.threatsBlockedToday ?? 14} Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* VLAN Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'Default', 'VLAN 1', 'Servers', 'VLAN 10', 'Cameras', 'VLAN 20', 'IoT', 'VLAN 30'].map(f => (
          <button
            key={f}
            onClick={() => setVlanFilter(f)}
            className={`rounded-xl px-3 py-1.5 font-mono text-xs transition-all ${
              vlanFilter === f
                ? 'bg-blue-600 font-bold text-white shadow-md shadow-blue-500/20'
                : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Connected Clients Search & Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 p-4">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Connected Client Inventory ({filteredClients.length} of {clientsList.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hostname, IP, MAC..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400">
              <tr>
                <th className="px-4 py-3">Client Hostname</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">MAC Address</th>
                <th className="px-4 py-3">VLAN</th>
                <th className="px-4 py-3">AP / Port</th>
                <th className="px-4 py-3">Signal (RSSI)</th>
                <th className="px-4 py-3">Speed (TX/RX)</th>
                <th className="px-4 py-3">Experience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No clients matched the filter.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id || client.mac} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-slate-800 p-1.5">
                          {getClientIcon(client.deviceType)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{client.hostname || client.name}</div>
                          <div className="font-mono text-[10px] text-slate-500">{client.deviceType || 'Network Device'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-400">{client.ip}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{client.mac}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{String(client.vlan)}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{client.apName || client.switchPort || 'GbE Switch Port'}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {client.signalDbm ? (
                        <span className="flex items-center gap-1">
                          <Signal className="h-3 w-3 text-emerald-400" />
                          {client.signalDbm} dBm
                        </span>
                      ) : (
                        '10 Gbps SFP+ / Wired'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {client.txRateMbps ? `${client.txRateMbps}/${client.rxRateMbps} Mbps` : '1.0 Gbps'}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">
                      {client.experiencePct ?? 99}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
