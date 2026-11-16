'use client';

import React, { useEffect } from 'react';
import { Minimize2, Play, Pause, RotateCcw, CheckCheck } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';

export function ZenModeModal() {
  const {
    zenMode,
    setZenMode,
    timerSecondsLeft,
    timerTotalSeconds,
    timerRunning,
    timerMode,
    toggleTimer,
    resetTimer,
    completeSessionNow,
    subjects,
    selectedSubjectId,
  } = useFocus();

  useEffect(() => {
    if (!zenMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZenMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zenMode, setZenMode]);

  if (!zenMode) return null;

  const mins = Math.floor(timerSecondsLeft / 60);
  const secs = timerSecondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = timerTotalSeconds > 0 ? timerSecondsLeft / timerTotalSeconds : 1;
  const dashOffset = circumference * (1 - progress);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const modeLabel =
    timerMode === 'pomodoro25'
      ? 'Pomodoro · 25 min'
      : timerMode === 'ultra50'
        ? 'Ultra Foco · 50 min'
        : timerMode === 'shortBreak'
          ? 'Pausa Curta · 5 min'
          : 'Pausa Longa · 15 min';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo Zen Imersivo"
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6"
    >
      <button
        type="button"
        onClick={() => setZenMode(false)}
        aria-label="Sair do Modo Zen"
        className="absolute top-6 right-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Minimize2 className="w-4 h-4" />
        <span>Sair (Esc)</span>
      </button>

      <div className="flex flex-col items-center text-center max-w-md w-full">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide">
          Modo Zen · {modeLabel}
        </p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 text-balance">
          {activeSubject ? activeSubject.name : 'Foco Total Sem Distrações'}
        </h2>

        <div className="relative w-72 h-72 flex items-center justify-center my-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
            <circle
              className="text-slate-200 dark:text-slate-800"
              cx="140"
              cy="140"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
            />
            <circle
              className="text-blue-600 dark:text-blue-500 transition-all duration-700 ease-linear"
              cx="140"
              cy="140"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-6xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatted}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {timerRunning ? 'Em andamento' : 'Pausado'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetTimer}
            aria-label="Reiniciar ciclo"
            className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleTimer}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{timerRunning ? 'Pausar Foco' : 'Iniciar Foco'}</span>
          </button>
          <button
            type="button"
            onClick={() => void completeSessionNow()}
            aria-label="Concluir sessão agora"
            className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
          >
            <CheckCheck className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
