import React from 'react';
import {
  Wifi,
  ArrowDown,
  ArrowUp,
  Activity,
  Radio,
  Globe,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StarlinkTelemetry } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

export interface InternetCardProps {
  telemetry: StarlinkTelemetry;
  onClick?: () => void;
}

export const InternetCard: React.FC<InternetCardProps> = ({ telemetry, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/20 p-5 backdrop-blur-md transition-all duration-200 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20 cursor-pointer"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-cyan-500/20 p-2 text-cyan-400">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-slate-100">Internet Uplink (Starlink)</h3>
              <StatusBadge status={telemetry.status} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">{telemetry.deviceModel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {telemetry.uptimePct}% Uptime
          </span>
          <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
        </div>
      </div>

      {/* Main Speeds Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Download */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
            <span>Download</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-100">
              {telemetry.downloadMbps}
            </span>
            <span className="font-mono text-[10px] text-slate-400">Mbps</span>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Upload</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-100">
              {telemetry.uploadMbps}
            </span>
            <span className="font-mono text-[10px] text-slate-400">Mbps</span>
          </div>
        </div>

        {/* Latency */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Latency</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-100">
              {telemetry.latencyMs}
            </span>
            <span className="font-mono text-[10px] text-slate-400">ms (±3ms)</span>
          </div>
        </div>

        {/* Packet Loss */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Packet Loss</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-100">
              {telemetry.packetLossPct}%
            </span>
            <span className="font-mono text-[10px] text-emerald-400">Optimal</span>
          </div>
        </div>
      </div>

      {/* Real-time Bandwidth & Latency Sparkline Graph */}
      <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-mono font-medium text-slate-400">Live Traffic & Latency History (24h)</span>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Download (Mbps)
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Latency (ms)
            </span>
          </div>
        </div>

        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetry.latencyHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="download" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorDl)" />
              <Area type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
        <div>
          IP: <span className="font-mono text-slate-300">{telemetry.publicIp}</span>
        </div>
        <div>
          Dish Temp: <span className="font-mono text-slate-300">{telemetry.dishTemperatureC}°C</span>
        </div>
        <div>
          DNS: <span className="font-mono text-slate-300">{telemetry.dnsStatus.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
};
