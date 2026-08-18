import React from 'react';
import {
  X,
  Camera,
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Eye,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { useHomelab } from '../../context/HomelabContext';
import { StatusBadge } from '../ui/StatusBadge';

export const LiveCameraModal: React.FC = () => {
  const { selectedCamera, setSelectedCamera } = useHomelab();
  const [muted, setMuted] = React.useState(true);

  if (!selectedCamera) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setSelectedCamera(null)}
    >
      <div
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/20 p-2 text-cyan-400">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-slate-100">{selectedCamera.name}</h3>
                <StatusBadge status={selectedCamera.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                {selectedCamera.location} • {selectedCamera.resolution} • {selectedCamera.fps} FPS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
              title={muted ? 'Unmute stream' : 'Mute stream'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setSelectedCamera(null)}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
              title="Close Stream"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Stream Main Video Display */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          <img
            src={selectedCamera.thumbnailUrl}
            alt={selectedCamera.name}
            className="h-full w-full object-cover"
          />

          {/* Top Live Timestamp overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-slate-950/80 px-3 py-1 font-mono text-xs backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-rose-300">LIVE FEED</span>
            <span className="text-slate-400">
              {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* Active AI Detections Floating Tags */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {selectedCamera.detections.map((det, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-slate-950/90 px-3 py-1 font-mono text-xs font-semibold text-cyan-300 shadow-lg backdrop-blur-md"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span className="capitalize">{det.type} Detected</span>
                <span className="text-slate-400">({det.confidencePct}% match)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Telemetry & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 bg-slate-950/60 p-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
            <span className="text-[10px] uppercase font-mono text-slate-400">Edge TPU Inference</span>
            <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
              7.2 ms latency (Coral USB)
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Model: mobilenet_ssd_v2_coco</p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
            <span className="text-[10px] uppercase font-mono text-slate-400">Recording Storage</span>
            <div className="mt-1 font-mono text-sm font-bold text-slate-200">
              24/7 Continuous + Motion Clips
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Retention: 30 Days (ZFS Pool)</p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                alert('Snapshot saved to local homelab gallery (/data/snapshots)');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Snapshot</span>
            </button>
            <button
              onClick={() => {
                setSelectedCamera(null);
              }}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
