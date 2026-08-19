import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  HeartPulse,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import type {
  UptimeKumaMonitorDto,
  UptimeKumaMonitorState,
} from '@shared/api';
import { useHomelab } from '../context/HomelabContext';
import { formatRelative } from '../lib/format';

const STATE_STYLE: Record<
  UptimeKumaMonitorState,
  { label: string; className: string }
> = {
  up: {
    label: 'UP',
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  },
  down: {
    label: 'DOWN',
    className: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  },
  pending: {
    label: 'PENDING',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  maintenance: {
    label: 'MAINTENANCE',
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  },
  unknown: {
    label: 'UNKNOWN',
    className: 'border-slate-700 bg-slate-800/70 text-slate-400',
  },
};

function formatLatency(value: number | null, type: string): string {
  if (type === 'push') return 'Heartbeat';
  if (value === null) return 'n/d';
  if (value < 1) return `${value.toFixed(3)} ms`;
  if (value < 10) return `${value.toFixed(2)} ms`;
  return `${value.toFixed(0)} ms`;
}

function formatAverage(value: number | null): string {
  if (value === null) return 'n/d';
  if (value < 1) return `${value.toFixed(3)} ms`;
  if (value < 10) return `${value.toFixed(2)} ms`;
  return `${value.toFixed(0)} ms`;
}

function formatMonitorType(type: string): string {
  return type.toUpperCase();
}

const SummaryCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = ({ label, value, icon: Icon, accent }) => (
  <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <Icon className={`h-4 w-4 ${accent}`} />
    </div>

    <div className={`mt-2 font-mono text-2xl font-extrabold ${accent}`}>
      {value}
    </div>
  </div>
);

const MonitorRow: React.FC<{ monitor: UptimeKumaMonitorDto }> = ({
  monitor,
}) => {
  const state = STATE_STYLE[monitor.state];

  const certificate =
    monitor.certificateValid === null &&
    monitor.certificateDaysRemaining === null
      ? '—'
      : monitor.certificateValid === false
        ? 'INVALID'
        : monitor.certificateDaysRemaining === null
          ? 'VALID'
          : `${Math.round(monitor.certificateDaysRemaining)} d`;

  return (
    <tr className="border-t border-slate-800/80 hover:bg-slate-800/20">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`rounded-md p-1.5 ${
              monitor.type === 'push'
                ? 'bg-violet-500/10 text-violet-400'
                : 'bg-cyan-500/10 text-cyan-400'
            }`}
          >
            {monitor.type === 'push' ? (
              <HeartPulse className="h-4 w-4" />
            ) : (
              <Server className="h-4 w-4" />
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-100">
              {monitor.name}
            </div>
            <div className="font-mono text-[9px] text-slate-600">
              ID {monitor.id}
            </div>
          </div>
        </div>
      </td>

      <td className="px-3 py-3 font-mono text-[10px] text-slate-400">
        {formatMonitorType(monitor.type)}
      </td>

      <td className="px-3 py-3">
        <span
          className={`inline-flex rounded border px-2 py-0.5 font-mono text-[9px] font-bold ${state.className}`}
        >
          {state.label}
        </span>
      </td>

      <td className="px-3 py-3 font-mono text-[10px] font-semibold text-slate-200">
        {formatLatency(monitor.responseTimeMs, monitor.type)}
      </td>

      <td className="px-3 py-3 font-mono text-[10px] text-slate-400">
        {formatAverage(monitor.average1dMs)}
      </td>

      <td className="px-3 py-3 font-mono text-[10px] text-slate-400">
        {formatAverage(monitor.average30dMs)}
      </td>

      <td className="px-3 py-3 font-mono text-[10px] text-slate-400">
        {formatAverage(monitor.average365dMs)}
      </td>

      <td className="px-3 py-3 font-mono text-[10px]">
        <span
          className={
            monitor.certificateValid === false
              ? 'text-rose-400'
              : monitor.certificateDaysRemaining !== null &&
                  monitor.certificateDaysRemaining <= 30
                ? 'text-amber-400'
                : monitor.certificateValid === true
                  ? 'text-emerald-400'
                  : 'text-slate-600'
          }
        >
          {certificate}
        </span>
      </td>
    </tr>
  );
};

export const ServicesPage: React.FC = () => {
  const { uptimeKumaMonitors, uptimeKumaSummary } = useHomelab();

  const summary = uptimeKumaSummary.data;
  const monitors = uptimeKumaMonitors.data ?? [];

  const healthy =
    summary !== null &&
    summary.total > 0 &&
    summary.up === summary.total;

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
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono text-sm font-bold tracking-wide text-white">
                  Monitoring Center
                </h2>

                {summary && (
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold ${
                      healthy
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {summary.up}/{summary.total} UP
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Estado real de los monitores gestionados por Uptime Kuma
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard
          label="Monitores"
          value={summary?.total ?? '—'}
          icon={Activity}
          accent="text-cyan-400"
        />

        <SummaryCard
          label="UP"
          value={summary?.up ?? '—'}
          icon={CheckCircle2}
          accent="text-emerald-400"
        />

        <SummaryCard
          label="DOWN"
          value={summary?.down ?? '—'}
          icon={AlertTriangle}
          accent={summary && summary.down > 0 ? 'text-rose-400' : 'text-slate-400'}
        />

        <SummaryCard
          label="Pending"
          value={summary?.pending ?? '—'}
          icon={Clock3}
          accent="text-amber-400"
        />

        <SummaryCard
          label="Maintenance"
          value={summary?.maintenance ?? '—'}
          icon={ShieldCheck}
          accent="text-sky-400"
        />
      </div>

      {uptimeKumaMonitors.phase === 'loading' && monitors.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center font-mono text-xs text-slate-500">
          Consultando Uptime Kuma…
        </div>
      )}

      {uptimeKumaMonitors.phase === 'not_configured' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300">
          La consulta de monitores de Uptime Kuma no está configurada.
        </div>
      )}

      {monitorsUnavailable && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <div className="font-mono text-xs font-bold text-rose-400">
                No se pudieron consultar los monitores
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {uptimeKumaMonitors.error?.message ?? 'Error desconocido'}
              </p>
            </div>
          </div>
        </div>
      )}

      {monitors.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-slate-950/50">
                <tr className="text-[9px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5 font-semibold">Monitor</th>
                  <th className="px-3 py-2.5 font-semibold">Tipo</th>
                  <th className="px-3 py-2.5 font-semibold">Estado</th>
                  <th className="px-3 py-2.5 font-semibold">Actual</th>
                  <th className="px-3 py-2.5 font-semibold">1 día</th>
                  <th className="px-3 py-2.5 font-semibold">30 días</th>
                  <th className="px-3 py-2.5 font-semibold">365 días</th>
                  <th className="px-3 py-2.5 font-semibold">TLS</th>
                </tr>
              </thead>

              <tbody>
                {monitors.map((monitor) => (
                  <MonitorRow key={monitor.id} monitor={monitor} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/30 px-3 py-2 text-[10px] text-slate-500">
            <span>
              Fuente: Uptime Kuma /metrics · consulta realizada por el backend
            </span>

            <span className="font-mono">
              Actualizado {formatRelative(uptimeKumaMonitors.fetchedAt)}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3 text-[10px] leading-relaxed text-slate-500">
        La API key permanece exclusivamente en el backend. Los monitores PUSH
        no tienen latencia de sondeo y se muestran como
        <span className="font-mono text-violet-400"> Heartbeat</span>. NUGA HOME
        todavía no muestra histórico de incidentes.
      </div>
    </div>
  );
};
