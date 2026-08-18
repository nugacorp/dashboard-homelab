import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';

/**
 * Local login. Credentials are posted to /api/auth/login and the server replies
 * with an HttpOnly cookie; nothing sensitive is ever kept in JS state.
 */
export const LoginPage: React.FC = () => {
  const { login } = useHomelab();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await login(username, password);
    if (!result.ok) setError(result.message);
    setBusy(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#020617] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-600/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <div className="font-mono text-lg font-extrabold tracking-wider text-slate-50">NUGA HOME</div>
            <div className="text-[11px] font-medium tracking-tight text-cyan-400">Command Center</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md"
        >
          <div className="space-y-1.5">
            <label htmlFor="username" className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-950/20 px-3 py-2 text-[11px] text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !username || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition-all hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Entrar</span>
          </button>
        </form>

        <p className="mt-4 text-center font-mono text-[10px] leading-relaxed text-slate-600">
          Acceso local. Las credenciales se validan en el backend y la sesión viaja
          en una cookie HttpOnly.
        </p>
      </div>
    </div>
  );
};
