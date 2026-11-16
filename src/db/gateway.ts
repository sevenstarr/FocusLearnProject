import { isSupabaseConfigured } from '../lib/supabase.ts';
import {
  getOrCreateUser as getOrCreateUserDrizzle,
  seedStarterWorkspaceIfNeeded as seedStarterWorkspaceDrizzle,
  updateUserProfileRow as updateUserProfileDrizzle,
} from './users.ts';
import {
  UUID_REGEX,
  createCommunityMessageRow as createCommunityDrizzle,
  createGoalRow as createGoalDrizzle,
  createNoteRow as createNoteDrizzle,
  createScheduleBlockRow as createScheduleDrizzle,
  createSubject as createSubjectDrizzle,
  createTaskRow as createTaskDrizzle,
  deleteCommunityMessageRow as deleteCommunityDrizzle,
  deleteGoalRow as deleteGoalDrizzle,
  deleteNoteRow as deleteNoteDrizzle,
  deleteScheduleBlockRow as deleteScheduleDrizzle,
  deleteSubjectRow as deleteSubjectDrizzle,
  deleteTaskRow as deleteTaskDrizzle,
  getWorkspaceData as getWorkspaceDrizzle,
  incrementGoalRow as incrementGoalDrizzle,
  listCommunityMessages as listCommunityDrizzle,
  updateNoteRow as updateNoteDrizzle,
  updateSubjectRow as updateSubjectDrizzle,
  updateTaskRow as updateTaskDrizzle,
} from './repositories.ts';
import {
  createCommunityMessageRowSupabase,
  createGoalRowSupabase,
  createNoteRowSupabase,
  createScheduleBlockRowSupabase,
  createSubjectSupabase,
  createTaskRowSupabase,
  deleteCommunityMessageRowSupabase,
  deleteGoalRowSupabase,
  deleteNoteRowSupabase,
  deleteScheduleBlockRowSupabase,
  deleteSubjectRowSupabase,
  deleteTaskRowSupabase,
  getOrCreateUserSupabase,
  getWorkspaceDataSupabase,
  incrementGoalRowSupabase,
  listCommunityMessagesSupabase,
  seedStarterWorkspaceIfNeededSupabase,
  updateNoteRowSupabase,
  updateSubjectRowSupabase,
  updateTaskRowSupabase,
  updateUserProfileRowSupabase,
} from './supabase-repositories.ts';
import type {
  CommunityChannel,
  ScheduleBlock,
  SemesterGoal,
  StudyNote,
  Subject,
  UserProfile,
} from '@/lib/types';

export { UUID_REGEX };

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  return isSupabaseConfigured()
    ? getOrCreateUserSupabase(uid, email, name)
    : getOrCreateUserDrizzle(uid, email, name);
}

export async function seedStarterWorkspaceIfNeeded(uid: string) {
  return isSupabaseConfigured()
    ? seedStarterWorkspaceIfNeededSupabase(uid)
    : seedStarterWorkspaceDrizzle(uid);
}

export async function updateUserProfileRow(uid: string, updates: Partial<UserProfile>) {
  return isSupabaseConfigured()
    ? updateUserProfileRowSupabase(uid, updates)
    : updateUserProfileDrizzle(uid, updates);
}

export async function getWorkspaceData(uid: string) {
  return isSupabaseConfigured()
    ? getWorkspaceDataSupabase(uid)
    : getWorkspaceDrizzle(uid);
}

export async function createSubject(
  uid: string,
  input: Omit<Subject, 'id' | 'ownerId'>
) {
  return isSupabaseConfigured()
    ? createSubjectSupabase(uid, input)
    : createSubjectDrizzle(uid, input);
}

export async function updateSubjectRow(
  uid: string,
  id: string,
  updates: Partial<Subject>
) {
  return isSupabaseConfigured()
    ? updateSubjectRowSupabase(uid, id, updates)
    : updateSubjectDrizzle(uid, id, updates);
}

export async function deleteSubjectRow(uid: string, id: string) {
  return isSupabaseConfigured()
    ? deleteSubjectRowSupabase(uid, id)
    : deleteSubjectDrizzle(uid, id);
}

export async function createTaskRow(uid: string, title: string, subjectId = '') {
  return isSupabaseConfigured()
    ? createTaskRowSupabase(uid, title, subjectId)
    : createTaskDrizzle(uid, title, subjectId);
}

export async function updateTaskRow(uid: string, id: string, completed: boolean) {
  return isSupabaseConfigured()
    ? updateTaskRowSupabase(uid, id, completed)
    : updateTaskDrizzle(uid, id, completed);
}

export async function deleteTaskRow(uid: string, id: string) {
  return isSupabaseConfigured()
    ? deleteTaskRowSupabase(uid, id)
    : deleteTaskDrizzle(uid, id);
}

export async function createScheduleBlockRow(
  uid: string,
  input: Omit<ScheduleBlock, 'id' | 'ownerId'>
) {
  return isSupabaseConfigured()
    ? createScheduleBlockRowSupabase(uid, input)
    : createScheduleDrizzle(uid, input);
}

export async function deleteScheduleBlockRow(uid: string, id: string) {
  return isSupabaseConfigured()
    ? deleteScheduleBlockRowSupabase(uid, id)
    : deleteScheduleDrizzle(uid, id);
}

export async function createNoteRow(
  uid: string,
  input: Omit<StudyNote, 'id' | 'ownerId' | 'updatedAtMs'>
) {
  return isSupabaseConfigured()
    ? createNoteRowSupabase(uid, input)
    : createNoteDrizzle(uid, input);
}

export async function updateNoteRow(
  uid: string,
  id: string,
  updates: Partial<StudyNote>
) {
  return isSupabaseConfigured()
    ? updateNoteRowSupabase(uid, id, updates)
    : updateNoteDrizzle(uid, id, updates);
}

export async function deleteNoteRow(uid: string, id: string) {
  return isSupabaseConfigured()
    ? deleteNoteRowSupabase(uid, id)
    : deleteNoteDrizzle(uid, id);
}

export async function createGoalRow(
  uid: string,
  input: Omit<SemesterGoal, 'id' | 'ownerId' | 'status'>
) {
  return isSupabaseConfigured()
    ? createGoalRowSupabase(uid, input)
    : createGoalDrizzle(uid, input);
}

export async function incrementGoalRow(uid: string, id: string, delta: number) {
  return isSupabaseConfigured()
    ? incrementGoalRowSupabase(uid, id, delta)
    : incrementGoalDrizzle(uid, id, delta);
}

export async function deleteGoalRow(uid: string, id: string) {
  return isSupabaseConfigured()
    ? deleteGoalRowSupabase(uid, id)
    : deleteGoalDrizzle(uid, id);
}

export async function listCommunityMessages(channel: CommunityChannel) {
  return isSupabaseConfigured()
    ? listCommunityMessagesSupabase(channel)
    : listCommunityDrizzle(channel);
}

export async function createCommunityMessageRow(input: {
  authorId: string;
  authorName: string;
  authorCourse: string;
  channel: CommunityChannel;
  text: string;
}) {
  return isSupabaseConfigured()
    ? createCommunityMessageRowSupabase(input)
    : createCommunityDrizzle(input);
}

export async function deleteCommunityMessageRow(uid: string, id: string) {
  return isSupabaseConfigured()
    ? deleteCommunityMessageRowSupabase(uid, id)
    : deleteCommunityDrizzle(uid, id);
}
