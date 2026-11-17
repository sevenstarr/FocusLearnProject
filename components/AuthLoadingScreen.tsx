import { BookOpen, LoaderCircle } from 'lucide-react';

export function AuthLoadingScreen() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-white"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(37,99,235,0.2),transparent_55%)]" />
      <section className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-950/40">
          <BookOpen className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold tracking-[0.22em] text-blue-300">FOCUSLEARN</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Preparando seu espaço</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Estamos verificando sua sessão para levar você ao lugar certo.
        </p>
        <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin text-blue-400" aria-hidden="true" />
          <span>Verificando sua conta…</span>
        </div>
      </section>
    </main>
  );
}
