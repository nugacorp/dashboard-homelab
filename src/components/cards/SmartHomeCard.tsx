import React from 'react';
import { Home, Lightbulb, Lock, Thermometer, Droplets, Users, Shield, ChevronRight } from 'lucide-react';
import { SmartHomeSummary } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

export interface SmartHomeCardProps {
  summary: SmartHomeSummary;
  onClick?: () => void;
}

export const SmartHomeCard: React.FC<SmartHomeCardProps> = ({ summary, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-amber-950/20 p-5 backdrop-blur-md transition-all duration-200 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-950/20 cursor-pointer"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-slate-100">Smart Home (Home Assistant)</h3>
              <StatusBadge status="Connected" size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">HAOS Core • Zigbee & Z-Wave Coordinator</p>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Lights */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            <span>Lights</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-100">
            {summary.lightsOn}{' '}
            <span className="text-xs font-normal text-slate-400">/ {summary.lightsTotal} ON</span>
          </div>
        </div>

        {/* Climate */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
            <span>Climate</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-100">
            {summary.avgTemperatureC}°C{' '}
            <span className="text-xs font-normal text-slate-400">{summary.avgHumidityPct}% RH</span>
          </div>
        </div>

        {/* Doors */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Perimeter</span>
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-emerald-400">
            {summary.doorsLocked ? 'All Secure' : 'Unlocked'}
          </div>
        </div>

        {/* Presence */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>Presence</span>
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-slate-200">
            {summary.peopleHome.join(' & ')}
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
        <span>Security Mode: <strong className="font-mono text-slate-200">{summary.securityMode}</strong></span>
        <span>6 Rooms Configured</span>
      </div>
    </div>
  );
};
