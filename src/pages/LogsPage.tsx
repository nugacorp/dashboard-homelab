import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import type {
  NugaLogEntryDto,
  NugaLogLevel,
} from '@shared/api';
import { useResource } from '../hooks/useResource';
import { formatRelative } from '../lib/format';

const LEVEL_STYLE: Record<NugaLogLevel, string> = {
  debug: 'border-slate-700 bg-slate-800/70 text-slate-400',
  info: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
  warn: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  error: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
};

function renderContext(context: Record<string, string>): string {
  return Object.entries(context)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleString('es-MX', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export const LogsPage: React.FC = () => {
  const logs = useResource<NugaLogEntryDto[]>(
    '/logs?limit=250',
    'nugaOps',
    {
      pollMs: 15_000,
      isEmpty: (entries) => entries.length === 0,
    },
  );

  const [query, setQuery] = useState('');
  const [level, setLevel] =
    useState<'all' | NugaLogLevel>('all');

  const entries = logs.data ?? [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return entries
      .filter((entry) => level === 'all' || entry.level === level)
      .filter((entry) => {
        if (!needle) return true;

        return [
          entry.level,
          entry.message,
          renderContext(entry.context),
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .slice()
      .reverse();
  }, [entries, level, query]);

  const warnings = entries.filter(
    (entry) => entry.level === 'warn',
  ).length;

  const errors = entries.filter(
    (entry) => entry.level === 'error',
  ).length;

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-400">
              <Terminal className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono text-sm font-bold text-white">
                  Logs NUGA HOME
                </h2>

                <span className="rounded border border-slate-700 bg-slate-800/70 px-2 py-0.5 font-mono text-[9px] text-slate-300">
                  {entries.length} eventos
                </span>
              </div>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Eventos recientes generados por el backend
              </p>
            </div>
          </div>

          <button
            onClick={logs.refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">
            Buffer
          </div>
          <div className="mt-1 font-mono text-xl font-extrabold text-cyan-400">
            {entries.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">
            Warnings
          </div>
          <div className="mt-1 font-mono text-xl font-extrabold text-amber-400">
            {warnings}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">
            Errors
          </div>
          <div className="mt-1 font-mono text-xl font-extrabold text-rose-400">
            {errors}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar mensaje o contexto..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 font-mono text-[11px] text-slate-200 outline-none"
          />
        </div>

        <select
          value={level}
          onChange={(event) =>
            setLevel(
              event.target.value as 'all' | NugaLogLevel,
            )
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-[11px] text-slate-300"
        >
          <option value="all">Todos</option>
          <option value="debug">DEBUG</option>
          <option value="info">INFO</option>
          <option value="warn">WARN</option>
          <option value="error">ERROR</option>
        </select>
      </div>

      {logs.phase === 'loading' && entries.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center font-mono text-xs text-slate-500">
          Consultando eventos…
        </div>
      )}

      {logs.phase === 'error' && entries.length === 0 && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-400" />
            <span className="text-xs text-rose-300">
              {logs.error?.message ?? 'No se pudieron consultar los logs'}
            </span>
          </div>
        </div>
      )}

      {filtered.length === 0 && logs.phase !== 'loading' && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-600" />
          <div className="mt-2 font-mono text-xs text-slate-400">
            Sin eventos coincidentes
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-slate-950/50">
                <tr className="text-[9px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Hora</th>
                  <th className="px-3 py-2.5">Nivel</th>
                  <th className="px-3 py-2.5">Mensaje</th>
                  <th className="px-3 py-2.5">Contexto</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((entry, index) => (
                  <tr
                    key={`${entry.timestamp}-${index}`}
                    className="border-t border-slate-800/80 align-top"
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-[10px] text-slate-500">
                      {formatTimestamp(entry.timestamp)}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${LEVEL_STYLE[entry.level]}`}
                      >
                        {entry.level}
                      </span>
                    </td>

                    <td className="px-3 py-3 font-mono text-[10px] text-slate-200">
                      {entry.message}
                    </td>

                    <td className="max-w-[480px] break-all px-3 py-3 font-mono text-[10px] text-slate-500">
                      {renderContext(entry.context) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between border-t border-slate-800 bg-slate-950/30 px-3 py-2 text-[10px] text-slate-500">
            <span>Buffer temporal en memoria</span>
            <span className="font-mono">
              Actualizado {formatRelative(logs.fetchedAt)}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-[11px] leading-relaxed text-slate-400">
          Tokens, Authorization, JWT, passwords y secretos registrados
          se redactan antes de entrar al buffer. Esta vista no monta
          Docker Socket ni accede arbitrariamente al host.
        </p>
      </div>
    </div>
  );
};
