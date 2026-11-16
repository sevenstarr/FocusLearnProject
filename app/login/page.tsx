'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  Timer,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useFirebase } from '@/components/FirebaseProvider';
import { useFocus } from '@/components/FocusProvider';
import { ToastBanner } from '@/components/ToastBanner';
import { UserAvatar } from '@/components/UserAvatar';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail } = useFirebase();
  const { theme, toggleTheme, showToast } = useFocus();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    const res = await signInWithGoogle();
    setSubmitting(false);
    if (res.ok) {
      showToast('Bem-vindo(a)!', res.message, 'success');
      router.push('/');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    const res = await signInWithEmail(email.trim(), password);
    setSubmitting(false);
    if (res.ok) {
      showToast('Acesso liberado', res.message, 'success');
      router.push('/');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ToastBanner />

      {/* Top Bar */}
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
          <Link href="/cadastro" className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            Criar Conta
          </Link>
          <Link href="/recuperar-senha" className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            Recuperar Senha
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
            href="/"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            Ir ao Painel
          </Link>
        </div>
      </header>

      {/* Main Split Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
        <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-sm">
          {/* Left Form */}
          <section className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Espaço Acadêmico Seguro
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2 text-balance">
                Bem-vindo(a) de volta ao FocusLearn
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Acesse seu painel, acompanhe suas metas e retome seus blocos de foco sincronizados na nuvem.
              </p>

              {/* Primary Google Sign-In */}
              <div className="mt-6">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleGoogleLogin()}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-white text-blue-600 font-bold text-xs flex items-center justify-center">
                    G
                  </span>
                  <span>Entrar com Google Estudantil</span>
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">
                    ou acesse com e-mail e senha
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              )}

              <form onSubmit={(e) => void handleEmailLogin(e)} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
                  >
                    E-mail Institucional ou Pessoal
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@universidade.edu.br"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                    >
                      Senha
                    </label>
                    <Link
                      href="/recuperar-senha"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPwd ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((p) => !p)}
                      aria-label="Mostrar ou ocultar senha"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Manter sessão neste dispositivo
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[46px] py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Entrar com E-mail</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Não tem uma conta acadêmica?{' '}
              <Link href="/cadastro" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Cadastre-se gratuitamente
              </Link>
            </p>
          </section>

          {/* Right Highlight Panel */}
          <aside className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-10 flex-col justify-between text-white">
            <div>
              <p className="text-xs font-semibold text-blue-100">
                Gestão de Estudos & Foco
              </p>
              <h2 className="text-2xl font-bold leading-snug mt-3 text-balance">
                Seu semestre sob controle, foco sem dispersão.
              </h2>
              <p className="mt-3 text-sm text-blue-100/90 leading-relaxed">
                Metodologia Pomodoro com áudio sintetizado, calculadora de aprovação e cadernos em Markdown sincronizados em tempo real.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-5 my-6">
              <div className="flex items-center justify-between text-xs text-blue-100 mb-3">
                <span>Fluxo Integrado</span>
                <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sincronizado
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Cálculo Diferencial e Integral</p>
                  <p className="text-xs text-blue-100/80">Blocos Pomodoro + caderno de fórmulas</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/15">
              <div className="flex -space-x-2">
                <UserAvatar name="Mariana Silva" sizeClass="w-8 h-8 text-[10px]" />
                <UserAvatar name="Lucas Andrade" sizeClass="w-8 h-8 text-[10px]" />
              </div>
              <p className="text-xs text-blue-100">
                Autenticação segura via Firebase Auth com sincronização em nuvem.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-5 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 FocusLearn Tecnologia Educacional.</p>
        <div className="flex items-center gap-5">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Termos de Serviço
          </Link>
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Privacidade & LGPD
          </Link>
        </div>
      </footer>
    </div>
  );
}
