'use client';

import React, { useMemo, useState } from 'react';
import {
  Timer,
  Flame,
  TrendingUp,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  CheckCheck,
  Plus,
  Trash2,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { getDateKey, getOffsetDateKey, calculateGrade } from '@/lib/seedData';

export function DashboardView() {
  const {
    profile,
    subjects,
    tasks,
    sessions,
    setActiveSection,
    timerMode,
    timerSecondsLeft,
    timerTotalSeconds,
    timerRunning,
    switchTimerMode,
    toggleTimer,
    resetTimer,
    completeSessionNow,
    addTask,
    toggleTask,
    deleteTask,
    showToast,
  } = useFocus();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateKey: string;
    label: string;
    minutes: number;
  } | null>(null);

  const todayKey = getDateKey();

  const todayStats = useMemo(() => {
    const todaySessions = sessions.filter((s) => s.dateKey === todayKey);
    const totalMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const goalMins = Math.max(30, profile.dailyGoalHours * 60);
    const pct = Math.min(100, Math.round((totalMinutes / goalMins) * 100));
    return {
      totalMinutes,
      formattedHours: `${hours}h ${String(mins).padStart(2, '0')}m`,
      sessionCount: todaySessions.length,
      pct,
    };
  }, [sessions, todayKey, profile.dailyGoalHours]);

  const globalAverage = useMemo(() => {
    const active = subjects.filter((s) => s.status === 'active');
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, s) => acc + (s.gradeMax > 0 ? calculateGrade(s.assessments, s.gradeMax, s.gradingMethod, s.approvalRules).average / s.gradeMax * 100 : 0), 0);
    return Number((sum / active.length).toFixed(1));
  }, [subjects]);

  // 30-day heatmap aggregated from actual sessions
  const heatmapDays = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      map.set(s.dateKey, (map.get(s.dateKey) || 0) + s.durationMinutes);
    });

    const days: { dateKey: string; dayNum: number; label: string; minutes: number; isToday: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dateKey = getOffsetDateKey(i);
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      days.push({
        dateKey,
        dayNum: d.getDate(),
        label,
        minutes: map.get(dateKey) || 0,
        isToday: i === 0,
      });
    }
    return days;
  }, [sessions]);

  // 4-week distribution computed from sessions
  const weeklyBars = useMemo(() => {
    const weeks = [0, 0, 0, 0];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    sessions.forEach((s) => {
      const parts = s.dateKey.split('-').map(Number);
      if (parts.length !== 3) return;
      const dt = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
      const diffDays = Math.floor((startOfToday - dt) / 86400000);
      if (diffDays >= 0 && diffDays < 28) {
        const weekIdx = 3 - Math.floor(diffDays / 7);
        weeks[weekIdx] += s.durationMinutes / 60;
      }
    });
    const maxVal = Math.max(5, ...weeks);
    return weeks.map((hrs, idx) => ({
      label: `Semana ${idx + 1}`,
      hours: Number(hrs.toFixed(1)),
      pct: Math.max(8, Math.round((hrs / maxVal) * 100)),
      isCurrent: idx === 3,
    }));
  }, [sessions]);

  const minsLeft = Math.floor(timerSecondsLeft / 60);
  const secsLeft = timerSecondsLeft % 60;
  const hoursElapsed = Math.floor(timerSecondsLeft / 3600);
  const formattedClock = timerMode === 'stopwatch'
    ? `${String(hoursElapsed).padStart(2, '0')}:${String(Math.floor(timerSecondsLeft / 60) % 60).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`
    : `${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;
  const ringRadius = 44;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference * (1 - (timerMode === 'stopwatch' ? 1 : timerTotalSeconds > 0 ? timerSecondsLeft / timerTotalSeconds : 1));

  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await addTask(newTaskTitle, subjects[0]?.id || '');
    setNewTaskTitle('');
    showToast('Tarefa adicionada', 'Nova micro-tarefa salva na sua lista.');
  };

  const firstName = profile.name.split(' ')[0] || 'Estudante';
  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Welcome Hero Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {profile.semester && (
              <>
                <span>{profile.semester}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="capitalize">{todayFormatted}</span>
            {profile.course && (
              <>
                <span aria-hidden="true">·</span>
                <span>{profile.course}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight text-balance">
            Olá, {firstName}. Pronto para o próximo bloco de foco?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Você completou{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {todayStats.formattedHours}
            </span>{' '}
            hoje de uma meta diária de{' '}
            <span className="font-semibold tabular-nums">{profile.dailyGoalHours}h</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('cronometro-pomodoro')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Timer className="w-4 h-4" />
            <span>Abrir Pomodoro</span>
          </button>
        </div>
      </section>

      {/* 4 KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tempo Hoje</p>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                Horas Estudadas
              </h2>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {todayStats.formattedHours}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                / {profile.dailyGoalHours}h meta
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${todayStats.pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tabular-nums">
              {todayStats.pct}% da meta diária concluída
            </p>
          </div>
        </article>

        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Consistência</p>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                Sequência de Foco
              </h2>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {profile.streak} dias
            </span>
            <div className="flex items-center gap-1 mt-3">
              {Array.from({ length: 7 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full ${
                    idx < Math.min(7, profile.streak)
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tabular-nums">
              Recorde pessoal: {profile.recordStreak} dias seguidos
            </p>
          </div>
        </article>

        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pomodoros</p>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                Sessões Hoje
              </h2>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {todayStats.sessionCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">blocos concluídos</span>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx < todayStats.sessionCount
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {idx < todayStats.sessionCount ? '✓' : ''}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Total acumulado: {sessions.length} sessões
            </p>
          </div>
        </article>

        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Desempenho</p>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                Média Global Atual
              </h2>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {globalAverage.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, globalAverage)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {subjects.filter((s) => s.status === 'active').length} disciplinas ativas no semestre
            </p>
          </div>
        </article>
      </section>

      {/* Main Grid: Analytics (8 cols) + Quick Tools (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 30-day Study Frequency Heatmap */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Frequência de Estudos (Últimos 30 Dias)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Clique em qualquer dia para ver os minutos registrados
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>Menos</span>
                <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
                <span className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900" />
                <span className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="w-3 h-3 rounded-sm bg-emerald-600" />
                <span>4h+</span>
              </div>
            </div>

            <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 mt-4">
              {heatmapDays.map((day) => {
                const bg =
                  day.minutes >= 240
                    ? 'bg-emerald-600 text-white'
                    : day.minutes >= 120
                      ? 'bg-blue-600 text-white'
                      : day.minutes > 0
                        ? 'bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDayDetail(day)}
                    title={`${day.label}: ${day.minutes} min`}
                    className={`h-8 rounded-md font-mono text-xs font-medium tabular-nums flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${bg} ${
                      day.isToday ? 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-900' : ''
                    }`}
                  >
                    {day.dayNum}
                  </button>
                );
              })}
            </div>

            {selectedDayDetail && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>
                  Registro de <strong>{selectedDayDetail.label}</strong> ({selectedDayDetail.dateKey})
                </span>
                <span className="font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  {selectedDayDetail.minutes} minutos estudados
                </span>
              </div>
            )}
          </section>

          {/* 4-Week Load Distribution */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Carga Semanal (Últimas 4 Semanas)
                </p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {weeklyBars.reduce((acc, w) => acc + w.hours, 0).toFixed(1)}h acumuladas no ciclo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('estatisticas-metas')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver detalhes
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-4 pt-2">
              {weeklyBars.map((w) => (
                <div key={w.label} className="flex flex-col items-center gap-2">
                  <div className="w-full h-32 bg-slate-100 dark:bg-slate-800/70 rounded-lg p-2 flex items-end justify-center">
                    <div
                      className={`w-full rounded-md flex items-end justify-center pb-1.5 font-mono text-xs font-bold tabular-nums transition-all duration-500 ${
                        w.isCurrent
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                          : 'bg-blue-600/85 dark:bg-blue-500/85 text-white'
                      }`}
                      style={{ height: `${w.pct}%` }}
                    >
                      {w.hours}h
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {w.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Mini Pomodoro + Quick Tasks */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Pomodoro Widget */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {timerMode === 'stopwatch' ? 'Cronômetro de estudo' : 'Pomodoro Rápido'}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {timerRunning ? 'Em foco' : 'Pronto'}
              </span>
            </div>

            <div className="w-full grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => switchTimerMode('stopwatch')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  timerMode === 'stopwatch'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Cronômetro
              </button>
              <button
                type="button"
                onClick={() => switchTimerMode('pomodoro25')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  timerMode === 'pomodoro25'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Pomodoro 25m
              </button>
              <button
                type="button"
                onClick={() => switchTimerMode('ultra50')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  timerMode === 'ultra50'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Ultra Foco 50m
              </button>
            </div>

            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-slate-100 dark:text-slate-800"
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="6"
                />
                <circle
                  className="text-blue-600 dark:text-blue-500 transition-all duration-700 ease-linear"
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {formattedClock}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {timerMode === 'stopwatch' ? 'Tempo estudado' : 'Restante'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={resetTimer}
                aria-label={timerMode === 'stopwatch' ? 'Zerar cronômetro' : 'Reiniciar timer'}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleTimer}
                className="flex-1 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{timerRunning ? 'Pausar' : timerMode === 'stopwatch' ? 'Iniciar cronômetro' : 'Iniciar Foco'}</span>
              </button>
              <button
                type="button"
                onClick={() => void completeSessionNow()}
                disabled={timerMode === 'stopwatch' && timerSecondsLeft < 60}
                title="Registrar sessão concluída"
                aria-label="Registrar sessão concluída"
                className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Quick Tasks Checklist */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Tarefas Rápidas</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {tasks.filter((t) => t.completed).length}/{tasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 py-3 max-h-64 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                  Nenhuma tarefa pendente. Adicione uma micro-tarefa abaixo.
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
                  >
                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => void toggleTask(task.id)}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0"
                      />
                      <span
                        className={`text-xs truncate ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200 font-medium'
                        }`}
                      >
                        {task.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => void deleteTask(task.id)}
                      aria-label={`Excluir tarefa ${task.title}`}
                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => void handleAddQuickTask(e)}
              className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nova micro-tarefa..."
                maxLength={200}
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
