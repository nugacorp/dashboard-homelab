import React from 'react';
import { IntegrationNotConfigured, type IntegrationTone } from './IntegrationNotConfigured';

/**
 * Layout for a section that is in the navigation but has no upstream yet.
 *
 * It keeps the visual identity of the dashboard (same banner, same card
 * treatment) while being unambiguous that there is no data behind it. The
 * "planned" list describes what would appear once the integration exists; it is
 * explicitly framed as future work, never rendered as a value.
 */
export interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  integrationName: string;
  description: string;
  requirement?: string;
  tone?: IntegrationTone;
  planned?: string[];
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  icon: Icon,
  accent,
  integrationName,
  description,
  requirement,
  tone = 'not_configured',
  planned,
}) => (
  <div className="space-y-6 pb-12">
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${accent}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-lg font-bold text-slate-100">{title}</h2>
              <span className="rounded-md border border-slate-700 bg-slate-800/70 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-slate-400">
                {tone === 'coming_later' ? 'COMING LATER' : 'NOT CONFIGURED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>

    <IntegrationNotConfigured
      name={integrationName}
      tone={tone}
      description={description}
      {...(requirement ? { requirement } : {})}
      icon={Icon}
    />

    {planned && planned.length > 0 && (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
          Qué mostrará esta sección cuando exista la integración
        </h3>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {planned.map((entry) => (
            <li
              key={entry}
              className="flex items-start gap-2 rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-400"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
              <span>{entry}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-[10px] text-slate-600">
          Ningún valor de esta lista se muestra hoy: no hay origen de datos.
        </p>
      </div>
    )}
  </div>
);
