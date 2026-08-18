import React, { useState } from 'react';
import {
  Home,
  Lightbulb,
  Lock,
  Unlock,
  Thermometer,
  Droplets,
  Power,
  Tv,
  Users,
  Shield,
  Sun
} from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';

export const SmartHomePage: React.FC = () => {
  const { smartHome, rooms, toggleLight, setClimateTemp, toggleLock } = useHomelab();
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');

  const displayedRooms = selectedRoomId === 'ALL' ? rooms : rooms.filter(r => r.id === selectedRoomId);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-lg font-bold text-slate-100">Home Assistant OS (HAOS)</h2>
                <StatusBadge status="Connected" size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                Core 2024.3.1 • Zigbee2MQTT & Z-Wave JS Mesh • {smartHome.totalDevices} Entities Tracked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">Lights Active:</span>{' '}
              <span className="font-bold text-amber-400">
                {smartHome.lightsOn} / {smartHome.lightsTotal}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2">
              <span className="text-slate-400">Perimeter:</span>{' '}
              <span className="font-bold text-emerald-400">
                {smartHome.doorsLocked ? 'All Locked' : 'Unlocked'}
              </span>
            </div>
          </div>
        </div>

        {/* Room Filter Bar */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setSelectedRoomId('ALL')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedRoomId === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Rooms ({rooms.length})
          </button>
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedRoomId === room.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{room.name}</span>
              <span className="font-mono text-[10px] text-slate-400">({room.temperatureC}°C)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Room-by-Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedRooms.map(room => (
          <div
            key={room.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md space-y-4"
          >
            {/* Room Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-mono text-sm font-bold text-slate-100">{room.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
                    {room.temperatureC}°C
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-blue-400" />
                    {room.humidityPct}% RH
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-950/60 px-2 py-1 text-xs font-mono">
                <Lightbulb className={`h-3.5 w-3.5 ${room.lightsActive > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                <span className="text-slate-200">{room.lightsActive} ON</span>
              </div>
            </div>

            {/* Devices in this Room */}
            <div className="space-y-2.5">
              {room.devices.map(device => {
                if (device.domain === 'light') {
                  const isOn = Boolean(device.state);
                  return (
                    <div
                      key={device.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                        isOn
                          ? 'border-amber-500/30 bg-amber-950/20'
                          : 'border-slate-800/80 bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`rounded-lg p-2 ${
                            isOn ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-200">{device.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {isOn ? `Brightness: ${device.attributes.brightness || 75}%` : 'Turned off'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleLight(room.id, device.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                          isOn
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {isOn ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  );
                }

                if (device.domain === 'climate') {
                  const currentTemp = device.attributes.currentTemperature || room.temperatureC;
                  const targetTemp = device.attributes.targetTemperature || 21.5;

                  return (
                    <div
                      key={device.id}
                      className="rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-cyan-400" />
                          <span className="font-mono text-xs font-bold text-slate-200">{device.name}</span>
                        </div>
                        <span className="font-mono text-xs text-cyan-300 font-bold">{targetTemp}°C</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">Set Target Temp:</span>
                        <div className="flex items-center gap-2 font-mono">
                          <button
                            onClick={() => setClimateTemp(room.id, device.id, +(targetTemp - 0.5).toFixed(1))}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-slate-100">{targetTemp}°C</span>
                          <button
                            onClick={() => setClimateTemp(room.id, device.id, +(targetTemp + 0.5).toFixed(1))}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (device.domain === 'lock') {
                  const isLocked = device.attributes.locked ?? true;
                  return (
                    <div
                      key={device.id}
                      className={`flex items-center justify-between rounded-xl border p-3 ${
                        isLocked
                          ? 'border-emerald-500/30 bg-emerald-950/20'
                          : 'border-amber-500/30 bg-amber-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`rounded-lg p-2 ${
                            isLocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-200">{device.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {isLocked ? 'Locked & Secured' : 'Unlocked (Door Open)'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleLock(room.id, device.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                          isLocked
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-amber-600 text-slate-950 font-bold'
                        }`}
                      >
                        {isLocked ? 'LOCKED' : 'UNLOCKED'}
                      </button>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
