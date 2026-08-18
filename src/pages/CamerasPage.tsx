import React, { useState } from 'react';
import { Camera, Sparkles, Eye, ShieldAlert, Cpu, Filter, Search } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { CameraCard } from '../components/cards/CameraCard';
import { FrigateCard } from '../components/cards/FrigateCard';
import { StatusBadge } from '../components/ui/StatusBadge';

export const CamerasPage: React.FC = () => {
  const { cameras, frigate, setSelectedCamera } = useHomelab();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredCameras = cameras.filter(cam => {
    const matchSearch =
      cam.name.toLowerCase().includes(search.toLowerCase()) ||
      cam.location.toLowerCase().includes(search.toLowerCase());

    if (filter === 'ALL') return matchSearch;
    if (filter === 'MOTION') return matchSearch && cam.detections.length > 0;
    if (filter === 'RECORDING') return matchSearch && cam.status === 'recording';
    return matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Frigate NVR Telemetry */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-lg font-bold text-slate-100">Security Cameras & NVR Matrix</h2>
                  <StatusBadge status="8/8 Active" size="sm" />
                </div>
                <p className="text-xs text-slate-400">
                  Frigate 0.13.2 • Google Coral Edge TPU USB Accelerator • 24/7 RTSP/WebRTC Streams
                </p>
              </div>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search camera streams..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800/80 pt-3">
            {['ALL', 'MOTION', 'RECORDING'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold transition-all ${
                  filter === f
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f === 'ALL' ? `All Cameras (${cameras.length})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* Frigate Coral Edge Card */}
        <FrigateCard frigate={frigate} />
      </div>

      {/* 8-Camera Live Matrix Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredCameras.map(cam => (
          <CameraCard
            key={cam.id}
            camera={cam}
            onOpenLive={() => setSelectedCamera(cam)}
          />
        ))}
      </div>
    </div>
  );
};
