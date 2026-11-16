import { and, desc, asc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  communityMessages,
  pomodoroSessions,
  quickTasks,
  scheduleBlocks,
  semesterGoals,
  studyNotes,
  subjects,
  users,
} from './schema.ts';
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

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapUserRow(row: typeof users.$inferSelect): UserProfile {
  return {
    ownerId: row.uid,
    name: row.name,
    email: row.email,
    course: row.course,
    university: row.university,
    semester: row.semester,
    registration: row.registration,
    bio: row.bio,
    dailyGoalHours: row.dailyGoalHours,
    pomoMinutes: row.pomoMinutes,
    streak: row.streak,
    recordStreak: row.recordStreak,
    theme: row.theme === 'dark' ? 'dark' : 'light',
    tutorialsSeen: row.tutorialsSeen || {},
  };
}

function mapSubjectRow(row: typeof subjects.$inferSelect): Subject {
  return {
    id: row.id,
    ownerId: row.ownerId,
    code: row.code,
    name: row.name,
    professor: row.professor,
    schedule: row.schedule,
    p1: row.p1,
    p2: row.p2,
    hoursStudied: row.hoursStudied,
    status:
      row.status === 'completed' || row.status === 'archived'
        ? row.status
        : 'active',
  };
}

function mapTaskRow(row: typeof quickTasks.$inferSelect): QuickTask {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    completed: row.completed,
    subjectId: row.subjectId,
  };
}

function mapSessionRow(row: typeof pomodoroSessions.$inferSelect): PomodoroSession {
  return {
    id: row.id,
    ownerId: row.ownerId,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    mode: row.mode as PomodoroMode,
    durationMinutes: row.durationMinutes,
    dateKey: row.dateKey,
    createdAtMs: row.createdAt.getTime(),
  };
}

function mapScheduleRow(row: typeof scheduleBlocks.$inferSelect): ScheduleBlock {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    dayIndex: row.dayIndex,
    startHour: row.startHour,
    endHour: row.endHour,
    type: row.type as ScheduleType,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
  };
}

function mapNoteRow(row: typeof studyNotes.$inferSelect): StudyNote {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    tags: Array.isArray(row.tags) ? row.tags : [],
    content: row.content,
    updatedAtMs: row.updatedAt.getTime(),
  };
}

function mapGoalRow(row: typeof semesterGoals.$inferSelect): SemesterGoal {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    category: row.category,
    currentValue: row.currentValue,
    targetValue: row.targetValue,
    unit: row.unit,
    deadline: row.deadline,
    status: row.status === 'completed' ? 'completed' : 'active',
  };
}

function mapCommunityRow(row: typeof communityMessages.$inferSelect): CommunityMessage {
  return {
    id: row.id,
    authorId: row.authorId,
    authorName: row.authorName,
    authorCourse: row.authorCourse,
    channel: row.channel as CommunityChannel,
    text: row.text,
    createdAtMs: row.createdAt.getTime(),
  };
}

export async function getWorkspaceData(uid: string) {
  try {
    const [
      userRows,
      subjectRows,
      taskRows,
      sessionRows,
      scheduleRows,
      noteRows,
      goalRows,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.uid, uid)),
      db.select().from(subjects).where(eq(subjects.ownerId, uid)).orderBy(desc(subjects.createdAt)),
      db.select().from(quickTasks).where(eq(quickTasks.ownerId, uid)).orderBy(desc(quickTasks.createdAt)),
      db
        .select()
        .from(pomodoroSessions)
        .where(eq(pomodoroSessions.ownerId, uid))
        .orderBy(desc(pomodoroSessions.createdAt)),
      db
        .select()
        .from(scheduleBlocks)
        .where(eq(scheduleBlocks.ownerId, uid))
        .orderBy(asc(scheduleBlocks.dayIndex), asc(scheduleBlocks.startHour)),
      db.select().from(studyNotes).where(eq(studyNotes.ownerId, uid)).orderBy(desc(studyNotes.updatedAt)),
      db.select().from(semesterGoals).where(eq(semesterGoals.ownerId, uid)).orderBy(asc(semesterGoals.createdAt)),
    ]);

    if (!userRows.length) {
      throw new Error('User profile not found.');
    }

    return {
      profile: mapUserRow(userRows[0]),
      subjects: subjectRows.map(mapSubjectRow),
      tasks: taskRows.map(mapTaskRow),
      sessions: sessionRows.map(mapSessionRow),
      schedule: scheduleRows.map(mapScheduleRow),
      notes: noteRows.map(mapNoteRow),
      goals: goalRows.map(mapGoalRow),
    };
  } catch (error) {
    console.error('Database query failed (getWorkspaceData):', error);
    throw new Error('Failed to load workspace data.', { cause: error });
  }
}

export async function createSubject(
  uid: string,
  input: Omit<Subject, 'id' | 'ownerId'>
): Promise<Subject> {
  try {
    const inserted = await db
      .insert(subjects)
      .values({
        ownerId: uid,
        code: input.code.trim().slice(0, 24),
        name: input.name.trim().slice(0, 120),
        professor: input.professor.trim().slice(0, 100),
        schedule: input.schedule.trim().slice(0, 80),
        p1: Math.max(0, Math.min(10, Number(input.p1) || 0)),
        p2: Math.max(0, Math.min(10, Number(input.p2) || 0)),
        hoursStudied: Math.max(0, Math.min(5000, Number(input.hoursStudied) || 0)),
        status: input.status || 'active',
      })
      .returning();

    return mapSubjectRow(inserted[0]);
  } catch (error) {
    console.error('Database query failed (createSubject):', error);
    throw new Error('Failed to create subject.', { cause: error });
  }
}

export async function updateSubjectRow(
  uid: string,
  id: string,
  updates: Partial<Subject>
): Promise<Subject | null> {
  try {
    const patch: Partial<typeof subjects.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (updates.code !== undefined) patch.code = updates.code.slice(0, 24);
    if (updates.name !== undefined) patch.name = updates.name.slice(0, 120);
    if (updates.professor !== undefined) patch.professor = updates.professor.slice(0, 100);
    if (updates.schedule !== undefined) patch.schedule = updates.schedule.slice(0, 80);
    if (updates.p1 !== undefined) patch.p1 = Math.max(0, Math.min(10, Number(updates.p1)));
    if (updates.p2 !== undefined) patch.p2 = Math.max(0, Math.min(10, Number(updates.p2)));
    if (updates.status !== undefined) patch.status = updates.status;

    const updated = await db
      .update(subjects)
      .set(patch)
      .where(and(eq(subjects.id, id), eq(subjects.ownerId, uid)))
      .returning();

    return updated[0] ? mapSubjectRow(updated[0]) : null;
  } catch (error) {
    console.error('Database query failed (updateSubjectRow):', error);
    throw new Error('Failed to update subject.', { cause: error });
  }
}

export async function deleteSubjectRow(uid: string, id: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.ownerId, uid)))
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed (deleteSubjectRow):', error);
    throw new Error('Failed to delete subject.', { cause: error });
  }
}

export async function createTaskRow(
  uid: string,
  title: string,
  subjectId = ''
): Promise<QuickTask> {
  try {
    const inserted = await db
      .insert(quickTasks)
      .values({
        ownerId: uid,
        title: title.trim().slice(0, 200),
        completed: false,
        subjectId: subjectId.slice(0, 128),
      })
      .returning();

    return mapTaskRow(inserted[0]);
  } catch (error) {
    console.error('Database query failed (createTaskRow):', error);
    throw new Error('Failed to create task.', { cause: error });
  }
}

export async function updateTaskRow(
  uid: string,
  id: string,
  completed: boolean
): Promise<QuickTask | null> {
  try {
    const updated = await db
      .update(quickTasks)
      .set({ completed, updatedAt: new Date() })
      .where(and(eq(quickTasks.id, id), eq(quickTasks.ownerId, uid)))
      .returning();

    return updated[0] ? mapTaskRow(updated[0]) : null;
  } catch (error) {
    console.error('Database query failed (updateTaskRow):', error);
    throw new Error('Failed to update task.', { cause: error });
  }
}

export async function deleteTaskRow(uid: string, id: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(quickTasks)
      .where(and(eq(quickTasks.id, id), eq(quickTasks.ownerId, uid)))
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed (deleteTaskRow):', error);
    throw new Error('Failed to delete task.', { cause: error });
  }
}

export async function createScheduleBlockRow(
  uid: string,
  input: Omit<ScheduleBlock, 'id' | 'ownerId'>
): Promise<ScheduleBlock> {
  try {
    const startHour = Math.max(6, Math.min(23, Math.round(Number(input.startHour))));
    const endHour = Math.max(startHour + 1, Math.min(24, Math.round(Number(input.endHour))));
    const inserted = await db
      .insert(scheduleBlocks)
      .values({
        ownerId: uid,
        title: input.title.trim().slice(0, 120),
        dayIndex: Math.max(0, Math.min(6, Math.round(Number(input.dayIndex)))),
        startHour,
        endHour,
        type: input.type,
        subjectId: input.subjectId.slice(0, 128),
        subjectName: input.subjectName.slice(0, 120),
      })
      .returning();

    return mapScheduleRow(inserted[0]);
  } catch (error) {
    console.error('Database query failed (createScheduleBlockRow):', error);
    throw new Error('Failed to create schedule block.', { cause: error });
  }
}

export async function deleteScheduleBlockRow(uid: string, id: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(scheduleBlocks)
      .where(and(eq(scheduleBlocks.id, id), eq(scheduleBlocks.ownerId, uid)))
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed (deleteScheduleBlockRow):', error);
    throw new Error('Failed to delete schedule block.', { cause: error });
  }
}

export async function createNoteRow(
  uid: string,
  input: Omit<StudyNote, 'id' | 'ownerId' | 'updatedAtMs'>
): Promise<StudyNote> {
  try {
    const cleanTags = (input.tags || [])
      .map((t) => t.trim().replace(/^#/, '').slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);

    const inserted = await db
      .insert(studyNotes)
      .values({
        ownerId: uid,
        title: input.title.trim().slice(0, 160),
        subjectId: input.subjectId.slice(0, 128),
        subjectName: input.subjectName.slice(0, 120),
        tags: cleanTags,
        content: input.content.trim().slice(0, 20000),
      })
      .returning();

    return mapNoteRow(inserted[0]);
  } catch (error) {
    console.error('Database query failed (createNoteRow):', error);
    throw new Error('Failed to create note.', { cause: error });
  }
}

export async function updateNoteRow(
  uid: string,
  id: string,
  updates: Partial<StudyNote>
): Promise<StudyNote | null> {
  try {
    const patch: Partial<typeof studyNotes.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (updates.title !== undefined) patch.title = updates.title.trim().slice(0, 160);
    if (updates.subjectId !== undefined) patch.subjectId = updates.subjectId.slice(0, 128);
    if (updates.subjectName !== undefined) patch.subjectName = updates.subjectName.slice(0, 120);
    if (updates.tags !== undefined) {
      patch.tags = updates.tags
        .map((t) => t.trim().replace(/^#/, '').slice(0, 40))
        .filter(Boolean)
        .slice(0, 10);
    }
    if (updates.content !== undefined) patch.content = updates.content.trim().slice(0, 20000);

    const updated = await db
      .update(studyNotes)
      .set(patch)
      .where(and(eq(studyNotes.id, id), eq(studyNotes.ownerId, uid)))
      .returning();

    return updated[0] ? mapNoteRow(updated[0]) : null;
  } catch (error) {
    console.error('Database query failed (updateNoteRow):', error);
    throw new Error('Failed to update note.', { cause: error });
  }
}

export async function deleteNoteRow(uid: string, id: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(studyNotes)
      .where(and(eq(studyNotes.id, id), eq(studyNotes.ownerId, uid)))
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed (deleteNoteRow):', error);
    throw new Error('Failed to delete note.', { cause: error });
  }
}

export async function createGoalRow(
  uid: string,
  input: Omit<SemesterGoal, 'id' | 'ownerId' | 'status'>
): Promise<SemesterGoal> {
  try {
    const target = Math.max(0.1, Math.min(100000, Number(input.targetValue) || 10));
    const current = Math.max(0, Math.min(100000, Number(input.currentValue) || 0));
    const status = current >= target ? 'completed' : 'active';

    const inserted = await db
      .insert(semesterGoals)
      .values({
        ownerId: uid,
        title: input.title.trim().slice(0, 140),
        category: input.category.trim().slice(0, 60) || 'Estudos',
        currentValue: current,
        targetValue: target,
        unit: input.unit.trim().slice(0, 24) || 'h',
        deadline: input.deadline.trim().slice(0, 40),
        status,
      })
      .returning();

    return mapGoalRow(inserted[0]);
  } catch (error) {
    console.error('Database query failed (createGoalRow):', error);
    throw new Error('Failed to create goal.', { cause: error });
  }
}

export async function incrementGoalRow(
  uid: string,
  id: string,
  delta: number
): Promise<SemesterGoal | null> {
  try {
    const existing = await db
      .select()
      .from(semesterGoals)
      .where(and(eq(semesterGoals.id, id), eq(semesterGoals.ownerId, uid)));

    if (!existing[0]) return null;
    if (existing[0].status === 'completed') {
      return mapGoalRow(existing[0]);
    }

    const nextVal = Math.max(
      0,
      Math.min(100000, Number((existing[0].currentValue + delta).toFixed(1)))
    );
    const nextStatus = nextVal >= existing[0].targetValue ? 'completed' : 'active';

    const updated = await db
      .update(semesterGoals)
      .set({
        currentValue: nextVal,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(semesterGoals.id, id), eq(semesterGoals.ownerId, uid)))
      .returning();

    return updated[0] ? mapGoalRow(updated[0]) : null;
  } catch (error) {
    console.error('Database query failed (incrementGoalRow):', error);
    throw new Error('Failed to update goal progress.', { cause: error });
  }
}

export async function deleteGoalRow(uid: string, id: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(semesterGoals)
      .where(and(eq(semesterGoals.id, id), eq(semesterGoals.ownerId, uid)))
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed (deleteGoalRow):', error);
    throw new Error('Failed to delete goal.', { cause: error });
  }
}

export async function listCommunityMessages(channel: CommunityChannel): Promise<CommunityMessage[]> {
  try {
    const rows = await db
      .select()
      .from(communityMessages)
      .where(eq(communityMessages.channel, channel))
      .orderBy(asc(communityMessages.createdAt))
      .limit(100);

    return rows.map(mapCommunityRow);
  } catch (error) {
    console.error('Database query failed (listCommunityMessages):', error);
    throw new Error('Failed to fetch community messages.', { cause: error });
  }
}

export async function createCommunityMessageRow(input: {
  authorId: string;
  authorName: string;
  authorCourse: string;
  channel: CommunityChannel;
  text: string;
}): Promise<CommunityMessage> {
  try {
    const inserted = await db
      .insert(communityMessages)
      .values({
        authorId: input.authorId,
        authorName: input.authorName.trim().slice(0, 100) || 'Estudante',
        authorCourse: input.authorCourse.trim().slice(0, 100),
        channel: input.channel,
        text: input.text.trim().slice(0, 1000),
      })
      .returning();

    return mapCommunityRow(inserted[0]);
  } catch (error) {
    console.error('Database query failed (createCommunityMessageRow):', error);
    throw new Error('Failed to post community message.', { cause: error });
  }
}

export async function deleteCommunityMessageRow(uid: string, id: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(communityMessages)
      .where(and(eq(communityMessages.id, id), eq(communityMessages.authorId, uid)))
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed (deleteCommunityMessageRow):', error);
    throw new Error('Failed to delete community message.', { cause: error });
  }
}
