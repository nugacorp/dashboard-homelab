import React from 'react';
import { NOT_AVAILABLE } from '../../lib/format';

export interface ResourceProgressProps {
  label: string;
  /**
   * 0-100, or null when the upstream did not report the value. A null renders
   * an empty track and "n/d" — never a 0% bar, which would read as "idle".
   */
  percentage: number | null;
  usedText?: string;
  totalText?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
  customColor?: string;
}

export const ResourceProgress: React.FC<ResourceProgressProps> = ({
  label,
  percentage,
  usedText,
  totalText,
  showPercentage = true,
  size = 'md',
  customColor,
}) => {
  const unknown = percentage === null || !Number.isFinite(percentage);
  const clampedPct = unknown ? 0 : Math.min(100, Math.max(0, percentage));

  let barColor = customColor ?? 'bg-cyan-500';
  if (!customColor) {
    if (clampedPct >= 90) barColor = 'bg-rose-500';
    else if (clampedPct >= 75) barColor = 'bg-amber-500';
    else barColor = 'bg-cyan-500';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <div className="flex items-center gap-1.5 font-mono">
          {usedText && (
            <span className="text-slate-400">
              {usedText}
              {totalText && ` / ${totalText}`}
            </span>
          )}
          {showPercentage && (
            <span className={unknown ? 'text-slate-600' : 'font-semibold text-slate-200'}>
              {unknown ? NOT_AVAILABLE : `${Math.round(clampedPct)}%`}
            </span>
          )}
        </div>
      </div>
      <div
        className={`w-full overflow-hidden rounded-full ${heightClass} ${
          unknown ? 'bg-slate-800/40' : 'bg-slate-800/80'
        }`}
      >
        {!unknown && (
          <div
            className={`${barColor} ${heightClass} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${clampedPct}%` }}
          />
        )}
      </div>
    </div>
  );
};
