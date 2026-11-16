'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  BookOpen,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  AlertCircle,
  Timer,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useFocus } from '@/components/FocusProvider';
import { ToastBanner } from '@/components/ToastBanner';

export default function CadastroPage() {
  const router = useRouter();
  const { signInWithGoogle, signUpWithEmail } = useAuth();
  const { theme, toggleTheme, updateUserProfile, showToast } = useFocus();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pwdChecks = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpec = /[^A-Za-z0-9]/.test(password);
    const score = [hasLength, hasUpper, hasNum, hasSpec].filter(Boolean).length;
    return { hasLength, hasUpper, hasNum, hasSpec, score };
  }, [password]);

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleGoogleSignup = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    const res = await signInWithGoogle();
    setSubmitting(false);
    if (res.ok) {
      if (course) {
        await updateUserProfile({ course });
      }
      showToast('Conta conectada!', res.message, 'success');
      router.push('/');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passwordsMatch) {
      setErrorMsg('As senhas informadas não coincidem.');
      return;
    }
    if (!terms) {
      setErrorMsg('Aceite os Termos de Serviço e Privacidade para prosseguir.');
      return;
    }

    setSubmitting(true);
    const res = await signUpWithEmail(fullName.trim(), email.trim(), password);
    setSubmitting(false);

    if (res.ok) {
      await updateUserProfile({
        name: fullName.trim(),
        email: email.trim(),
        course: course || '',
      });
      showToast('Conta criada!', res.message, 'success');
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
          <Link href="/login" className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            Entrar
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
            href="/login"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0"
          >
            Já tenho conta
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Form Column */}
          <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Nova Conta Acadêmica · Universitário / Pré-Vestibular
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2 text-balance">
                Crie sua conta no FocusLearn
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Organize matérias, cronometre ciclos de estudo e sincronize tudo em tempo real.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleGoogleSignup()}
                  className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-white text-blue-600 font-bold text-xs flex items-center justify-center">
                    G
                  </span>
                  <span>Cadastrar rapidamente com Google</span>
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">
                    ou preencha seus dados acadêmicos
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

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-semibold mb-1.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="signup-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-semibold mb-1.5">
                    E-mail Institucional ou Pessoal
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome.sobrenome@universidade.edu.br"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-course" className="block text-sm font-semibold mb-1.5">
                    Curso / Área de Estudo
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="signup-course"
                      required
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[44px]"
                    >
                      <option value="" disabled>
                        Selecione seu curso ou objetivo acadêmico
                      </option>
                      <option value="Engenharia de Software / TI">Engenharia de Software / TI</option>
                      <option value="Medicina">Medicina</option>
                      <option value="Direito">Direito</option>
                      <option value="Administração & Negócios">Administração & Negócios</option>
                      <option value="Psicologia">Psicologia</option>
                      <option value="Pré-Vestibular / ENEM">Pré-Vestibular / ENEM</option>
                      <option value="Concursos Públicos">Concursos Públicos</option>
                      <option value="Outra Graduação / Pós">Outra Graduação / Pós-Graduação</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-semibold mb-1.5">
                    Senha Segura
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="signup-password"
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crie uma senha forte"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((p) => !p)}
                      aria-label="Mostrar ou ocultar senha"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1 cursor-pointer"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Bar */}
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Nível de segurança:</span>
                      <span
                        className={`font-semibold ${
                          pwdChecks.score === 4
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : pwdChecks.score >= 2
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {!password
                          ? 'Aguardando senha'
                          : pwdChecks.score <= 1
                            ? 'Fraca'
                            : pwdChecks.score < 4
                              ? 'Média'
                              : 'Forte'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          pwdChecks.score === 4
                            ? 'bg-emerald-600'
                            : pwdChecks.score >= 2
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${(pwdChecks.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3 text-xs">
                    {[
                      { ok: pwdChecks.hasLength, text: 'Mínimo 8 caracteres' },
                      { ok: pwdChecks.hasUpper, text: 'Uma letra maiúscula' },
                      { ok: pwdChecks.hasNum, text: 'Pelo menos um número' },
                      { ok: pwdChecks.hasSpec, text: 'Um caractere especial (@$!%*?)' },
                    ].map((rule) => (
                      <div
                        key={rule.text}
                        className={`flex items-center gap-1.5 ${
                          rule.ok
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {rule.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{rule.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-confirm" className="block text-sm font-semibold mb-1.5">
                    Confirme a Senha
                  </label>
                  <input
                    id="signup-confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm min-h-[44px] ${
                      !passwordsMatch
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {!passwordsMatch && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                      As senhas informadas não coincidem.
                    </p>
                  )}
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Li e aceito os{' '}
                    <Link href="/termos" className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
                      Termos de Serviço
                    </Link>{' '}e a{' '}
                    <Link href="/privacidade" className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
                      Política de Privacidade
                    </Link>.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Criar Conta com E-mail</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="pt-6 text-center border-t border-slate-100 dark:border-slate-800 mt-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Já possui uma conta ativa?{' '}
                <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Faça login aqui
                </Link>
              </p>
            </div>
          </section>

          {/* Right Social Proof Column */}
          <aside className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 rounded-2xl p-8 sm:p-10 text-white flex flex-col justify-between">
            <div className="space-y-6">
              <p className="text-xs font-semibold text-blue-100">
                Rotina Acadêmica de Alta Retenção
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-balance">
                Transforme horas dispersas em aprovações reais.
              </h2>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                O FocusLearn reúne cronômetro Pomodoro, grade horária, calculadora de média e salas de estudo em um único fluxo.
              </p>

              <ul className="space-y-4 pt-2">
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Cronômetro Pomodoro Inteligente</h3>
                    <p className="text-xs text-blue-100/80 mt-0.5">
                      Registro automático de blocos líquidos e sintetizador acústico integrado.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Planejador Semanal</h3>
                    <p className="text-xs text-blue-100/80 mt-0.5">
                      Grade horária semanal conectada com revisões e datas de provas.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Comunidade em Tempo Real</h3>
                    <p className="text-xs text-blue-100/80 mt-0.5">
                      Tire dúvidas por disciplina com colegas conectados ao mesmo tempo.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-white/15">
              <p className="text-xs text-blue-100 leading-relaxed">
                Seus dados acadêmicos ficam protegidos e sincronizados com sua conta no Supabase Auth.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
