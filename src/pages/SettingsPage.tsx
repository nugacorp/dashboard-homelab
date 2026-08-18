import React from 'react';
import { Settings, ShieldCheck, Key, RefreshCw, Database, Server, Radio, Power } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';

export const SettingsPage: React.FC = () => {
  const { integrations, demoMode, setDemoMode } = useHomelab();

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-400">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-sm font-bold text-white tracking-wide">Settings & API Gateway</h2>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 uppercase">
                Zero-Trust Configured
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Manage API tokens, upstream endpoints, background polling intervals, and safety guardrails
            </p>
          </div>
        </div>
      </div>

      {/* Demo Mode Toggle */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-xs font-bold text-white">Live Telemetry Simulation (Demo Mode)</div>
          <p className="text-[11px] text-slate-400">
            Simulates realistic fluctuating network throughput, Starlink satellite pings, and Proxmox node temperatures.
          </p>
        </div>
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-all ${
            demoMode
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          {demoMode ? 'ENABLED (3.5s Poll)' : 'PAUSED'}
        </button>
      </div>

      {/* Integrations Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-2.5 font-mono text-xs font-bold text-white">
          Configured Homelab API Endpoints
        </div>

        <div className="divide-y divide-slate-800">
          {integrations.map(int => (
            <div key={int.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">{int.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                      int.status === 'connected'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {int.status}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-400">{int.endpoint}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-mono">Sync: {int.syncIntervalSeconds}s</span>
                <button
                  onClick={() => alert(`Re-testing connection to ${int.name}...`)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Test Link
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
