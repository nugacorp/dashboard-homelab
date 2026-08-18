import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  ArrowDown,
  ArrowUp,
  Activity,
  Compass,
  Thermometer,
  CloudSnow,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';

export const StarlinkPage: React.FC = () => {
  const { starlink, requestConfirmation } = useHomelab();
  const [snowMelt, setSnowMelt] = useState<boolean>(starlink.snowMeltActive);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-lg font-bold text-slate-100">Starlink Telemetry & Dishy Ops</h2>
                <StatusBadge status={starlink.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                {starlink.deviceModel} • Firmware: {starlink.firmwareVersion} • IP: {starlink.publicIp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                requestConfirmation({
                  title: 'Reboot Starlink Dishy',
                  action: 'Restart Starlink Satellite Terminal',
                  resource: `${starlink.deviceModel} (Dishy V3)`,
                  impact: 'WAN internet uplink will disconnect for 2 to 3 minutes during satellite realignment.',
                  onConfirm: () => alert('Starlink reboot instruction sent to terminal.')
                })
              }
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reboot Dishy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowDown className="h-4 w-4 text-cyan-400" />
            <span>Download Speed</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-100">
            {starlink.downloadMbps} <span className="text-xs font-normal text-slate-400">Mbps</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUp className="h-4 w-4 text-blue-400" />
            <span>Upload Speed</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-100">
            {starlink.uploadMbps} <span className="text-xs font-normal text-slate-400">Mbps</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Latency</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-100">
            {starlink.latencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Compass className="h-4 w-4 text-amber-400" />
            <span>Azimuth / Elevation</span>
          </div>
          <div className="mt-2 font-mono text-base font-bold text-slate-100">
            {starlink.azimuthDeg}° / {starlink.elevationDeg}°
          </div>
        </div>
      </div>

      {/* Latency and Download Graph */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Starlink Satellite Telemetry (Last 24 Hours)
          </h3>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Download (Mbps)
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Latency (ms)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={starlink.latencyHistory} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStarlinkDl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorStarlinkLat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="download" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorStarlinkDl)" />
              <Area type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorStarlinkLat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Obstruction Level</span>
            <span className="font-mono font-bold text-emerald-400">
              {starlink.obstructionPct}% (Clear View of Sky)
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Dish Surface Temp</span>
            <span className="font-mono font-bold text-slate-200">
              {starlink.dishTemperatureC}°C
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudSnow className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-300 font-medium">Automatic Snow Melt</span>
            </div>
            <button
              onClick={() => setSnowMelt(!snowMelt)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-bold transition-colors ${
                snowMelt ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {snowMelt ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
