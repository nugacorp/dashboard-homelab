import React, { useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';

export const AlertsPage: React.FC = () => {
  const { alerts, acknowledgeAlert, resolveAlert } = useHomelab();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ACTIVE') return a.status !== 'resolved';
    if (filter === 'RESOLVED') return a.status === 'resolved';
    return true;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-rose-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-bold text-white tracking-wide">Central NOC Alert Manager</h2>
                <span className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-400 uppercase">
                  {alerts.filter(a => a.status !== 'resolved').length} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real-time incident notifications, automated telemetry thresholds, and resolution audit log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors ${
                  filter === f
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2.5">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center text-xs text-slate-400">
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
            No alerts match this filter. All homelab subsystems nominal.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const isResolved = alert.status === 'resolved';

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  isResolved
                    ? 'border-slate-800/60 bg-[#0f172a]/50 opacity-60'
                    : isCritical
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : 'border-amber-500/30 bg-amber-950/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-md p-1.5 mt-0.5 ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {isCritical ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{alert.source}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-400'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">{alert.message}</p>
                    </div>
                  </div>

                  {!isResolved && (
                    <div className="flex items-center gap-2">
                      {alert.status === 'active' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="rounded-md bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600/30"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
