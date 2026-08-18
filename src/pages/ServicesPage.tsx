import React, { useState } from 'react';
import { Grid, Search, ExternalLink, RotateCcw, Filter, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';

export const ServicesPage: React.FC = () => {
  const { services, dockerContainers, restartService, requestConfirmation } = useHomelab();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = ['ALL', 'Media', 'Smart Home', 'Security', 'Management', 'Database', 'Monitoring', 'Productivity'];

  const q = (search || '').toLowerCase().trim();

  const filteredServices = services.filter(srv => {
    const name = (srv.name || '').toLowerCase();
    const cat = (srv.category || '').toLowerCase();
    const host = (srv.hostNode || srv.host || '').toLowerCase();
    const url = (srv.url || '').toLowerCase();

    const matchSearch =
      q === '' ||
      name.includes(q) ||
      cat.includes(q) ||
      host.includes(q) ||
      url.includes(q);

    const matchCategory = categoryFilter === 'ALL' || cat === categoryFilter.toLowerCase();
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-400">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-bold text-white tracking-wide">Homelab Services Catalog</h2>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 uppercase">
                  {services.filter(s => s.status === 'Running').length}/{services.length} Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Self-hosted applications, docker containers, reverse proxies, and microservices
              </p>
            </div>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services by name, port, host..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Categories */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-800/80 pt-2.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredServices.map(srv => {
          const isRunning = srv.status === 'Running';
          return (
            <div
              key={srv.id}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0f172a] p-3.5 transition-all hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-emerald-400">
                      {srv.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-mono text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {srv.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">Port {srv.port}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      isRunning
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {srv.status}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Host Node:</span>
                    <span className="font-mono text-slate-300">{srv.hostNode || srv.host}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Category:</span>
                    <span className="text-slate-300">{srv.category}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Uptime:</span>
                    <span className="font-mono text-slate-300">{srv.uptime}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                <a
                  href={srv.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <span className="truncate max-w-[120px]">{srv.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>

                <button
                  onClick={() => restartService(srv.id)}
                  className="rounded-md border border-slate-800 bg-slate-950 p-1 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                  title="Restart Service"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
