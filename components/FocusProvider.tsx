'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ambientAudio, AmbientSoundType } from '@/lib/audio';
import {
  UserProfile,
  Subject,
  QuickTask,
  PomodoroSession,
  ScheduleBlock,
  StudyNote,
  SemesterGoal,
  CommunityMessage,
  CommunityChannel,
  PomodoroMode,
  ThemeMode,
  NavSection,
} from '@/lib/types';
import {
  createDefaultProfile,
  createStarterSubjects,
  createStarterTasks,
  createStarterSessions,
  createStarterSchedule,
  createStarterNotes,
  createStarterGoals,
  DEMO_COMMUNITY_MESSAGES,
  getDateKey,
} from '@/lib/seedData';

export interface ToastState {
  id: number;
  title: string;
  message: string;
  tone: 'success' | 'error' | 'info';
}

const LOCAL_STORAGE_KEY = 'focuslearn_local_state_v2';

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  pomodoro25: 25 * 60,
  ultra50: 50 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

interface FocusContextValue {
  activeSection: NavSection;
  setActiveSection: (s: NavSection) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cloudSynced: boolean;
  loadingData: boolean;

  profile: UserProfile;
  subjects: Subject[];
  tasks: QuickTask[];
  sessions: PomodoroSession[];
  schedule: ScheduleBlock[];
  notes: StudyNote[];
  goals: SemesterGoal[];
  communityMessages: CommunityMessage[];
  activeChannel: CommunityChannel;
  setActiveChannel: (c: CommunityChannel) => void;

  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  // Toast
  toast: ToastState | null;
  showToast: (title: string, message: string, tone?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;

  // Global Pomodoro Timer & Audio
  timerMode: PomodoroMode;
  timerSecondsLeft: number;
  timerTotalSeconds: number;
  timerRunning: boolean;
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  zenMode: boolean;
  setZenMode: (open: boolean) => void;
  switchTimerMode: (mode: PomodoroMode) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  completeSessionNow: () => Promise<void>;

  // Ambient Audio
  audioPlaying: boolean;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  toggleAmbientSound: (sound?: AmbientSoundType) => void;
  setAmbientVolume: (vol: number) => void;

  // CRUD Actions
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addSubject: (input: Omit<Subject, 'id' | 'ownerId'>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  addTask: (title: string, subjectId?: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  addScheduleBlock: (input: Omit<ScheduleBlock, 'id' | 'ownerId'>) => Promise<void>;
  deleteScheduleBlock: (id: string) => Promise<void>;

  addNote: (input: Omit<StudyNote, 'id' | 'ownerId' | 'updatedAtMs'>) => Promise<string>;
  updateNote: (id: string, updates: Partial<StudyNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  addGoal: (input: Omit<SemesterGoal, 'id' | 'ownerId' | 'status'>) => Promise<void>;
  incrementGoalProgress: (id: string, delta: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  sendCommunityMessage: (text: string) => Promise<void>;
  deleteCommunityMessage: (id: string) => Promise<void>;
  resetLocalDemo: () => void;
}

const FocusContext = createContext<FocusContextValue | undefined>(undefined);

function applyDomTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { user, authReady, getAccessToken } = useAuth();

  const [activeSection, setActiveSection] = useState<NavSection>('visao-geral');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  const localUid = 'local-preview';
  const [profile, setProfile] = useState<UserProfile>(() => createDefaultProfile(localUid));
  const [subjects, setSubjects] = useState<Subject[]>(() => createStarterSubjects(localUid));
  const [tasks, setTasks] = useState<QuickTask[]>(() => createStarterTasks(localUid));
  const [sessions, setSessions] = useState<PomodoroSession[]>(() => createStarterSessions(localUid));
  const [schedule, setSchedule] = useState<ScheduleBlock[]>(() => createStarterSchedule(localUid));
  const [notes, setNotes] = useState<StudyNote[]>(() => createStarterNotes(localUid));
  const [goals, setGoals] = useState<SemesterGoal[]>(() => createStarterGoals(localUid));
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>(DEMO_COMMUNITY_MESSAGES);
  const [activeChannel, setActiveChannel] = useState<CommunityChannel>('calculo');

  const [theme, setTheme] = useState<ThemeMode>('light');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Pomodoro state
  const [timerMode, setTimerMode] = useState<PomodoroMode>('pomodoro25');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(MODE_DURATIONS.pomodoro25);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('sub-calc1');
  const [zenMode, setZenMode] = useState(false);

  // Audio state
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('rain');
  const [ambientVolume, setAmbientVolumeState] = useState(65);

  const cloudSynced = Boolean(user && user.emailVerified);

  const showToast = useCallback(
    (title: string, message: string, tone: 'success' | 'error' | 'info' = 'success') => {
      setToast({ id: Date.now(), title, message, tone });
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  // Apply theme to DOM whenever theme changes
  useEffect(() => {
    applyDomTheme(theme);
  }, [theme]);

  const authFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      const res = await fetch(input, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      });
      if (!res.ok) {
        let errMessage = 'Falha ao sincronizar com o servidor.';
        try {
          const errJson = await res.json();
          if (errJson?.error) errMessage = String(errJson.error);
        } catch {
          // Ignore parse error
        }
        throw new Error(errMessage);
      }
      return res.json();
    },
    [user, getAccessToken]
  );

  // Load local preview state on mount when unauthenticated
  useEffect(() => {
    if (!authReady) return;
    if (user && user.emailVerified) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.profile) {
            setProfile(parsed.profile);
            if (parsed.profile.theme === 'dark' || parsed.profile.theme === 'light') {
              setTheme(parsed.profile.theme);
            }
          }
          if (Array.isArray(parsed.subjects)) setSubjects(parsed.subjects);
          if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
          if (Array.isArray(parsed.sessions)) setSessions(parsed.sessions);
          if (Array.isArray(parsed.schedule)) setSchedule(parsed.schedule);
          if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
          if (Array.isArray(parsed.goals)) setGoals(parsed.goals);
          if (Array.isArray(parsed.communityMessages)) setCommunityMessages(parsed.communityMessages);
        }
      } catch {
        // Ignore malformed storage
      } finally {
        setLoadingData(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  // Persist local preview state when unauthenticated
  useEffect(() => {
    if (!authReady || (user && user.emailVerified)) return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          profile: { ...profile, theme },
          subjects,
          tasks,
          sessions,
          schedule,
          notes,
          goals,
          communityMessages,
        })
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [authReady, user, profile, theme, subjects, tasks, sessions, schedule, notes, goals, communityMessages]);

  // Bootstrap & load workspace from PostgreSQL API when authenticated
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    let active = true;
    async function loadWorkspace() {
      try {
        const data = await authFetch('/api/workspace');
        if (!active) return;
        if (data.profile) {
          const loadedProfile: UserProfile = {
            ...data.profile,
            photoURL: user?.photoURL || undefined,
          };
          setProfile(loadedProfile);
          setTheme(loadedProfile.theme === 'dark' ? 'dark' : 'light');
        }
        if (Array.isArray(data.subjects)) setSubjects(data.subjects);
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (Array.isArray(data.sessions)) setSessions(data.sessions);
        if (Array.isArray(data.schedule)) setSchedule(data.schedule);
        if (Array.isArray(data.notes)) setNotes(data.notes);
        if (Array.isArray(data.goals)) setGoals(data.goals);
      } catch (err) {
        if (!active) return;
        showToast(
          'Erro ao carregar dados',
          err instanceof Error ? err.message : 'Não foi possível carregar sua conta agora.',
          'error'
        );
      } finally {
        if (active) setLoadingData(false);
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, [authReady, user, authFetch, showToast]);

  // Load community messages for active channel when authenticated
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    let active = true;
    async function fetchMessages() {
      try {
        const data = await authFetch(`/api/community?channel=${encodeURIComponent(activeChannel)}`);
        if (active && Array.isArray(data.messages)) {
          setCommunityMessages(data.messages);
        }
      } catch {
        // Keep current messages quietly if transient polling fails
      }
    }

    void fetchMessages();
    const interval = setInterval(() => {
      void fetchMessages();
    }, 8000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [authReady, user, activeChannel, authFetch]);

  const resolvedSelectedSubjectId = subjects.some((s) => s.id === selectedSubjectId)
    ? selectedSubjectId
    : subjects[0]?.id || 'geral';

  const completeSessionRef = useRef<() => Promise<void>>(async () => {});

  const completeSessionNow = useCallback(async () => {
    setTimerRunning(false);
    ambientAudio.playCompletionChime();

    const isBreak = timerMode === 'shortBreak' || timerMode === 'longBreak';
    const fullMinutes = Math.round(MODE_DURATIONS[timerMode] / 60);
    const elapsedMinutes = Math.max(
      1,
      Math.round((MODE_DURATIONS[timerMode] - timerSecondsLeft) / 60) || fullMinutes
    );
    const loggedMinutes = timerSecondsLeft === 0 ? fullMinutes : Math.min(fullMinutes, elapsedMinutes);

    const activeSubject = subjects.find((s) => s.id === resolvedSelectedSubjectId) || subjects[0];
    const subId = activeSubject?.id || 'geral';
    const subName = activeSubject?.name || 'Estudo Geral';

    if (!isBreak) {
      const dateKey = getDateKey();
      if (cloudSynced && user) {
        try {
          const res = await authFetch('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({
              subjectId: subId,
              subjectName: subName.slice(0, 120),
              mode: timerMode,
              durationMinutes: loggedMinutes,
              dateKey,
            }),
          });
          if (res.session) {
            setSessions((prev) => [res.session, ...prev]);
          }
          if (res.updatedSubject) {
            setSubjects((prev) =>
              prev.map((s) => (s.id === res.updatedSubject.id ? res.updatedSubject : s))
            );
          }
        } catch (err) {
          showToast(
            'Erro ao salvar sessão',
            err instanceof Error ? err.message : 'Tente novamente em instantes.',
            'error'
          );
          return;
        }
      } else {
        const newSession: PomodoroSession = {
          id: `sess-${Date.now()}`,
          ownerId: localUid,
          subjectId: subId,
          subjectName: subName,
          mode: timerMode,
          durationMinutes: loggedMinutes,
          dateKey,
          createdAtMs: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
        if (activeSubject) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === activeSubject.id
                ? { ...s, hoursStudied: Number((s.hoursStudied + loggedMinutes / 60).toFixed(2)) }
                : s
            )
          );
        }
      }
      showToast(
        'Sessão concluída!',
        `+${loggedMinutes} min registrados em ${subName}.`,
        'success'
      );
    } else {
      showToast('Pausa encerrada', 'Hora de retomar o próximo ciclo de foco!', 'info');
    }

    // Auto-switch next mode cleanly
    const nextMode: PomodoroMode = isBreak ? 'pomodoro25' : 'shortBreak';
    setTimerMode(nextMode);
    setTimerSecondsLeft(MODE_DURATIONS[nextMode]);
  }, [timerMode, timerSecondsLeft, subjects, resolvedSelectedSubjectId, cloudSynced, user, authFetch, showToast]);

  useEffect(() => {
    completeSessionRef.current = completeSessionNow;
  }, [completeSessionNow]);

  // Global 1-second timer interval
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          void completeSessionRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const switchTimerMode = (mode: PomodoroMode) => {
    setTimerRunning(false);
    setTimerMode(mode);
    setTimerSecondsLeft(MODE_DURATIONS[mode]);
  };

  const toggleTimer = () => {
    setTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSecondsLeft(MODE_DURATIONS[timerMode]);
  };

  const skipTimer = () => {
    setTimerRunning(false);
    const next: PomodoroMode =
      timerMode === 'pomodoro25' || timerMode === 'ultra50' ? 'shortBreak' : 'pomodoro25';
    setTimerMode(next);
    setTimerSecondsLeft(MODE_DURATIONS[next]);
    showToast('Bloco alternado', 'Timer ajustado para o próximo ciclo.', 'info');
  };

  const toggleAmbientSound = (sound?: AmbientSoundType) => {
    const target = sound ?? ambientSound;
    const playing = ambientAudio.toggle(sound);
    setAmbientSound(target);
    setAudioPlaying(playing);
  };

  const setAmbientVolume = (vol: number) => {
    setAmbientVolumeState(vol);
    ambientAudio.setVolume(vol);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setTheme(mode);
    setProfile((prev) => ({ ...prev, theme: mode }));
    if (cloudSynced && user) {
      try {
        await authFetch('/api/profile', {
          method: 'PATCH',
          body: JSON.stringify({ theme: mode }),
        });
      } catch (err) {
        showToast(
          'Erro ao salvar tema',
          err instanceof Error ? err.message : 'Não foi possível salvar sua preferência.',
          'error'
        );
      }
    }
  };

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    void setThemeMode(next);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const merged: UserProfile = {
      ...profile,
      ...updates,
      name: (updates.name ?? profile.name).slice(0, 120),
      email: (updates.email ?? profile.email).slice(0, 180),
      course: (updates.course ?? profile.course).slice(0, 120),
      university: (updates.university ?? profile.university).slice(0, 140),
      semester: (updates.semester ?? profile.semester).slice(0, 40),
      registration: (updates.registration ?? profile.registration).slice(0, 40),
      bio: (updates.bio ?? profile.bio).slice(0, 500),
      dailyGoalHours: Math.max(0.5, Math.min(24, Number(updates.dailyGoalHours ?? profile.dailyGoalHours))),
      pomoMinutes: Math.max(5, Math.min(120, Number(updates.pomoMinutes ?? profile.pomoMinutes))),
      theme: updates.theme ?? theme,
    };
    setProfile(merged);
    if (updates.theme) setTheme(updates.theme);

    if (cloudSynced && user) {
      try {
        await authFetch('/api/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            name: merged.name,
            email: merged.email,
            course: merged.course,
            university: merged.university,
            semester: merged.semester,
            registration: merged.registration,
            bio: merged.bio,
            dailyGoalHours: merged.dailyGoalHours,
            pomoMinutes: merged.pomoMinutes,
            theme: merged.theme,
          }),
        });
      } catch (err) {
        showToast(
          'Erro ao atualizar perfil',
          err instanceof Error ? err.message : 'Tente novamente em instantes.',
          'error'
        );
        return;
      }
    }
    showToast('Perfil atualizado', 'Suas informações acadêmicas foram salvas.');
  };

  const addSubject = async (input: Omit<Subject, 'id' | 'ownerId'>) => {
    const sanitized = {
      code: input.code.trim().slice(0, 24),
      name: input.name.trim().slice(0, 120),
      professor: input.professor.trim().slice(0, 100),
      schedule: input.schedule.trim().slice(0, 80),
      credits: Math.max(0, Math.min(40, Number(input.credits) || 4)),
      p1: Math.max(0, Math.min(10, Number(input.p1) || 0)),
      p2: Math.max(0, Math.min(10, Number(input.p2) || 0)),
      hoursStudied: Math.max(0, Math.min(5000, Number(input.hoursStudied) || 0)),
      status: input.status || 'active',
    };
    if (cloudSynced && user) {
      try {
        const res = await authFetch('/api/subjects', {
          method: 'POST',
          body: JSON.stringify(sanitized),
        });
        if (res.subject) {
          setSubjects((prev) => [res.subject, ...prev]);
        }
      } catch (err) {
        showToast(
          'Erro ao adicionar matéria',
          err instanceof Error ? err.message : 'Tente novamente em instantes.',
          'error'
        );
        return;
      }
    } else {
      setSubjects((prev) => [{ id: `sub-${Date.now()}`, ownerId: localUid, ...sanitized }, ...prev]);
    }
    showToast('Matéria adicionada', `${sanitized.code} · ${sanitized.name} salva.`);
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const existing = subjects.find((s) => s.id === id);
    if (!existing) return;
    const next = {
      code: (updates.code ?? existing.code).slice(0, 24),
      name: (updates.name ?? existing.name).slice(0, 120),
      professor: (updates.professor ?? existing.professor).slice(0, 100),
      schedule: (updates.schedule ?? existing.schedule).slice(0, 80),
      credits: Math.max(0, Math.min(40, Number(updates.credits ?? existing.credits))),
      p1: Math.max(0, Math.min(10, Number(updates.p1 ?? existing.p1))),
      p2: Math.max(0, Math.min(10, Number(updates.p2 ?? existing.p2))),
      status: updates.status ?? existing.status,
    };
    if (cloudSynced && user) {
      try {
        const res = await authFetch(`/api/subjects/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(next),
        });
        if (res.subject) {
          setSubjects((prev) => prev.map((s) => (s.id === id ? res.subject : s)));
        }
      } catch (err) {
        showToast(
          'Erro ao atualizar matéria',
          err instanceof Error ? err.message : 'Tente novamente em instantes.',
          'error'
        );
        return;
      }
    } else {
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...next } : s)));
    }
    showToast('Matéria atualizada', 'Notas e dados da disciplina atualizados.');
  };

  const deleteSubject = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await authFetch(`/api/subjects/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        setSubjects((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        showToast(
          'Erro ao remover matéria',
          err instanceof Error ? err.message : 'Tente novamente em instantes.',
          'error'
        );
        return;
      }
    } else {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
    showToast('Matéria removida', 'Disciplina removida do semestre.', 'info');
  };

  const addTask = async (title: string, subjectId = '') => {
    const clean = title.trim().slice(0, 200);
    if (!clean) return;
    if (cloudSynced && user) {
      try {
        const res = await authFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title: clean, subjectId: subjectId.slice(0, 128) }),
        });
        if (res.task) {
          setTasks((prev) => [res.task, ...prev]);
        }
      } catch (err) {
        showToast(
          'Erro ao adicionar tarefa',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
      }
    } else {
      setTasks((prev) => [
        { id: `task-${Date.now()}`, ownerId: localUid, title: clean, completed: false, subjectId },
        ...prev,
      ]);
    }
  };

  const toggleTask = async (id: string) => {
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return;
    const nextVal = !existing.completed;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextVal } : t)));
    if (cloudSynced && user) {
      try {
        await authFetch(`/api/tasks/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: nextVal }),
        });
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === id ? existing : t)));
        showToast(
          'Erro ao atualizar tarefa',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
      }
    }
  };

  const deleteTask = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await authFetch(`/api/tasks/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        showToast(
          'Erro ao remover tarefa',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
      }
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const addScheduleBlock = async (input: Omit<ScheduleBlock, 'id' | 'ownerId'>) => {
    const startHour = Math.max(6, Math.min(23, Number(input.startHour)));
    const endHour = Math.max(startHour + 1, Math.min(24, Number(input.endHour)));
    const payload = {
      title: input.title.trim().slice(0, 120),
      dayIndex: Math.max(0, Math.min(6, Number(input.dayIndex))),
      startHour,
      endHour,
      type: input.type,
      subjectId: input.subjectId.slice(0, 128),
      subjectName: input.subjectName.slice(0, 120),
    };
    if (cloudSynced && user) {
      try {
        const res = await authFetch('/api/schedule', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.block) {
          setSchedule((prev) => [...prev, res.block]);
        }
      } catch (err) {
        showToast(
          'Erro ao agendar bloco',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
        return;
      }
    } else {
      setSchedule((prev) => [...prev, { id: `sched-${Date.now()}`, ownerId: localUid, ...payload }]);
    }
    showToast('Sessão agendada', `${payload.title} adicionada ao planejador.`);
  };

  const deleteScheduleBlock = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await authFetch(`/api/schedule/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        setSchedule((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        showToast(
          'Erro ao remover bloco',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
        return;
      }
    } else {
      setSchedule((prev) => prev.filter((b) => b.id !== id));
    }
    showToast('Bloco removido', 'Horário removido da grade semanal.', 'info');
  };

  const addNote = async (input: Omit<StudyNote, 'id' | 'ownerId' | 'updatedAtMs'>) => {
    const cleanTags = input.tags
      .map((t) => t.trim().replace(/^#/, '').slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);
    const payload = {
      title: input.title.trim().slice(0, 160),
      subjectId: input.subjectId.slice(0, 128),
      subjectName: input.subjectName.slice(0, 120),
      tags: cleanTags,
      content: input.content.trim().slice(0, 20000),
    };

    if (cloudSynced && user) {
      try {
        const res = await authFetch('/api/notes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.note) {
          setNotes((prev) => [res.note, ...prev]);
          showToast('Nota salva', `"${payload.title}" sincronizada na nuvem.`);
          return String(res.note.id);
        }
      } catch (err) {
        showToast(
          'Erro ao salvar nota',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
        return '';
      }
    }
    const id = `note-${Date.now()}`;
    setNotes((prev) => [{ id, ownerId: localUid, ...payload, updatedAtMs: Date.now() }, ...prev]);
    showToast('Nota salva', `"${payload.title}" adicionada ao caderno.`);
    return id;
  };

  const updateNote = async (id: string, updates: Partial<StudyNote>) => {
    const existing = notes.find((n) => n.id === id);
    if (!existing) return;
    const cleanTags = (updates.tags ?? existing.tags)
      .map((t) => t.trim().replace(/^#/, '').slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);
    const payload = {
      title: (updates.title ?? existing.title).trim().slice(0, 160),
      subjectId: (updates.subjectId ?? existing.subjectId).slice(0, 128),
      subjectName: (updates.subjectName ?? existing.subjectName).slice(0, 120),
      tags: cleanTags,
      content: (updates.content ?? existing.content).trim().slice(0, 20000),
    };
    if (cloudSynced && user) {
      try {
        const res = await authFetch(`/api/notes/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (res.note) {
          setNotes((prev) => prev.map((n) => (n.id === id ? res.note : n)));
        }
      } catch (err) {
        showToast(
          'Erro ao atualizar nota',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
        return;
      }
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...payload, updatedAtMs: Date.now() } : n))
      );
    }
    showToast('Anotação atualizada', 'Alterações salvas com sucesso.');
  };

  const deleteNote = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await authFetch(`/api/notes/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } catch (err) {
        showToast(
          'Erro ao remover nota',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
        return;
      }
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
    showToast('Nota removida', 'Anotação excluída do caderno.', 'info');
  };

  const addGoal = async (input: Omit<SemesterGoal, 'id' | 'ownerId' | 'status'>) => {
    const target = Math.max(0.1, Math.min(100000, Number(input.targetValue) || 10));
    const current = Math.max(0, Math.min(100000, Number(input.currentValue) || 0));
    const status = current >= target ? 'completed' : 'active';
    const payload = {
      title: input.title.trim().slice(0, 140),
      category: input.category.trim().slice(0, 60) || 'Estudos',
      currentValue: current,
      targetValue: target,
      unit: input.unit.trim().slice(0, 24) || 'h',
      deadline: input.deadline.trim().slice(0, 40),
      status,
    } as const;

    if (cloudSynced && user) {
      try {
        const res = await authFetch('/api/goals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.goal) {
          setGoals((prev) => [...prev, res.goal]);
        }
      } catch (err) {
        showToast(
          'Erro ao criar meta',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
        return;
      }
    } else {
      setGoals((prev) => [...prev, { id: `goal-${Date.now()}`, ownerId: localUid, ...payload }]);
    }
    showToast('Meta criada', payload.title);
  };

  const incrementGoalProgress = async (id: string, delta: number) => {
    const existing = goals.find((g) => g.id === id);
    if (!existing || existing.status === 'completed') return;
    const nextVal = Math.max(0, Math.min(100000, Number((existing.currentValue + delta).toFixed(1))));
    const nextStatus = nextVal >= existing.targetValue ? 'completed' : 'active';
    if (cloudSynced && user) {
      try {
        const res = await authFetch(`/api/goals/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ delta }),
        });
        if (res.goal) {
          setGoals((prev) => prev.map((g) => (g.id === id ? res.goal : g)));
          if (res.goal.status === 'completed') {
            showToast('Meta atingida!', `Parabéns por concluir "${existing.title}"!`);
          }
        }
      } catch (err) {
        showToast(
          'Erro ao atualizar meta',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
      }
    } else {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, currentValue: nextVal, status: nextStatus } : g))
      );
      if (nextStatus === 'completed') {
        showToast('Meta atingida!', `Parabéns por concluir "${existing.title}"!`);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await authFetch(`/api/goals/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        setGoals((prev) => prev.filter((g) => g.id !== id));
      } catch (err) {
        showToast(
          'Erro ao remover meta',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
        return;
      }
    } else {
      setGoals((prev) => prev.filter((g) => g.id !== id));
    }
    showToast('Meta removida', 'Meta excluída da lista.', 'info');
  };

  const sendCommunityMessage = async (text: string) => {
    const clean = text.trim().slice(0, 1000);
    if (!clean) return;

    if (cloudSynced && user) {
      try {
        const res = await authFetch('/api/community', {
          method: 'POST',
          body: JSON.stringify({
            channel: activeChannel,
            text: clean,
            authorName: profile.name.slice(0, 100),
            authorCourse: profile.course.slice(0, 100),
          }),
        });
        if (res.message) {
          setCommunityMessages((prev) => [...prev, res.message]);
        }
      } catch (err) {
        showToast(
          'Erro ao enviar mensagem',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
      }
    } else {
      const msg: CommunityMessage = {
        id: `local-msg-${Date.now()}`,
        authorId: localUid,
        authorName: profile.name,
        authorCourse: profile.course,
        channel: activeChannel,
        text: clean,
        createdAtMs: Date.now(),
      };
      setCommunityMessages((prev) => [...prev, msg]);
    }
  };

  const deleteCommunityMessage = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await authFetch(`/api/community/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        setCommunityMessages((prev) => prev.filter((m) => m.id !== id));
      } catch (err) {
        showToast(
          'Erro ao remover mensagem',
          err instanceof Error ? err.message : 'Tente novamente.',
          'error'
        );
      }
    } else {
      setCommunityMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const resetLocalDemo = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setProfile(createDefaultProfile(localUid));
    setSubjects(createStarterSubjects(localUid));
    setTasks(createStarterTasks(localUid));
    setSessions(createStarterSessions(localUid));
    setSchedule(createStarterSchedule(localUid));
    setNotes(createStarterNotes(localUid));
    setGoals(createStarterGoals(localUid));
    setCommunityMessages(DEMO_COMMUNITY_MESSAGES);
    setTheme('light');
    showToast('Dados restaurados', 'Estado inicial restaurado neste dispositivo.', 'info');
  };

  return (
    <FocusContext.Provider
      value={{
        activeSection,
        setActiveSection,
        searchQuery,
        setSearchQuery,
        cloudSynced,
        loadingData,
        profile,
        subjects,
        tasks,
        sessions,
        schedule,
        notes,
        goals,
        communityMessages,
        activeChannel,
        setActiveChannel,
        theme,
        toggleTheme,
        setThemeMode,
        toast,
        showToast,
        dismissToast,
        timerMode,
        timerSecondsLeft,
        timerTotalSeconds: MODE_DURATIONS[timerMode],
        timerRunning,
        selectedSubjectId: resolvedSelectedSubjectId,
        setSelectedSubjectId,
        zenMode,
        setZenMode,
        switchTimerMode,
        toggleTimer,
        resetTimer,
        skipTimer,
        completeSessionNow,
        audioPlaying,
        ambientSound,
        ambientVolume,
        toggleAmbientSound,
        setAmbientVolume,
        updateUserProfile,
        addSubject,
        updateSubject,
        deleteSubject,
        addTask,
        toggleTask,
        deleteTask,
        addScheduleBlock,
        deleteScheduleBlock,
        addNote,
        updateNote,
        deleteNote,
        addGoal,
        incrementGoalProgress,
        deleteGoal,
        sendCommunityMessage,
        deleteCommunityMessage,
        resetLocalDemo,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocus must be used inside FocusProvider');
  }
  return ctx;
}
