import React from 'react';
import { Network, Router, Wifi, ArrowDown, ArrowUp, ShieldCheck, Server, Radio } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { TopologyMap } from '../components/common/TopologyMap';
import { StatusBadge } from '../components/ui/StatusBadge';

export const NetworkPage: React.FC = () => {
  const { unifi, starlink, setCurrentPage } = useHomelab();

  return (
    <div className="space-y-6 pb-12">
      {/* Network Infrastructure Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/20 p-2.5 text-blue-400">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-lg font-bold text-slate-100">Network & SDN Fabric</h2>
                <StatusBadge status="100% Nominal" size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                UniFi Dream Machine Pro Gateway + Starlink Dishy WAN + USW Pro 24 PoE Switch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('unifi')}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500"
            >
              Open UniFi SDN Controller
            </button>
          </div>
        </div>
      </div>

      {/* Network Topology Graph */}
      <TopologyMap />

      {/* VLANs Breakdown Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-3.5">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Configured VLANs & Subnets (8 Segments)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400">
              <tr>
                <th className="px-4 py-3">VLAN ID</th>
                <th className="px-4 py-3">Network Name</th>
                <th className="px-4 py-3">Subnet</th>
                <th className="px-4 py-3">DHCP Pool</th>
                <th className="px-4 py-3">Isolation</th>
                <th className="px-4 py-3">Connected Devices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(unifi.vlans || []).map(vlan => (
                <tr key={vlan.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-bold text-cyan-400">VLAN {vlan.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{vlan.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{vlan.subnet}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{vlan.dhcpRange}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                        vlan.isolated
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {vlan.isolated ? 'Isolated VLAN' : 'Routable'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-200">{vlan.clientsCount} devices</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
