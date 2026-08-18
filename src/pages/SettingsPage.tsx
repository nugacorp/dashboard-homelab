import React from 'react';
import { Settings, ShieldCheck, ShieldAlert, LogOut, RefreshCw, KeyRound, Info } from 'lucide-react';
import type { IntegrationKey } from '@shared/api';
import { useHomelab } from '../context/HomelabContext';
import { formatRelative } from '../lib/format';

/**
 * Settings.
 *
 * Read-only on purpose. Configuration lives in the backend environment, not in
 * the browser, so there is nothing here to edit and no token to display - not
 * even masked. The old page rendered eight "Connected" integrations with fake
 * masked tokens and a demo-mode switch; both are gone.
 */

const ENV_VARS: Record<IntegrationKey, string[]> = {
  proxmox: ['PVE_API_URL', 'PVE_TOKEN_ID', 'PVE_TOKEN_SECRET', 'PVE_CA_CERT_PATH', 'PVE_TLS_SERVERNAME'],
  homeAssistant: ['HASS_URL', 'HASS_TOKEN'],
  hermes: ['HERMES_ENABLED', 'HERMES_API_URL', 'HERMES_API_KEY'],
  uptimeKuma: ['UPTIME_KUMA_URL'],
};

const LABELS: Record<IntegrationKey, string> = {
  proxmox: 'Proxmox VE',
  homeAssistant: 'Home Assistant',
  hermes: 'Hermes',
  uptimeKuma: 'Uptime Kuma',
};

const STATE_CLASS: Record<string, string> = {
  ok: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  unavailable: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
  not_configured: 'border-slate-700 bg-slate-800/70 text-slate-400',
  disabled: 'border-slate-700 bg-slate-800/70 text-slate-400',
};

export const SettingsPage: React.FC = () => {
  const { ready, session, logout } = useHomelab();
  const integrations = ready.data?.integrations;

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold tracking-wide text-white">Ajustes</h2>
            <p className="text-[11px] text-slate-400">
              La configuración se define en el entorno del backend. Esta vista solo la refleja.
            </p>
          </div>
        </div>
      </div>

      {/* Session */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-lg border p-2 ${
                session.authRequired
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
              }`}
            >
              {session.authRequired ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="font-mono text-xs font-bold text-white">
                {session.authRequired ? 'Autenticación activa' : 'Autenticación desactivada'}
              </div>
              <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-400">
                {session.authRequired ? (
                  <>
                    Sesión iniciada como{' '}
                    <span className="font-mono text-slate-200">{session.username}</span>. La cookie
                    es HttpOnly con SameSite=Lax y está firmada con SESSION_SECRET.
                  </>
                ) : (
                  <>
                    No hay credenciales configuradas, así que el dashboard es accesible para
                    cualquiera que alcance el puerto. Define{' '}
                    <span className="font-mono text-slate-300">DASHBOARD_USERNAME</span>,{' '}
                    <span className="font-mono text-slate-300">DASHBOARD_PASSWORD_HASH</span> y{' '}
                    <span className="font-mono text-slate-300">SESSION_SECRET</span> antes de
                    exponerlo fuera de la LAN.
                  </>
                )}
              </p>
            </div>
          </div>

          {session.authRequired && (
            <button
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>

        {!session.authRequired && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
            <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
            <code className="font-mono text-[11px] leading-relaxed text-slate-400">
              npm run hash-password -- &apos;tu-contraseña&apos;
              <br />
              openssl rand -base64 48 &nbsp;# SESSION_SECRET
            </code>
          </div>
        )}
      </div>

      {/* Integrations */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a]">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2.5">
          <span className="font-mono text-xs font-bold text-white">Integraciones</span>
          <button
            onClick={ready.refresh}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reprobar</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {(Object.keys(LABELS) as IntegrationKey[]).map((key) => {
            const health = integrations?.[key];
            const state = health?.state ?? 'not_configured';
            return (
              <div key={key} className="flex flex-wrap items-start justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{LABELS[key]}</span>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${STATE_CLASS[state]}`}
                    >
                      {state.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {health?.detail ?? 'Sin datos de sondeo.'}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {ENV_VARS[key].map((name) => (
                      <span
                        key={name}
                        className="rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-500"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="shrink-0 font-mono text-[10px] text-slate-600">
                  {health?.checkedAt ? formatRelative(health.checkedAt) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <div>
          <h3 className="font-mono text-xs font-bold text-slate-200">
            Por qué no se muestra ningún token
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Los secretos existen únicamente en el proceso del backend. Ni siquiera enmascarados
            viajan al navegador: un token parcial sigue siendo información sobre el token. Para
            cambiarlos, edita el archivo de entorno en VM120 y reinicia el contenedor.
          </p>
        </div>
      </div>
    </div>
  );
};
