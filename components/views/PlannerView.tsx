'use client';

import React, { useMemo, useState } from 'react';
import { CalendarDays, Plus, Trash2, X } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { ScheduleType } from '@/lib/types';

const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const TYPE_STYLES: Record<ScheduleType, string> = {
  aula: 'bg-blue-600 text-white border-blue-700',
  revisao: 'bg-emerald-600 text-white border-emerald-700',
  pausa: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600',
  prova: 'bg-amber-600 text-white border-amber-700',
};

const TYPE_LABELS: Record<ScheduleType, string> = {
  aula: 'Aula',
  revisao: 'Revisão',
  pausa: 'Pausa',
  prova: 'Prova',
};

export function PlannerView() {
  const { schedule, subjects, addScheduleBlock, deleteScheduleBlock } = useFocus();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dayIndex, setDayIndex] = useState(0);
  const [startHour, setStartHour] = useState(14);
  const [endHour, setEndHour] = useState(16);
  const [type, setType] = useState<ScheduleType>('revisao');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');

  const [filterType, setFilterType] = useState<'all' | ScheduleType>('all');

  const visibleBlocks = useMemo(
    () => (filterType === 'all' ? schedule : schedule.filter((b) => b.type === filterType)),
    [schedule, filterType]
  );

  const openSlotModal = (day: number, hour: number) => {
    setDayIndex(day);
    setStartHour(hour);
    setEndHour(Math.min(22, hour + 1));
    setSubjectId(subjects[0]?.id || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const sub = subjects.find((s) => s.id === subjectId);
    await addScheduleBlock({
      title,
      dayIndex,
      startHour,
      endHour: Math.max(startHour + 1, endHour),
      type,
      subjectId: sub?.id || '',
      subjectName: sub?.name || 'Estudo Geral',
    });
    setTitle('');
    setModalOpen(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Organização Semanal · Clique em um horário para agendar
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
            Planejador Semanal
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gerencie seus blocos de aula, sessões de revisão e datas de provas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openSlotModal(0, 14)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Sessão</span>
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Todos
          </button>
          {(['aula', 'revisao', 'prova', 'pausa'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterType === t
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {visibleBlocks.length} bloco(s) na grade
        </span>
      </div>

      {/* Schedule Grid */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[64px_repeat(7,1fr)] gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-center text-xs font-semibold">
            <div className="text-slate-400 py-2">Hora</div>
            {DAYS.map((day, idx) => {
              const jsDay = new Date().getDay();
              const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
              const isToday = idx === todayIdx;
              return (
                <div
                  key={day}
                  className={`py-2 rounded-lg ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[64px_repeat(7,1fr)] gap-1.5 py-1.5 min-h-[54px]">
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center tabular-nums">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {DAYS.map((_, dIdx) => {
                  const blocksHere = visibleBlocks.filter(
                    (b) => b.dayIndex === dIdx && hour >= b.startHour && hour < b.endHour
                  );
                  if (blocksHere.length === 0) {
                    return (
                      <button
                        key={dIdx}
                        type="button"
                        onClick={() => openSlotModal(dIdx, hour)}
                        aria-label={`Agendar em ${DAYS[dIdx]} às ${hour}:00`}
                        className="rounded-lg border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      />
                    );
                  }
                  const block = blocksHere[0];
                  const isStart = block.startHour === hour;
                  return (
                    <div
                      key={dIdx}
                      className={`rounded-lg px-2 py-1.5 border text-xs flex items-center justify-between gap-1 ${TYPE_STYLES[block.type]}`}
                    >
                      <span className="font-medium truncate">
                        {isStart ? block.title : `${block.title} (cont.)`}
                      </span>
                      {isStart && (
                        <button
                          type="button"
                          onClick={() => void deleteScheduleBlock(block.id)}
                          aria-label={`Remover bloco ${block.title}`}
                          className="p-0.5 rounded opacity-80 hover:opacity-100 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Create Schedule Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Agendar Sessão de Estudo"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Agendar Sessão</span>
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

            <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Título do Bloco
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Revisão P2 Cálculo"
                  maxLength={120}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Dia da Semana
                  </label>
                  <select
                    value={dayIndex}
                    onChange={(e) => setDayIndex(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  >
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tipo
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ScheduleType)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  >
                    <option value="aula">Aula</option>
                    <option value="revisao">Revisão</option>
                    <option value="prova">Prova</option>
                    <option value="pausa">Pausa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Hora Início (8–20)
                  </label>
                  <input
                    type="number"
                    min={8}
                    max={20}
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Hora Fim (9–21)
                  </label>
                  <input
                    type="number"
                    min={9}
                    max={21}
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Matéria Associada
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                  {subjects.length === 0 && <option value="">Estudo Geral</option>}
                </select>
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
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
