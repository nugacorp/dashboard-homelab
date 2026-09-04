import React from 'react';
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Globe2,
  Network,
  RefreshCw,
  Server,
} from 'lucide-react';
import { IntegrationNotConfigured } from '../components/common/IntegrationNotConfigured';
import { useHomelab } from '../context/HomelabContext';

export const NetworkPage: React.FC = () => {
  const { network } = useHomelab();

  if (network.phase === 'loading') {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-sm text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
          Consultando red local…
        </div>
      </div>
    );
  }

  if (network.phase === 'not_configured') {
    return (
      <IntegrationNotConfigured
        name="Observabilidad de red"
        description="El backend todavía no tiene configurados los endpoints del gateway y DNS de la LAN."
        requirement="Configura NETWORK_DNS_SERVER, NETWORK_LOCAL_DOMAIN y NETWORK_GATEWAY_IP en el backend."
      />
    );
  }

  if (network.phase === 'error' || !network.data) {
    return (
      <IntegrationNotConfigured
        name="Observabilidad de red"
        tone="unavailable"
        description={network.error?.message ?? 'No se pudo obtener el estado actual de la red local.'}
        requirement="Revisa la conectividad del backend hacia el gateway y el servidor DNS."
      />
    );
  }

  const data = network.data;
  const resolved = data.records.filter((record) => record.ipv4 !== null).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-cyan-400" />
            <h1 className="font-mono text-xl font-extrabold text-slate-100">
              Red y DNS
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Observabilidad read-only del gateway LAN y Technitium DNS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => network.refresh()}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Globe2 className="h-4 w-4 text-cyan-400" />
            Gateway LAN
          </div>

          <div className="mt-3 font-mono text-xl font-bold text-slate-100">
            {data.gatewayIp}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {data.gatewayHttpsReachable ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  HTTPS accesible
                </span>
              </>
            ) : (
              <>
                <CircleAlert className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-semibold text-rose-400">
                  Sin respuesta HTTPS
                </span>
              </>
            )}
          </div>

          <div className="mt-2 font-mono text-[11px] text-slate-500">
            Latencia:{' '}
            {data.gatewayLatencyMs === null
              ? 'n/d'
              : `${data.gatewayLatencyMs} ms`}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Server className="h-4 w-4 text-cyan-400" />
            Technitium DNS
          </div>

          <div className="mt-3 font-mono text-xl font-bold text-slate-100">
            {data.dnsServer}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {data.dnsExternalResolution ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  Resolución externa OK
                </span>
              </>
            ) : (
              <>
                <CircleAlert className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-semibold text-rose-400">
                  Resolución externa falló
                </span>
              </>
            )}
          </div>

          <div className="mt-2 font-mono text-[11px] text-slate-500">
            Latencia:{' '}
            {data.dnsLatencyMs === null ? 'n/d' : `${data.dnsLatencyMs} ms`}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Activity className="h-4 w-4 text-cyan-400" />
            Zona local
          </div>

          <div className="mt-3 font-mono text-xl font-bold text-slate-100">
            {data.localDomain}
          </div>

          <div className="mt-3 text-xs text-slate-400">
            <span className="font-mono font-bold text-emerald-400">
              {resolved}
            </span>
            {' / '}
            <span className="font-mono">{data.records.length}</span>
            {' registros resueltos'}
          </div>

          <div className="mt-2 font-mono text-[11px] text-slate-500">
            Fuente: consulta DNS directa
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">
            Inventario DNS local
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Registros observados directamente en el servidor DNS configurado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">FQDN</th>
                <th className="px-4 py-3 font-semibold">IPv4</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/70">
              {data.records.map((record) => (
                <tr key={record.fqdn} className="text-xs">
                  <td className="px-4 py-3 font-mono font-bold text-slate-200">
                    {record.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {record.fqdn}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {record.ipv4 ?? 'n/d'}
                  </td>
                  <td className="px-4 py-3">
                    {record.ipv4 ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-rose-400">
                        <CircleAlert className="h-3.5 w-3.5" />
                        Sin resolver
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 px-4 py-3 text-xs text-slate-400">
        Esta integración es exclusivamente de observación. NUGA HOME no modifica
        DNS, gateway ni configuración de red desde esta pantalla.
      </div>
    </div>
  );
};
