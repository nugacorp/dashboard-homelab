import React from 'react';
import { Server, ArrowDown, Network, Globe, Home, Bot, Activity, Cpu, Layers } from 'lucide-react';
import { useHomelab } from '../../context/HomelabContext';
import { formatPct } from '../../lib/format';

/**
 * Infrastructure map built from data we actually have.
 *
 * The previous version drew a fixed diagram with a UDM-Pro, a 24-port PoE
 * switch, a Starlink dish, eight cameras and a TrueNAS box, none of which
 * exist. The WAN and gateway tiers are now labelled as unmonitored, and the
 * bottom row is generated from the live Proxmox node list.
 */
export const TopologyMap: React.FC = () => {
  const { nodes, homeAssistant, hermes, uptimeKuma, setCurrentPage } = useHomelab();

  const nodeList = nodes.data ?? [];
  const onlineCount = nodeList.filter((n) => n.online).length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
            Mapa de infraestructura
          </h3>
          <p className="text-xs text-slate-400">
            Generado a partir de los nodos Proxmox y las integraciones configuradas
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {onlineCount}/{nodeList.length} nodos online
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center space-y-4">
        {/* WAN and gateway are not monitored: no UniFi, no Starlink telemetry. */}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-4 py-2.5">
          <div className="rounded-lg bg-slate-800/70 p-2 text-slate-500">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-slate-400">WAN / Internet</div>
            <div className="font-mono text-[11px] text-slate-600">
              NOT CONFIGURED — sin telemetría de uplink
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-slate-800" />
          <ArrowDown className="h-3 w-3 text-slate-700" />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-4 py-2.5">
          <div className="rounded-lg bg-slate-800/70 p-2 text-slate-500">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-slate-400">Gateway / Switching</div>
            <div className="font-mono text-[11px] text-slate-600">
              NOT CONFIGURED — sin controlador de red integrado
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-cyan-500/60" />
          <ArrowDown className="h-3 w-3 text-cyan-400" />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 px-4 py-2.5 shadow-lg">
          <div className="rounded-lg bg-cyan-500/20 p-2 text-cyan-400">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-slate-100">
              Cluster Proxmox {nodes.data && nodeList.length > 0 ? `(${nodeList.length} nodos)` : ''}
            </div>
            <div className="text-[11px] text-slate-400">
              Origen de toda la telemetría de cómputo del dashboard
            </div>
          </div>
        </div>

        <div className="w-full pt-2">
          <div className="relative mx-auto h-0.5 w-11/12 bg-slate-800" />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {nodeList.map((node) => (
              <button
                key={node.id}
                onClick={() => setCurrentPage('proxmox')}
                className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-cyan-500/40 hover:bg-slate-800/80"
              >
                <Server className="h-4 w-4 text-cyan-400" />
                <span className="mt-1.5 truncate font-mono text-[11px] font-bold text-slate-200">
                  {node.name}
                </span>
                <span
                  className={`text-[10px] ${node.online ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {node.online ? 'Online' : 'Offline'} · {formatPct(node.cpuUsagePct, 0)}
                </span>
                <span className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <Cpu className="h-3 w-3" />
                    {node.guests.vmsRunning}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Layers className="h-3 w-3" />
                    {node.guests.lxcRunning}
                  </span>
                </span>
              </button>
            ))}

            {nodeList.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center font-mono text-[11px] text-slate-500">
                Sin nodos Proxmox disponibles.
              </div>
            )}

            <button
              onClick={() => setCurrentPage('smart-home')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-amber-500/40 hover:bg-slate-800/80"
            >
              <Home className="h-4 w-4 text-amber-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">
                Home Assistant
              </span>
              <span
                className={`text-[10px] ${
                  homeAssistant.phase === 'ok' ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {homeAssistant.phase === 'ok'
                  ? `${homeAssistant.data?.entitiesTotal ?? 0} entidades`
                  : 'sin datos'}
              </span>
            </button>

            <button
              onClick={() => setCurrentPage('hermes')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-indigo-500/40 hover:bg-slate-800/80"
            >
              <Bot className="h-4 w-4 text-indigo-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">Hermes</span>
              <span
                className={`text-[10px] ${
                  hermes.phase === 'ok' ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {hermes.phase === 'ok' ? 'configurado' : 'no configurado'}
              </span>
            </button>

            <button
              onClick={() => setCurrentPage('services')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center transition-all hover:border-emerald-500/40 hover:bg-slate-800/80"
            >
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">
                Uptime Kuma
              </span>
              <span
                className={`text-[10px] ${
                  uptimeKuma.data?.reachable ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {uptimeKuma.data?.reachable ? 'accesible' : 'sin datos'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
