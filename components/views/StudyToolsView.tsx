'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Clock3, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useFocus } from '@/components/FocusProvider';

type ReviewCard = {
  id: string;
  front: string;
  back: string;
  dueAt: number;
  intervalDays: number;
  ease: number;
  repetitions: number;
};

function storageKey(uid: string) {
  return `focuslearn_review_cards_v1:${uid}`;
}

function estimateAverage(subject: { assessments: { score: number; maxScore: number; weight: number }[] }) {
  const valid = subject.assessments.filter((assessment) => assessment.maxScore > 0);
  if (!valid.length) return 0.5;
  const totalWeight = valid.reduce((sum, assessment) => sum + assessment.weight, 0);
  if (!totalWeight) return 0.5;
  return valid.reduce(
    (sum, assessment) => sum + (assessment.score / assessment.maxScore) * assessment.weight,
    0
  ) / totalWeight;
}

export function StudyToolsView() {
  const { user } = useAuth();
  const { subjects, profile } = useFocus();
  const uid = user?.uid || 'local-preview';
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loadedForUid, setLoadedForUid] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => { window.clearTimeout(initialUpdate); window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(uid)) || '[]');
        if (Array.isArray(parsed)) setCards(parsed.filter((card) =>
          card && typeof card.id === 'string' && typeof card.front === 'string' && typeof card.back === 'string'
        ));
      } catch {
        setCards([]);
      }
      setLoadedForUid(uid);
    });
    return () => { active = false; };
  }, [uid]);

  useEffect(() => {
    if (loadedForUid !== uid) return;
    try { localStorage.setItem(storageKey(uid), JSON.stringify(cards)); } catch { /* storage may be full */ }
  }, [cards, loadedForUid, uid]);

  const priorities = useMemo(() => {
    const active = subjects.filter((subject) => subject.status === 'active');
    const weighted = active.map((subject) => {
      const gradeGap = Math.max(0.15, 1 - estimateAverage(subject));
      const lowPractice = 1 / (1 + Math.max(0, subject.hoursStudied));
      return { subject, weight: gradeGap + lowPractice * 0.35 };
    });
    const dailyMinutes = Math.max(30, Math.round(profile.dailyGoalHours * 60));
    const selected = weighted.sort((a, b) => b.weight - a.weight).slice(0, Math.min(5, Math.floor(dailyMinutes / 15)));
    const totalWeight = selected.reduce((sum, item) => sum + item.weight, 0) || 1;
    const extraSlots = Math.max(0, Math.floor(dailyMinutes / 15) - selected.length);
    const allocations = selected.map(({ subject, weight }) => {
        const slots = Math.floor((extraSlots * weight) / totalWeight);
        return { subject, slots, average: estimateAverage(subject) };
      });
    const allocatedSlots = allocations.reduce((sum, item) => sum + item.slots, 0);
    return allocations
      .map((item, index) => ({
        ...item,
        minutes: (1 + item.slots + (index < extraSlots - allocatedSlots ? 1 : 0)) * 15,
      }))
      .sort((a, b) => a.average - b.average || a.subject.hoursStudied - b.subject.hoursStudied)
      .map(({ subject, minutes, average }) => ({ subject, minutes, average }));
  }, [subjects, profile.dailyGoalHours]);

  const dueCards = useMemo(() => cards.filter((card) => card.dueAt <= now), [cards, now]);

  const addCard = (event: FormEvent) => {
    event.preventDefault();
    const cleanFront = front.trim();
    const cleanBack = back.trim();
    if (!cleanFront || !cleanBack) return;
    setCards((previous) => [{
      id: crypto.randomUUID(), front: cleanFront, back: cleanBack,
      dueAt: Date.now(), intervalDays: 0, ease: 2.5, repetitions: 0,
    }, ...previous]);
    setFront('');
    setBack('');
  };

  const rateCard = (card: ReviewCard, rating: 'again' | 'hard' | 'good' | 'easy') => {
    const now = Date.now();
    const next = { ...card };
    if (rating === 'again') {
      next.repetitions = 0;
      next.intervalDays = 0;
      next.dueAt = now + 10 * 60_000;
    } else {
      if (rating === 'hard') {
        next.ease = Math.max(1.3, next.ease - 0.15);
        next.intervalDays = Math.max(1, next.intervalDays * 1.2 || 1);
      } else if (rating === 'easy') {
        next.ease += 0.15;
        next.intervalDays = Math.max(4, next.intervalDays * next.ease * 1.3 || 4);
      } else {
        next.intervalDays = next.repetitions === 0 ? 1 : next.repetitions === 1 ? 6 : next.intervalDays * next.ease;
      }
      next.repetitions += 1;
      next.dueAt = now + Math.round(next.intervalDays * 86_400_000);
    }
    setCards((previous) => previous.map((item) => item.id === card.id ? next : item));
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Planejamento e recuperação ativa</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Estudos Inteligentes</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Sugestões de foco e cartões com revisão espaçada, salvos neste dispositivo.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-blue-600" /><h2 className="font-bold">Plano de foco para hoje</h2></div>
        {priorities.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {priorities.map(({ subject, minutes, average }, index) => <article key={subject.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Prioridade {index + 1}</p>
            <h3 className="mt-1 font-semibold">{subject.code} · {subject.name}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Reserve cerca de {minutes} min · desempenho atual estimado: {Math.round(average * 100)}%</p>
          </article>)}
        </div> : <p className="text-sm text-slate-500">Cadastre matérias para receber uma sugestão de distribuição.</p>}
        <p className="mt-4 text-xs text-slate-500">Estimativa baseada nas notas registradas, horas estudadas e meta diária. Ajuste os blocos conforme suas provas e disponibilidade.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={addCard} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-600" /><h2 className="font-bold">Criar cartão de revisão</h2></div>
          <label className="text-xs font-semibold">Pergunta<textarea value={front} onChange={(event) => setFront(event.target.value)} maxLength={500} required rows={3} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Qual é a ideia principal...?" /></label>
          <label className="text-xs font-semibold">Resposta<textarea value={back} onChange={(event) => setBack(event.target.value)} maxLength={1000} required rows={4} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Explique com suas palavras..." /></label>
          <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Salvar cartão</button>
          <p className="text-xs text-slate-500">Os cartões ficam no armazenamento local deste navegador e perfil.</p>
        </form>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-amber-600" /><h2 className="font-bold">Para revisar agora</h2></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{dueCards.length} pendentes</span></div>
          {dueCards.length ? dueCards.slice(0, 8).map((card) => <ReviewCardItem key={card.id} card={card} onRate={rateCard} />) : <div className="rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-800/60"><Sparkles className="mx-auto h-6 w-6 text-emerald-500" /><p className="mt-2 text-sm font-medium">Tudo revisado por enquanto.</p><p className="mt-1 text-xs text-slate-500">Crie cartões para praticar recuperação ativa.</p></div>}
        </div>
      </section>
    </div>
  );
}

function ReviewCardItem({ card, onRate }: { card: ReviewCard; onRate: (card: ReviewCard, rating: 'again' | 'hard' | 'good' | 'easy') => void }) {
  const [revealed, setRevealed] = useState(false);
  return <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
    <p className="text-sm font-semibold">{card.front}</p>
    {revealed ? <><p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">{card.back}</p><div className="mt-3 flex flex-wrap gap-2">{([['again', 'Errei'], ['hard', 'Difícil'], ['good', 'Lembrei'], ['easy', 'Fácil']] as const).map(([rating, label]) => <button key={rating} type="button" onClick={() => { onRate(card, rating); setRevealed(false); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-blue-400 dark:border-slate-700">{label}</button>)}</div></> : <button type="button" onClick={() => setRevealed(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"><RotateCcw className="h-3.5 w-3.5" />Mostrar resposta</button>}
  </article>;
}
