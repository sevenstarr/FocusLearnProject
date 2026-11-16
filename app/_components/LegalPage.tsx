import Link from 'next/link';
import { ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';

type Section = { id: string; title: string; content: React.ReactNode };

export function LegalPage({
  eyebrow,
  title,
  summary,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  updatedAt: string;
  sections: Section[];
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/login" className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="FocusLearn, ir para entrar">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white">FL</span>
            <span className="font-display text-lg font-bold tracking-tight">FocusLearn</span>
          </Link>
          <Link href="/cadastro" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            Criar conta
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para entrar
        </Link>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 px-6 py-9 text-white sm:px-10 sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              {eyebrow === 'Privacidade e dados' ? <ShieldCheck className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">{eyebrow}</p>
            <h1 className="mt-2 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">{summary}</p>
            <p className="mt-6 text-xs text-blue-100">Última atualização: {updatedAt}</p>
          </div>

          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:p-10">
            <nav aria-label="Nesta página" className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-6">
              <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nesta página</p>
              <ul className="space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id}><a href={`#${section.id}`} className="block rounded-lg px-2 py-2 text-sm leading-5 text-slate-600 hover:bg-white hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-300">{index + 1}. {section.title}</a></li>
                ))}
              </ul>
            </nav>
            <article className="min-w-0 divide-y divide-slate-200 dark:divide-slate-800">
              {sections.map((section, index) => (
                <section id={section.id} key={section.id} className="scroll-mt-8 py-7 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{String(index + 1).padStart(2, '0')}</p>
                  <h2 className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">{section.title}</h2>
                  <div className="legal-copy mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.content}</div>
                </section>
              ))}
              <p className="border-t border-slate-200 py-6 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Este documento apresenta as práticas e condições do serviço conforme implementado atualmente. Para exercer direitos de titular ou relatar uma questão, use um canal oficial de contato do FocusLearn e evite publicar dados pessoais em espaços públicos.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 FocusLearn Tecnologia Educacional.</p>
          <div className="flex gap-5"><Link href="/termos" className="hover:text-blue-600">Termos de Serviço</Link><Link href="/privacidade" className="hover:text-blue-600">Privacidade</Link></div>
        </div>
      </footer>
    </div>
  );
}
