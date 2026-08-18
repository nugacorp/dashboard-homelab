import React, { useState } from 'react';
import { ShieldCheck, ChevronRight, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface HealthIndicatorProps {
  score: number;
  homeStatus: 'Healthy' | 'Warning' | 'Critical';
  statusText: string;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({ score, homeStatus, statusText }) => {
  const [showModal, setShowModal] = useState(false);

  const subsystems = [
    { name: 'Starlink Internet', status: 'Healthy', score: 99, notes: 'Online at 245 Mbps, 32ms latency' },
    { name: 'Proxmox 3-Node Cluster', status: 'Warning', score: 96, notes: 'Node 02 memory at 66.8% (Frigate/Plex buffers)' },
    { name: 'UniFi Network SDN', status: 'Healthy', score: 100, notes: '42 clients, 99% WiFi Experience' },
    { name: 'Home Assistant & IoT', status: 'Healthy', score: 98, notes: '8 lights on, doors secured, sensors active' },
    { name: 'Security Cameras & Frigate', status: 'Healthy', score: 100, notes: '8/8 streams recording, TPU 7.2ms' },
    { name: 'ZFS Storage & Immich', status: 'Healthy', score: 97, notes: '5.6 TB free (53% used), SMART passed' },
    { name: 'Nightly Backups', status: 'Healthy', score: 100, notes: 'PBS & TrueNAS syncs completed on schedule' },
    { name: 'Homelab Services', status: 'Healthy', score: 98, notes: '32/32 containers and daemons running' }
  ];

  const circumference = 2 * Math.PI * 34; // r = 34
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 p-4 backdrop-blur-md transition-all duration-200 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Home Infrastructure Health
            </span>
            <Info className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-emerald-400" />
          </div>
          <StatusBadge status={homeStatus} size="sm" />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-slate-50">{score}%</span>
              <span className="font-mono text-xs font-medium text-emerald-400">Score</span>
            </div>
            <p className="text-xs text-slate-400">{statusText}</p>
          </div>

          {/* Radial Circular Progress Gauge */}
          <div className="relative flex h-18 w-18 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-1000 ease-out"
                fill="transparent"
              />
            </svg>
            <ShieldCheck className="absolute h-6 w-6 text-emerald-400" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
          <span>8 Subsystems Evaluated</span>
          <span className="flex items-center gap-0.5 text-emerald-400 group-hover:underline">
            View breakdown <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Breakdown Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-mono text-lg font-bold text-slate-100">Infrastructure Health Audit</h3>
                <p className="text-xs text-slate-400">Calculated across telemetry, hardware, and service states</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-emerald-400">{score}%</span>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {subsystems.map((sub, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between rounded-xl border border-slate-800/70 bg-slate-950/40 p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {sub.status === 'Healthy' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-sm font-semibold text-slate-200">{sub.name}</span>
                    </div>
                    <p className="text-xs text-slate-400">{sub.notes}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-slate-100">{sub.score}%</span>
                    <div className="mt-0.5">
                      <StatusBadge status={sub.status} size="sm" showPulse={false} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
