import React from 'react';
import { Server, Cpu, Layers, ArrowUpRight, Activity, MemoryStick } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { NodeCard } from '../components/cards/NodeCard';
import { SmartHomeCard } from '../components/cards/SmartHomeCard';
import { IntegrationsCard } from '../components/cards/IntegrationsCard';
import { TopologyMap } from '../components/common/TopologyMap';
import { ResourceGate } from '../components/common/ResourceGate';
import { IntegrationNotConfigured } from '../components/common/IntegrationNotConfigured';
import { formatBytes, formatPct, ratioPct } from '../lib/format';

/**
 * Overview.
 *
 * Everything on this page is either measured or explicitly absent. There is no
 * health score: the previous 98% figure was a constant in a mock file, and any
 * replacement would need SLOs the homelab does not define yet.
 */
export const OverviewPage: React.FC = () => {
  const { cluster, nodes, homeAssistant, uptimeKumaSummary, setCurrentPage } = useHomelab();

  return (
    <div className="space-y-6 pb-12">
      {/* Row 1: cluster KPI, integrations, nuga-ops */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          onClick={() => setCurrentPage('proxmox')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md transition-all hover:border-cyan-500/40 hover:bg-slate-900/90"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cluster Proxmox
            </span>
            {cluster.data && (
              <StatusBadge
                status={
                  cluster.data.quorate === null
                    ? 'standalone'
                    : cluster.data.quorate
                      ? 'quorate'
                      : 'no quorum'
                }
                size="sm"
                showPulse={cluster.data.quorate === true}
              />
            )}
          </div>

          {cluster.phase === 'ok' && cluster.data ? (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-extrabold text-slate-50">
                  {formatPct(cluster.data.cpuUsagePct, 1)}
                </span>
                <span className="font-mono text-xs text-slate-400">CPU</span>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-lg font-bold text-slate-200">
                  {formatBytes(cluster.data.memoryUsedBytes, 0)} /{' '}
                  {formatBytes(cluster.data.memoryTotalBytes, 0)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400">
                <span>
                  {cluster.data.guests.vmsRunning}/{cluster.data.guests.vmsTotal} VMs
                </span>
                <span>
                  {cluster.data.guests.lxcRunning}/{cluster.data.guests.lxcTotal} LXC
                </span>
                <span>
                  {cluster.data.nodesOnline}/{cluster.data.nodesTotal} nodos
                </span>
              </div>
            </>
          ) : (
            <p className="mt-4 font-mono text-xs text-slate-500">
              {cluster.phase === 'loading'
                ? 'Consultando Proxmox…'
                : cluster.phase === 'not_configured'
                  ? 'Proxmox no configurado'
                  : (cluster.error?.message ?? 'Sin datos')}
            </p>
          )}
        </div>

        <IntegrationsCard />

        <button
          type="button"
          onClick={() => setCurrentPage('services')}
          className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left backdrop-blur-md transition-all hover:border-cyan-500/40 hover:bg-slate-900/90"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Monitoring
              </span>
            </div>

            {uptimeKumaSummary.data && (
              <span
                className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold ${
                  uptimeKumaSummary.data.up === uptimeKumaSummary.data.total &&
                  uptimeKumaSummary.data.total > 0
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                }`}
              >
                {uptimeKumaSummary.data.up}/{uptimeKumaSummary.data.total} UP
              </span>
            )}
          </div>

          {uptimeKumaSummary.data ? (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={`font-mono text-3xl font-extrabold ${
                    uptimeKumaSummary.data.down === 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {uptimeKumaSummary.data.up}
                </span>

                <span className="font-mono text-xs text-slate-400">
                  / {uptimeKumaSummary.data.total} monitores UP
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3">
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">
                    Down
                  </div>
                  <div
                    className={`mt-1 font-mono text-sm font-bold ${
                      uptimeKumaSummary.data.down > 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {uptimeKumaSummary.data.down}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">
                    Pending
                  </div>
                  <div
                    className={`mt-1 font-mono text-sm font-bold ${
                      uptimeKumaSummary.data.pending > 0
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {uptimeKumaSummary.data.pending}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">
                    Maint.
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-300">
                    {uptimeKumaSummary.data.maintenance}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span className="text-[10px] text-slate-500">
                  Uptime Kuma · datos reales
                </span>

                <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 group-hover:underline">
                  Ver Monitoring Center
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </>
          ) : (
            <div className="mt-4 py-4 text-center font-mono text-xs text-slate-500">
              {uptimeKumaSummary.phase === 'loading'
                ? 'Consultando Uptime Kuma…'
                : uptimeKumaSummary.phase === 'not_configured'
                  ? 'Monitoring no configurado'
                  : (uptimeKumaSummary.error?.message ?? 'Sin datos de monitoring')}
            </div>
          )}
        </button>
      </div>

      {/* Row 2: Home Assistant */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ResourceGate
          resource={homeAssistant}
          name="Home Assistant"
          notConfiguredDescription="Home Assistant no está conectado al backend de NUGA HOME."
          notConfiguredRequirement="Define HASS_URL y HASS_TOKEN (token de larga duración) en el backend."
          compact
        >
          {(summary) => (
            <SmartHomeCard summary={summary} onClick={() => setCurrentPage('smart-home')} />
          )}
        </ResourceGate>

        <IntegrationNotConfigured
          name="Uplink de internet y red"
          tone="not_configured"
          description="No hay controlador de red ni telemetría de Starlink integrados. Esta tarjeta mostraba antes 245 Mbps y 32 ms; eran valores simulados."
          requirement="Pendiente de desplegar un controlador de red con API."
          compact
        />
      </div>

      {/* Row 3: nodes */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">
              Nodos Proxmox {nodes.data ? `(${nodes.data.length})` : ''}
            </h3>
          </div>
          <button
            onClick={() => setCurrentPage('proxmox')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
          >
            <span>Ver cluster</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <ResourceGate
          resource={nodes}
          name="Proxmox"
          notConfiguredDescription="Proxmox no está configurado, así que no hay nodos que mostrar."
          notConfiguredRequirement="Define PVE_API_URL, PVE_TOKEN_ID y PVE_TOKEN_SECRET en el backend."
          emptyDescription="La API de Proxmox respondió pero no devolvió ningún nodo."
        >
          {(nodeList) => (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {nodeList.map((node) => (
                <NodeCard key={node.id} node={node} onSelect={() => setCurrentPage('proxmox')} />
              ))}
            </div>
          )}
        </ResourceGate>
      </div>

      {/* Row 4: infrastructure map */}
      <TopologyMap />

      {/* Row 5: cluster capacity summary */}
      {cluster.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CapacityTile
            icon={Cpu}
            label="Núcleos totales"
            value={String(cluster.data.cpuCoresTotal)}
            hint={`${cluster.data.nodesOnline} nodos online`}
            accent="text-cyan-400"
          />
          <CapacityTile
            icon={MemoryStick}
            label="Memoria del cluster"
            value={`${formatBytes(cluster.data.memoryUsedBytes, 0)} / ${formatBytes(cluster.data.memoryTotalBytes, 0)}`}
            hint={formatPct(ratioPct(cluster.data.memoryUsedBytes, cluster.data.memoryTotalBytes), 1)}
            accent="text-indigo-400"
          />
          <CapacityTile
            icon={Layers}
            label="Guests"
            value={`${cluster.data.guests.vmsTotal} VM · ${cluster.data.guests.lxcTotal} LXC`}
            hint={`${cluster.data.guests.vmsRunning + cluster.data.guests.lxcRunning} en ejecución`}
            accent="text-emerald-400"
          />
        </div>
      )}
    </div>
  );
};

const CapacityTile: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent: string;
}> = ({ icon: Icon, label, value, hint, accent }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <div className={`rounded-lg bg-slate-800/70 p-1.5 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="mt-2 font-mono text-xl font-bold tracking-tight text-slate-50">{value}</div>
    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
      <Activity className="h-3 w-3" />
      <span>{hint}</span>
    </div>
  </div>
);
