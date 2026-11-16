import { getSupabaseAdmin } from '../lib/supabase.ts';
import {
  createDefaultProfile,
  createStarterGoals,
  createStarterNotes,
  createStarterSchedule,
  createStarterSessions,
  createStarterSubjects,
  createStarterTasks,
} from '@/lib/seedData';
import type {
  CommunityChannel,
  CommunityMessage,
  PomodoroMode,
  PomodoroSession,
  QuickTask,
  ScheduleBlock,
  ScheduleType,
  SemesterGoal,
  StudyNote,
  Subject,
  UserProfile,
} from '@/lib/types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface DbUserRow {
  uid: string;
  name: string;
  email: string;
  course: string;
  university: string;
  semester: string;
  registration: string;
  bio: string;
  daily_goal_hours: number;
  pomo_minutes: number;
  streak: number;
  record_streak: number;
  theme: string;
  tutorials_seen?: Record<string, boolean> | null;
  seeded: boolean;
}

interface DbSubjectRow {
  id: string;
  owner_id: string;
  code: string;
  name: string;
  professor: string;
  schedule: string;
  p1: number;
  p2: number;
  hours_studied: number;
  status: string;
}

interface DbTaskRow {
  id: string;
  owner_id: string;
  title: string;
  completed: boolean;
  subject_id: string;
}

interface DbSessionRow {
  id: string;
  owner_id: string;
  subject_id: string;
  subject_name: string;
  mode: string;
  duration_minutes: number;
  date_key: string;
  created_at: string;
}

interface DbScheduleRow {
  id: string;
  owner_id: string;
  title: string;
  day_index: number;
  start_hour: number;
  end_hour: number;
  type: string;
  subject_id: string;
  subject_name: string;
}

interface DbNoteRow {
  id: string;
  owner_id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  tags: string[];
  content: string;
  updated_at: string;
}

interface DbGoalRow {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  current_value: number;
  target_value: number;
  unit: string;
  deadline: string;
  status: string;
}

interface DbCommunityRow {
  id: string;
  author_id: string;
  author_name: string;
  author_course: string;
  channel: string;
  text: string;
  created_at: string;
}

function mapUserRow(row: DbUserRow): UserProfile {
  return {
    ownerId: row.uid,
    name: row.name,
    email: row.email,
    course: row.course,
    university: row.university,
    semester: row.semester,
    registration: row.registration,
    bio: row.bio,
    dailyGoalHours: row.daily_goal_hours,
    pomoMinutes: row.pomo_minutes,
    streak: row.streak,
    recordStreak: row.record_streak,
    theme: row.theme === 'dark' ? 'dark' : 'light',
    tutorialsSeen: row.tutorials_seen || {},
  };
}

function mapSubjectRow(row: DbSubjectRow): Subject {
  return {
    id: row.id,
    ownerId: row.owner_id,
    code: row.code,
    name: row.name,
    professor: row.professor,
    schedule: row.schedule,
    p1: row.p1,
    p2: row.p2,
    hoursStudied: row.hours_studied,
    status:
      row.status === 'completed' || row.status === 'archived'
        ? row.status
        : 'active',
  };
}

function mapTaskRow(row: DbTaskRow): QuickTask {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    completed: row.completed,
    subjectId: row.subject_id,
  };
}

function mapSessionRow(row: DbSessionRow): PomodoroSession {
  return {
    id: row.id,
    ownerId: row.owner_id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    mode: row.mode as PomodoroMode,
    durationMinutes: row.duration_minutes,
    dateKey: row.date_key,
    createdAtMs: new Date(row.created_at).getTime(),
  };
}

function mapScheduleRow(row: DbScheduleRow): ScheduleBlock {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    dayIndex: row.day_index,
    startHour: row.start_hour,
    endHour: row.end_hour,
    type: row.type as ScheduleType,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
  };
}

function mapNoteRow(row: DbNoteRow): StudyNote {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    tags: Array.isArray(row.tags) ? row.tags : [],
    content: row.content,
    updatedAtMs: new Date(row.updated_at).getTime(),
  };
}

function mapGoalRow(row: DbGoalRow): SemesterGoal {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    category: row.category,
    currentValue: row.current_value,
    targetValue: row.target_value,
    unit: row.unit,
    deadline: row.deadline,
    status: row.status === 'completed' ? 'completed' : 'active',
  };
}

function mapCommunityRow(row: DbCommunityRow): CommunityMessage {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorCourse: row.author_course,
    channel: row.channel as CommunityChannel,
    text: row.text,
    createdAtMs: new Date(row.created_at).getTime(),
  };
}

function throwSupabaseError(
  context: string,
  fallbackMessage: string,
  err: unknown
): never {
  const errObj =
    typeof err === 'object' && err !== null
      ? (err as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown })
      : null;

  const code = errObj?.code ? String(errObj.code) : '';
  const rawMsg = errObj?.message
    ? String(errObj.message)
    : err instanceof Error
      ? err.message
      : String(err || 'Unknown Supabase error');
  const lower = rawMsg.toLowerCase();

  console.warn(
    `Supabase query issue [${context}]: code=${code || 'none'} message=${rawMsg}`
  );

  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    lower.includes('could not find the table') ||
    lower.includes('does not exist')
  ) {
    throw new Error(
      'As tabelas do Supabase ainda não foram criadas. Execute supabase/migrations/20261116000000_initial_schema.sql no SQL Editor do seu projeto Supabase.',
      { cause: err }
    );
  }

  if (
    code === '42501' ||
    lower.includes('row-level security') ||
    lower.includes('permission denied') ||
    lower.includes('invalid api key') ||
    lower.includes('jwt')
  ) {
    throw new Error(
      'Credenciais do Supabase inválidas ou sem permissão. Verifique se SUPABASE_SERVICE_ROLE_KEY contém a chave service_role correta.',
      { cause: err }
    );
  }

  if (
    lower.includes('fetch failed') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused')
  ) {
    throw new Error(
      'Não foi possível conectar ao Supabase. Verifique NEXT_PUBLIC_SUPABASE_URL nos Secrets.',
      { cause: err }
    );
  }

  throw new Error(fallbackMessage, { cause: err });
}

export async function getOrCreateUserSupabase(uid: string, email: string, name?: string) {
  const supabase = getSupabaseAdmin();
  const safeEmail = (email || 'estudante@universidade.edu.br').slice(0, 180);
  const safeName = (name || 'Estudante FocusLearn').slice(0, 120);
  const defaults = createDefaultProfile(uid, safeName, safeEmail);

  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .maybeSingle<DbUserRow>();

  if (fetchError) {
    throwSupabaseError('getOrCreateUser fetch', 'Failed to synchronize user account.', fetchError);
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ email: safeEmail, updated_at: new Date().toISOString() })
      .eq('uid', uid)
      .select('*')
      .single<DbUserRow>();

    if (updateError) {
      throwSupabaseError('getOrCreateUser update', 'Failed to synchronize user account.', updateError);
    }
    return updated;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert({
      uid,
      name: defaults.name,
      email: defaults.email,
      course: defaults.course,
      university: defaults.university,
      semester: defaults.semester,
      registration: defaults.registration,
      bio: defaults.bio,
      daily_goal_hours: defaults.dailyGoalHours,
      pomo_minutes: defaults.pomoMinutes,
      streak: defaults.streak,
      record_streak: defaults.recordStreak,
      theme: defaults.theme,
      seeded: false,
    })
    .select('*')
    .single<DbUserRow>();

  if (insertError) {
    throwSupabaseError('getOrCreateUser insert', 'Failed to synchronize user account.', insertError);
  }

  return inserted;
}

export async function seedStarterWorkspaceIfNeededSupabase(uid: string) {
  const supabase = getSupabaseAdmin();

  const { data: claimed, error: claimError } = await supabase
    .from('users')
    .update({ seeded: true, updated_at: new Date().toISOString() })
    .eq('uid', uid)
    .eq('seeded', false)
    .select('uid');

  if (claimError) {
    throwSupabaseError('seed claim', 'Failed to initialize workspace data.', claimError);
  }

  if (!claimed || claimed.length === 0) {
    return;
  }

  const starterSubjects = createStarterSubjects(uid);
  if (!starterSubjects.length) {
    return;
  }

  const { data: insertedSubjects, error: subErr } = await supabase
    .from('subjects')
    .insert(
      starterSubjects.map((s) => ({
        owner_id: uid,
        code: s.code,
        name: s.name,
        professor: s.professor,
        schedule: s.schedule,
        p1: s.p1,
        p2: s.p2,
        hours_studied: s.hoursStudied,
        status: s.status,
      }))
    )
    .select('*');

  if (subErr) {
    throwSupabaseError('seed subjects', 'Failed to initialize workspace data.', subErr);
  }

  const subjectIdMap = new Map<string, string>();
  starterSubjects.forEach((starter, index) => {
    const created = (insertedSubjects as DbSubjectRow[] | null)?.[index];
    if (created) {
      subjectIdMap.set(starter.id, created.id);
    }
  });
  const resolveSubId = (oldId: string) => subjectIdMap.get(oldId) || oldId;

  const starterTasks = createStarterTasks(uid);
  const starterSessions = createStarterSessions(uid);
  const starterSchedule = createStarterSchedule(uid);
  const starterNotes = createStarterNotes(uid);
  const starterGoals = createStarterGoals(uid);

  const results = await Promise.all([
    starterTasks.length
      ? supabase.from('quick_tasks').insert(
          starterTasks.map((t) => ({
            owner_id: uid,
            title: t.title,
            completed: t.completed,
            subject_id: resolveSubId(t.subjectId),
          }))
        )
      : Promise.resolve({ error: null }),
    starterSessions.length
      ? supabase.from('pomodoro_sessions').insert(
          starterSessions.map((s) => ({
            owner_id: uid,
            subject_id: resolveSubId(s.subjectId),
            subject_name: s.subjectName,
            mode: s.mode,
            duration_minutes: s.durationMinutes,
            date_key: s.dateKey,
            created_at: new Date(s.createdAtMs).toISOString(),
          }))
        )
      : Promise.resolve({ error: null }),
    starterSchedule.length
      ? supabase.from('schedule_blocks').insert(
          starterSchedule.map((b) => ({
            owner_id: uid,
            title: b.title,
            day_index: b.dayIndex,
            start_hour: b.startHour,
            end_hour: b.endHour,
            type: b.type,
            subject_id: resolveSubId(b.subjectId),
            subject_name: b.subjectName,
          }))
        )
      : Promise.resolve({ error: null }),
    starterNotes.length
      ? supabase.from('study_notes').insert(
          starterNotes.map((n) => ({
            owner_id: uid,
            title: n.title,
            subject_id: resolveSubId(n.subjectId),
            subject_name: n.subjectName,
            tags: n.tags,
            content: n.content,
            updated_at: new Date(n.updatedAtMs).toISOString(),
          }))
        )
      : Promise.resolve({ error: null }),
    starterGoals.length
      ? supabase.from('semester_goals').insert(
          starterGoals.map((g) => ({
            owner_id: uid,
            title: g.title,
            category: g.category,
            current_value: g.currentValue,
            target_value: g.targetValue,
            unit: g.unit,
            deadline: g.deadline,
            status: g.status,
          }))
        )
      : Promise.resolve({ error: null }),
  ]);

  for (const res of results) {
    if (res.error) {
      throwSupabaseError('seed children', 'Failed to initialize workspace data.', res.error);
    }
  }
}

export async function updateUserProfileRowSupabase(
  uid: string,
  updates: Partial<UserProfile>
) {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined) patch.name = updates.name.slice(0, 120);
  if (updates.email !== undefined) patch.email = updates.email.slice(0, 180);
  if (updates.course !== undefined) patch.course = updates.course.slice(0, 120);
  if (updates.university !== undefined) patch.university = updates.university.slice(0, 140);
  if (updates.semester !== undefined) patch.semester = updates.semester.slice(0, 40);
  if (updates.registration !== undefined) patch.registration = updates.registration.slice(0, 40);
  if (updates.bio !== undefined) patch.bio = updates.bio.slice(0, 500);
  if (updates.dailyGoalHours !== undefined) {
    patch.daily_goal_hours = Math.max(0.5, Math.min(24, Number(updates.dailyGoalHours)));
  }
  if (updates.pomoMinutes !== undefined) {
    patch.pomo_minutes = Math.max(5, Math.min(120, Math.round(Number(updates.pomoMinutes))));
  }
  if (updates.theme === 'light' || updates.theme === 'dark') {
    patch.theme = updates.theme;
  }
  if (updates.tutorialsSeen !== undefined) {
    patch.tutorials_seen = updates.tutorialsSeen;
  }

  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('uid', uid)
    .select('*')
    .maybeSingle<DbUserRow>();

  if (error) {
    throwSupabaseError('updateUserProfileRow', 'Failed to update user profile.', error);
  }

  return data;
}

export async function getWorkspaceDataSupabase(uid: string) {
  const supabase = getSupabaseAdmin();
  const [userRes, subRes, taskRes, sessRes, schedRes, noteRes, goalRes] = await Promise.all([
    supabase.from('users').select('*').eq('uid', uid).maybeSingle<DbUserRow>(),
    supabase.from('subjects').select('*').eq('owner_id', uid).order('created_at', { ascending: false }),
    supabase.from('quick_tasks').select('*').eq('owner_id', uid).order('created_at', { ascending: false }),
    supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('owner_id', uid)
      .order('created_at', { ascending: false }),
    supabase
      .from('schedule_blocks')
      .select('*')
      .eq('owner_id', uid)
      .order('day_index', { ascending: true })
      .order('start_hour', { ascending: true }),
    supabase.from('study_notes').select('*').eq('owner_id', uid).order('updated_at', { ascending: false }),
    supabase.from('semester_goals').select('*').eq('owner_id', uid).order('created_at', { ascending: true }),
  ]);

  const errors = [
    userRes.error,
    subRes.error,
    taskRes.error,
    sessRes.error,
    schedRes.error,
    noteRes.error,
    goalRes.error,
  ].filter(Boolean);

  if (errors.length > 0 || !userRes.data) {
    throwSupabaseError(
      'getWorkspaceData',
      'Failed to load workspace data.',
      errors[0] || new Error('User profile row missing.')
    );
  }

  return {
    profile: mapUserRow(userRes.data),
    subjects: ((subRes.data || []) as DbSubjectRow[]).map(mapSubjectRow),
    tasks: ((taskRes.data || []) as DbTaskRow[]).map(mapTaskRow),
    sessions: ((sessRes.data || []) as DbSessionRow[]).map(mapSessionRow),
    schedule: ((schedRes.data || []) as DbScheduleRow[]).map(mapScheduleRow),
    notes: ((noteRes.data || []) as DbNoteRow[]).map(mapNoteRow),
    goals: ((goalRes.data || []) as DbGoalRow[]).map(mapGoalRow),
  };
}

export async function createSubjectSupabase(
  uid: string,
  input: Omit<Subject, 'id' | 'ownerId'>
): Promise<Subject> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      owner_id: uid,
      code: input.code.trim().slice(0, 24),
      name: input.name.trim().slice(0, 120),
      professor: input.professor.trim().slice(0, 100),
      schedule: input.schedule.trim().slice(0, 80),
      p1: Math.max(0, Math.min(10, Number(input.p1) || 0)),
      p2: Math.max(0, Math.min(10, Number(input.p2) || 0)),
      hours_studied: Math.max(0, Math.min(5000, Number(input.hoursStudied) || 0)),
      status: input.status || 'active',
    })
    .select('*')
    .single<DbSubjectRow>();

  if (error) {
    throwSupabaseError('createSubject', 'Failed to create subject.', error);
  }
  return mapSubjectRow(data);
}

export async function updateSubjectRowSupabase(
  uid: string,
  id: string,
  updates: Partial<Subject>
): Promise<Subject | null> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.code !== undefined) patch.code = updates.code.slice(0, 24);
  if (updates.name !== undefined) patch.name = updates.name.slice(0, 120);
  if (updates.professor !== undefined) patch.professor = updates.professor.slice(0, 100);
  if (updates.schedule !== undefined) patch.schedule = updates.schedule.slice(0, 80);
  if (updates.p1 !== undefined) patch.p1 = Math.max(0, Math.min(10, Number(updates.p1)));
  if (updates.p2 !== undefined) patch.p2 = Math.max(0, Math.min(10, Number(updates.p2)));
  if (updates.status !== undefined) patch.status = updates.status;

  const { data, error } = await supabase
    .from('subjects')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', uid)
    .select('*')
    .maybeSingle<DbSubjectRow>();

  if (error) {
    throwSupabaseError('updateSubjectRow', 'Failed to update subject.', error);
  }
  return data ? mapSubjectRow(data) : null;
}

export async function deleteSubjectRowSupabase(uid: string, id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)
    .eq('owner_id', uid)
    .select('id');

  if (error) {
    throwSupabaseError('deleteSubjectRow', 'Failed to delete subject.', error);
  }
  return Boolean(data && data.length > 0);
}

export async function createTaskRowSupabase(
  uid: string,
  title: string,
  subjectId = ''
): Promise<QuickTask> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('quick_tasks')
    .insert({
      owner_id: uid,
      title: title.trim().slice(0, 200),
      completed: false,
      subject_id: subjectId.slice(0, 128),
    })
    .select('*')
    .single<DbTaskRow>();

  if (error) {
    throwSupabaseError('createTaskRow', 'Failed to create task.', error);
  }
  return mapTaskRow(data);
}

export async function updateTaskRowSupabase(
  uid: string,
  id: string,
  completed: boolean
): Promise<QuickTask | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('quick_tasks')
    .update({ completed, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', uid)
    .select('*')
    .maybeSingle<DbTaskRow>();

  if (error) {
    throwSupabaseError('updateTaskRow', 'Failed to update task.', error);
  }
  return data ? mapTaskRow(data) : null;
}

export async function deleteTaskRowSupabase(uid: string, id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('quick_tasks')
    .delete()
    .eq('id', id)
    .eq('owner_id', uid)
    .select('id');

  if (error) {
    throwSupabaseError('deleteTaskRow', 'Failed to delete task.', error);
  }
  return Boolean(data && data.length > 0);
}

export async function createScheduleBlockRowSupabase(
  uid: string,
  input: Omit<ScheduleBlock, 'id' | 'ownerId'>
): Promise<ScheduleBlock> {
  const supabase = getSupabaseAdmin();
  const startHour = Math.max(6, Math.min(23, Math.round(Number(input.startHour))));
  const endHour = Math.max(startHour + 1, Math.min(24, Math.round(Number(input.endHour))));

  const { data, error } = await supabase
    .from('schedule_blocks')
    .insert({
      owner_id: uid,
      title: input.title.trim().slice(0, 120),
      day_index: Math.max(0, Math.min(6, Math.round(Number(input.dayIndex)))),
      start_hour: startHour,
      end_hour: endHour,
      type: input.type,
      subject_id: input.subjectId.slice(0, 128),
      subject_name: input.subjectName.slice(0, 120),
    })
    .select('*')
    .single<DbScheduleRow>();

  if (error) {
    throwSupabaseError('createScheduleBlockRow', 'Failed to create schedule block.', error);
  }
  return mapScheduleRow(data);
}

export async function deleteScheduleBlockRowSupabase(uid: string, id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('schedule_blocks')
    .delete()
    .eq('id', id)
    .eq('owner_id', uid)
    .select('id');

  if (error) {
    throwSupabaseError('deleteScheduleBlockRow', 'Failed to delete schedule block.', error);
  }
  return Boolean(data && data.length > 0);
}

export async function createNoteRowSupabase(
  uid: string,
  input: Omit<StudyNote, 'id' | 'ownerId' | 'updatedAtMs'>
): Promise<StudyNote> {
  const supabase = getSupabaseAdmin();
  const cleanTags = (input.tags || [])
    .map((t) => t.trim().replace(/^#/, '').slice(0, 40))
    .filter(Boolean)
    .slice(0, 10);

  const { data, error } = await supabase
    .from('study_notes')
    .insert({
      owner_id: uid,
      title: input.title.trim().slice(0, 160),
      subject_id: input.subjectId.slice(0, 128),
      subject_name: input.subjectName.slice(0, 120),
      tags: cleanTags,
      content: input.content.trim().slice(0, 20000),
    })
    .select('*')
    .single<DbNoteRow>();

  if (error) {
    throwSupabaseError('createNoteRow', 'Failed to create note.', error);
  }
  return mapNoteRow(data);
}

export async function updateNoteRowSupabase(
  uid: string,
  id: string,
  updates: Partial<StudyNote>
): Promise<StudyNote | null> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) patch.title = updates.title.trim().slice(0, 160);
  if (updates.subjectId !== undefined) patch.subject_id = updates.subjectId.slice(0, 128);
  if (updates.subjectName !== undefined) patch.subject_name = updates.subjectName.slice(0, 120);
  if (updates.tags !== undefined) {
    patch.tags = updates.tags
      .map((t) => t.trim().replace(/^#/, '').slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);
  }
  if (updates.content !== undefined) patch.content = updates.content.trim().slice(0, 20000);

  const { data, error } = await supabase
    .from('study_notes')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', uid)
    .select('*')
    .maybeSingle<DbNoteRow>();

  if (error) {
    throwSupabaseError('updateNoteRow', 'Failed to update note.', error);
  }
  return data ? mapNoteRow(data) : null;
}

export async function deleteNoteRowSupabase(uid: string, id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('study_notes')
    .delete()
    .eq('id', id)
    .eq('owner_id', uid)
    .select('id');

  if (error) {
    throwSupabaseError('deleteNoteRow', 'Failed to delete note.', error);
  }
  return Boolean(data && data.length > 0);
}

export async function createGoalRowSupabase(
  uid: string,
  input: Omit<SemesterGoal, 'id' | 'ownerId' | 'status'>
): Promise<SemesterGoal> {
  const supabase = getSupabaseAdmin();
  const target = Math.max(0.1, Math.min(100000, Number(input.targetValue) || 10));
  const current = Math.max(0, Math.min(100000, Number(input.currentValue) || 0));
  const status = current >= target ? 'completed' : 'active';

  const { data, error } = await supabase
    .from('semester_goals')
    .insert({
      owner_id: uid,
      title: input.title.trim().slice(0, 140),
      category: input.category.trim().slice(0, 60) || 'Estudos',
      current_value: current,
      target_value: target,
      unit: input.unit.trim().slice(0, 24) || 'h',
      deadline: input.deadline.trim().slice(0, 40),
      status,
    })
    .select('*')
    .single<DbGoalRow>();

  if (error) {
    throwSupabaseError('createGoalRow', 'Failed to create goal.', error);
  }
  return mapGoalRow(data);
}

export async function incrementGoalRowSupabase(
  uid: string,
  id: string,
  delta: number
): Promise<SemesterGoal | null> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from('semester_goals')
    .select('*')
    .eq('id', id)
    .eq('owner_id', uid)
    .maybeSingle<DbGoalRow>();

  if (fetchError) {
    throwSupabaseError('incrementGoalRow fetch', 'Failed to update goal progress.', fetchError);
  }

  if (!existing) return null;
  if (existing.status === 'completed') {
    return mapGoalRow(existing);
  }

  const nextVal = Math.max(
    0,
    Math.min(100000, Number((existing.current_value + delta).toFixed(1)))
  );
  const nextStatus = nextVal >= existing.target_value ? 'completed' : 'active';

  const { data: updated, error: updateError } = await supabase
    .from('semester_goals')
    .update({
      current_value: nextVal,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', uid)
    .select('*')
    .maybeSingle<DbGoalRow>();

  if (updateError) {
    throwSupabaseError('incrementGoalRow update', 'Failed to update goal progress.', updateError);
  }
  return updated ? mapGoalRow(updated) : null;
}

export async function deleteGoalRowSupabase(uid: string, id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('semester_goals')
    .delete()
    .eq('id', id)
    .eq('owner_id', uid)
    .select('id');

  if (error) {
    throwSupabaseError('deleteGoalRow', 'Failed to delete goal.', error);
  }
  return Boolean(data && data.length > 0);
}

export async function listCommunityMessagesSupabase(
  channel: CommunityChannel
): Promise<CommunityMessage[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('community_messages')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    throwSupabaseError('listCommunityMessages', 'Failed to fetch community messages.', error);
  }
  return ((data || []) as DbCommunityRow[]).map(mapCommunityRow);
}

export async function createCommunityMessageRowSupabase(input: {
  authorId: string;
  authorName: string;
  authorCourse: string;
  channel: CommunityChannel;
  text: string;
}): Promise<CommunityMessage> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('community_messages')
    .insert({
      author_id: input.authorId,
      author_name: input.authorName.trim().slice(0, 100) || 'Estudante',
      author_course: input.authorCourse.trim().slice(0, 100),
      channel: input.channel,
      text: input.text.trim().slice(0, 1000),
    })
    .select('*')
    .single<DbCommunityRow>();

  if (error) {
    throwSupabaseError('createCommunityMessageRow', 'Failed to post community message.', error);
  }
  return mapCommunityRow(data);
}

export async function deleteCommunityMessageRowSupabase(
  uid: string,
  id: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('community_messages')
    .delete()
    .eq('id', id)
    .eq('author_id', uid)
    .select('id');

  if (error) {
    throwSupabaseError('deleteCommunityMessageRow', 'Failed to delete community message.', error);
  }
  return Boolean(data && data.length > 0);
}
