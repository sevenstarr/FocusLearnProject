'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Calculator, Trash2, Clock, GraduationCap, X, Play, Save } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { calculateGrade, createAssessment, defaultApprovalRules } from '@/lib/seedData';
import { ApprovalRules, Assessment, GradingMethod, Subject } from '@/lib/types';

const inputClass = 'w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700';
const labelClass = 'block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1';

function GradeSetup({ gradeMax, method, rules, onGradeMax, onMethod, onRules }: {
  gradeMax: number; method: GradingMethod; rules: ApprovalRules;
  onGradeMax: (value: number) => void; onMethod: (value: GradingMethod) => void;
  onRules: (value: ApprovalRules) => void;
}) {
  const updateRule = (key: keyof ApprovalRules, value: number) => onRules({ ...rules, [key]: value });
  return <>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <label className={labelClass}>Nota máxima da matéria<input aria-label="Nota máxima da matéria" className={`${inputClass} mt-1`} type="number" min="0.01" step="0.1" value={gradeMax} onChange={(e) => onGradeMax(Math.max(0.01, Number(e.target.value) || 0.01))} /></label>
      <label className={labelClass}>Cálculo das avaliações<select className={`${inputClass} mt-1`} value={method} onChange={(e) => onMethod(e.target.value as GradingMethod)}><option value="normalized">Normalizar pela soma dos máximos</option><option value="sum">Somar pontos diretamente</option><option value="weighted">Usar pesos percentuais</option></select></label>
    </div>
    <details className="pt-2">
      <summary className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400">Critérios de aprovação e prova final</summary>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3">
        <label className={labelClass}>Aprovação direta<input className={`${inputClass} mt-1`} type="number" min="0" max={gradeMax} step="0.1" value={rules.directThreshold} onChange={(e) => updateRule('directThreshold', Math.max(0, Number(e.target.value) || 0))} /></label>
        <label className={labelClass}>Mínimo para fazer final<input className={`${inputClass} mt-1`} type="number" min="0" max={gradeMax} step="0.1" value={rules.finalEligibilityThreshold} onChange={(e) => updateRule('finalEligibilityThreshold', Math.max(0, Number(e.target.value) || 0))} /></label>
        <label className={labelClass}>Meta após a final<input className={`${inputClass} mt-1`} type="number" min="0" max={gradeMax} step="0.1" value={rules.finalTarget} onChange={(e) => updateRule('finalTarget', Math.max(0, Number(e.target.value) || 0))} /></label>
        <label className={labelClass}>Máximo da prova final<input className={`${inputClass} mt-1`} type="number" min="0.01" step="0.1" value={rules.finalMaxScore} onChange={(e) => updateRule('finalMaxScore', Math.max(0.01, Number(e.target.value) || 0.01))} /></label>
        <label className={labelClass}>Peso da final (%)<input className={`${inputClass} mt-1`} type="number" min="0" max="100" step="1" value={rules.finalWeight} onChange={(e) => updateRule('finalWeight', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} /></label>
      </div>
    </details>
  </>;
}

function AssessmentList({ assessments, method, onChange, onAdd, onRemove }: {
  assessments: Assessment[]; method: GradingMethod;
  onChange: (index: number, key: keyof Assessment, value: string | number) => void;
  onAdd: () => void; onRemove: (id: string) => void;
}) {
  return <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between"><h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Avaliações</h4><button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"><Plus className="w-3.5 h-3.5" />Adicionar</button></div>
    {assessments.length === 0 && <p className="text-xs text-slate-500">Nenhuma avaliação. Adicione uma para calcular a média.</p>}
    {assessments.map((item, index) => <div key={item.id} className="grid grid-cols-[minmax(75px,1.2fr)_repeat(2,minmax(65px,0.7fr))_auto_auto] gap-2 items-end rounded-lg bg-slate-50 dark:bg-slate-800/70 p-2">
      <label className={labelClass}>Nome<input aria-label={`Nome da avaliação ${index + 1}`} className={`${inputClass} mt-1`} maxLength={80} value={item.name} onChange={(e) => onChange(index, 'name', e.target.value)} /></label>
      <label className={labelClass}>Nota obtida<input aria-label={`Nota obtida ${item.name}`} className={`${inputClass} mt-1`} type="number" min="0" max={item.maxScore} step="0.1" value={item.score} onChange={(e) => onChange(index, 'score', Number(e.target.value) || 0)} /></label>
      <label className={labelClass}>Nota máxima<input aria-label={`Nota máxima ${item.name}`} className={`${inputClass} mt-1`} type="number" min="0.01" step="0.1" value={item.maxScore} onChange={(e) => onChange(index, 'maxScore', Math.max(0.01, Number(e.target.value) || 0.01))} /></label>
      {method === 'weighted' && <label className={labelClass}>Peso %<input aria-label={`Peso percentual ${item.name}`} className={`${inputClass} mt-1`} type="number" min="0" max="100" step="1" value={item.weight} onChange={(e) => onChange(index, 'weight', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} /></label>}
      <span className="pb-2 text-xs text-slate-500">/{item.maxScore}</span>
      <button type="button" aria-label={`Remover avaliação ${item.name}`} onClick={() => onRemove(item.id)} className="mb-1 p-1.5 rounded-md text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
    </div>)}
    {method === 'weighted' && <p className="text-[11px] text-slate-500">Pesos atuais: {assessments.reduce((sum, a) => sum + a.weight, 0)}% (devem totalizar 100%).</p>}
  </div>;
}

function GradeResult({ evaluation, gradeMax, finalMaxScore }: { evaluation: ReturnType<typeof calculateGrade>; gradeMax: number; finalMaxScore: number }) {
  const tone = evaluation.tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : evaluation.tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
    <p className="text-sm"><span className="text-slate-500">Média:</span> <strong className="font-mono">{evaluation.average.toFixed(1)} / {gradeMax}</strong></p>
    <p className={`text-xs font-semibold ${tone}`}>{evaluation.statusLabel}</p>
    {evaluation.valid && evaluation.neededPF !== null && evaluation.neededPF > 0 && <p className="text-xs text-slate-600 dark:text-slate-300">{evaluation.canReachTarget ? `Necessário na PF: ${evaluation.neededPF.toFixed(1)} / ${finalMaxScore}` : `A meta exige ${evaluation.neededPF.toFixed(1)} na PF, acima do máximo ${finalMaxScore}.`}</p>}
  </div>;
}

export function SubjectsView() {
  const { subjects, searchQuery, addSubject, updateSubject, deleteSubject, setSelectedSubjectId, setActiveSection } = useFocus();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [schedule, setSchedule] = useState('');
  const [simulatorSubjectId, setSimulatorSubjectId] = useState('');
  const [simConfig, setSimConfig] = useState<{ assessments: Assessment[]; gradeMax: number; gradingMethod: GradingMethod; approvalRules: ApprovalRules }>(() => ({ assessments: [], gradeMax: 10, gradingMethod: 'normalized', approvalRules: defaultApprovalRules(10) }));

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subjects.filter((s) => (statusFilter === 'all' || s.status === statusFilter) && (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.professor.toLowerCase().includes(q)));
  }, [subjects, statusFilter, searchQuery]);
  const evaluations = useMemo(() => subjects.map((s) => calculateGrade(s.assessments, s.gradeMax, s.gradingMethod, s.approvalRules)), [subjects]);
  const summary = useMemo(() => {
    const active = subjects.map((s, i) => ({ subject: s, evaluation: evaluations[i] })).filter(({ subject }) => subject.status === 'active');
    const totalHours = subjects.reduce((acc, s) => acc + s.hoursStudied, 0);
    const avgPct = active.length ? active.reduce((sum, { subject, evaluation }) => sum + (subject.gradeMax > 0 ? evaluation.average / subject.gradeMax * 100 : 0), 0) / active.length : 0;
    const finalExams = active.filter(({ evaluation }) => evaluation.neededPF !== null && evaluation.neededPF > 0).length;
    return { totalHours: totalHours.toFixed(1), avg: avgPct.toFixed(1), finalExams };
  }, [subjects, evaluations]);
  const simEvaluation = calculateGrade(simConfig.assessments, simConfig.gradeMax, simConfig.gradingMethod, simConfig.approvalRules);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    await addSubject({ code, name, professor: professor || 'A definir', schedule: schedule || 'Horário flexível', assessments: [], gradeMax: 10, gradingMethod: 'normalized', approvalRules: defaultApprovalRules(10), hoursStudied: 0, status: 'active' });
    setCode(''); setName(''); setProfessor(''); setSchedule(''); setModalOpen(false);
  };

  const updateAssessment = (subject: Subject, index: number, key: keyof Assessment, value: string | number) => {
    const assessments = subject.assessments.map((item, i) => i === index ? { ...item, [key]: key === 'name' ? String(value).slice(0, 80) : Number(value), ...(key === 'maxScore' ? { score: Math.min(item.score, Number(value) || 0) } : {}) } : item);
    void updateSubject(subject.id, { assessments });
  };
  const updateGradeMax = (subject: Subject, value: number) => {
    const ratio = value / subject.gradeMax;
    const approvalRules = { ...subject.approvalRules, directThreshold: subject.approvalRules.directThreshold * ratio, finalEligibilityThreshold: subject.approvalRules.finalEligibilityThreshold * ratio, finalTarget: subject.approvalRules.finalTarget * ratio, finalMaxScore: subject.approvalRules.finalMaxScore * ratio };
    void updateSubject(subject.id, { gradeMax: value, approvalRules });
  };
  const selectSimulatorSubject = (id: string) => {
    setSimulatorSubjectId(id);
    const subject = subjects.find((s) => s.id === id);
    setSimConfig(subject ? { assessments: subject.assessments.map((a) => ({ ...a })), gradeMax: subject.gradeMax, gradingMethod: subject.gradingMethod, approvalRules: { ...subject.approvalRules } } : { assessments: [], gradeMax: 10, gradingMethod: 'normalized', approvalRules: defaultApprovalRules(10) });
  };
  const updateSimAssessment = (index: number, key: keyof Assessment, value: string | number) => setSimConfig((prev) => ({ ...prev, assessments: prev.assessments.map((item, i) => i === index ? { ...item, [key]: key === 'name' ? String(value) : Number(value), ...(key === 'maxScore' ? { score: Math.min(item.score, Number(value) || 0) } : {}) } : item) }));
  const updateSimGradeMax = (value: number) => setSimConfig((prev) => {
    const ratio = value / prev.gradeMax;
    return { ...prev, gradeMax: value, approvalRules: { ...prev.approvalRules, directThreshold: prev.approvalRules.directThreshold * ratio, finalEligibilityThreshold: prev.approvalRules.finalEligibilityThreshold * ratio, finalTarget: prev.approvalRules.finalTarget * ratio, finalMaxScore: prev.approvalRules.finalMaxScore * ratio } };
  });

  return <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Semestre Letivo · Gestão de Disciplinas</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-0.5">Matérias & Cursos</h1><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Gerencie avaliações, escalas de notas e seus critérios de aprovação.</p></div><button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"><Plus className="w-4 h-4" />Nova Matéria</button></div>

    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4"><div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4"><p className="text-xs text-slate-500 font-medium">Média Global</p><p className="font-mono text-2xl font-bold text-emerald-600 mt-1">{summary.avg}<span className="text-xs font-normal text-slate-500">%</span></p></div><div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4"><p className="text-xs text-slate-500 font-medium">Em Prova Final</p><p className="font-mono text-2xl font-bold text-amber-600 mt-1">{summary.finalExams}</p></div><div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4"><p className="text-xs text-slate-500 font-medium">Horas Estudadas</p><p className="font-mono text-2xl font-bold text-blue-600 mt-1">{summary.totalHours}h</p></div></div>

    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-600" /><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Simulador de Média & Aprovação</h2></div>
      <label className={labelClass}>Usar configuração de uma matéria<select className={`${inputClass} mt-1 max-w-md`} value={simulatorSubjectId} onChange={(e) => selectSimulatorSubject(e.target.value)}><option value="">Simulação independente</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}</select></label>
      <p className="text-xs text-slate-500">A simulação começa com as notas e regras atuais; edições aqui não alteram a matéria.</p>
      <GradeSetup gradeMax={simConfig.gradeMax} method={simConfig.gradingMethod} rules={simConfig.approvalRules} onGradeMax={updateSimGradeMax} onMethod={(gradingMethod) => setSimConfig((p) => ({ ...p, gradingMethod }))} onRules={(approvalRules) => setSimConfig((p) => ({ ...p, approvalRules }))} />
      <AssessmentList assessments={simConfig.assessments} method={simConfig.gradingMethod} onChange={updateSimAssessment} onAdd={() => setSimConfig((p) => ({ ...p, assessments: [...p.assessments, createAssessment(`Avaliação ${p.assessments.length + 1}`, p.gradeMax)] }))} onRemove={(id) => setSimConfig((p) => ({ ...p, assessments: p.assessments.filter((a) => a.id !== id) }))} />
      <GradeResult evaluation={simEvaluation} gradeMax={simConfig.gradeMax} finalMaxScore={simConfig.approvalRules.finalMaxScore} />
    </section>

    <div className="flex items-center justify-between flex-wrap gap-3"><div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{([{ id: 'all', label: 'Todas' }, { id: 'active', label: 'Ativas' }, { id: 'completed', label: 'Concluídas' }] as const).map((tab) => <button key={tab.id} type="button" onClick={() => setStatusFilter(tab.id)} className={`px-3.5 py-1.5 text-xs font-semibold rounded-md ${statusFilter === tab.id ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600'}`}>{tab.label}</button>)}</div><span className="text-xs text-slate-500">{filteredSubjects.length} disciplina(s) exibida(s)</span></div>

    {filteredSubjects.length === 0 ? <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center"><GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm font-semibold">Nenhuma matéria encontrada</p><p className="text-xs text-slate-500 mt-1">Adicione sua primeira disciplina ou limpe os filtros atuais.</p></div> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{filteredSubjects.map((sub) => {
      const evaluation = calculateGrade(sub.assessments, sub.gradeMax, sub.gradingMethod, sub.approvalRules);
      const setRules = (approvalRules: ApprovalRules) => void updateSubject(sub.id, { approvalRules });
      return <article key={sub.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-xs text-slate-500"><span className="font-mono font-semibold text-blue-600">{sub.code}</span><span>·</span><span>{sub.schedule}</span></div><h3 className="text-base font-bold mt-1 truncate">{sub.name}</h3><p className="text-xs text-slate-500 mt-0.5">{sub.professor}</p></div><button type="button" onClick={() => void deleteSubject(sub.id)} aria-label={`Remover ${sub.name}`} className="p-2 rounded-lg text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
        <GradeSetup gradeMax={sub.gradeMax} method={sub.gradingMethod} rules={sub.approvalRules} onGradeMax={(value) => updateGradeMax(sub, value)} onMethod={(gradingMethod) => void updateSubject(sub.id, { gradingMethod })} onRules={setRules} />
        <AssessmentList assessments={sub.assessments} method={sub.gradingMethod} onChange={(index, key, value) => updateAssessment(sub, index, key, value)} onAdd={() => void updateSubject(sub.id, { assessments: [...sub.assessments, createAssessment(`Avaliação ${sub.assessments.length + 1}`, sub.gradeMax)] })} onRemove={(id) => void updateSubject(sub.id, { assessments: sub.assessments.filter((a) => a.id !== id) })} />
        <GradeResult evaluation={evaluation} gradeMax={sub.gradeMax} finalMaxScore={sub.approvalRules.finalMaxScore} />
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs"><span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><Clock className="w-3.5 h-3.5 text-blue-600" />{sub.hoursStudied.toFixed(1)}h estudadas</span><div className="flex items-center gap-2"><button type="button" onClick={() => void updateSubject(sub.id, { status: sub.status === 'active' ? 'completed' : 'active' })} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">{sub.status === 'active' ? 'Concluir' : 'Reabrir'}</button><button type="button" onClick={() => { setSelectedSubjectId(sub.id); setActiveSection('cronometro-pomodoro'); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"><Play className="w-3 h-3" />Estudar</button></div></div>
      </article>;
    })}</div>}

    {modalOpen && <div role="dialog" aria-modal="true" aria-label="Adicionar Nova Disciplina" className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl"><div className="flex items-center justify-between pb-3 border-b mb-4"><h2 className="text-lg font-bold flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600" />Nova Disciplina</h2><button type="button" onClick={() => setModalOpen(false)} aria-label="Fechar modal"><X className="w-4 h-4" /></button></div><form onSubmit={(e) => void handleCreateSubject(e)} className="flex flex-col gap-3">{([{ label: 'Código', value: code, set: setCode, placeholder: 'ES-401', max: 24 }, { label: 'Nome da Disciplina', value: name, set: setName, placeholder: 'Ex.: Engenharia de Requisitos', max: 120 }, { label: 'Professor(a)', value: professor, set: setProfessor, placeholder: 'Nome do professor', max: 100 }, { label: 'Horário das Aulas', value: schedule, set: setSchedule, placeholder: 'Ter / Qui · 14:00 - 16:00', max: 80 }] as const).map((field) => <label key={field.label} className="text-xs font-semibold text-slate-600 dark:text-slate-400">{field.label}<input required={field.label === 'Código' || field.label === 'Nome da Disciplina'} value={field.value} onChange={(e) => field.set(e.target.value)} placeholder={field.placeholder} maxLength={field.max} className={`${inputClass} mt-1 px-3 py-2`} /></label>)}<div className="flex justify-end gap-2 mt-3 pt-3 border-t"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border text-sm">Cancelar</button><button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold inline-flex gap-2 items-center"><Save className="w-4 h-4" />Salvar Disciplina</button></div></form></div></div>}
  </div>;
}
