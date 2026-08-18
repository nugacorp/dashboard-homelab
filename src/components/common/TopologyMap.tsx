import React, { useState } from 'react';
import {
  Globe,
  Radio,
  Router,
  Network,
  Server,
  Wifi,
  Camera,
  Home,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  ArrowDown
} from 'lucide-react';
import { useHomelab, NavigationPage } from '../../context/HomelabContext';

export const TopologyMap: React.FC = () => {
  const { starlink, unifi, nodes, setCurrentPage } = useHomelab();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const clusterNodesOnline = nodes.filter(n => n.status === 'online').length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
            Network Topology & Infrastructure Map
          </h3>
          <p className="text-xs text-slate-400">
            End-to-end routing hierarchy with live link health and telemetry
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> All Links Active
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">10 Gbps SFP+ Backbone</span>
        </div>
      </div>

      {/* Interactive Topology Graph */}
      <div className="mt-6 flex flex-col items-center justify-center space-y-4">
        {/* Tier 1: Public Internet */}
        <div
          onClick={() => setCurrentPage('starlink')}
          className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 px-4 py-2.5 shadow-lg transition-all hover:border-cyan-500/50 hover:bg-slate-800"
        >
          <div className="rounded-lg bg-cyan-500/20 p-2 text-cyan-400">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-slate-100">WAN Internet (Global)</div>
            <div className="text-[11px] text-slate-400">IP: {starlink.publicIp} • {starlink.uptimePct}% Uptime</div>
          </div>
        </div>

        {/* Down Connector */}
        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-cyan-500/60" />
          <ArrowDown className="h-3 w-3 text-cyan-400" />
        </div>

        {/* Tier 2: Starlink Dishy Terminal */}
        <div
          onClick={() => setCurrentPage('starlink')}
          className="group flex cursor-pointer items-center gap-3 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 px-4 py-2.5 shadow-lg transition-all hover:border-cyan-500/60"
        >
          <div className="rounded-lg bg-cyan-500/20 p-2 text-cyan-400">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-100">Starlink Dishy V3</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-300">
                Online
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {starlink.downloadMbps} Mbps DL • {starlink.uploadMbps} Mbps UL • {starlink.latencyMs} ms
            </div>
          </div>
        </div>

        {/* Down Connector */}
        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-cyan-500/60" />
          <ArrowDown className="h-3 w-3 text-cyan-400" />
        </div>

        {/* Tier 3: Gateway (UDM-Pro) */}
        <div
          onClick={() => setCurrentPage('unifi')}
          className="group flex cursor-pointer items-center gap-3 rounded-xl border border-blue-500/30 bg-slate-900/90 px-4 py-2.5 shadow-lg transition-all hover:border-blue-500/60"
        >
          <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
            <Router className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-100">UDM-Pro Gateway</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-300">
                192.168.1.1
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              VLANs Configured • IPS/IDS Active • {unifi.connectedClients} Connected Clients
            </div>
          </div>
        </div>

        {/* Down Connector */}
        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-blue-500/60" />
          <ArrowDown className="h-3 w-3 text-blue-400" />
        </div>

        {/* Tier 4: Core Switch (USW-Pro-24-PoE) */}
        <div
          onClick={() => setCurrentPage('unifi')}
          className="group flex cursor-pointer items-center gap-3 rounded-xl border border-indigo-500/30 bg-slate-900/90 px-5 py-2.5 shadow-lg transition-all hover:border-indigo-500/60"
        >
          <div className="rounded-lg bg-indigo-500/20 p-2 text-indigo-400">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-100">USW-Pro-24-PoE Switch</span>
              <span className="font-mono text-[10px] text-indigo-300">10G SFP+ Link</span>
            </div>
            <div className="text-[11px] text-slate-400">PoE Power: 142.5 W • 24 GbE Ports Active</div>
          </div>
        </div>

        {/* Branch Lines to Subsystems */}
        <div className="w-full pt-2">
          {/* Horizontal Distribution Rail */}
          <div className="relative mx-auto h-0.5 w-11/12 bg-slate-800" />

          {/* Connected Homelab Infrastructure Nodes Grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {/* Proxmox Node 01 */}
            <div
              onClick={() => setCurrentPage('proxmox')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-cyan-500/40 hover:bg-slate-800/80"
            >
              <Server className="h-4 w-4 text-cyan-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">pve-node-01</span>
              <span className="text-[10px] text-emerald-400">Online • 23%</span>
            </div>

            {/* Proxmox Node 02 */}
            <div
              onClick={() => setCurrentPage('proxmox')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-cyan-500/40 hover:bg-slate-800/80"
            >
              <Server className="h-4 w-4 text-cyan-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">pve-node-02</span>
              <span className="text-[10px] text-amber-400">Online • 34%</span>
            </div>

            {/* Proxmox Node 03 */}
            <div
              onClick={() => setCurrentPage('proxmox')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-cyan-500/40 hover:bg-slate-800/80"
            >
              <Server className="h-4 w-4 text-cyan-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">pve-node-03</span>
              <span className="text-[10px] text-emerald-400">Online • 17%</span>
            </div>

            {/* UniFi APs */}
            <div
              onClick={() => setCurrentPage('unifi')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-blue-500/40 hover:bg-slate-800/80"
            >
              <Wifi className="h-4 w-4 text-blue-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">UniFi APs (4)</span>
              <span className="text-[10px] text-emerald-400">42 Clients</span>
            </div>

            {/* Cameras Subnet */}
            <div
              onClick={() => setCurrentPage('cameras')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-indigo-500/40 hover:bg-slate-800/80"
            >
              <Camera className="h-4 w-4 text-indigo-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">Cameras (8)</span>
              <span className="text-[10px] text-emerald-400">PoE Active</span>
            </div>

            {/* Home Assistant */}
            <div
              onClick={() => setCurrentPage('smart-home')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-amber-500/40 hover:bg-slate-800/80"
            >
              <Home className="h-4 w-4 text-amber-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">Home Assistant</span>
              <span className="text-[10px] text-emerald-400">VM 100</span>
            </div>

            {/* Storage NAS */}
            <div
              onClick={() => setCurrentPage('storage')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-emerald-500/40 hover:bg-slate-800/80"
            >
              <HardDrive className="h-4 w-4 text-emerald-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">TrueNAS ZFS</span>
              <span className="text-[10px] text-emerald-400">12 TB (53%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
