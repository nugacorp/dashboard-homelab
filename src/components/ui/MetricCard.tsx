import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  iconColor = 'text-cyan-400',
  trend,
  badge,
  onClick,
  className = ''
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-200 hover:border-slate-700/80 hover:bg-slate-900/90 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        <div className="flex items-center gap-2">
          {badge}
          {Icon && (
            <div className={`rounded-lg bg-slate-800/70 p-1.5 ${iconColor}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-bold tracking-tight text-slate-50">{value}</span>
        {unit && <span className="font-mono text-xs font-medium text-slate-400">{unit}</span>}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono font-medium ${
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
