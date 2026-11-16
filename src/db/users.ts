import { and, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  pomodoroSessions,
  quickTasks,
  scheduleBlocks,
  semesterGoals,
  studyNotes,
  subjects,
  users,
} from './schema.ts';
import {
  createDefaultProfile,
  createStarterGoals,
  createStarterNotes,
  createStarterSchedule,
  createStarterSessions,
  createStarterSubjects,
  createStarterTasks,
} from '@/lib/seedData';
import type { UserProfile } from '@/lib/types';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  const safeEmail = (email || 'estudante@universidade.edu.br').slice(0, 180);
  const safeName = (name || 'Estudante FocusLearn').slice(0, 120);
  const defaults = createDefaultProfile(uid, safeName, safeEmail);

  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        name: defaults.name,
        email: defaults.email,
        course: defaults.course,
        university: defaults.university,
        semester: defaults.semester,
        registration: defaults.registration,
        bio: defaults.bio,
        dailyGoalHours: defaults.dailyGoalHours,
        pomoMinutes: defaults.pomoMinutes,
        streak: defaults.streak,
        recordStreak: defaults.recordStreak,
        theme: defaults.theme,
        seeded: false,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: safeEmail,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (getOrCreateUser):', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function seedStarterWorkspaceIfNeeded(uid: string) {
  try {
    await db.transaction(async (tx) => {
      const claimed = await tx
        .update(users)
        .set({ seeded: true, updatedAt: new Date() })
        .where(and(eq(users.uid, uid), eq(users.seeded, false)))
        .returning();

      if (!claimed.length) {
        return;
      }

      const starterSubjects = createStarterSubjects(uid);
      const insertedSubjects = await tx
        .insert(subjects)
        .values(
          starterSubjects.map((s) => ({
            ownerId: uid,
            code: s.code,
            name: s.name,
            professor: s.professor,
            schedule: s.schedule,
            credits: s.credits,
            p1: s.p1,
            p2: s.p2,
            hoursStudied: s.hoursStudied,
            status: s.status,
          }))
        )
        .returning();

      const subjectIdMap = new Map<string, string>();
      starterSubjects.forEach((starter, index) => {
        const created = insertedSubjects[index];
        if (created) {
          subjectIdMap.set(starter.id, created.id);
        }
      });

      const resolveSubId = (oldId: string) => subjectIdMap.get(oldId) || oldId;

      const starterTasks = createStarterTasks(uid);
      if (starterTasks.length) {
        await tx.insert(quickTasks).values(
          starterTasks.map((t) => ({
            ownerId: uid,
            title: t.title,
            completed: t.completed,
            subjectId: resolveSubId(t.subjectId),
          }))
        );
      }

      const starterSessions = createStarterSessions(uid);
      if (starterSessions.length) {
        await tx.insert(pomodoroSessions).values(
          starterSessions.map((s) => ({
            ownerId: uid,
            subjectId: resolveSubId(s.subjectId),
            subjectName: s.subjectName,
            mode: s.mode,
            durationMinutes: s.durationMinutes,
            dateKey: s.dateKey,
            createdAt: new Date(s.createdAtMs),
          }))
        );
      }

      const starterSchedule = createStarterSchedule(uid);
      if (starterSchedule.length) {
        await tx.insert(scheduleBlocks).values(
          starterSchedule.map((b) => ({
            ownerId: uid,
            title: b.title,
            dayIndex: b.dayIndex,
            startHour: b.startHour,
            endHour: b.endHour,
            type: b.type,
            subjectId: resolveSubId(b.subjectId),
            subjectName: b.subjectName,
          }))
        );
      }

      const starterNotes = createStarterNotes(uid);
      if (starterNotes.length) {
        await tx.insert(studyNotes).values(
          starterNotes.map((n) => ({
            ownerId: uid,
            title: n.title,
            subjectId: resolveSubId(n.subjectId),
            subjectName: n.subjectName,
            tags: n.tags,
            content: n.content,
            updatedAt: new Date(n.updatedAtMs),
          }))
        );
      }

      const starterGoals = createStarterGoals(uid);
      if (starterGoals.length) {
        await tx.insert(semesterGoals).values(
          starterGoals.map((g) => ({
            ownerId: uid,
            title: g.title,
            category: g.category,
            currentValue: g.currentValue,
            targetValue: g.targetValue,
            unit: g.unit,
            deadline: g.deadline,
            status: g.status,
          }))
        );
      }
    });
  } catch (error) {
    console.error('Database query failed (seedStarterWorkspaceIfNeeded):', error);
    throw new Error('Failed to initialize workspace data.', { cause: error });
  }
}

export async function updateUserProfileRow(uid: string, updates: Partial<UserProfile>) {
  try {
    const patch: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (updates.name !== undefined) patch.name = updates.name.slice(0, 120);
    if (updates.email !== undefined) patch.email = updates.email.slice(0, 180);
    if (updates.course !== undefined) patch.course = updates.course.slice(0, 120);
    if (updates.university !== undefined) patch.university = updates.university.slice(0, 140);
    if (updates.semester !== undefined) patch.semester = updates.semester.slice(0, 40);
    if (updates.registration !== undefined) patch.registration = updates.registration.slice(0, 40);
    if (updates.bio !== undefined) patch.bio = updates.bio.slice(0, 500);
    if (updates.dailyGoalHours !== undefined) {
      patch.dailyGoalHours = Math.max(0.5, Math.min(24, Number(updates.dailyGoalHours)));
    }
    if (updates.pomoMinutes !== undefined) {
      patch.pomoMinutes = Math.max(5, Math.min(120, Math.round(Number(updates.pomoMinutes))));
    }
    if (updates.theme === 'light' || updates.theme === 'dark') {
      patch.theme = updates.theme;
    }

    const updated = await db
      .update(users)
      .set(patch)
      .where(eq(users.uid, uid))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Database query failed (updateUserProfileRow):', error);
    throw new Error('Failed to update user profile.', { cause: error });
  }
}
