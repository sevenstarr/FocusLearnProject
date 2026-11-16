export type ThemeMode = 'light' | 'dark';

export type NavSection =
  | 'visao-geral'
  | 'materias-cursos'
  | 'cronometro-pomodoro'
  | 'planejador-semanal'
  | 'estatisticas-metas'
  | 'anotacoes'
  | 'comunidade'
  | 'configuracoes-ajuda';

export interface UserProfile {
  ownerId: string;
  name: string;
  email: string;
  course: string;
  university: string;
  semester: string;
  registration: string;
  bio: string;
  dailyGoalHours: number;
  pomoMinutes: number;
  streak: number;
  recordStreak: number;
  theme: ThemeMode;
  photoURL?: string;
}

export interface Subject {
  id: string;
  ownerId: string;
  code: string;
  name: string;
  professor: string;
  schedule: string;
  credits: number;
  p1: number;
  p2: number;
  hoursStudied: number;
  status: 'active' | 'completed' | 'archived';
}

export interface QuickTask {
  id: string;
  ownerId: string;
  title: string;
  completed: boolean;
  subjectId: string;
}

export type PomodoroMode = 'pomodoro25' | 'ultra50' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  id: string;
  ownerId: string;
  subjectId: string;
  subjectName: string;
  mode: PomodoroMode;
  durationMinutes: number;
  dateKey: string;
  createdAtMs: number;
}

export type ScheduleType = 'aula' | 'revisao' | 'pausa' | 'prova';

export interface ScheduleBlock {
  id: string;
  ownerId: string;
  title: string;
  dayIndex: number; // 0 = Seg ... 6 = Dom
  startHour: number; // 8..21
  endHour: number; // 9..22
  type: ScheduleType;
  subjectId: string;
  subjectName: string;
}

export interface StudyNote {
  id: string;
  ownerId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  tags: string[];
  content: string;
  updatedAtMs: number;
}

export interface SemesterGoal {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed';
}

export type CommunityChannel = 'calculo' | 'algoritmos' | 'geral';

export interface CommunityMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorCourse: string;
  channel: CommunityChannel;
  text: string;
  createdAtMs: number;
}
