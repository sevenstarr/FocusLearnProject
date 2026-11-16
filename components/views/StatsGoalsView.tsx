'use client';

import React, { useMemo, useState } from 'react';
import { Flag, Download, Plus, Trash2, CheckCircle2, X, BarChart3 } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';

export function StatsGoalsView() {
  const { goals, subjects, sessions, addGoal, incrementGoalProgress, deleteGoal } = useFocus();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Carga Horária');
  const [targetValue, setTargetValue] = useState('40');
  const [unit, setUnit] = useState('h');
  const [deadline, setDeadline] = useState('');

  const subjectHours = useMemo(() => {
    const maxH = Math.max(1, ...subjects.map((s) => s.hoursStudied));
    return subjects.map((s) => ({
      ...s,
      pct: Math.max(6, Math.round((s.hoursStudied / maxH) * 100)),
    }));
  }, [subjects]);

  const totalHoursAll = useMemo(
    () => (sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60).toFixed(1),
    [sessions]
  );

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addGoal({
      title,
      category,
      currentValue: 0,
      targetValue: Number(targetValue) || 10,
      unit,
      deadline,
    });
    setTitle('');
    setModalOpen(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Análise Acadêmica · {totalHoursAll}h registradas
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
            Estatísticas & Metas Semestrais
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Monitore metas concluídas, horas líquidas por matéria e exporte seu relatório.
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Distribution by Subject */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Horas Dedicadas por Disciplina</span>
        </h2>

        {subjectHours.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
            Cadastre disciplinas para visualizar a distribuição de horas.
          </p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {subjectHours.map((s) => (
              <div key={s.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {s.code} · {s.name}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                    {s.hoursStudied.toFixed(1)}h
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Goals */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Flag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Metas Ativas e Concluídas</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {goals.filter((g) => g.status === 'completed').length}/{goals.length} atingidas
          </span>
        </div>

        {goals.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
            Nenhuma meta cadastrada ainda. Clique em &ldquo;Nova Meta&rdquo; para criar seu primeiro objetivo.
          </p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            const done = g.status === 'completed';
            return (
              <article
                key={g.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {g.category} · Prazo {g.deadline}
                    </p>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {g.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteGoal(g.id)}
                    aria-label={`Remover meta ${g.title}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer no-print"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {g.currentValue} / {g.targetValue} {g.unit}
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        done
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        done ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {done ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Meta concluída
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void incrementGoalProgress(g.id, 1)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer no-print"
                    >
                      +1 {g.unit} de progresso
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        )}
      </section>

      {/* New Goal Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Criar Nova Meta"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Nova Meta Semestral
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleCreateGoal(e)} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Título da Meta
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Concluir 30 resumos em Markdown"
                  maxLength={140}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Categoria
                  </label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    maxLength={60}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Prazo
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Alvo
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Unidade
                  </label>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="h, listas, capítulos"
                    maxLength={24}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
