import React from 'react';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Resource } from '../../hooks/useResource';
import { IntegrationNotConfigured } from './IntegrationNotConfigured';

/**
 * Renders a resource according to its phase, so no page has to reimplement the
 * loading / empty / not-configured / error branches by hand.
 *
 * `stale` is rendered as a banner above the real content rather than replacing
 * it: showing the last known good data with an explicit "outdated" marker beats
 * blanking the screen every time a poll misses.
 */
export interface ResourceGateProps<T> {
  resource: Resource<T>;
  /** Name shown in the not-configured / error states. */
  name: string;
  notConfiguredDescription: string;
  notConfiguredRequirement?: string;
  emptyDescription?: string;
  children: (data: T) => React.ReactNode;
  compact?: boolean;
}

export function ResourceGate<T>({
  resource,
  name,
  notConfiguredDescription,
  notConfiguredRequirement,
  emptyDescription,
  children,
  compact = false,
}: ResourceGateProps<T>): React.ReactElement {
  const { phase, data, error, stale, refresh } = resource;

  if (phase === 'loading') {
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 ${
          compact ? 'p-5' : 'p-10'
        }`}
      >
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
        <span className="font-mono">Consultando {name}…</span>
      </div>
    );
  }

  if (phase === 'not_configured' || phase === 'disabled') {
    return (
      <IntegrationNotConfigured
        name={name}
        tone="not_configured"
        description={notConfiguredDescription}
        {...(notConfiguredRequirement ? { requirement: notConfiguredRequirement } : {})}
        compact={compact}
      />
    );
  }

  if (phase === 'error') {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-500/25 bg-slate-900/40 text-center ${
          compact ? 'p-5' : 'p-10'
        }`}
      >
        <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-300">
          <AlertTriangle className={compact ? 'h-5 w-5' : 'h-7 w-7'} />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-sm font-bold text-slate-100">{name}</h3>
          <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">
            UNAVAILABLE
          </span>
        </div>
        <p className="max-w-lg font-mono text-[11px] leading-relaxed text-slate-400">
          {error?.message ?? 'La integración no respondió.'}
        </p>
        {error?.code && (
          <span className="font-mono text-[10px] text-slate-600">{error.code}</span>
        )}
        <button
          onClick={refresh}
          className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <IntegrationNotConfigured
        name={name}
        tone="empty"
        description={emptyDescription ?? `${name} respondió correctamente pero no hay datos que mostrar.`}
        compact={compact}
      />
    );
  }

  return (
    <>
      {stale && <StaleBanner message={error?.message ?? null} onRetry={refresh} />}
      {data !== null ? children(data) : null}
    </>
  );
}

export const StaleBanner: React.FC<{ message: string | null; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-950/20 px-3 py-2">
    <div className="flex items-center gap-2 text-[11px] text-amber-300">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="font-mono">
        Datos desactualizados — la última actualización falló
        {message ? `: ${message}` : '.'}
      </span>
    </div>
    <button
      onClick={onRetry}
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-200 hover:bg-amber-500/20"
    >
      REINTENTAR
    </button>
  </div>
);
