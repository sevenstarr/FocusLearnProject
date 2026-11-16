'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
  serverTimestamp,
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useFirebase } from '@/components/FirebaseProvider';
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
  const { user, authReady } = useFirebase();

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

  // Bootstrap & listen to Firestore when user is verified & authenticated
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    const uid = user.uid;
    let active = true;

    async function bootstrapUserAccount() {
      const profileRef = doc(db, 'users', uid);
      try {
        const snap = await getDoc(profileRef);
        if (!snap.exists()) {
          const defaultProf = createDefaultProfile(
            uid,
            user?.displayName || 'Estudante FocusLearn',
            user?.email || 'estudante@universidade.edu.br'
          );
          const batch = writeBatch(db);
          batch.set(profileRef, {
            ownerId: uid,
            name: defaultProf.name,
            email: defaultProf.email,
            course: defaultProf.course,
            university: defaultProf.university,
            semester: defaultProf.semester,
            registration: defaultProf.registration,
            bio: defaultProf.bio,
            dailyGoalHours: defaultProf.dailyGoalHours,
            pomoMinutes: defaultProf.pomoMinutes,
            streak: defaultProf.streak,
            recordStreak: defaultProf.recordStreak,
            theme: defaultProf.theme,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          for (const sub of createStarterSubjects(uid)) {
            batch.set(doc(db, 'users', uid, 'subjects', sub.id), {
              ownerId: uid,
              code: sub.code,
              name: sub.name,
              professor: sub.professor,
              schedule: sub.schedule,
              credits: sub.credits,
              p1: sub.p1,
              p2: sub.p2,
              hoursStudied: sub.hoursStudied,
              status: sub.status,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          for (const t of createStarterTasks(uid)) {
            batch.set(doc(db, 'users', uid, 'tasks', t.id), {
              ownerId: uid,
              title: t.title,
              completed: t.completed,
              subjectId: t.subjectId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          for (const s of createStarterSessions(uid)) {
            batch.set(doc(db, 'users', uid, 'sessions', s.id), {
              ownerId: uid,
              subjectId: s.subjectId,
              subjectName: s.subjectName,
              mode: s.mode,
              durationMinutes: s.durationMinutes,
              dateKey: s.dateKey,
              createdAt: serverTimestamp(),
            });
          }
          for (const b of createStarterSchedule(uid)) {
            batch.set(doc(db, 'users', uid, 'schedule', b.id), {
              ownerId: uid,
              title: b.title,
              dayIndex: b.dayIndex,
              startHour: b.startHour,
              endHour: b.endHour,
              type: b.type,
              subjectId: b.subjectId,
              subjectName: b.subjectName,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          for (const n of createStarterNotes(uid)) {
            batch.set(doc(db, 'users', uid, 'notes', n.id), {
              ownerId: uid,
              title: n.title,
              subjectId: n.subjectId,
              subjectName: n.subjectName,
              tags: n.tags,
              content: n.content,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          for (const g of createStarterGoals(uid)) {
            batch.set(doc(db, 'users', uid, 'goals', g.id), {
              ownerId: uid,
              title: g.title,
              category: g.category,
              currentValue: g.currentValue,
              targetValue: g.targetValue,
              unit: g.unit,
              deadline: g.deadline,
              status: g.status,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await batch.commit();
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    }

    void bootstrapUserAccount().then(() => {
      if (!active) return;
      setLoadingData(false);
    });

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (!snap.exists()) return;
          const d = snap.data();
          const prof: UserProfile = {
            ownerId: d.ownerId,
            name: d.name,
            email: d.email,
            course: d.course,
            university: d.university,
            semester: d.semester,
            registration: d.registration,
            bio: d.bio,
            dailyGoalHours: d.dailyGoalHours,
            pomoMinutes: d.pomoMinutes,
            streak: d.streak,
            recordStreak: d.recordStreak,
            theme: d.theme === 'dark' ? 'dark' : 'light',
            photoURL: user.photoURL || undefined,
          };
          setProfile(prof);
          setTheme(prof.theme);
        },
        (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
      )
    );

    const subsQuery = query(collection(db, 'users', uid, 'subjects'), where('ownerId', '==', uid));
    unsubs.push(
      onSnapshot(
        subsQuery,
        (snap) => {
          const list: Subject[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              ownerId: d.ownerId,
              code: d.code,
              name: d.name,
              professor: d.professor,
              schedule: d.schedule,
              credits: d.credits,
              p1: d.p1,
              p2: d.p2,
              hoursStudied: d.hoursStudied,
              status: d.status,
            };
          });
          setSubjects(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/subjects`)
      )
    );

    const tasksQuery = query(collection(db, 'users', uid, 'tasks'), where('ownerId', '==', uid));
    unsubs.push(
      onSnapshot(
        tasksQuery,
        (snap) => {
          const list: QuickTask[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              ownerId: d.ownerId,
              title: d.title,
              completed: Boolean(d.completed),
              subjectId: d.subjectId || '',
            };
          });
          setTasks(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/tasks`)
      )
    );

    const sessionsQuery = query(collection(db, 'users', uid, 'sessions'), where('ownerId', '==', uid));
    unsubs.push(
      onSnapshot(
        sessionsQuery,
        (snap) => {
          const list: PomodoroSession[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              const ts = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
              return {
                id: docSnap.id,
                ownerId: d.ownerId,
                subjectId: d.subjectId,
                subjectName: d.subjectName,
                mode: d.mode as PomodoroMode,
                durationMinutes: d.durationMinutes,
                dateKey: d.dateKey,
                createdAtMs: ts,
              };
            })
            .sort((a, b) => b.createdAtMs - a.createdAtMs);
          setSessions(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/sessions`)
      )
    );

    const schedQuery = query(collection(db, 'users', uid, 'schedule'), where('ownerId', '==', uid));
    unsubs.push(
      onSnapshot(
        schedQuery,
        (snap) => {
          const list: ScheduleBlock[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              ownerId: d.ownerId,
              title: d.title,
              dayIndex: d.dayIndex,
              startHour: d.startHour,
              endHour: d.endHour,
              type: d.type,
              subjectId: d.subjectId,
              subjectName: d.subjectName,
            };
          });
          setSchedule(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/schedule`)
      )
    );

    const notesQuery = query(collection(db, 'users', uid, 'notes'), where('ownerId', '==', uid));
    unsubs.push(
      onSnapshot(
        notesQuery,
        (snap) => {
          const list: StudyNote[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              const ts = d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : Date.now();
              return {
                id: docSnap.id,
                ownerId: d.ownerId,
                title: d.title,
                subjectId: d.subjectId,
                subjectName: d.subjectName,
                tags: Array.isArray(d.tags) ? d.tags : [],
                content: d.content,
                updatedAtMs: ts,
              };
            })
            .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
          setNotes(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/notes`)
      )
    );

    const goalsQuery = query(collection(db, 'users', uid, 'goals'), where('ownerId', '==', uid));
    unsubs.push(
      onSnapshot(
        goalsQuery,
        (snap) => {
          const list: SemesterGoal[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              ownerId: d.ownerId,
              title: d.title,
              category: d.category,
              currentValue: d.currentValue,
              targetValue: d.targetValue,
              unit: d.unit,
              deadline: d.deadline,
              status: d.status,
            };
          });
          setGoals(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/goals`)
      )
    );

    return () => {
      active = false;
      unsubs.forEach((u) => u());
    };
  }, [authReady, user]);

  // Listen to live community messages for active channel when authenticated
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      return;
    }
    const q = query(
      collection(db, 'communityMessages'),
      where('channel', '==', activeChannel),
      limit(100)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: CommunityMessage[] = snap.docs
          .map((docSnap) => {
            const d = docSnap.data();
            const ts = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
            return {
              id: docSnap.id,
              authorId: d.authorId,
              authorName: d.authorName,
              authorCourse: d.authorCourse,
              channel: d.channel as CommunityChannel,
              text: d.text,
              createdAtMs: ts,
            };
          })
          .sort((a, b) => a.createdAtMs - b.createdAtMs);
        setCommunityMessages(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'communityMessages')
    );
    return () => unsub();
  }, [authReady, user, activeChannel]);

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
        const sessRef = doc(collection(db, 'users', user.uid, 'sessions'));
        try {
          await setDoc(sessRef, {
            ownerId: user.uid,
            subjectId: subId,
            subjectName: subName.slice(0, 120),
            mode: timerMode,
            durationMinutes: loggedMinutes,
            dateKey,
            createdAt: serverTimestamp(),
          });
          if (activeSubject) {
            await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
              hoursStudied: increment(Number((loggedMinutes / 60).toFixed(2))),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions`);
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
  }, [timerMode, timerSecondsLeft, subjects, resolvedSelectedSubjectId, cloudSynced, user, showToast]);

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
        await updateDoc(doc(db, 'users', user.uid), {
          theme: mode,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
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
        await updateDoc(doc(db, 'users', user.uid), {
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
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
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
      const ref = doc(collection(db, 'users', user.uid, 'subjects'));
      try {
        await setDoc(ref, {
          ownerId: user.uid,
          ...sanitized,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/subjects`);
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
        await updateDoc(doc(db, 'users', user.uid, 'subjects', id), {
          ...next,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/subjects/${id}`);
      }
    } else {
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...next } : s)));
    }
    showToast('Matéria atualizada', 'Notas e dados da disciplina atualizados.');
  };

  const deleteSubject = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'subjects', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/subjects/${id}`);
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
      const ref = doc(collection(db, 'users', user.uid, 'tasks'));
      try {
        await setDoc(ref, {
          ownerId: user.uid,
          title: clean,
          completed: false,
          subjectId: subjectId.slice(0, 128),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/tasks`);
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
    if (cloudSynced && user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', id), {
          completed: nextVal,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${id}`);
      }
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextVal } : t)));
    }
  };

  const deleteTask = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/tasks/${id}`);
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
      const ref = doc(collection(db, 'users', user.uid, 'schedule'));
      try {
        await setDoc(ref, {
          ownerId: user.uid,
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/schedule`);
      }
    } else {
      setSchedule((prev) => [...prev, { id: `sched-${Date.now()}`, ownerId: localUid, ...payload }]);
    }
    showToast('Sessão agendada', `${payload.title} adicionada ao planejador.`);
  };

  const deleteScheduleBlock = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'schedule', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/schedule/${id}`);
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
      const ref = doc(collection(db, 'users', user.uid, 'notes'));
      try {
        await setDoc(ref, {
          ownerId: user.uid,
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Nota salva', `"${payload.title}" sincronizada na nuvem.`);
        return ref.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/notes`);
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
        await updateDoc(doc(db, 'users', user.uid, 'notes', id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/notes/${id}`);
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
        await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/notes/${id}`);
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
      const ref = doc(collection(db, 'users', user.uid, 'goals'));
      try {
        await setDoc(ref, {
          ownerId: user.uid,
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/goals`);
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
        await updateDoc(doc(db, 'users', user.uid, 'goals', id), {
          currentValue: nextVal,
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/goals/${id}`);
      }
    } else {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, currentValue: nextVal, status: nextStatus } : g))
      );
    }
    if (nextStatus === 'completed') {
      showToast('Meta atingida!', `Parabéns por concluir "${existing.title}"!`);
    }
  };

  const deleteGoal = async (id: string) => {
    if (cloudSynced && user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/goals/${id}`);
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
      const ref = doc(collection(db, 'communityMessages'));
      try {
        await setDoc(ref, {
          authorId: user.uid,
          authorName: profile.name.slice(0, 100),
          authorCourse: profile.course.slice(0, 100),
          channel: activeChannel,
          text: clean,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'communityMessages');
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
        await deleteDoc(doc(db, 'communityMessages', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `communityMessages/${id}`);
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
