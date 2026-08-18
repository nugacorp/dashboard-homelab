import React from 'react';

export interface StatusBadgeProps {
  status?: string | boolean | null;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'online', size = 'md', showPulse = true }) => {
  const displayStatus = typeof status === 'boolean' ? (status ? 'Online' : 'Offline') : String(status || 'online');
  const normalized = displayStatus.toLowerCase();

  let dotColor = 'bg-emerald-400';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  let pulseColor = 'bg-emerald-400';

  if (['running', 'online', 'healthy', 'active', 'connected', 'passed', 'excellent'].includes(normalized)) {
    dotColor = 'bg-emerald-400';
    badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    pulseColor = 'bg-emerald-400';
  } else if (['warning', 'degraded', 'heating', 'searching', 'good'].includes(normalized)) {
    dotColor = 'bg-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    pulseColor = 'bg-amber-400';
  } else if (['critical', 'offline', 'error', 'failed', 'faulted', 'poor'].includes(normalized)) {
    dotColor = 'bg-rose-400';
    badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
    pulseColor = 'bg-rose-400';
  } else if (['stopped', 'paused', 'exited', 'stowed', 'disarmed', 'not configured'].includes(normalized)) {
    dotColor = 'bg-slate-400';
    badgeBg = 'bg-slate-800/60 border-slate-700/60 text-slate-300';
    pulseColor = 'bg-slate-400';
  } else if (['motion', 'info', 'information'].includes(normalized)) {
    dotColor = 'bg-cyan-400';
    badgeBg = 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
    pulseColor = 'bg-cyan-400';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium'
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono tracking-tight font-medium ${badgeBg} ${sizeClasses}`}
    >
      <span className="relative flex">
        {showPulse && !['stopped', 'paused', 'exited', 'stowed', 'disarmed', 'not configured'].includes(normalized) && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full ${dotColor} ${dotSize}`} />
      </span>
      <span className="capitalize">{displayStatus}</span>
    </span>
  );
};
