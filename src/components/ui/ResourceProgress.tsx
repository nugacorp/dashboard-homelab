import React from 'react';

export interface ResourceProgressProps {
  label: string;
  percentage: number;
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
  customColor
}) => {
  const clampedPct = Math.min(100, Math.max(0, percentage));

  // Determine threshold color
  let barColor = customColor || 'bg-emerald-500';
  if (!customColor) {
    if (clampedPct >= 90) {
      barColor = 'bg-rose-500';
    } else if (clampedPct >= 75) {
      barColor = 'bg-amber-500';
    } else {
      barColor = 'bg-cyan-500';
    }
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
            <span className="font-semibold text-slate-200">{Math.round(clampedPct)}%</span>
          )}
        </div>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-slate-800/80 ${heightClass}`}>
        <div
          className={`${barColor} ${heightClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
    </div>
  );
};
