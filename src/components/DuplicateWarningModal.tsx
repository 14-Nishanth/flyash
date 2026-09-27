import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  existingDetails?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  title = 'Duplicate Entry Detected',
  message,
  existingDetails,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 dark:border-amber-900/50 transform transition-all scale-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-2xl flex-shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {message}
            </p>

            {existingDetails && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-mono">
                {existingDetails}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Cancel & Edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition shadow-md shadow-amber-600/20 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
};
