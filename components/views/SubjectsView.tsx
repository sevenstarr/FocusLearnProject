'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Calculator,
  Trash2,
  Clock,
  GraduationCap,
  X,
  Play,
} from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { calculateUFCGrade } from '@/lib/seedData';
import { Subject } from '@/lib/types';

export function SubjectsView() {
  const {
    subjects,
    searchQuery,
    addSubject,
    updateSubject,
    deleteSubject,
    setSelectedSubjectId,
    setActiveSection,
  } = useFocus();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [calcP1, setCalcP1] = useState<string>('');
  const [calcP2, setCalcP2] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [schedule, setSchedule] = useState('');

  const calcEval = useMemo(
    () => calculateUFCGrade(parseFloat(calcP1) || 0, parseFloat(calcP2) || 0),
    [calcP1, calcP2]
  );

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subjects.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.professor.toLowerCase().includes(q)
      );
    });
  }, [subjects, statusFilter, searchQuery]);

  const summary = useMemo(() => {
    const active = subjects.filter((s) => s.status === 'active');
    const totalHours = subjects.reduce((acc, s) => acc + s.hoursStudied, 0);
    const avg =
      active.length > 0
        ? active.reduce((acc, s) => acc + calculateUFCGrade(s.p1, s.p2).average, 0) / active.length
        : 0;
    const finalExams = active.filter((s) => {
      const ev = calculateUFCGrade(s.p1, s.p2);
      return ev.neededPF !== null && ev.neededPF > 0;
    }).length;
    return {
      totalHours: totalHours.toFixed(1),
      avg: avg.toFixed(1),
      finalExams,
    };
  }, [subjects]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    await addSubject({
      code,
      name,
      professor: professor || 'A definir',
      schedule: schedule || 'Horário flexível',
      p1: 0,
      p2: 0,
      hoursStudied: 0,
      status: 'active',
    });
    setCode('');
    setName('');
    setProfessor('');
    setSchedule('');
    setModalOpen(false);
  };

  const handleGradeChange = (sub: Subject, field: 'p1' | 'p2', val: string) => {
    const num = Math.max(0, Math.min(10, parseFloat(val) || 0));
    void updateSubject(sub.id, { [field]: num });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Semestre Letivo · Gestão de Disciplinas
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
            Matérias & Cursos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atualize suas notas P1 e P2, acompanhe horas líquidas e simule sua aprovação.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Matéria</span>
        </button>
      </div>

      {/* Summary Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Média Global</p>
          <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {summary.avg} <span className="text-xs font-normal text-slate-500">/ 10</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Em Prova Final</p>
          <p className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {summary.finalExams}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Horas Estudadas</p>
          <p className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {summary.totalHours}h
          </p>
        </div>
      </div>

      {/* UFC Approval Calculator */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Simulador de Média & Aprovação (Regra Federal / UFC)
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label
              htmlFor="calc-p1"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Nota P1 (0 a 10)
            </label>
            <input
              id="calc-p1"
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="0.0"
              value={calcP1}
              onChange={(e) => setCalcP1(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label
              htmlFor="calc-p2"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Nota P2 (0 a 10)
            </label>
            <input
              id="calc-p2"
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="0.0"
              value={calcP2}
              onChange={(e) => setCalcP2(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Média Parcial
            </p>
            <p className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {calcEval.average.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Nota Necessária na PF
            </p>
            <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {calcEval.neededPF === null
                ? 'Sem direito à PF (< 4.0)'
                : calcEval.neededPF === 0
                  ? '0.0 (Dispensado)'
                  : `${calcEval.neededPF.toFixed(1)} pts`}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Situação</p>
            <p
              className={`text-sm font-semibold ${
                calcEval.tone === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : calcEval.tone === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {calcEval.statusLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(
            [
              { id: 'all', label: 'Todas' },
              { id: 'active', label: 'Ativas' },
              { id: 'completed', label: 'Concluídas' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {filteredSubjects.length} disciplina(s) exibida(s)
        </span>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
          <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Nenhuma matéria encontrada
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adicione sua primeira disciplina ou limpe os filtros atuais.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredSubjects.map((sub) => {
            const ev = calculateUFCGrade(sub.p1, sub.p2);
            return (
              <article
                key={sub.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {sub.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span aria-hidden="true">·</span>
                      <span>{sub.schedule}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {sub.professor}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void deleteSubject(sub.id)}
                    aria-label={`Remover ${sub.name}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Grade Editor */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label
                      htmlFor={`p1-${sub.id}`}
                      className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Nota P1
                    </label>
                    <input
                      id={`p1-${sub.id}`}
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={sub.p1}
                      onChange={(e) => handleGradeChange(sub, 'p1', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono tabular-nums border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`p2-${sub.id}`}
                      className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Nota P2
                    </label>
                    <input
                      id={`p2-${sub.id}`}
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={sub.p2}
                      onChange={(e) => handleGradeChange(sub, 'p2', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono tabular-nums border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Média Parcial
                    </p>
                    <p
                      className={`font-mono text-lg font-bold tabular-nums pt-0.5 ${
                        ev.tone === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ev.tone === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {ev.average.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {sub.hoursStudied.toFixed(1)}h estudadas
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        ev.tone === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : ev.tone === 'warning'
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-red-600 dark:text-red-400 font-medium'
                      }
                    >
                      {ev.statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        void updateSubject(sub.id, {
                          status: sub.status === 'active' ? 'completed' : 'active',
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium whitespace-nowrap cursor-pointer"
                    >
                      {sub.status === 'active' ? 'Concluir' : 'Reabrir'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setActiveSection('cronometro-pomodoro');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Estudar</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create Subject Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Adicionar Nova Disciplina"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Nova Disciplina</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleCreateSubject(e)} className="flex flex-col gap-3">
              <div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Código
                  </label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ES-401"
                    maxLength={24}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nome da Disciplina
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Engenharia de Requisitos"
                  maxLength={120}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Professor(a)
                </label>
                <input
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="Ex.: Prof. Marcos Oliveira"
                  maxLength={100}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Horário das Aulas
                </label>
                <input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Ex.: Ter / Qui · 14:00 - 16:00"
                  maxLength={80}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Salvar Disciplina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
