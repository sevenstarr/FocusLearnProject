'use client';

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCheck,
  Maximize2,
  Headphones,
  Volume2,
  CloudRain,
  Coffee,
  Wind,
  Library,
  History,
  BookOpen,
} from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { PomodoroMode } from '@/lib/types';
import { AmbientSoundType } from '@/lib/audio';

const MODE_TABS: { id: PomodoroMode; label: string }[] = [
  { id: 'pomodoro25', label: 'Pomodoro (25m)' },
  { id: 'ultra50', label: 'Ultra Foco (50m)' },
  { id: 'shortBreak', label: 'Pausa Curta (5m)' },
  { id: 'longBreak', label: 'Pausa Longa (15m)' },
];

const SOUND_OPTIONS: {
  id: AmbientSoundType;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'rain', label: 'Chuva Suave', desc: 'Acústica contínua', Icon: CloudRain },
  { id: 'lofi', label: 'Cafeteria Lo-Fi', desc: 'Acorde ambiente', Icon: Coffee },
  { id: 'white-noise', label: 'Ruído Branco', desc: 'Bloqueio de ruído', Icon: Wind },
  { id: 'library', label: 'Biblioteca', desc: 'Silêncio suave', Icon: Library },
];

export function PomodoroView() {
  const {
    subjects,
    sessions,
    selectedSubjectId,
    setSelectedSubjectId,
    timerMode,
    timerSecondsLeft,
    timerTotalSeconds,
    timerRunning,
    setZenMode,
    switchTimerMode,
    toggleTimer,
    resetTimer,
    skipTimer,
    completeSessionNow,
    audioPlaying,
    ambientSound,
    ambientVolume,
    toggleAmbientSound,
    setAmbientVolume,
  } = useFocus();

  const mins = Math.floor(timerSecondsLeft / 60);
  const secs = timerSecondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = timerTotalSeconds > 0 ? timerSecondsLeft / timerTotalSeconds : 1;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Módulo de Produtividade · Foco Cronometrado
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
            Cronômetro Pomodoro & Áudio Acústico
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Matéria em Estudo
              </span>
              <select
                aria-label="Selecionar matéria em estudo"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">
                    {s.code} · {s.name}
                  </option>
                ))}
                {subjects.length === 0 && (
                  <option value="geral" className="bg-white dark:bg-slate-900">
                    Estudo Geral
                  </option>
                )}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setZenMode(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Modo Zen</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Timer + Audio Synthesizer */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center">
            {/* Mode Tabs */}
            <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchTimerMode(tab.id)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    timerMode === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Circular Timer */}
            <div className="relative w-64 h-64 sm:w-76 sm:h-76 flex items-center justify-center my-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
                <circle
                  className="text-slate-100 dark:text-slate-800"
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                />
                <circle
                  className={`transition-all duration-700 ease-linear ${
                    timerMode === 'shortBreak' || timerMode === 'longBreak'
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : 'text-blue-600 dark:text-blue-500'
                  }`}
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tempo Restante
                </span>
                <span className="font-mono text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight my-1 select-none">
                  {formatted}
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {timerRunning ? 'Cronômetro ativo' : 'Aguardando início'}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full max-w-lg">
              <button
                type="button"
                onClick={resetTimer}
                aria-label="Reiniciar ciclo"
                className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={toggleTimer}
                className="flex-1 min-w-[160px] py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{timerRunning ? 'Pausar Foco' : 'Iniciar Foco'}</span>
              </button>

              <button
                type="button"
                onClick={skipTimer}
                aria-label="Alternar bloco"
                className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => void completeSessionNow()}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Registrar Sessão</span>
              </button>
            </div>

            {/* Web Audio Synthesizer */}
            <div className="w-full mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Sintetizador de Som Ambiente (Web Audio API)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAmbientSound()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    audioPlaying
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {audioPlaying ? 'Pausar Áudio' : 'Tocar Áudio'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {SOUND_OPTIONS.map(({ id, label, desc, Icon }) => {
                  const selected = ambientSound === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleAmbientSound(id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{label}</p>
                        <p
                          className={`text-[10px] truncate ${
                            selected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <input
                  aria-label="Volume do som ambiente"
                  type="range"
                  min={0}
                  max={100}
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="w-full max-w-xs h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg accent-blue-600 cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                  {ambientVolume}%
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Session History */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Histórico de Sessões</span>
            </h2>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {sessions.length} total
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                Conclua um bloco Pomodoro para registrar seu histórico aqui.
              </p>
            ) : (
              sessions.slice(0, 18).map((sess) => {
                const timeStr = new Date(sess.createdAtMs).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={sess.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {sess.subjectName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {sess.dateKey} · {timeStr}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                      +{sess.durationMinutes}m
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
