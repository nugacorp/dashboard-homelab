import React from 'react';
import { Grid, ExternalLink, Server, Home, Bot, Activity, Info } from 'lucide-react';
import type { IntegrationHealth } from '@shared/api';
import { useHomelab } from '../context/HomelabContext';
import { formatRelative } from '../lib/format';

/**
 * Service catalog.
 *
 * The previous version listed twelve services (Plex, Frigate, Immich, Ollama,
 * Tailscale, Postgres...) with CPU, RAM and uptime figures, none of which were
 * real. What NUGA HOME can honestly enumerate is the set of endpoints it is
 * itself configured to talk to, plus their live probe result.
 *
 * A full homelab service inventory needs a source of truth. Uptime Kuma is the
 * natural one, but its 2.x API is not stable enough to depend on - see
 * docs/INTEGRATIONS.md.
 */

interface ServiceRow {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  health: IntegrationHealth | null;
  url: string | null;
}

const STATE_LABEL: Record<string, { text: string; className: string }> = {
  ok: { text: 'OK', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' },
  unavailable: { text: 'UNAVAILABLE', className: 'border-rose-500/20 bg-rose-500/10 text-rose-400' },
  not_configured: { text: 'NOT CONFIGURED', className: 'border-slate-700 bg-slate-800/70 text-slate-400' },
  disabled: { text: 'DISABLED', className: 'border-slate-700 bg-slate-800/70 text-slate-400' },
};

export const ServicesPage: React.FC = () => {
  const { ready, uptimeKuma } = useHomelab();
  const integrations = ready.data?.integrations;

  const rows: ServiceRow[] = [
    {
      id: 'proxmox',
      name: 'Proxmox VE',
      description: 'Cluster de virtualización — origen de la telemetría de cómputo',
      icon: Server,
      accent: 'text-cyan-400',
      health: integrations?.proxmox ?? null,
      url: null,
    },
    {
      id: 'homeAssistant',
      name: 'Home Assistant',
      description: 'Entidades y estados del hogar, en solo lectura',
      icon: Home,
      accent: 'text-amber-400',
      health: integrations?.homeAssistant ?? null,
      url: null,
    },
    {
      id: 'hermes',
      name: 'Hermes',
      description: 'Agente de IA en VM110 — pendiente de conectar al dashboard',
      icon: Bot,
      accent: 'text-indigo-400',
      health: integrations?.hermes ?? null,
      url: null,
    },
    {
      id: 'uptimeKuma',
      name: 'Uptime Kuma',
      description: 'Monitorización externa — se enlaza, no se consulta por API',
      icon: Activity,
      accent: 'text-emerald-400',
      health: integrations?.uptimeKuma ?? null,
      url: uptimeKuma.data?.url ?? null,
    },
  ];

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
            <Grid className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold tracking-wide text-white">
              Servicios conectados a NUGA HOME
            </h2>
            <p className="text-[11px] text-slate-400">
              Endpoints que el backend tiene configurados y su último resultado de sondeo
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => {
          const Icon = row.icon;
          const label = STATE_LABEL[row.health?.state ?? 'not_configured']!;

          return (
            <div
              key={row.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0f172a] p-3.5 transition-all hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-800 bg-slate-950 ${row.accent}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="truncate font-mono text-xs font-bold text-white">{row.name}</h3>
                  </div>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${label.className}`}
                  >
                    {label.text}
                  </span>
                </div>

                <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">{row.description}</p>

                {row.health && (
                  <p className="mt-2 font-mono text-[10px] leading-relaxed text-slate-500">
                    {row.health.detail}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[10px]">
                <span className="font-mono text-slate-600">
                  {row.health?.checkedAt ? formatRelative(row.health.checkedAt) : 'sin sondeo'}
                  {row.health?.latencyMs !== null && row.health?.latencyMs !== undefined
                    ? ` · ${row.health.latencyMs} ms`
                    : ''}
                </span>
                {row.url && (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-slate-400 transition-colors hover:text-emerald-400"
                  >
                    <span>abrir</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <div>
          <h3 className="font-mono text-xs font-bold text-slate-200">
            Por qué no hay un catálogo completo de servicios
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Enumerar todos los servicios del homelab con CPU, memoria y uptime requeriría leer el
            demonio Docker de cada host o una fuente de inventario. Montar el socket de Docker en
            este contenedor queda descartado por seguridad, y Uptime Kuma 2.x no expone una API REST
            estable para el estado de sus monitores. Hasta que exista una fuente fiable, esta página
            solo muestra lo que el backend sabe de primera mano.
          </p>
        </div>
      </div>
    </div>
  );
};
