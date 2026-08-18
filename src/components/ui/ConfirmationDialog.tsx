import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useHomelab } from '../../context/HomelabContext';

export const ConfirmationDialog: React.FC = () => {
  const { confirmationModal, closeConfirmation } = useHomelab();

  if (!confirmationModal.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={closeConfirmation}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/30 bg-slate-900 shadow-2xl shadow-rose-950/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 bg-rose-500/10 p-4 text-rose-300">
          <div className="rounded-lg bg-rose-500/20 p-2 text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-mono text-base font-bold text-slate-100">{confirmationModal.title}</h3>
            <p className="text-xs text-rose-300/80">Safety Authorization Guardrail Active</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Action</span>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 font-mono text-sm font-semibold text-slate-200">
              {confirmationModal.action}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Resource</span>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-sm text-slate-300">
              {confirmationModal.resource}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Operational Impact</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed">{confirmationModal.impact}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/40 p-4">
          <button
            type="button"
            onClick={closeConfirmation}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              confirmationModal.onConfirm();
            }}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-500 active:scale-95"
          >
            Confirm & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
