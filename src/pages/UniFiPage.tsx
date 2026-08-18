import React, { useState } from 'react';
import { Wifi, Search, Signal, Shield, Activity, Laptop, Smartphone, Tv, Server } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';

export const UniFiPage: React.FC = () => {
  const { unifi } = useHomelab();
  const [search, setSearch] = useState('');
  const [vlanFilter, setVlanFilter] = useState('ALL');

  const filteredClients = unifi.clients.filter(cl => {
    const matchSearch =
      cl.hostname.toLowerCase().includes(search.toLowerCase()) ||
      cl.ip.includes(search) ||
      cl.mac.toLowerCase().includes(search.toLowerCase());

    const matchVlan = vlanFilter === 'ALL' || cl.vlan.toString() === vlanFilter;

    return matchSearch && matchVlan;
  });

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
                UniFi OS v3.2.12 • {unifi.accessPointsCount} Access Points • {unifi.switchesCount} Switches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">Connected:</span>{' '}
              <span className="font-bold text-slate-100">{unifi.connectedClients} Clients</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">Threats Blocked:</span>{' '}
              <span className="font-bold text-emerald-400">{unifi.threatsBlockedToday} Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Clients Search & Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 p-4">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Connected Client Inventory ({filteredClients.length} of {unifi.clients.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px]">
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
                <th className="px-4 py-3">Connection</th>
                <th className="px-4 py-3">Signal (RSSI)</th>
                <th className="px-4 py-3">TX Rate</th>
                <th className="px-4 py-3">RX Rate</th>
                <th className="px-4 py-3">WiFi Exp.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-200">{client.hostname}</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">{client.ip}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{client.mac}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">VLAN {client.vlan}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{client.apName || client.switchPort || 'Wired'}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {client.signalDbm ? `${client.signalDbm} dBm` : 'Gigabit GbE'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{client.txRateMbps} Mbps</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{client.rxRateMbps} Mbps</td>
                  <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{client.experiencePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
