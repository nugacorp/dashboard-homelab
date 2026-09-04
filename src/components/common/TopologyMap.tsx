import React from 'react';
import {
  Server,
  ArrowDown,
  Network,
  Globe,
  Home,
  Bot,
  Activity,
  Cpu,
  Layers,
} from 'lucide-react';
import { useHomelab } from '../../context/HomelabContext';
import { formatPct } from '../../lib/format';

/**
 * Infrastructure map built only from observed integrations.
 *
 * Proxmox, Home Assistant, Hermes, Uptime Kuma and the local network resource
 * provide live data. Starlink is known as the WAN upstream from the deployed
 * topology, but it has no telemetry source in NUGA HOME yet, so its metrics
 * remain explicitly n/c.
 */
export const TopologyMap: React.FC = () => {
  const {
    nodes,
    network,
    homeAssistant,
    hermes,
    uptimeKuma,
    setCurrentPage,
  } = useHomelab();

  const nodeList = nodes.data ?? [];
  const onlineCount = nodeList.filter((node) => node.online).length;

  const networkData = network.data;
  const resolvedDnsRecords =
    networkData?.records.filter((record) => record.ipv4 !== null).length ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
            Mapa de infraestructura
          </h3>
          <p className="text-xs text-slate-400">
            Construido únicamente con inventario conocido y fuentes observables
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {onlineCount}/{nodeList.length} nodos Proxmox online
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center space-y-4">
        {/* WAN: topology known, telemetry intentionally unavailable. */}
        <button
          type="button"
          onClick={() => setCurrentPage('starlink')}
          className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-2.5 text-left transition-colors hover:border-slate-600"
        >
          <div className="rounded-lg bg-slate-800/70 p-2 text-slate-400">
            <Globe className="h-4 w-4" />
          </div>

          <div>
            <div className="font-mono text-xs font-bold text-slate-300">
              WAN / Starlink
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              Telemetría n/c — sin integración Starlink
            </div>
          </div>
        </button>

        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-slate-800" />
          <ArrowDown className="h-3 w-3 text-slate-700" />
        </div>

        {/* Gateway: reachability comes from the network backend. */}
        <button
          type="button"
          onClick={() => setCurrentPage('unifi')}
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors ${
            networkData?.gatewayHttpsReachable
              ? 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
          }`}
        >
          <div
            className={`rounded-lg p-2 ${
              networkData?.gatewayHttpsReachable
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-slate-800/70 text-slate-500'
            }`}
          >
            <Network className="h-4 w-4" />
          </div>

          <div>
            <div className="font-mono text-xs font-bold text-slate-200">
              UCG Max / Gateway
            </div>

            <div
              className={`font-mono text-[11px] ${
                networkData?.gatewayHttpsReachable
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              {networkData
                ? `${networkData.gatewayIp} · ${
                    networkData.gatewayHttpsReachable
                      ? 'HTTPS accesible'
                      : 'sin respuesta HTTPS'
                  }`
                : network.phase === 'loading'
                  ? 'Consultando gateway…'
                  : 'Observabilidad n/c'}
            </div>
          </div>
        </button>

        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-slate-800" />
          <ArrowDown className="h-3 w-3 text-slate-700" />
        </div>

        {/* DNS: direct queries to configured Technitium server. */}
        <button
          type="button"
          onClick={() => setCurrentPage('network')}
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors ${
            networkData?.dnsExternalResolution
              ? 'border-cyan-500/30 bg-cyan-950/10 hover:border-cyan-500/50'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
          }`}
        >
          <div
            className={`rounded-lg p-2 ${
              networkData?.dnsExternalResolution
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'bg-slate-800/70 text-slate-500'
            }`}
          >
            <Activity className="h-4 w-4" />
          </div>

          <div>
            <div className="font-mono text-xs font-bold text-slate-200">
              Technitium DNS
            </div>

            <div className="font-mono text-[11px] text-slate-400">
              {networkData
                ? `${networkData.dnsServer} · ${networkData.localDomain} · ${resolvedDnsRecords}/${networkData.records.length} registros`
                : network.phase === 'loading'
                  ? 'Consultando DNS…'
                  : 'Observabilidad n/c'}
            </div>
          </div>
        </button>

        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-cyan-500/60" />
          <ArrowDown className="h-3 w-3 text-cyan-400" />
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage('proxmox')}
          className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 px-4 py-2.5 text-left shadow-lg transition-colors hover:border-cyan-500/50"
        >
          <div className="rounded-lg bg-cyan-500/20 p-2 text-cyan-400">
            <Server className="h-4 w-4" />
          </div>

          <div>
            <div className="font-mono text-xs font-bold text-slate-100">
              Cluster Proxmox{' '}
              {nodes.data && nodeList.length > 0
                ? `(${nodeList.length} nodos)`
                : ''}
            </div>

            <div className="text-[11px] text-slate-400">
              Telemetría real del cluster nuga-home
            </div>
          </div>
        </button>

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
                  className={`text-[10px] ${
                    node.online ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {node.online ? 'Online' : 'Offline'} ·{' '}
                  {formatPct(node.cpuUsagePct, 0)}
                </span>

                {node.ip && (
                  <span className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {node.ip}
                  </span>
                )}

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
                  homeAssistant.phase === 'ok'
                    ? 'text-emerald-400'
                    : 'text-slate-500'
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

              <span className="mt-1.5 font-mono text-[11px] font-bold text-slate-200">
                Hermes
              </span>

              <span
                className={`text-[10px] ${
                  hermes.phase === 'ok'
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {hermes.phase === 'ok'
                  ? 'configurado'
                  : 'no configurado'}
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
                  uptimeKuma.data?.reachable
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {uptimeKuma.data?.reachable
                  ? 'accesible'
                  : 'sin datos'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
