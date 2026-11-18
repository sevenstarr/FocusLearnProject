'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  GraduationCap,
  Timer,
  CalendarDays,
  BarChart3,
  FileText,
  MessageSquare,
  Settings,
  LogIn,
  UserPlus,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Flame,
  Target,
  ShoppingBag,
  Coins,
  CircleHelp,
  BrainCircuit,
} from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { useAuth } from '@/components/AuthProvider';
import { NavSection } from '@/lib/types';
import { getDateKey } from '@/lib/seedData';
import { UserAvatar } from '@/components/UserAvatar';
import { ToastBanner } from '@/components/ToastBanner';
import { FocusLearnHomeButton } from '@/components/FocusLearnHomeButton';
import { ZenModeModal } from '@/components/ZenModeModal';
import { DashboardView } from '@/components/views/DashboardView';
import { SubjectsView } from '@/components/views/SubjectsView';
import { PomodoroView } from '@/components/views/PomodoroView';
import { PlannerView } from '@/components/views/PlannerView';
import { StatsGoalsView } from '@/components/views/StatsGoalsView';
import { NotesView } from '@/components/views/NotesView';
import { CommunityView } from '@/components/views/CommunityView';
import { SettingsProfileView } from '@/components/views/SettingsProfileView';
import { ShopView } from '@/components/views/ShopView';
import { ModuleTutorialModal } from '@/components/ModuleTutorialModal';
import { StudyToolsView } from '@/components/views/StudyToolsView';

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'visao-geral', label: 'Visão Geral', shortLabel: 'Início', Icon: LayoutDashboard },
  { id: 'materias-cursos', label: 'Matérias & Cursos', shortLabel: 'Matérias', Icon: GraduationCap },
  { id: 'cronometro-pomodoro', label: 'Cronômetro Pomodoro', shortLabel: 'Foco', Icon: Timer },
  { id: 'loja', label: 'Loja de Cosméticos', shortLabel: 'Loja', Icon: ShoppingBag },
  { id: 'planejador-semanal', label: 'Planejador Semanal', shortLabel: 'Agenda', Icon: CalendarDays },
  { id: 'estatisticas-metas', label: 'Estatísticas & Metas', shortLabel: 'Metas', Icon: BarChart3 },
  { id: 'anotacoes', label: 'Anotações & Cadernos', shortLabel: 'Notas', Icon: FileText },
  { id: 'estudos-inteligentes', label: 'Estudos Inteligentes', shortLabel: 'Estudos', Icon: BrainCircuit },
  { id: 'comunidade', label: 'Comunidade & Chat', shortLabel: 'Chat', Icon: MessageSquare },
];

export function FocusLearnShell() {
  const {
    activeSection,
    setActiveSection,
    searchQuery,
    setSearchQuery,
    profile,
    sessions,
    subjects,
    notes,
    theme,
    toggleTheme,
    cloudSynced,
    shop,
    loadingData,
    markTutorialSeen,
  } = useFocus();
  const { user } = useAuth();
  const equippedAvatar = shop.owned.find((item) => item.category === 'avatar' && item.equipped);
  const equippedAvatarEmoji = shop.items.find((item) => item.id === equippedAvatar?.itemId)?.emoji;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tutorialSection, setTutorialSection] = useState<NavSection | null>(null);

  useEffect(() => {
    if (loadingData || profile.tutorialsSeen?.[activeSection]) return;
    let active = true;
    queueMicrotask(() => { if (active) setTutorialSection(activeSection); });
    return () => { active = false; };
  }, [activeSection, loadingData, profile.tutorialsSeen]);

  const closeTutorial = useCallback(() => {
    if (tutorialSection) void markTutorialSeen(tutorialSection);
    setTutorialSection(null);
  }, [markTutorialSeen, tutorialSection]);

  const todayMinutes = useMemo(() => {
    const key = getDateKey();
    return sessions
      .filter((s) => s.dateKey === key)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [sessions]);

  const todayHoursLabel = `${(todayMinutes / 60).toFixed(1)}h / ${profile.dailyGoalHours}h hoje`;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matchedSubjects = subjects
      .filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        label: `${s.code} · ${s.name}`,
        kind: 'Matéria',
        target: 'materias-cursos' as NavSection,
      }));
    const matchedNotes = notes
      .filter((n) => n.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((n) => ({
        id: n.id,
        label: n.title,
        kind: 'Nota',
        target: 'anotacoes' as NavSection,
      }));
    return [...matchedSubjects, ...matchedNotes];
  }, [searchQuery, subjects, notes]);

  const navigate = (section: NavSection) => {
    setActiveSection(section);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ToastBanner />
      <ZenModeModal />
      {tutorialSection && (
        <ModuleTutorialModal
          key={tutorialSection}
          section={tutorialSection}
          onClose={closeTutorial}
        />
      )}

      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col justify-between py-5 transition-transform duration-200 lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          <div className="px-5 flex items-center justify-between mb-5">
            <FocusLearnHomeButton compact onHome={() => navigate('visao-geral')} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Fechar menu"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 pb-4 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <UserAvatar name={profile.name} photoURL={user?.photoURL || undefined} emoji={equippedAvatarEmoji} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {profile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {profile.course || 'FocusLearn'}
              </p>
            </div>
          </div>

          <nav className="px-3 flex flex-col gap-1">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>Login / Entrar</span>
          </Link>
          <Link
            href="/cadastro"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Criar Nova Conta</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate('configuracoes-ajuda')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeSection === 'configuracoes-ajuda'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Configurações & Perfil</span>
          </button>
        </div>
      </aside>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 flex-col justify-between py-6">
        <div className="flex flex-col">
          <div className="px-4 mb-7">
            <FocusLearnHomeButton onHome={() => navigate('visao-geral')} />
          </div>

          <nav aria-label="Navegação principal" className="px-3 flex flex-col gap-1">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-3 flex flex-col gap-1 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>{cloudSynced ? 'Trocar Conta' : 'Login / Entrar'}</span>
          </Link>
          <Link
            href="/cadastro"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Criar Nova Conta</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate('configuracoes-ajuda')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'configuracoes-ajuda'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Configurações & Perfil</span>
          </button>
        </div>
      </aside>

      {/* Top Header */}
      <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md relative">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu lateral"
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full hidden sm:flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar matérias ou anotações..."
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
              {searchResults.map((res) => (
                <button
                  key={`${res.kind}-${res.id}`}
                  type="button"
                  onClick={() => {
                    navigate(res.target);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 text-xs cursor-pointer"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {res.label}
                  </span>
                  <span className="text-slate-400 shrink-0">{res.kind}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {cloudSynced && <button type="button" onClick={() => navigate('loja')} className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" aria-label="Abrir loja e ver saldo"><Coins className="h-4 w-4" />{shop.balance}</button>}
          <button
            type="button"
            onClick={() => setTutorialSection(activeSection)}
            aria-label={`Abrir tutorial: ${NAV_ITEMS.find((item) => item.id === activeSection)?.label || 'Configurações e perfil'}`}
            title="Ajuda deste módulo"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <CircleHelp className="w-4 h-4" />
          </button>
          <div className="hidden md:flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {profile.streak} dias
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {todayHoursLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('configuracoes-ajuda')}
            className="flex items-center gap-2.5 cursor-pointer"
            title="Perfil e Configurações"
          >
            <UserAvatar
              name={profile.name}
              photoURL={user?.photoURL || undefined}
              emoji={equippedAvatarEmoji}
              sizeClass="w-8 h-8 text-xs"
            />
            <span className="hidden xl:inline text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              {profile.name.split(' ')[0]}
            </span>
          </button>

          <Link
            href="/login"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            {cloudSynced ? 'Conta' : 'Entrar'}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 flex-1 pt-16 pb-20 lg:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSection === 'visao-geral' && <DashboardView />}
            {activeSection === 'materias-cursos' && <SubjectsView />}
            {activeSection === 'cronometro-pomodoro' && <PomodoroView />}
            {activeSection === 'loja' && <ShopView />}
            {activeSection === 'planejador-semanal' && <PlannerView />}
            {activeSection === 'estatisticas-metas' && <StatsGoalsView />}
            {activeSection === 'anotacoes' && <NotesView />}
            {activeSection === 'estudos-inteligentes' && <StudyToolsView />}
            {activeSection === 'comunidade' && <CommunityView />}
            {activeSection === 'configuracoes-ajuda' && <SettingsProfileView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Navegação rápida móvel"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 px-2 flex items-center justify-around"
      >
        {NAV_ITEMS.slice(0, 5).map(({ id, shortLabel, Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] cursor-pointer ${
                active
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] whitespace-nowrap">{shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
