import React from 'react';
import { Bell, ShieldCheck, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import type { IntegrationKey } from '@shared/api';
import { useHomelab } from '../context/HomelabContext';
import { formatRelative } from '../lib/format';

/**
 * Alerts.
 *
 * There is no alerting backend, so this page does not invent an incident feed.
 * What it can state truthfully is which configured integrations are currently
 * failing their probe, derived from /api/health/ready. Acknowledge / resolve
 * buttons are gone: with no store behind them they only moved a flag in browser
 * memory until the next refresh.
 */

const LABELS: Record<IntegrationKey, string> = {
  proxmox: 'Proxmox VE',
  homeAssistant: 'Home Assistant',
  hermes: 'Hermes',
  uptimeKuma: 'Uptime Kuma',
};

export const AlertsPage: React.FC = () => {
  const { ready } = useHomelab();

  const failing = ready.data
    ? (Object.entries(ready.data.integrations) as Array<
        [IntegrationKey, (typeof ready.data.integrations)[IntegrationKey]]
      >).filter(([, health]) => health.state === 'unavailable')
    : [];

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-bold tracking-wide text-white">
                  Estado de integraciones
                </h2>
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    failing.length > 0
                      ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {failing.length} con fallo
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Derivado de /api/health/ready · última comprobación {formatRelative(ready.fetchedAt)}
              </p>
            </div>
          </div>

          <button
            onClick={ready.refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Comprobar ahora</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {failing.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center text-xs text-slate-400">
            <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            Ninguna integración configurada está fallando ahora mismo.
          </div>
        ) : (
          failing.map(([key, health]) => (
            <div key={key} className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-rose-500/20 p-1.5 text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{LABELS[key]}</span>
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-rose-400">
                        unavailable
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {formatRelative(health.checkedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{health.detail}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <div>
          <h3 className="font-mono text-xs font-bold text-slate-200">
            Esto no es todavía un gestor de alertas
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            No hay histórico, ni umbrales, ni notificaciones: solo el resultado del último sondeo a
            cada integración. Uptime Kuma sigue siendo la fuente de verdad para caídas y avisos.
            Una bandeja de alertas real necesitaría persistencia y reglas, que quedan fuera de v1.
          </p>
        </div>
      </div>
    </div>
  );
};
