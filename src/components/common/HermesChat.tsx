import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Server,
  HardDrive,
  Camera,
  Activity,
  Layers
} from 'lucide-react';
import { useHomelab } from '../../context/HomelabContext';
import { HermesMessage } from '../../types';

export interface HermesChatProps {
  embedded?: boolean;
}

export const HermesChat: React.FC<HermesChatProps> = ({ embedded = false }) => {
  const {
    hermesMessages,
    sendHermesMessage,
    executeHermesAction,
    cluster,
    nodes,
    starlink,
    cameras,
    storagePool,
    services
  } = useHomelab();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [hermesMessages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    setIsTyping(true);
    await sendHermesMessage(text);
    setIsTyping(false);
  };

  const samplePrompts = [
    'What is wrong with the homelab?',
    'Which node is using the most RAM?',
    'Are all cameras online?',
    'How much storage is available?',
    'Why is Internet latency high?',
    'Restart Immich'
  ];

  return (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-[calc(100vh-8rem)]'} bg-slate-950/60`}>
      {/* Header Info Banner */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-100">Hermes AI Assistant</span>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                Read-Only Safe Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Live homelab infrastructure copilot & telemetry diagnostics</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Synced with 3 Nodes</span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {hermesMessages.map(msg => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2.5`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                      : 'border border-slate-800 bg-slate-900/90 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Structured Context Diagnostic Card if present */}
                {msg.contextCard && (
                  <div className="rounded-xl border border-cyan-500/20 bg-slate-900/90 p-3 shadow-lg">
                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs font-semibold text-cyan-300">
                      <Activity className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{msg.contextCard.title}</span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(msg.contextCard.data).map(([key, val]) => (
                        <div key={key} className="rounded-lg bg-slate-950/60 p-2 text-[11px]">
                          <span className="text-slate-400">{key}:</span>{' '}
                          <span className="font-mono font-bold text-slate-200">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proposed Destructive / Administrative Action Card */}
                {msg.proposedAction && (
                  <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 p-4 shadow-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span>Administrative Action Proposal</span>
                    </div>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-400">Action:</span>{' '}
                        <span className="font-mono font-semibold text-white">{msg.proposedAction.action}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Impact:</span>{' '}
                        <span className="text-amber-200/90">{msg.proposedAction.impact}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
                      {msg.proposedAction.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              // dismiss
                            }}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => executeHermesAction(msg.id, msg.proposedAction!.id)}
                            className="flex items-center gap-1 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Authorize & Execute</span>
                          </button>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 font-mono text-xs font-semibold text-emerald-400">
                          <Check className="h-4 w-4" /> Action Executed Successfully
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className={`text-[10px] text-slate-400 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-400">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="shrink-0 font-mono text-[10px] text-slate-500 uppercase">Suggested:</span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                sendHermesMessage(prompt);
              }}
              className="shrink-0 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/90 p-3 sm:p-4"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Hermes anything about your homelab, servers, or devices..."
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20 transition-all hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
