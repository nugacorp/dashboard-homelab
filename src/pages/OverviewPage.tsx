import React from 'react';
import {
  Server,
  Cpu,
  Layers,
  Radio,
  Wifi,
  Home,
  Camera,
  HardDrive,
  Grid,
  Zap,
  Activity,
  Bell,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { HealthIndicator } from '../components/ui/HealthIndicator';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';
import { NodeCard } from '../components/cards/NodeCard';
import { InternetCard } from '../components/cards/InternetCard';
import { SmartHomeCard } from '../components/cards/SmartHomeCard';
import { CameraCard } from '../components/cards/CameraCard';
import { ImmichCard } from '../components/cards/ImmichCard';
import { FrigateCard } from '../components/cards/FrigateCard';
import { TopologyMap } from '../components/common/TopologyMap';

export const OverviewPage: React.FC = () => {
  const {
    overview,
    cluster,
    nodes,
    vms,
    containers,
    starlink,
    unifi,
    smartHome,
    cameras,
    frigate,
    storagePool,
    immich,
    services,
    energy,
    alerts,
    activity,
    setCurrentPage,
    setSelectedCamera,
    liveThroughput
  } = useHomelab();

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Global Health & Key NOC KPIs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Health Score Gauge */}
        <HealthIndicator
          score={overview.healthScore}
          homeStatus={overview.homeStatus}
          statusText="All core homelab services operating within optimal parameters"
        />

        {/* Global Cluster KPI */}
        <div
          onClick={() => setCurrentPage('proxmox')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-4.5 backdrop-blur-md transition-all hover:border-cyan-500/40 hover:bg-slate-900/90"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Proxmox 3-Node Cluster
            </span>
            <StatusBadge status={cluster.quorumStatus} size="sm" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-slate-50">
              {cluster.cpuUsageAvgPct}%
            </span>
            <span className="font-mono text-xs text-slate-400">Avg CPU</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-xl font-bold text-slate-200">
              {cluster.ramUsedGb} / {cluster.ramTotalGb} GB
            </span>
            <span className="font-mono text-xs text-slate-400">RAM</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400">
            <span>{vms.length} Virtual Machines</span>
            <span>{containers.length} LXC Containers</span>
          </div>
        </div>

        {/* Live Power & Energy Grid */}
        <div
          onClick={() => setCurrentPage('energy')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-4.5 backdrop-blur-md transition-all hover:border-amber-500/40 hover:bg-slate-900/90"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Power Consumption
            </span>
            <StatusBadge status="Grid + Solar" size="sm" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-slate-50">
              {energy.currentDrawWatts}
            </span>
            <span className="font-mono text-xs text-amber-400">Watts</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-sm text-emerald-400">
              UPS: {energy.upsBatteryPct}% ({energy.upsRuntimeMinutes}m)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400">
            <span>Est. Cost: ${energy.costEstimatedPerMonth}/mo</span>
            <span>Rack Ambient: {energy.ambientTempC}°C</span>
          </div>
        </div>
      </div>

      {/* Row 2: Internet & Network Uplink + Smart Home */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InternetCard
          telemetry={starlink}
          onClick={() => setCurrentPage('starlink')}
        />
        <SmartHomeCard
          summary={smartHome}
          onClick={() => setCurrentPage('smart-home')}
        />
      </div>

      {/* Row 3: Proxmox 3 Nodes Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">
              Proxmox Cluster Nodes (3)
            </h3>
          </div>
          <button
            onClick={() => setCurrentPage('proxmox')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
          >
            <span>Manage Cluster</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {nodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              onSelect={() => setCurrentPage('proxmox')}
            />
          ))}
        </div>
      </div>

      {/* Row 4: Network Map Topology */}
      <TopologyMap />

      {/* Row 5: Cameras Matrix Preview (First 4) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">
              Security Cameras Live Matrix ({cameras.length})
            </h3>
          </div>
          <button
            onClick={() => setCurrentPage('cameras')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
          >
            <span>View All 8 Cameras</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cameras.slice(0, 4).map(cam => (
            <CameraCard
              key={cam.id}
              camera={cam}
              onOpenLive={() => setSelectedCamera(cam)}
            />
          ))}
        </div>
      </div>

      {/* Row 6: Storage, Immich & Frigate Deep Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* ZFS Storage Pool */}
        <div
          onClick={() => setCurrentPage('storage')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md transition-all hover:border-emerald-500/40 hover:bg-slate-900/90"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-slate-100">{storagePool.name}</h3>
                <p className="text-[11px] text-slate-400">{storagePool.type} (6 Disks)</p>
              </div>
            </div>
            <StatusBadge status={storagePool.health} size="sm" />
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Capacity Used</span>
              <span className="font-mono font-bold text-slate-200">
                {storagePool.usedTb} TB / {storagePool.totalTb} TB ({storagePool.usedPct}%)
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${storagePool.usedPct}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Free: <strong className="font-mono text-slate-200">{storagePool.freeTb} TB</strong></span>
            <span>SMART: <strong className="text-emerald-400">100% Passed</strong></span>
          </div>
        </div>

        {/* Immich Photo App */}
        <ImmichCard
          immich={immich}
          onClick={() => setCurrentPage('storage')}
        />

        {/* Frigate AI NVR */}
        <FrigateCard
          frigate={frigate}
          onClick={() => setCurrentPage('cameras')}
        />
      </div>

      {/* Row 7: Activity Feed & Alerts Log */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Infrastructure Activity Log */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                Live Homelab Event Stream
              </h3>
            </div>
            <button
              onClick={() => setCurrentPage('logs')}
              className="text-xs text-cyan-400 hover:underline"
            >
              View Syslog
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {activity.slice(0, 5).map(act => (
              <div
                key={act.id}
                className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-xs"
              >
                <div className="mt-0.5 rounded-lg bg-slate-800 p-1 text-cyan-400">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-slate-200">{act.source}</span>
                    <span className="font-mono text-[10px] text-slate-500">{act.relativeTime}</span>
                  </div>
                  <p className="mt-0.5 text-slate-400">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Central Alerts Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                System Alerts ({activeAlerts.length} Active)
              </h3>
            </div>
            <button
              onClick={() => setCurrentPage('alerts')}
              className="text-xs text-amber-400 hover:underline"
            >
              Alert Manager
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All systems healthy. No active alerts.
              </div>
            ) : (
              activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={alert.severity} size="sm" showPulse={false} />
                      <span className="font-mono font-semibold text-slate-200">{alert.source}</span>
                    </div>
                    <p className="text-slate-400">{alert.message}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{alert.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
