import React from 'react';
import { Sparkles, X, Bot, Maximize2 } from 'lucide-react';
import { useHomelab } from '../../context/HomelabContext';
import { HermesChat } from './HermesChat';

export const HermesDrawer: React.FC = () => {
  const { isHermesDrawerOpen, setIsHermesDrawerOpen, setCurrentPage } = useHomelab();

  return (
    <>
      {/* Floating Bottom-Right Hermes Button */}
      <button
        id="hermes-floating-trigger"
        onClick={() => setIsHermesDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-cyan-600 to-blue-600 text-white shadow-2xl shadow-cyan-500/30 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50 active:scale-95 group"
        title="Open Hermes AI Assistant"
      >
        <div className="relative">
          <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
        </div>
      </button>

      {/* Slide-over Drawer Overlay */}
      {isHermesDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsHermesDrawerOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-slate-950 shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mono text-xs font-bold text-slate-100">Hermes AI Copilot</h3>
                  <span className="text-[10px] text-cyan-400">Context: Active View Telemetry</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setCurrentPage('hermes');
                    setIsHermesDrawerOpen(false);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  title="Expand to Full Workspace"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsHermesDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  title="Close Drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 overflow-hidden">
              <HermesChat embedded={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
