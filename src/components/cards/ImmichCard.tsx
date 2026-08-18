import React from 'react';
import { Image, Video, Users, Database, Sparkles, HardDrive, ChevronRight } from 'lucide-react';
import { ImmichStats } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

export interface ImmichCardProps {
  immich: ImmichStats;
  onClick?: () => void;
}

export const ImmichCard: React.FC<ImmichCardProps> = ({ immich, onClick }) => {
  const gb = (immich.storageUsedBytes / (1024 * 1024 * 1024 * 1024)).toFixed(2);

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 backdrop-blur-md transition-all duration-200 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-950/20 cursor-pointer"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-400">
            <Image className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-slate-100">Immich Photo Suite</h3>
              <StatusBadge status={immich.status} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">AI Facial Recognition & Vector Search</p>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <span className="text-[10px] uppercase text-slate-400">Photos</span>
          <div className="font-mono text-lg font-bold text-slate-100">
            {immich.photosCount.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <span className="text-[10px] uppercase text-slate-400">Videos</span>
          <div className="font-mono text-lg font-bold text-slate-100">
            {immich.videosCount.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <span className="text-[10px] uppercase text-slate-400">Storage</span>
          <div className="font-mono text-lg font-bold text-indigo-400">{gb} TB</div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>ML: {immich.mlStatus}</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">{immich.lastBackup}</span>
      </div>
    </div>
  );
};
