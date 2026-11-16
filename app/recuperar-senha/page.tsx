'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  Mail,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useFocus } from '@/components/FocusProvider';
import { ToastBanner } from '@/components/ToastBanner';

type RecoveryTab = 'recovery' | 'auth-error' | 'success';

export default function RecuperarSenhaPage() {
  const { sendPasswordReset } = useAuth();
  const { theme, toggleTheme, showToast } = useFocus();

  const [tab, setTab] = useState<RecoveryTab>('recovery');
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('estudante@universidade.br');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasAt = email.includes('@');
  const hasDomain = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const isClean = !/[<>{}\\]/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!hasDomain || !isClean) {
      setErrorMsg('Por favor, insira um endereço de e-mail válido com @ e domínio.');
      return;
    }
    setSubmitting(true);
    const res = await sendPasswordReset(email.trim());
    setSubmitting(false);
    if (res.ok) {
      setSentEmail(email.trim());
      setTab('success');
      showToast('E-mail enviado!', res.message, 'success');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ToastBanner />

      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          Focus<span className="text-blue-600 dark:text-blue-400">Learn</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            Painel Principal
          </Link>
          <Link href="/login" className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            Entrar
          </Link>
          <Link href="/cadastro" className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            Criar Conta
          </Link>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0"
          >
            Voltar ao Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-6">
        <div className="w-full max-w-6xl">
          {/* Interactive State Selector */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">
              Estados do Fluxo de Recuperação
            </span>
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setTab('recovery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === 'recovery'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Solicitar Redefinição
              </button>
              <button
                type="button"
                onClick={() => setTab('auth-error')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === 'auth-error'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Simulação: Senha Incorreta
              </button>
              <button
                type="button"
                onClick={() => setTab('success')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === 'success'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Simulação: E-mail Enviado
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Main Card */}
            <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col justify-between">
              {tab === 'recovery' && (
                <div className="flex flex-col flex-1">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Recuperação de Conta
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2 text-balance">
                    Redefinir sua senha acadêmica
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Informe seu e-mail cadastrado e enviaremos um link seguro via Supabase Auth para redefinir sua senha.
                  </p>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="mt-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p>{errorMsg}</p>
                    </div>
                  )}

                  <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4 flex-1">
                    <div>
                      <label htmlFor="rec-email" className="block text-sm font-semibold mb-1.5">
                        E-mail cadastrado
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="rec-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="estudante@universidade.br"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Validação em tempo real:
                      </p>
                      <p className={hasAt ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                        {hasAt ? '✓' : '○'} Contém separador @
                      </p>
                      <p className={hasDomain ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                        {hasDomain ? '✓' : '○'} Domínio válido com extensão (.edu.br, .com, etc.)
                      </p>
                      <p className={email && isClean ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                        {email && isClean ? '✓' : '○'} Formato sanitizado
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-auto w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{submitting ? 'Enviando...' : 'Enviar Link de Recuperação'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {tab === 'auth-error' && (
                <div className="flex flex-col gap-4">
                  <div
                    role="alert"
                    className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-sm">E-mail ou senha incorretos</p>
                      <p className="mt-1 leading-relaxed">
                        Exemplo de feedback acessível quando credenciais inválidas são enviadas.
                      </p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div>
                      <p className="text-xs font-semibold mb-1">E-mail</p>
                      <input
                        readOnly
                        value="carla.santos@universidade.edu.br"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                        Senha Incorreta
                      </p>
                      <input
                        readOnly
                        type="password"
                        value="SenhaAntiga123!"
                        className="w-full px-3 py-2 rounded-lg bg-red-50/40 dark:bg-red-950/20 border-2 border-red-500 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('recovery')}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Recuperar senha deste e-mail
                    </button>
                  </div>
                </div>
              )}

              {tab === 'success' && (
                <div className="flex flex-col items-center justify-center text-center py-8 flex-1">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Verifique sua caixa de entrada
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md">
                    Se o endereço estiver cadastrado, enviamos as instruções de redefinição para:
                  </p>
                  <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg mt-3">
                    {sentEmail}
                  </p>
                  <div className="flex items-center gap-3 mt-6 w-full max-w-sm">
                    <button
                      type="button"
                      onClick={() => setTab('recovery')}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tentar outro</span>
                    </button>
                    <Link
                      href="/login"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold text-center"
                    >
                      Ir para Login
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Right Security Info */}
            <aside className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 text-white rounded-2xl p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-blue-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Central de Segurança Acadêmica
                </p>
                <h2 className="text-2xl font-bold leading-snug text-balance">
                  Sua jornada acadêmica protegida de ponta a ponta.
                </h2>
                <p className="text-sm text-blue-100/90 leading-relaxed">
                  Suas credenciais são gerenciadas diretamente pelo Supabase Authentication com tokens JWT verificados e isolamento por conta.
                </p>
                <ul className="space-y-2.5 pt-2 text-xs text-blue-100">
                  <li className="p-3 rounded-xl bg-white/10">
                    Autenticação OAuth com Google Workspace & contas pessoais
                  </li>
                  <li className="p-3 rounded-xl bg-white/10">
                    Isolamento estrito de dados acadêmicos por usuário autenticado
                  </li>
                  <li className="p-3 rounded-xl bg-white/10">
                    Links de redefinição com expiração automática
                  </li>
                </ul>
              </div>
              <p className="text-xs text-blue-100/80 pt-6 border-t border-white/15 mt-6">
                Em caso de dúvida, acesse a aba Configurações & Perfil no painel principal.
              </p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
