'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sun, Moon, LogIn, LogOut, UserPlus, KeyRound, RotateCcw, RefreshCw, CircleAlert, Trash2 } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { useAuth } from '@/components/AuthProvider';
import { UserAvatar } from '@/components/UserAvatar';
import { UserProfile } from '@/lib/types';

export function SettingsProfileView() {
  const {
    profile,
    theme,
    setThemeMode,
    updateUserProfile,
    cloudSynced,
    resetLocalDemo,
    showToast,
    pendingMutations,
    syncPendingMutations,
    retryPendingMutation,
    discardPendingMutation,
  } = useFocus();
  const { user, signInWithGoogle, signOutUser } = useAuth();

  const [draft, setDraft] = useState<Partial<UserProfile>>({});

  const name = draft.name ?? profile.name;
  const email = draft.email ?? profile.email;
  const course = draft.course ?? profile.course;
  const university = draft.university ?? profile.university;
  const semester = draft.semester ?? profile.semester;
  const registration = draft.registration ?? profile.registration;
  const dailyGoalHours =
    draft.dailyGoalHours !== undefined ? String(draft.dailyGoalHours) : String(profile.dailyGoalHours);
  const bio = draft.bio ?? profile.bio;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name,
      email,
      course,
      university,
      semester,
      registration,
      dailyGoalHours: Number(dailyGoalHours) || 5,
      bio,
    });
    setDraft({});
  };

  const handleSignOut = async () => {
    await signOutUser();
    setDraft({});
    showToast('Sessão encerrada', 'Você voltou para o modo local deste dispositivo.', 'info');
  };

  const handleGoogleSync = async () => {
    const res = await signInWithGoogle();
    showToast(res.ok ? 'Conectado!' : 'Aviso', res.message, res.ok ? 'success' : 'error');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={profile.name}
            photoURL={user?.photoURL || profile.photoURL}
            sizeClass="w-16 h-16 text-lg"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile.name}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {profile.course || 'Curso não informado'} · {profile.university || 'Instituição não informada'}
            </p>
            <p className="font-mono text-xs text-blue-600 dark:text-blue-400 mt-1">
              Matrícula: {profile.registration || '—'} ·{' '}
              {cloudSynced ? 'Sincronizado na nuvem' : 'Armazenamento local'}
            </p>
          </div>
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleGoogleSync()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sincronizar com Google</span>
          </button>
        )}
      </section>

      {pendingMutations.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="flex items-center gap-2 font-bold"><CircleAlert className="h-5 w-5 text-amber-600" />Sincronização pendente</h2><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{pendingMutations.length} alteração(ões) de edição/remoção aguardando. Conflitos ficam listados para você descartar ou tentar de novo.</p></div>
          <button type="button" onClick={() => void syncPendingMutations()} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"><RefreshCw className="h-3.5 w-3.5" />Sincronizar agora</button>
        </div>
        <ul className="mt-4 flex flex-col gap-2">{pendingMutations.map((mutation) => <li key={mutation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/80 p-3 text-xs dark:bg-slate-900/70"><div><span className="font-mono font-semibold">{mutation.method}</span><span className="ml-2 text-slate-600 dark:text-slate-300">{mutation.url}</span>{mutation.status === 'conflict' && <p className="mt-1 text-red-600 dark:text-red-400">Conflito: {mutation.error || 'O registro mudou no servidor.'}</p>}</div><div className="flex gap-2"><button type="button" onClick={() => mutation.status === 'conflict' ? retryPendingMutation(mutation.id) : void syncPendingMutations()} className="rounded-md border border-slate-200 px-2.5 py-1.5 dark:border-slate-700">Tentar de novo</button><button type="button" onClick={() => discardPendingMutation(mutation.id)} aria-label="Descartar alteração pendente" className="rounded-md border border-slate-200 p-1.5 text-red-600 dark:border-slate-700"><Trash2 className="h-3.5 w-3.5" /></button></div></li>)}</ul>
      </section>}

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
          Editar Perfil & Preferências
        </h2>

        <form onSubmit={(e) => void handleSave(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nome Completo
            </label>
            <input
              required
              value={name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              maxLength={120}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="seu@email.com"
              maxLength={180}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Curso
            </label>
            <input
              value={course}
              onChange={(e) => setDraft((prev) => ({ ...prev, course: e.target.value }))}
              placeholder="Seu curso ou objetivo"
              maxLength={120}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Universidade / Instituição
            </label>
            <input
              value={university}
              onChange={(e) => setDraft((prev) => ({ ...prev, university: e.target.value }))}
              placeholder="Sua instituição"
              maxLength={140}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Semestre Atual
            </label>
            <input
              value={semester}
              onChange={(e) => setDraft((prev) => ({ ...prev, semester: e.target.value }))}
              placeholder="Ex.: 1º Semestre"
              maxLength={40}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Matrícula
            </label>
            <input
              value={registration}
              onChange={(e) => setDraft((prev) => ({ ...prev, registration: e.target.value }))}
              placeholder="Número de matrícula (opcional)"
              maxLength={40}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Meta Diária de Estudo (Horas)
            </label>
            <input
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              value={dailyGoalHours}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, dailyGoalHours: Number(e.target.value) || 0.5 }))
              }
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono tabular-nums border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Biografia Acadêmica
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
              maxLength={500}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Aparência da Interface
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Modo Claro</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4 text-blue-500" />
                <span>Modo Escuro</span>
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {!cloudSynced ? (
              <button
                type="button"
                onClick={resetLocalDemo}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Dados Locais</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Alterações salvas diretamente no seu perfil em nuvem.
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Acesso & Credenciais
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          Acesse os fluxos dedicados de login, criação de conta ou recuperação de senha.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold whitespace-nowrap"
          >
            <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Página de Login</span>
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Criar Nova Conta</span>
          </Link>
          <Link
            href="/recuperar-senha"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold whitespace-nowrap"
          >
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Recuperação de Senha</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
