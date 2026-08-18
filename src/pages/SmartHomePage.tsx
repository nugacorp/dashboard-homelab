import React, { useMemo, useState } from 'react';
import { Home, Search, Lock, Lightbulb, Gauge, ToggleRight, Info } from 'lucide-react';
import type { HomeAssistantEntityDto } from '@shared/api';
import { useHomelab } from '../context/HomelabContext';
import { useResource } from '../hooks/useResource';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ResourceGate } from '../components/common/ResourceGate';
import { formatRelative, formatNumber } from '../lib/format';

/**
 * Home Assistant, read-only.
 *
 * No toggles, no setpoints, no lock buttons: the backend has no write path to
 * Home Assistant in v1, so offering a control here could only ever produce a
 * fake success. The banner says so explicitly.
 *
 * This installation currently exposes only system entities - no Zigbee
 * coordinator, no physical devices - and the empty state is written for that.
 */
export const SmartHomePage: React.FC = () => {
  const { homeAssistant, session } = useHomelab();
  const canFetch = !session.loading && (!session.authRequired || session.authenticated);

  const entities = useResource<HomeAssistantEntityDto[]>('/home-assistant/entities', 'homeAssistant', {
    pollMs: 30_000,
    enabled: canFetch,
    isEmpty: (d) => d.length === 0,
  });

  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');

  const domains = useMemo(() => {
    const summary = homeAssistant.data;
    if (!summary) return ['ALL'];
    return ['ALL', ...summary.domains.slice(0, 12).map((d) => d.domain)];
  }, [homeAssistant.data]);

  const filtered = useMemo(() => {
    const list = entities.data ?? [];
    const q = search.toLowerCase().trim();
    return list.filter((e) => {
      const matchSearch =
        q === '' ||
        e.entityId.toLowerCase().includes(q) ||
        e.friendlyName.toLowerCase().includes(q);
      const matchDomain = domainFilter === 'ALL' || e.domain === domainFilter;
      return matchSearch && matchDomain;
    });
  }, [entities.data, search, domainFilter]);

  return (
    <div className="space-y-6 pb-12">
      <ResourceGate
        resource={homeAssistant}
        name="Home Assistant"
        notConfiguredDescription="El backend no tiene credenciales de Home Assistant."
        notConfiguredRequirement="Define HASS_URL (esta instalación responde en el puerto 80, no en 8123) y HASS_TOKEN."
      >
        {(summary) => {
          const physical =
            summary.categories.lights +
            summary.categories.switches +
            summary.categories.climate +
            summary.categories.locks +
            summary.categories.cameras +
            summary.categories.mediaPlayers;

          return (
            <>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400">
                      <Home className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-mono text-lg font-bold text-slate-100">Home Assistant</h2>
                        <StatusBadge status="connected" size="sm" />
                      </div>
                      <p className="text-xs text-slate-400">
                        {summary.version ? `Core ${summary.version}` : 'Versión no reportada'}
                        {summary.locationName ? ` · ${summary.locationName}` : ''} ·{' '}
                        {formatNumber(summary.entitiesTotal)} entidades
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
                      <span className="text-slate-400">No disponibles:</span>{' '}
                      <span
                        className={`font-bold ${
                          summary.entitiesUnavailable > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {summary.entitiesUnavailable}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
                      <span className="text-slate-400">Desconocidas:</span>{' '}
                      <span className="font-bold text-slate-200">{summary.entitiesUnknown}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-1.5 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="font-mono text-[11px] leading-relaxed text-slate-400">
                    Control no habilitado — NUGA HOME solo lee estados. No hay ninguna ruta de
                    escritura hacia Home Assistant en esta versión: encender luces, abrir cerraduras
                    o cambiar el clima se hará desde la propia app de Home Assistant.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <CategoryTile icon={Lightbulb} label="Luces" value={summary.categories.lights} color="text-amber-400" />
                <CategoryTile icon={ToggleRight} label="Switches" value={summary.categories.switches} color="text-emerald-400" />
                <CategoryTile icon={Gauge} label="Sensores" value={summary.categories.sensors} color="text-cyan-400" />
                <CategoryTile icon={Lock} label="Cerraduras" value={summary.categories.locks} color="text-blue-400" />
                <CategoryTile icon={Home} label="Climatización" value={summary.categories.climate} color="text-rose-400" />
              </div>

              {physical === 0 && (
                <div className="flex items-start gap-2 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200">
                      No hay dispositivos configurados
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Home Assistant responde correctamente, pero todavía no tiene dispositivos
                      físicos: no hay coordinador Zigbee, luces, enchufes, cámaras ni sensores
                      inteligentes emparejados. Las entidades listadas abajo son de sistema.
                    </p>
                  </div>
                </div>
              )}
            </>
          );
        }}
      </ResourceGate>

      <ResourceGate
        resource={entities}
        name="Entidades de Home Assistant"
        notConfiguredDescription="Home Assistant no está configurado."
        emptyDescription="Home Assistant no devolvió ninguna entidad."
      >
        {() => (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 p-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Entidades ({filtered.length})
              </h3>

              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar entity_id o nombre…"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-slate-800/60 px-4 py-2.5">
              {domains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setDomainFilter(domain)}
                  className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
                    domainFilter === domain
                      ? 'border border-amber-500/30 bg-amber-500/15 font-bold text-amber-300'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {domain === 'ALL' ? 'todos' : domain}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Entidad</th>
                    <th className="px-4 py-3">Dominio</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Clase</th>
                    <th className="px-4 py-3">Último cambio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Ninguna entidad coincide con el filtro.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((entity) => (
                      <tr key={entity.entityId} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{entity.friendlyName}</div>
                          <div className="font-mono text-[10px] text-slate-500">{entity.entityId}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{entity.domain}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono ${
                              entity.available ? 'text-slate-200' : 'text-amber-400'
                            }`}
                          >
                            {entity.state}
                            {entity.unit ? ` ${entity.unit}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {entity.deviceClass ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {formatRelative(entity.lastChanged)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ResourceGate>
    </div>
  );
};

const CategoryTile: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}> = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span>{label}</span>
    </div>
    <div
      className={`mt-1.5 font-mono text-2xl font-bold ${value === 0 ? 'text-slate-600' : 'text-slate-100'}`}
    >
      {value}
    </div>
  </div>
);
