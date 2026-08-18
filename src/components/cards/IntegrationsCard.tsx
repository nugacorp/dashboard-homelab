import React from 'react';
import { Plug, CheckCircle2, XCircle, MinusCircle, PauseCircle, Loader2 } from 'lucide-react';
import type { IntegrationHealth, IntegrationKey, IntegrationState } from '@shared/api';
import { useHomelab } from '../../context/HomelabContext';
import { formatRelative } from '../../lib/format';

/**
 * Replaces the old "98% Health Score" gauge.
 *
 * There is no score here on purpose: any single number would have to be
 * invented, because the dashboard has no service-level objectives to measure
 * against. What it shows instead is the literal state of each integration as
 * reported by /api/health/ready, which is a fact rather than an opinion.
 */

const LABELS: Record<IntegrationKey, string> = {
  proxmox: 'Proxmox VE',
  homeAssistant: 'Home Assistant',
  hermes: 'Hermes',
  uptimeKuma: 'Uptime Kuma',
};

const STATE_STYLES: Record<
  IntegrationState,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  ok: { icon: CheckCircle2, color: 'text-emerald-400', label: 'OK' },
  unavailable: { icon: XCircle, color: 'text-rose-400', label: 'UNAVAILABLE' },
  not_configured: { icon: MinusCircle, color: 'text-slate-500', label: 'NOT CONFIGURED' },
  disabled: { icon: PauseCircle, color: 'text-slate-500', label: 'DISABLED' },
};

const IntegrationRow: React.FC<{ name: string; health: IntegrationHealth }> = ({ name, health }) => {
  const style = STATE_STYLES[health.state];
  const Icon = style.icon;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 p-2.5">
      <div className="flex min-w-0 items-start gap-2">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.color}`} />
        <div className="min-w-0">
          <div className="font-mono text-xs font-bold text-slate-200">{name}</div>
          <p className="truncate text-[11px] text-slate-400" title={health.detail}>
            {health.detail}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`font-mono text-[10px] font-bold ${style.color}`}>{style.label}</div>
        {health.latencyMs !== null && (
          <div className="font-mono text-[10px] text-slate-600">{health.latencyMs} ms</div>
        )}
      </div>
    </div>
  );
};

export const IntegrationsCard: React.FC = () => {
  const { ready } = useHomelab();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Plug className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Integraciones
          </span>
        </div>
        {ready.phase === 'loading' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
        ) : (
          <span className="font-mono text-[10px] text-slate-500">
            {formatRelative(ready.fetchedAt)}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {ready.phase === 'loading' && (
          <p className="py-4 text-center font-mono text-[11px] text-slate-500">
            Consultando estado…
          </p>
        )}

        {ready.phase === 'error' && (
          <p className="py-4 text-center font-mono text-[11px] text-rose-300">
            {ready.error?.message ?? 'El backend no respondió.'}
          </p>
        )}

        {ready.data &&
          (Object.keys(LABELS) as IntegrationKey[]).map((key) => (
            <IntegrationRow key={key} name={LABELS[key]} health={ready.data!.integrations[key]} />
          ))}
      </div>

      {ready.data && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-500">
          <span>
            Backend v{ready.data.version} · auth {ready.data.auth === 'enabled' ? 'activa' : 'desactivada'}
          </span>
          <span
            className={`font-mono font-bold ${
              ready.data.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {ready.data.status.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};
