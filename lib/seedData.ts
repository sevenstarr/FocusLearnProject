import {
  Subject,
  QuickTask,
  PomodoroSession,
  ScheduleBlock,
  StudyNote,
  SemesterGoal,
  UserProfile,
  CommunityMessage,
} from './types';

export function getDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetDateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getDateKey(d);
}

export interface GradeEvaluation {
  average: number;
  statusLabel: string;
  tone: 'success' | 'warning' | 'danger';
  neededPF: number | null;
}

export function calculateUFCGrade(p1: number, p2: number): GradeEvaluation {
  const safeP1 = Math.max(0, Math.min(10, Number(p1) || 0));
  const safeP2 = Math.max(0, Math.min(10, Number(p2) || 0));
  const avg = Number(((safeP1 + safeP2) / 2).toFixed(1));

  if (avg >= 7.0) {
    return {
      average: avg,
      statusLabel: 'Aprovado Direto',
      tone: 'success',
      neededPF: 0,
    };
  }
  if (avg < 4.0) {
    return {
      average: avg,
      statusLabel: 'Reprovado por Média',
      tone: 'danger',
      neededPF: null,
    };
  }
  const needed = Math.max(0, Number((10 - avg).toFixed(1)));
  return {
    average: avg,
    statusLabel: `Prova Final (precisa ${needed.toFixed(1)})`,
    tone: 'warning',
    neededPF: needed,
  };
}

export function createDefaultProfile(
  uid: string,
  name = 'Mariana Silva',
  email = 'mariana.silva@universidade.edu.br'
): UserProfile {
  return {
    ownerId: uid,
    name: name.slice(0, 120),
    email: email.slice(0, 180),
    course: 'Engenharia de Software',
    university: 'Universidade Federal (UFC)',
    semester: '5º Semestre',
    registration: '2024.1.ES-0492',
    bio: 'Estudante focada em sistemas distribuídos, algoritmos e produtividade acadêmica.',
    dailyGoalHours: 5,
    pomoMinutes: 25,
    streak: 14,
    recordStreak: 21,
    theme: 'light',
  };
}

export function createStarterSubjects(uid: string): Subject[] {
  return [
    {
      id: 'sub-calc1',
      ownerId: uid,
      code: 'MAT-104',
      name: 'Cálculo Diferencial e Integral II',
      professor: 'Prof. Ricardo Alencar',
      schedule: 'Seg / Qua · 08:00 - 10:00',
      credits: 6,
      p1: 8.4,
      p2: 7.8,
      hoursStudied: 16.5,
      status: 'active',
    },
    {
      id: 'sub-eda',
      ownerId: uid,
      code: 'ES-208',
      name: 'Estruturas de Dados Avançadas',
      professor: 'Profa. Camila Nogueira',
      schedule: 'Ter / Qui · 10:00 - 12:00',
      credits: 6,
      p1: 9.0,
      p2: 8.6,
      hoursStudied: 14.0,
      status: 'active',
    },
    {
      id: 'sub-bd',
      ownerId: uid,
      code: 'ES-312',
      name: 'Banco de Dados Distribuídos',
      professor: 'Prof. Henrique Duarte',
      schedule: 'Ter / Qui · 14:00 - 16:00',
      credits: 4,
      p1: 6.2,
      p2: 6.8,
      hoursStudied: 9.5,
      status: 'active',
    },
    {
      id: 'sub-arq',
      ownerId: uid,
      code: 'ES-305',
      name: 'Arquitetura de Software',
      professor: 'Profa. Beatriz Mendes',
      schedule: 'Sex · 08:00 - 12:00',
      credits: 4,
      p1: 8.8,
      p2: 9.2,
      hoursStudied: 11.0,
      status: 'active',
    },
  ];
}

export function createStarterTasks(uid: string): QuickTask[] {
  return [
    {
      id: 'task-1',
      ownerId: uid,
      title: 'Resolver lista 04 de Integrais Múltiplas',
      completed: false,
      subjectId: 'sub-calc1',
    },
    {
      id: 'task-2',
      ownerId: uid,
      title: 'Implementar balanceamento em Árvore AVL',
      completed: true,
      subjectId: 'sub-eda',
    },
    {
      id: 'task-3',
      ownerId: uid,
      title: 'Revisar índices B+ e isolamento MVCC',
      completed: false,
      subjectId: 'sub-bd',
    },
  ];
}

export function createStarterSessions(uid: string): PomodoroSession[] {
  const now = Date.now();
  return [
    {
      id: 'sess-today-1',
      ownerId: uid,
      subjectId: 'sub-calc1',
      subjectName: 'Cálculo Diferencial e Integral II',
      mode: 'pomodoro25',
      durationMinutes: 25,
      dateKey: getDateKey(),
      createdAtMs: now - 1000 * 60 * 140,
    },
    {
      id: 'sess-today-2',
      ownerId: uid,
      subjectId: 'sub-eda',
      subjectName: 'Estruturas de Dados Avançadas',
      mode: 'ultra50',
      durationMinutes: 50,
      dateKey: getDateKey(),
      createdAtMs: now - 1000 * 60 * 75,
    },
    {
      id: 'sess-d1',
      ownerId: uid,
      subjectId: 'sub-calc1',
      subjectName: 'Cálculo Diferencial e Integral II',
      mode: 'ultra50',
      durationMinutes: 150,
      dateKey: getOffsetDateKey(1),
      createdAtMs: now - 86400000 * 1,
    },
    {
      id: 'sess-d2',
      ownerId: uid,
      subjectId: 'sub-eda',
      subjectName: 'Estruturas de Dados Avançadas',
      mode: 'ultra50',
      durationMinutes: 180,
      dateKey: getOffsetDateKey(2),
      createdAtMs: now - 86400000 * 2,
    },
    {
      id: 'sess-d3',
      ownerId: uid,
      subjectId: 'sub-bd',
      subjectName: 'Banco de Dados Distribuídos',
      mode: 'pomodoro25',
      durationMinutes: 120,
      dateKey: getOffsetDateKey(3),
      createdAtMs: now - 86400000 * 3,
    },
    {
      id: 'sess-d5',
      ownerId: uid,
      subjectId: 'sub-arq',
      subjectName: 'Arquitetura de Software',
      mode: 'ultra50',
      durationMinutes: 210,
      dateKey: getOffsetDateKey(5),
      createdAtMs: now - 86400000 * 5,
    },
    {
      id: 'sess-d7',
      ownerId: uid,
      subjectId: 'sub-calc1',
      subjectName: 'Cálculo Diferencial e Integral II',
      mode: 'ultra50',
      durationMinutes: 160,
      dateKey: getOffsetDateKey(7),
      createdAtMs: now - 86400000 * 7,
    },
    {
      id: 'sess-d10',
      ownerId: uid,
      subjectId: 'sub-eda',
      subjectName: 'Estruturas de Dados Avançadas',
      mode: 'pomodoro25',
      durationMinutes: 95,
      dateKey: getOffsetDateKey(10),
      createdAtMs: now - 86400000 * 10,
    },
    {
      id: 'sess-d14',
      ownerId: uid,
      subjectId: 'sub-bd',
      subjectName: 'Banco de Dados Distribuídos',
      mode: 'ultra50',
      durationMinutes: 200,
      dateKey: getOffsetDateKey(14),
      createdAtMs: now - 86400000 * 14,
    },
  ];
}

export function createStarterSchedule(uid: string): ScheduleBlock[] {
  return [
    {
      id: 'sched-1',
      ownerId: uid,
      title: 'Aula: Cálculo II',
      dayIndex: 0,
      startHour: 8,
      endHour: 10,
      type: 'aula',
      subjectId: 'sub-calc1',
      subjectName: 'Cálculo Diferencial e Integral II',
    },
    {
      id: 'sched-2',
      ownerId: uid,
      title: 'Revisão: Árvores AVL & Rubro-Negra',
      dayIndex: 1,
      startHour: 14,
      endHour: 16,
      type: 'revisao',
      subjectId: 'sub-eda',
      subjectName: 'Estruturas de Dados Avançadas',
    },
    {
      id: 'sched-3',
      ownerId: uid,
      title: 'Aula: Cálculo II',
      dayIndex: 2,
      startHour: 8,
      endHour: 10,
      type: 'aula',
      subjectId: 'sub-calc1',
      subjectName: 'Cálculo Diferencial e Integral II',
    },
    {
      id: 'sched-4',
      ownerId: uid,
      title: 'Prova P2: Banco de Dados',
      dayIndex: 3,
      startHour: 14,
      endHour: 16,
      type: 'prova',
      subjectId: 'sub-bd',
      subjectName: 'Banco de Dados Distribuídos',
    },
    {
      id: 'sched-5',
      ownerId: uid,
      title: 'Simulado Arquitetura Hexagonal',
      dayIndex: 4,
      startHour: 10,
      endHour: 12,
      type: 'revisao',
      subjectId: 'sub-arq',
      subjectName: 'Arquitetura de Software',
    },
  ];
}

export function createStarterNotes(uid: string): StudyNote[] {
  const now = Date.now();
  return [
    {
      id: 'note-1',
      ownerId: uid,
      title: 'Teorema de Green e Campos Vetoriais',
      subjectId: 'sub-calc1',
      subjectName: 'Cálculo Diferencial e Integral II',
      tags: ['resumo', 'formulas', 'p2'],
      content: `## Teorema de Green\n\nRelaciona uma **integral de linha** ao redor de uma curva fechada simples $C$ com uma **integral dupla** sobre a região plana $D$ delimitada por $C$.\n\n### Enunciado Principal\n- $C$ deve ser orientada no sentido **anti-horário** (positivo).\n- $P(x, y)$ e $Q(x, y)$ possuem derivadas parciais contínuas em uma região aberta contendo $D$.\n\n\`\`\`\n∮_C (P dx + Q dy) = ∬_D (∂Q/∂x - ∂P/∂y) dA\n\`\`\`\n\n### Checklist de Resolução\n1. Verificar se a curva é fechada e simples.\n2. Conferir a orientação (anti-horária = positiva).\n3. Calcular $\\partial Q/\\partial x - \\partial P/\\partial y$ antes de montar os limites de integração.`,
      updatedAtMs: now - 3600000 * 5,
    },
    {
      id: 'note-2',
      ownerId: uid,
      title: 'Complexidade Amortizada e Árvores B+',
      subjectId: 'sub-eda',
      subjectName: 'Estruturas de Dados Avançadas',
      tags: ['algoritmos', 'arvores'],
      content: `## Árvores B+ em Sistemas de Armazenamento\n\nDiferente da Árvore B tradicional, na **Árvore B+** todos os registros (ou ponteiros de dados) residem exclusivamente nos **nós folha**.\n\n### Vantagens para Banco de Dados\n- **Maior fator de ramificação** nos nós internos (menos acessos a disco).\n- Folhas encadeadas em lista ligada facilitam *range queries* (\`BETWEEN\`, \`>=\`).\n- Altura garantida em $O(\\log_B N)$.`,
      updatedAtMs: now - 3600000 * 24,
    },
  ];
}

export function createStarterGoals(uid: string): SemesterGoal[] {
  return [
    {
      id: 'goal-1',
      ownerId: uid,
      title: 'Completar 120 horas líquidas no semestre',
      category: 'Carga Horária',
      currentValue: 74,
      targetValue: 120,
      unit: 'h',
      deadline: '2026-12-18',
      status: 'active',
    },
    {
      id: 'goal-2',
      ownerId: uid,
      title: 'Resolver 40 listas de exercícios',
      category: 'Prática',
      currentValue: 26,
      targetValue: 40,
      unit: 'listas',
      deadline: '2026-12-10',
      status: 'active',
    },
    {
      id: 'goal-3',
      ownerId: uid,
      title: 'Manter média global acima de 8.0',
      category: 'Desempenho',
      currentValue: 8.2,
      targetValue: 8.0,
      unit: 'pts',
      deadline: '2026-12-20',
      status: 'completed',
    },
  ];
}

export const DEMO_COMMUNITY_MESSAGES: CommunityMessage[] = [
  {
    id: 'demo-msg-1',
    authorId: 'demo-lucas',
    authorName: 'Lucas Andrade',
    authorCourse: 'Engenharia de Computação',
    channel: 'calculo',
    text: 'Alguém já fechou a questão 7 da lista de Teorema de Stokes? A parametrização do paraboloide ficou bem limpa em coordenadas polares.',
    createdAtMs: Date.now() - 1000 * 60 * 18,
  },
  {
    id: 'demo-msg-2',
    authorId: 'demo-bia',
    authorName: 'Beatriz Costa',
    authorCourse: 'Ciência da Computação',
    channel: 'calculo',
    text: 'Sim! Substituindo z = 4 - r² com r de 0 a 2 o vetor normal sai direto sem raiz quadrada.',
    createdAtMs: Date.now() - 1000 * 60 * 9,
  },
  {
    id: 'demo-msg-3',
    authorId: 'demo-rafael',
    authorName: 'Rafael Moura',
    authorCourse: 'Engenharia de Software',
    channel: 'algoritmos',
    text: 'Subi meu resumo de Programação Dinâmica com memoization top-down no caderno. Se alguém quiser comparar casos de teste da árvore AVL, estou online!',
    createdAtMs: Date.now() - 1000 * 60 * 25,
  },
  {
    id: 'demo-msg-4',
    authorId: 'demo-ana',
    authorName: 'Ana Clara Lima',
    authorCourse: 'Sistemas de Informação',
    channel: 'geral',
    text: 'Bora fazer 2 blocos de Ultra Foco (50m) agora antes da revisão das 16h!',
    createdAtMs: Date.now() - 1000 * 60 * 12,
  },
];
