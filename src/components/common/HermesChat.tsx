import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, AlertTriangle, PlugZap } from 'lucide-react';
import type { HermesChatResponseDto } from '@shared/api';
import { useHomelab } from '../../context/HomelabContext';
import { apiPost } from '../../services/api/client';
import type { HermesMessage } from '../../types';

export interface HermesChatProps {
  embedded?: boolean;
}

/**
 * Hermes chat.
 *
 * Every turn shown here came from the Hermes upstream through
 * POST /api/hermes/chat. When Hermes is not configured the composer is disabled
 * and the panel says so; it does not answer on Hermes' behalf, which is exactly
 * what the previous implementation did (it shipped hand-written replies about
 * cameras, TPU temperatures and a 12 TB pool that do not exist).
 */
export const HermesChat: React.FC<HermesChatProps> = ({ embedded = false }) => {
  const { hermes } = useHomelab();
  const [messages, setMessages] = useState<HermesMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const available = hermes.phase === 'ok' && hermes.data?.enabled === true;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending || !available) return;

    const now = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${now.getTime()}`,
        sender: 'user',
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text,
      },
    ]);
    setInput('');
    setIsSending(true);

    const result = await apiPost<{ data: HermesChatResponseDto | null; error: { message: string } | null }>(
      '/hermes/chat',
      { message: text },
    );

    const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (result.ok && result.data?.data) {
      setMessages((prev) => [
        ...prev,
        { id: `h-${Date.now()}`, sender: 'hermes', timestamp: stamp, text: result.data!.data!.reply },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          sender: 'system',
          timestamp: stamp,
          isError: true,
          text:
            result.errorMessage ??
            'Hermes no devolvió una respuesta. No se muestra ningún contenido generado localmente.',
        },
      ]);
    }
    setIsSending(false);
  };

  return (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-[calc(100vh-8rem)]'} bg-slate-950/60`}>
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-100">Hermes</span>
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                  available
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-700 bg-slate-800/70 text-slate-400'
                }`}
              >
                {available ? 'CONECTADO' : 'NO CONFIGURADO'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {available
                ? `Vía backend NUGA HOME${hermes.data?.version ? ` · v${hermes.data.version}` : ''}`
                : 'Hermes API no configurada'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {!available && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
            <div className="rounded-2xl bg-slate-950/70 p-3 text-slate-400">
              <PlugZap className="h-6 w-6" />
            </div>
            <h3 className="font-mono text-sm font-bold text-slate-100">Hermes API no configurada</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              El agente Hermes vive en VM110 pero todavía no está conectado a este dashboard.
              Mientras <span className="font-mono text-slate-300">HERMES_ENABLED</span> siga en{' '}
              <span className="font-mono text-slate-300">false</span> no se envía ninguna consulta y
              tampoco se genera ninguna respuesta simulada.
            </p>
            <div className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-left font-mono text-[11px] leading-relaxed text-slate-500">
              HERMES_ENABLED=true
              <br />
              HERMES_API_URL=http://&lt;host&gt;:&lt;port&gt;
              <br />
              HERMES_API_KEY=…
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSystem = msg.sender === 'system';

          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    isSystem
                      ? 'border-rose-500/30 bg-rose-950/40 text-rose-300'
                      : 'border-cyan-500/30 bg-cyan-950 text-cyan-300'
                  }`}
                >
                  {isSystem ? <AlertTriangle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
              )}

              <div className="max-w-[85%] space-y-2.5 sm:max-w-[75%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'rounded-br-none bg-cyan-600 text-white shadow-md'
                      : isSystem
                        ? 'rounded-bl-none border border-rose-500/30 bg-rose-950/20 text-rose-200'
                        : 'rounded-bl-none border border-slate-800 bg-slate-900/90 text-slate-200 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <div className={`text-[10px] text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950 text-cyan-300">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-400">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/90 p-3 sm:p-4"
      >
        <input
          type="text"
          value={input}
          disabled={!available}
          onChange={(e) => setInput(e.target.value)}
          placeholder={available ? 'Pregunta a Hermes…' : 'Hermes API no configurada'}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!available || !input.trim() || isSending}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20 transition-all hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
