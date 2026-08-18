import React from 'react';
import { Home, Lightbulb, ToggleRight, Gauge, ChevronRight, Cctv, Lock } from 'lucide-react';
import type { HomeAssistantSummaryDto } from '@shared/api';
import { StatusBadge } from '../ui/StatusBadge';
import { formatNumber } from '../../lib/format';

export interface SmartHomeCardProps {
  summary: HomeAssistantSummaryDto;
  onClick?: () => void;
}

/**
 * Real Home Assistant summary.
 *
 * This installation currently has only system entities: no Zigbee coordinator,
 * no lights, no locks, no cameras. The card is written so that all-zero is a
 * legitimate, clearly-labelled outcome instead of something to paper over.
 */
export const SmartHomeCard: React.FC<SmartHomeCardProps> = ({ summary, onClick }) => {
  const { categories } = summary;
  const physicalDevices =
    categories.lights +
    categories.switches +
    categories.climate +
    categories.locks +
    categories.cameras +
    categories.mediaPlayers;

  const tiles = [
    { icon: Lightbulb, label: 'Luces', value: categories.lights, color: 'text-amber-400' },
    { icon: ToggleRight, label: 'Switches', value: categories.switches, color: 'text-emerald-400' },
    { icon: Gauge, label: 'Sensores', value: categories.sensors, color: 'text-cyan-400' },
    { icon: Lock, label: 'Cerraduras', value: categories.locks, color: 'text-blue-400' },
  ];

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-amber-950/20 p-5 backdrop-blur-md transition-all duration-200 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-950/20"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
            <Home className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-slate-100">Home Assistant</h3>
              <StatusBadge status="connected" size="sm" />
            </div>
            <p className="truncate text-[11px] text-slate-400">
              {summary.version ? `Core ${summary.version}` : 'Versión no reportada'}
              {summary.locationName ? ` · ${summary.locationName}` : ''}
            </p>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span>{label}</span>
            </div>
            <div
              className={`mt-1 font-mono text-xl font-bold ${
                value === 0 ? 'text-slate-600' : 'text-slate-100'
              }`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {physicalDevices === 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
          <Cctv className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="font-mono text-[11px] text-slate-400">
            No hay dispositivos configurados — solo entidades de sistema.
          </span>
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
        <span>
          Entidades: <strong className="font-mono text-slate-200">{formatNumber(summary.entitiesTotal)}</strong>
        </span>
        <span>
          No disponibles:{' '}
          <strong
            className={`font-mono ${
              summary.entitiesUnavailable > 0 ? 'text-amber-400' : 'text-slate-200'
            }`}
          >
            {summary.entitiesUnavailable}
          </strong>
        </span>
      </div>
    </div>
  );
};
