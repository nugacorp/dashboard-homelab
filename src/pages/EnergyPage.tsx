import React from 'react';
import { Zap, Battery, Sun, DollarSign, Activity, Thermometer, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useHomelab } from '../context/HomelabContext';

export const EnergyPage: React.FC = () => {
  const { energy } = useHomelab();

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-bold text-white tracking-wide">Rack Power & Smart Energy Grid</h2>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 uppercase">
                  APC Smart-UPS 1500VA Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live metering from Shelly EM Pro & APC Smart-UPS battery backup unit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live Power Draw</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white leading-none mt-1">
            {energy.currentDrawWatts} <span className="text-xs font-normal text-slate-400">W</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Baseline: 640W</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">UPS Battery State</span>
            <Battery className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white leading-none mt-1">
            {energy.upsBatteryPct}%
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">{energy.upsRuntimeMinutes} min runtime on outage</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Monthly</span>
            <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white leading-none mt-1">
            ${energy.costEstimatedPerMonth}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">@ $0.14 / kWh tier</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Rack Ambient Temp</span>
            <Thermometer className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white leading-none mt-1">
            {energy.ambientTempC}°C
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">Exhaust Fans: 42% PWM</div>
        </div>
      </div>

      {/* 24-Hour Power Draw Chart */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            24-Hour Homelab Power History (Watts)
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Live Power Draw
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={energy.dailyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#030712',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                  fontSize: '11px'
                }}
              />
              <Area type="monotone" dataKey="watts" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
