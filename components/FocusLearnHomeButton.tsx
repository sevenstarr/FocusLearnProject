import React from 'react';

type FocusLearnHomeButtonProps = {
  onHome: () => void;
  compact?: boolean;
};

export function FocusLearnHomeButton({ onHome, compact = false }: FocusLearnHomeButtonProps) {
  return (
    <button
      type="button"
      onClick={onHome}
      aria-label="FocusLearn — voltar para a página inicial"
      title="Voltar para a página inicial"
      className={`group inline-flex min-h-11 items-center rounded-xl px-2.5 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-slate-800 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900 ${compact ? 'gap-2' : 'gap-2.5'}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 256 256"
        className={`shrink-0 text-blue-600 dark:text-blue-400 ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
      >
        <path
          fill="currentColor"
          d="M48 48h66v22H70v44H48V48zm94 0h66v66h-22V70h-44V48zM48 142h22v44h44v22H48v-66zm138 0h22v66h-66v-22h44v-44z"
        />
        <circle className="fill-cyan-500 dark:fill-cyan-300" cx="128" cy="128" r="17" />
      </svg>
      <span
        className={`font-display font-bold tracking-tight text-slate-900 dark:text-white ${compact ? 'text-lg' : 'text-xl'}`}
      >
        FocusLearn
      </span>
    </button>
  );
}
