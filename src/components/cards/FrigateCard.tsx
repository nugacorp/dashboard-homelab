import React from 'react';
import { Camera, Cpu, Zap, Sparkles, Activity, ChevronRight } from 'lucide-react';
import { FrigateStats } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

export interface FrigateCardProps {
  frigate: FrigateStats;
  onClick?: () => void;
}

export const FrigateCard: React.FC<FrigateCardProps> = ({ frigate, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 backdrop-blur-md transition-all duration-200 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20 cursor-pointer"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-cyan-500/20 p-2 text-cyan-400">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-slate-100">Frigate NVR AI</h3>
              <StatusBadge status={frigate.status} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">Google Coral Edge TPU Acceleration</p>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <span className="text-[10px] uppercase text-slate-400">TPU Speed</span>
          <div className="font-mono text-base font-bold text-emerald-400">
            {frigate.tpuInferenceSpeedMs} ms
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <span className="text-[10px] uppercase text-slate-400">Persons</span>
          <div className="font-mono text-base font-bold text-cyan-400">
            {frigate.detectionsToday.person}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <span className="text-[10px] uppercase text-slate-400">Vehicles</span>
          <div className="font-mono text-base font-bold text-blue-400">
            {frigate.detectionsToday.vehicle}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <span className="text-[10px] uppercase text-slate-400">Packages</span>
          <div className="font-mono text-base font-bold text-amber-400">
            {frigate.detectionsToday.package}
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
        <span>Hardware: {frigate.hwAcceleration.split('+')[0]}</span>
        <span className="font-mono text-slate-300">TPU: {frigate.tpuTemperatureC}°C</span>
      </div>
    </div>
  );
};
