import React, { useState } from 'react';
import { Terminal, Search, Filter, ShieldCheck, Download, Trash2 } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';

export const LogsPage: React.FC = () => {
  const { logs } = useHomelab();
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  const services = ['ALL', 'Corosync', 'Proxmox VE', 'UniFi Network', 'Frigate NVR', 'Immich Server', 'Home Assistant'];

  const q = (search || '').toLowerCase().trim();

  const filteredLogs = logs.filter(l => {
    const msg = (l.message || '').toLowerCase();
    const srv = (l.service || '').toLowerCase();
    const matchSearch =
      q === '' ||
      msg.includes(q) ||
      srv.includes(q);
    const matchService = serviceFilter === 'ALL' || srv === serviceFilter.toLowerCase();
    return matchSearch && matchService;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2 text-indigo-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-bold text-white tracking-wide">Central System Syslog & Journald</h2>
                <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-400 uppercase">
                  Vector Aggregator Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Unified live event stream across PVE hosts, kernel rings, containers, and services
              </p>
            </div>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter journald logs..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-800/80 pt-2.5">
          {services.map(srv => (
            <button
              key={srv}
              onClick={() => setServiceFilter(srv)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                serviceFilter === srv
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {srv}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View */}
      <div className="rounded-xl border border-slate-800 bg-black font-mono text-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Streaming /var/log/syslog (100% Real-time)</span>
          </div>
          <span>Showing {filteredLogs.length} events</span>
        </div>

        <div className="p-3 space-y-1.5 max-h-[600px] overflow-y-auto">
          {filteredLogs.map(log => {
            const isWarn = log.level === 'warn';
            const isError = log.level === 'error';
            return (
              <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/60 px-1 py-0.5 rounded">
                <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
                <span
                  className={`px-1 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 ${
                    isError
                      ? 'bg-rose-500/20 text-rose-400'
                      : isWarn
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-indigo-400 shrink-0 font-bold text-[11px]">[{log.service}]</span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
