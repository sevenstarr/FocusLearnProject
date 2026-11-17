import {
  Subject,
  QuickTask,
  PomodoroSession,
  ScheduleBlock,
  StudyNote,
  SemesterGoal,
  UserProfile,
  CommunityMessage,
  Assessment,
  ApprovalRules,
  GradingMethod,
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
  valid: boolean;
  canReachTarget: boolean;
}

export function defaultApprovalRules(gradeMax = 10): ApprovalRules {
  return {
    directThreshold: gradeMax * 0.7,
    finalEligibilityThreshold: gradeMax * 0.4,
    finalTarget: gradeMax * 0.5,
    finalMaxScore: gradeMax,
    finalWeight: 50,
  };
}

export function normalizeSubjectGrades(raw: Record<string, unknown>): Pick<Subject, 'assessments' | 'gradeMax' | 'gradingMethod' | 'approvalRules'> {
  const gradeMax = Number(raw.gradeMax) > 0 ? Number(raw.gradeMax) : 10;
  const legacy = !Array.isArray(raw.assessments);
  const assessments: Assessment[] = legacy
    ? [
        { id: 'legacy-p1', name: 'P1', score: Number(raw.p1) || 0, maxScore: 10, weight: 50 },
        { id: 'legacy-p2', name: 'P2', score: Number(raw.p2) || 0, maxScore: 10, weight: 50 },
      ]
    : (raw.assessments as Assessment[]).map((item) => {
        const maxScore = Math.min(100000, Math.max(0.01, Number(item.maxScore) || 10));
        return {
          id: String(item.id || crypto.randomUUID()),
          name: String(item.name || 'Avaliação').slice(0, 80),
          score: Math.min(maxScore, Math.max(0, Number(item.score) || 0)),
          maxScore,
          weight: Math.min(100, Math.max(0, Number(item.weight) || 0)),
        };
      });
  const inputRules = raw.approvalRules as Partial<ApprovalRules> | undefined;
  const defaults = defaultApprovalRules(gradeMax);
  const approvalRules = inputRules
    ? {
        directThreshold: Math.min(gradeMax, Math.max(0, Number(inputRules.directThreshold ?? defaults.directThreshold))),
        finalEligibilityThreshold: Math.min(gradeMax, Math.max(0, Number(inputRules.finalEligibilityThreshold ?? defaults.finalEligibilityThreshold))),
        finalTarget: Math.min(gradeMax, Math.max(0, Number(inputRules.finalTarget ?? defaults.finalTarget))),
        finalMaxScore: Math.max(0.01, Math.min(100000, Number(inputRules.finalMaxScore ?? defaults.finalMaxScore))),
        finalWeight: Math.min(100, Math.max(0, Number(inputRules.finalWeight ?? defaults.finalWeight))),
      }
    : defaultApprovalRules(gradeMax);
  const gradingMethod = raw.gradingMethod === 'sum' || raw.gradingMethod === 'weighted' || raw.gradingMethod === 'normalized'
    ? raw.gradingMethod
    : 'normalized';
  return { assessments, gradeMax, gradingMethod, approvalRules };
}

export function createAssessment(name = 'Nova avaliação', gradeMax = 10): Assessment {
  return { id: crypto.randomUUID(), name, score: 0, maxScore: gradeMax, weight: 0 };
}

export function calculateGrade(
  assessments: Assessment[],
  gradeMax: number,
  method: GradingMethod,
  rules: ApprovalRules
): GradeEvaluation {
  const safeMax = Math.max(0, Number(gradeMax) || 0);
  const totalMax = assessments.reduce((sum, item) => sum + Math.max(0, Number(item.maxScore) || 0), 0);
  const totalWeight = assessments.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0);
  if (assessments.length === 0) return { average: 0, statusLabel: 'Adicione uma avaliação para calcular a média', tone: 'warning', neededPF: null, valid: true, canReachTarget: false };
  const valid = safeMax > 0 && (method !== 'sum' || Math.abs(totalMax - safeMax) < 0.001) &&
    (method !== 'weighted' || Math.abs(totalWeight - 100) < 0.001);
  let average = 0;

  if (valid && assessments.length > 0) {
    if (method === 'sum') {
      average = assessments.reduce((sum, item) => sum + Math.min(item.maxScore, Math.max(0, item.score)), 0);
    } else if (method === 'normalized') {
      average = totalMax > 0
        ? assessments.reduce((sum, item) => sum + Math.min(item.maxScore, Math.max(0, item.score)), 0) / totalMax * safeMax
        : 0;
    } else {
      average = assessments.reduce((sum, item) =>
        sum + (item.maxScore > 0 ? Math.min(item.maxScore, Math.max(0, item.score)) / item.maxScore : 0) * safeMax * item.weight / 100, 0);
    }
  }
  average = Number(Math.min(safeMax, Math.max(0, average)).toFixed(2));

  if (!valid) return { average, statusLabel: method === 'sum' ? 'Ajuste os máximos para somarem a nota da matéria' : 'Ajuste os pesos para totalizarem 100%', tone: 'warning', neededPF: null, valid, canReachTarget: false };
  if (average >= rules.directThreshold) return { average, statusLabel: 'Aprovado direto', tone: 'success', neededPF: 0, valid, canReachTarget: true };
  if (average < rules.finalEligibilityThreshold || rules.finalWeight <= 0 || rules.finalMaxScore <= 0) {
    return { average, statusLabel: 'Abaixo da média para prova final', tone: 'danger', neededPF: null, valid, canReachTarget: false };
  }

  const needed = ((rules.finalTarget - average * (1 - rules.finalWeight / 100)) /
    (rules.finalWeight / 100)) * rules.finalMaxScore / safeMax;
  const roundedNeeded = Number(Math.max(0, needed).toFixed(2));
  const canReachTarget = roundedNeeded <= rules.finalMaxScore;
  return {
    average,
    statusLabel: canReachTarget ? `Prova final: precisa ${roundedNeeded.toFixed(1)}` : 'Meta impossível com o máximo da prova final',
    tone: canReachTarget ? 'warning' : 'danger',
    neededPF: roundedNeeded,
    valid,
    canReachTarget,
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
