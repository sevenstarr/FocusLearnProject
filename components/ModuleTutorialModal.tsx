'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, SkipForward, X } from 'lucide-react';
import type { NavSection } from '@/lib/types';

type TutorialStep = { title: string; description: string };

const TUTORIALS: Record<NavSection, { title: string; intro: string; steps: TutorialStep[] }> = {
  'visao-geral': {
    title: 'Visão Geral',
    intro: 'Seu resumo diário e os atalhos para começar a estudar.',
    steps: [
      { title: 'Acompanhe seu ritmo', description: 'Veja suas horas estudadas, sequência de dias e progresso da meta diária nos indicadores do painel.' },
      { title: 'Comece uma sessão', description: 'Use o Pomodoro rápido para iniciar um ciclo de foco. Você pode escolher uma matéria e registrar a sessão ao concluí-la.' },
      { title: 'Organize pequenas tarefas', description: 'Adicione microtarefas para manter próximas ações visíveis e marque cada uma quando terminar.' },
    ],
  },
  'materias-cursos': {
    title: 'Matérias & Cursos',
    intro: 'Organize disciplinas e acompanhe seu desempenho acadêmico.',
    steps: [
      { title: 'Cadastre uma matéria', description: 'Use “Nova Matéria” para incluir nome, código e informações da disciplina.' },
      { title: 'Acompanhe notas e estudo', description: 'Atualize P1 e P2 para ver a média e a situação calculadas. As sessões vinculadas também somam horas estudadas.' },
      { title: 'Inicie o foco pela matéria', description: 'Escolha uma disciplina e use o atalho de Pomodoro para começar uma sessão já vinculada a ela.' },
    ],
  },
  'cronometro-pomodoro': {
    title: 'Cronômetro Pomodoro',
    intro: 'Alterne períodos de foco e pausas para estudar com ritmo.',
    steps: [
      { title: 'Escolha matéria e ciclo', description: 'Selecione a matéria em estudo e escolha um ciclo Pomodoro, Ultra Foco ou pausa.' },
      { title: 'Inicie o cronômetro', description: 'Use iniciar e pausar conforme sua rotina. A sessão concluída pode ser registrada no histórico.' },
      { title: 'Personalize o ambiente', description: 'Ative sons ambientes e ajuste o volume. O Modo Zen amplia o timer para reduzir distrações.' },
    ],
  },
  'loja': {
    title: 'Loja de Cosméticos',
    intro: 'Personalize a aparência do seu espaço de estudos.',
    steps: [
      { title: 'Explore o catálogo', description: 'Veja temas e avatares disponíveis junto ao custo em créditos.' },
      { title: 'Ganhe créditos estudando', description: 'Sessões de estudo concluídas podem gerar créditos para usar na loja.' },
      { title: 'Equipe seus itens', description: 'Os cosméticos adquiridos ficam no seu inventário. Escolha um para aplicar ao seu perfil.' },
    ],
  },
  'planejador-semanal': {
    title: 'Planejador Semanal',
    intro: 'Monte uma grade semanal, importe eventos .ics e exporte seus horários para outros calendários.',
    steps: [
      { title: 'Adicione um bloco', description: 'Clique em “Nova Sessão” ou em um horário vazio para agendar uma atividade.' },
      { title: 'Defina os detalhes', description: 'Informe título, dia, horário, categoria e, se quiser, associe uma matéria.' },
      { title: 'Revise sua semana', description: 'Use os filtros por categoria, importe calendários .ics de até 40 eventos ou exporte sua grade para outro aplicativo.' },
    ],
  },
  'estatisticas-metas': {
    title: 'Estatísticas & Metas',
    intro: 'Visualize seu esforço e transforme objetivos em progresso acompanhado.',
    steps: [
      { title: 'Entenda suas estatísticas', description: 'Acompanhe a distribuição das horas estudadas por matéria e consulte seus registros.' },
      { title: 'Crie uma meta', description: 'Defina um objetivo, categoria, unidade, valor desejado e prazo para o semestre.' },
      { title: 'Atualize e compartilhe', description: 'Registre o progresso ao longo do tempo e use “Exportar PDF” para imprimir ou guardar um resumo.' },
    ],
  },
  anotacoes: {
    title: 'Anotações & Cadernos',
    intro: 'Guarde resumos e materiais organizados em cadernos pesquisáveis.',
    steps: [
      { title: 'Crie uma anotação', description: 'Use “Nova Nota” para definir título e, opcionalmente, associar uma matéria.' },
      { title: 'Escreva em Markdown', description: 'Formate o conteúdo com títulos e listas. A pré-visualização mostra como o texto ficará.' },
      { title: 'Pratique o conteúdo', description: 'Além da busca e das tags, gere um quiz com Gemini a partir da nota selecionada; o conteúdo será enviado ao Google após sua ação.' },
    ],
  },
  'estudos-inteligentes': {
    title: 'Estudos Inteligentes',
    intro: 'Monte um plano de foco e pratique recuperação ativa com revisões espaçadas.',
    steps: [
      { title: 'Priorize matérias', description: 'O plano sugere mais tempo para matérias com menor desempenho e menos horas estudadas.' },
      { title: 'Crie cartões', description: 'Escreva perguntas e respostas curtas para revisar conceitos importantes.' },
      { title: 'Revise no intervalo certo', description: 'Avalie como foi lembrar cada resposta. O intervalo cresce quando a lembrança fica fácil.' },
    ],
  },
  comunidade: {
    title: 'Comunidade & Chat',
    intro: 'Converse nos canais de estudo ou encontre uma sala de foco com metas compartilhadas.',
    steps: [
      { title: 'Escolha um canal ou sala', description: 'Entre no canal relacionado ao assunto, crie uma sala de foco ou participe de uma sala ativa para acompanhar a meta do grupo.' },
      { title: 'Envie uma mensagem', description: 'Escreva no campo de mensagem e envie para participar da conversa.' },
      { title: 'Gerencie suas mensagens', description: 'Você pode remover as próprias mensagens quando precisar corrigir ou retirar algo.' },
    ],
  },
  'configuracoes-ajuda': {
    title: 'Configurações & Perfil',
    intro: 'Mantenha suas informações e preferências atualizadas.',
    steps: [
      { title: 'Complete seu perfil', description: 'Atualize curso, instituição, semestre e outros dados acadêmicos.' },
      { title: 'Ajuste suas preferências', description: 'Defina sua meta diária e alterne entre tema claro e escuro.' },
      { title: 'Acesse sua conta', description: 'Entre ou crie uma conta para sincronizar seus dados e progresso entre dispositivos.' },
    ],
  },
};

export function ModuleTutorialModal({
  section,
  onClose,
}: {
  section: NavSection;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const tutorial = TUTORIALS[section];
  const step = tutorial.steps[stepIndex];
  const isLast = stepIndex === tutorial.steps.length - 1;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') setStepIndex((current) => Math.max(0, current - 1));
      if (event.key === 'ArrowRight') setStepIndex((current) => Math.min(tutorial.steps.length - 1, current + 1));
      if (event.key === 'Tab') {
        const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, tutorial.steps.length]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-description"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex min-w-0 gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Tutorial rápido</p>
              <h2 id="tutorial-title" className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">{tutorial.title}</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar tutorial"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-6 sm:px-6 sm:py-7" aria-live="polite">
          <p id="tutorial-description" className="text-sm leading-6 text-slate-600 dark:text-slate-300">{tutorial.intro}</p>
          <div className="mt-6 min-h-28 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70 sm:p-5">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Passo {stepIndex + 1} de {tutorial.steps.length}</p>
            <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
          </div>
          <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
            {tutorial.steps.map((item, index) => (
              <span key={item.title} className={`h-1.5 rounded-full transition-all ${index === stepIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-slate-700'}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            <SkipForward className="h-4 w-4" /> Pular tutorial
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              type="button"
              onClick={() => isLast ? onClose() : setStepIndex((current) => current + 1)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              {isLast ? <><Check className="h-4 w-4" /> Concluir</> : <>Próximo <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
