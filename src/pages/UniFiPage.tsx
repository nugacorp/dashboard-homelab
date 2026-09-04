import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Network,
  Radio,
  RefreshCw,
  Server,
  Users,
  Wifi,
} from 'lucide-react';
import { IntegrationNotConfigured } from '../components/common/IntegrationNotConfigured';
import { useHomelab } from '../context/HomelabContext';

function formatRate(value: number | null): string {
  if (value === null) return 'n/d';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} Gbps`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Mbps`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} Kbps`;
  return `${Math.round(value)} bps`;
}

export const UniFiPage: React.FC = () => {
  const { unifi } = useHomelab();

  if (unifi.phase === 'loading') {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-sm text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
          Consultando UniFi Network…
        </div>
      </div>
    );
  }

  if (unifi.phase === 'not_configured') {
    return (
      <IntegrationNotConfigured
        name="UniFi Network"
        description="El UCG Max está desplegado, pero la API oficial aún no está configurada en este backend."
        requirement="Configura la API local oficial de UniFi Network únicamente en el backend."
      />
    );
  }

  if (unifi.phase === 'error' || !unifi.data) {
    return (
      <IntegrationNotConfigured
        name="UniFi Network"
        tone="unavailable"
        description={unifi.error?.message ?? 'No se pudo consultar UniFi Network.'}
        requirement="Revisa API key, CA TLS, server name y conectividad con el UCG Max."
      />
    );
  }

  const data = unifi.data;
  const onlineDevices = data.devices.filter(
    (device) => device.state?.toUpperCase() === 'ONLINE',
  ).length;

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-400" />
            <h1 className="font-mono text-xl font-extrabold text-slate-100">
              UniFi Network
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            API oficial local · sitio {data.siteName ?? 'n/d'} · Network{' '}
            {data.applicationVersion ?? 'n/d'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => unifi.refresh()}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-blue-500/40 hover:text-blue-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Dispositivos', `${onlineDevices}/${data.devices.length}`, Server],
          ['Clientes', data.clients.length, Users],
          ['Redes', data.networks.length, Network],
          ['WAN', data.wans.length, Radio],
          ['WiFi', data.wifiBroadcastCount, Wifi],
        ].map(([label, value, Icon]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {label as string}
              </span>
              {React.createElement(Icon as React.ComponentType<{ className?: string }>, {
                className: 'h-4 w-4 text-blue-400',
              })}
            </div>
            <div className="mt-2 font-mono text-2xl font-extrabold text-slate-100">
              {value as React.ReactNode}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-400" />
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">
            Dispositivos UniFi
          </h2>
        </div>

        {data.devices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
            No hay dispositivos adoptados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.devices.map((device) => {
              const online = device.state?.toUpperCase() === 'ONLINE';

              return (
                <div
                  key={device.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm font-bold text-slate-100">
                        {device.name ?? device.model ?? 'Dispositivo UniFi'}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-500">
                        {device.model ?? 'modelo n/d'} · {device.ipAddress ?? 'IP n/d'}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-bold ${
                        online
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {online ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {device.state ?? 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">
                        Firmware
                      </div>
                      <div className="mt-1 font-mono text-slate-300">
                        {device.firmwareVersion ?? 'n/d'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">
                        CPU / RAM
                      </div>
                      <div className="mt-1 flex items-center gap-1 font-mono text-slate-300">
                        <Cpu className="h-3 w-3" />
                        {device.cpuUtilizationPct ?? 'n/d'}% /{' '}
                        {device.memoryUtilizationPct ?? 'n/d'}%
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">
                        RX
                      </div>
                      <div className="mt-1 font-mono text-slate-300">
                        {formatRate(device.rxRateBps)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">
                        TX
                      </div>
                      <div className="mt-1 font-mono text-slate-300">
                        {formatRate(device.txRateBps)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Redes / VLAN
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/70">
            {data.networks.map((network) => (
              <div
                key={network.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">
                    {network.name ?? 'Sin nombre'}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {network.management ?? 'management n/d'}
                  </div>
                </div>

                <div className="text-right font-mono text-[10px] text-slate-400">
                  VLAN {network.vlanId ?? 'n/d'}
                </div>
              </div>
            ))}

            {data.networks.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                Sin redes reportadas.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Clientes conectados
              </span>
            </div>
          </div>

          <div className="max-h-80 divide-y divide-slate-800/70 overflow-y-auto">
            {data.clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-200">
                    {client.name ?? client.type ?? 'Cliente'}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {client.type ?? 'tipo n/d'}
                  </div>
                </div>

                <div className="shrink-0 font-mono text-[10px] text-slate-300">
                  {client.ipAddress ?? 'IP n/d'}
                </div>
              </div>
            ))}

            {data.clients.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                Sin clientes conectados.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 px-4 py-3 text-xs text-slate-400">
        <div className="flex items-start gap-2">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <span>
            Integración estrictamente read-only. NUGA HOME solo consulta endpoints
            GET permitidos y no expone acciones de reinicio, adopción, puertos,
            clientes, redes ni firewall.
          </span>
        </div>
      </div>
    </div>
  );
};
