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
  name = 'Estudante',
  email = ''
): UserProfile {
  return {
    ownerId: uid,
    name: name.slice(0, 120),
    email: email.slice(0, 180),
    course: '',
    university: '',
    semester: '',
    registration: '',
    bio: '',
    dailyGoalHours: 4,
    pomoMinutes: 25,
    streak: 0,
    recordStreak: 0,
    theme: 'light',
    tutorialsSeen: {},
  };
}

export function createStarterSubjects(_uid: string): Subject[] {
  return [];
}

export function createStarterTasks(_uid: string): QuickTask[] {
  return [];
}

export function createStarterSessions(_uid: string): PomodoroSession[] {
  return [];
}

export function createStarterSchedule(_uid: string): ScheduleBlock[] {
  return [];
}

export function createStarterNotes(_uid: string): StudyNote[] {
  return [];
}

export function createStarterGoals(_uid: string): SemesterGoal[] {
  return [];
}

export const DEMO_COMMUNITY_MESSAGES: CommunityMessage[] = [];
