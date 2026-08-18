import React from 'react';
import { PlugZap, Info, ExternalLink } from 'lucide-react';

/**
 * The single component used everywhere a subsystem has no data to show.
 *
 * It exists so that "we never set this up" reads differently from "this is
 * broken" and from "this is genuinely empty". Nothing here ever renders a
 * sample value, a placeholder chart or a plausible-looking number.
 */
export type IntegrationTone = 'not_configured' | 'coming_later' | 'unavailable' | 'empty';

const TONES: Record<
  IntegrationTone,
  { label: string; accent: string; ring: string; chip: string }
> = {
  not_configured: {
    label: 'NOT CONFIGURED',
    accent: 'text-slate-400',
    ring: 'border-slate-800',
    chip: 'bg-slate-800/70 text-slate-300 border-slate-700',
  },
  coming_later: {
    label: 'COMING LATER',
    accent: 'text-indigo-300',
    ring: 'border-indigo-500/20',
    chip: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  },
  unavailable: {
    label: 'UNAVAILABLE',
    accent: 'text-rose-300',
    ring: 'border-rose-500/25',
    chip: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  },
  empty: {
    label: 'NO DATA',
    accent: 'text-slate-400',
    ring: 'border-slate-800',
    chip: 'bg-slate-800/70 text-slate-300 border-slate-700',
  },
};

export interface IntegrationNotConfiguredProps {
  name: string;
  tone?: IntegrationTone;
  /** One or two sentences explaining the state in plain language. */
  description: string;
  /** What the operator would have to do next, when there is a next step. */
  requirement?: string;
  cta?: { label: string; href: string };
  icon?: React.ComponentType<{ className?: string }>;
  compact?: boolean;
}

export const IntegrationNotConfigured: React.FC<IntegrationNotConfiguredProps> = ({
  name,
  tone = 'not_configured',
  description,
  requirement,
  cta,
  icon: Icon = PlugZap,
  compact = false,
}) => {
  const t = TONES[tone];

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed ${t.ring} bg-slate-900/40 text-center backdrop-blur-md ${
        compact ? 'gap-2 p-5' : 'gap-3 p-10'
      }`}
    >
      <div className={`rounded-2xl bg-slate-950/70 p-3 ${t.accent}`}>
        <Icon className={compact ? 'h-5 w-5' : 'h-7 w-7'} />
      </div>

      <div className="flex items-center gap-2">
        <h3 className={`font-mono font-bold text-slate-100 ${compact ? 'text-sm' : 'text-base'}`}>
          {name}
        </h3>
        <span
          className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider ${t.chip}`}
        >
          {t.label}
        </span>
      </div>

      <p className={`max-w-md text-slate-400 ${compact ? 'text-[11px]' : 'text-xs'}`}>{description}</p>

      {requirement && (
        <div className="mt-1 flex max-w-md items-start gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-left">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="font-mono text-[11px] leading-relaxed text-slate-400">{requirement}</span>
        </div>
      )}

      {cta && (
        <a
          href={cta.href}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
        >
          <span>{cta.label}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
};
