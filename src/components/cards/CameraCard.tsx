import React from 'react';
import { Camera, Eye, ShieldAlert, Sparkles, Video, Play } from 'lucide-react';
import { CameraStream } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

export interface CameraCardProps {
  camera: CameraStream;
  onOpenLive: () => void;
}

export const CameraCard: React.FC<CameraCardProps> = ({ camera, onOpenLive }) => {
  return (
    <div
      onClick={onOpenLive}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 transition-all duration-200 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20 cursor-pointer"
    >
      {/* Video Preview Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={camera.thumbnailUrl}
          alt={camera.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2 py-0.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono text-[10px] font-bold text-rose-300">REC</span>
            <span className="font-mono text-[10px] text-slate-400">| {camera.fps} FPS</span>
          </div>

          <StatusBadge status={camera.status} size="sm" />
        </div>

        {/* Play Overlay Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600/90 text-white shadow-lg shadow-cyan-600/40">
            <Play className="h-5 w-5 ml-0.5 fill-white" />
          </div>
        </div>

        {/* Detection Chips Overlay if active */}
        {camera.detections.length > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5">
            {camera.detections.map((det, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 rounded-md border border-cyan-500/40 bg-slate-950/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300 backdrop-blur-md"
              >
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span className="capitalize">{det.type}</span>
                <span>{det.confidencePct}%</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Camera Meta Bottom Bar */}
      <div className="flex items-center justify-between p-3">
        <div>
          <h4 className="font-mono text-xs font-bold text-slate-100 group-hover:text-cyan-300">
            {camera.name}
          </h4>
          <p className="text-[10px] text-slate-400">{camera.location}</p>
        </div>

        <div className="text-right">
          <span className="font-mono text-[10px] text-slate-400">{camera.resolution.split(' ')[0]}</span>
          <div className="text-[10px] text-slate-400">{camera.lastMotionTime}</div>
        </div>
      </div>
    </div>
  );
};
