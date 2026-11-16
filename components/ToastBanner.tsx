'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';

export function ToastBanner() {
  const { toast, dismissToast } = useFocus();

  if (!toast) return null;

  const Icon =
    toast.tone === 'error' ? AlertCircle : toast.tone === 'info' ? Info : CheckCircle2;

  const toneClasses =
    toast.tone === 'error'
      ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
      : toast.tone === 'info'
        ? 'bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
        : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/70 text-slate-900 dark:text-slate-100';

  const iconTone =
    toast.tone === 'error'
      ? 'text-red-600 dark:text-red-400'
      : toast.tone === 'info'
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-200 ${toneClasses}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconTone}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold tracking-tight">{toast.title}</p>
        <p className="text-sm opacity-90 leading-snug mt-0.5">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={dismissToast}
        aria-label="Fechar notificação"
        className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
