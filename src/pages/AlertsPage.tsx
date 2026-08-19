import React from 'react';
import {
  AlertTriangle,
  Bell,
  Clock3,
  Info,
  PauseCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type {
  UptimeKumaMonitorDto,
  UptimeKumaMonitorState,
} from '@shared/api';
import { useHomelab } from '../context/HomelabContext';
import { formatRelative } from '../lib/format';

/**
 * Current monitoring alerts.
 *
 * This is intentionally not an incident history. NUGA HOME renders only the
 * current state reported by Uptime Kuma. DOWN, PENDING and MAINTENANCE are
 * surfaced here; UP monitors are omitted.
 */

type ActiveAlertState = Extract<
  UptimeKumaMonitorState,
  'down' | 'pending' | 'maintenance'
>;

const ALERT_STYLE: Record<
  ActiveAlertState,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    container: string;
    iconBox: string;
    badge: string;
  }
> = {
  down: {
    label: 'DOWN',
    icon: AlertTriangle,
    container: 'border-rose-500/30 bg-rose-950/10',
    iconBox: 'bg-rose-500/20 text-rose-400',
    badge: 'bg-rose-500/20 text-rose-400',
  },
  pending: {
    label: 'PENDING',
    icon: Clock3,
    container: 'border-amber-500/30 bg-amber-950/10',
    iconBox: 'bg-amber-500/20 text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  maintenance: {
    label: 'MAINTENANCE',
    icon: PauseCircle,
    container: 'border-sky-500/30 bg-sky-950/10',
    iconBox: 'bg-sky-500/20 text-sky-400',
    badge: 'bg-sky-500/20 text-sky-400',
  },
};

const STATE_PRIORITY: Record<ActiveAlertState, number> = {
  down: 0,
  pending: 1,
  maintenance: 2,
};

function isActiveAlert(
  monitor: UptimeKumaMonitorDto,
): monitor is UptimeKumaMonitorDto & { state: ActiveAlertState } {
  return (
    monitor.state === 'down' ||
    monitor.state === 'pending' ||
    monitor.state === 'maintenance'
  );
}

function formatResponseTime(monitor: UptimeKumaMonitorDto): string {
  if (monitor.type === 'push') return 'Heartbeat';
  if (monitor.responseTimeMs === null) return 'n/d';

  if (monitor.responseTimeMs < 1) {
    return `${monitor.responseTimeMs.toFixed(3)} ms`;
  }

  if (monitor.responseTimeMs < 10) {
    return `${monitor.responseTimeMs.toFixed(2)} ms`;
  }

  return `${monitor.responseTimeMs.toFixed(0)} ms`;
}

export const AlertsPage: React.FC = () => {
  const {
    uptimeKumaMonitors,
    uptimeKumaSummary,
  } = useHomelab();

  const monitors = uptimeKumaMonitors.data ?? [];

  const activeAlerts = monitors
    .filter(isActiveAlert)
    .sort((a, b) => STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state]);

  const down = activeAlerts.filter((monitor) => monitor.state === 'down').length;
  const pending = activeAlerts.filter(
    (monitor) => monitor.state === 'pending',
  ).length;
  const maintenance = activeAlerts.filter(
    (monitor) => monitor.state === 'maintenance',
  ).length;

  const refresh = () => {
    uptimeKumaMonitors.refresh();
    uptimeKumaSummary.refresh();
  };

  const monitorsUnavailable =
    uptimeKumaMonitors.phase !== 'ok' &&
    uptimeKumaMonitors.phase !== 'loading' &&
    uptimeKumaMonitors.phase !== 'not_configured';

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg border p-2 ${
                activeAlerts.length > 0
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono text-sm font-bold tracking-wide text-white">
                  Alertas actuales
                </h2>

                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    activeAlerts.length > 0
                      ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {activeAlerts.length} activas
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Estado actual reportado por Uptime Kuma · actualizado{' '}
                {formatRelative(uptimeKumaMonitors.fetchedAt)}
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Comprobar ahora
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Down
          </div>
          <div
            className={`mt-1 font-mono text-xl font-extrabold ${
              down > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {down}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Pending
          </div>
          <div
            className={`mt-1 font-mono text-xl font-extrabold ${
              pending > 0 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {pending}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Maintenance
          </div>
          <div
            className={`mt-1 font-mono text-xl font-extrabold ${
              maintenance > 0 ? 'text-sky-400' : 'text-slate-300'
            }`}
          >
            {maintenance}
          </div>
        </div>
      </div>

      {uptimeKumaMonitors.phase === 'loading' && monitors.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center font-mono text-xs text-slate-500">
          Consultando Uptime Kuma…
        </div>
      )}

      {uptimeKumaMonitors.phase === 'not_configured' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300">
          Uptime Kuma no está configurado para consultar monitores.
        </div>
      )}

      {monitorsUnavailable && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />

            <div>
              <div className="font-mono text-xs font-bold text-rose-400">
                No se pudo obtener el estado de los monitores
              </div>

              <p className="mt-1 text-[11px] text-slate-400">
                {uptimeKumaMonitors.error?.message ?? 'Error desconocido'}
              </p>
            </div>
          </div>
        </div>
      )}

      {uptimeKumaMonitors.phase === 'ok' &&
        activeAlerts.length === 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <ShieldCheck className="mx-auto mb-2 h-9 w-9 text-emerald-400" />

            <div className="font-mono text-sm font-bold text-emerald-400">
              Sin alertas activas
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Ningún monitor está DOWN, PENDING o en MAINTENANCE.
            </p>

            {uptimeKumaSummary.data && (
              <p className="mt-2 font-mono text-[10px] text-slate-500">
                {uptimeKumaSummary.data.up}/{uptimeKumaSummary.data.total}{' '}
                monitores UP
              </p>
            )}
          </div>
        )}

      {activeAlerts.length > 0 && (
        <div className="space-y-2.5">
          {activeAlerts.map((monitor) => {
            const style = ALERT_STYLE[monitor.state];
            const Icon = style.icon;

            return (
              <div
                key={monitor.id}
                className={`rounded-xl border p-3.5 ${style.container}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-md p-1.5 ${style.iconBox}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {monitor.name}
                        </span>

                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${style.badge}`}
                        >
                          {style.label}
                        </span>

                        <span className="font-mono text-[9px] text-slate-500">
                          {monitor.type.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                        <span>
                          Respuesta:{' '}
                          <span className="font-mono text-slate-300">
                            {formatResponseTime(monitor)}
                          </span>
                        </span>

                        <span>
                          Monitor ID:{' '}
                          <span className="font-mono text-slate-300">
                            {monitor.id}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

        <div>
          <h3 className="font-mono text-xs font-bold text-slate-200">
            Estado actual, no historial de incidentes
          </h3>

          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Esta vista muestra únicamente el estado actual leído desde Uptime
            Kuma. NUGA HOME todavía no persiste inicio, duración, resolución ni
            reconocimiento de incidentes. Los monitores UP no aparecen como
            alertas.
          </p>
        </div>
      </div>
    </div>
  );
};
