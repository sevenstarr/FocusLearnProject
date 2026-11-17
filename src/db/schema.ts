import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  course: text('course').notNull().default(''),
  university: text('university').notNull().default(''),
  semester: text('semester').notNull().default(''),
  registration: text('registration').notNull().default(''),
  bio: text('bio').notNull().default(''),
  dailyGoalHours: doublePrecision('daily_goal_hours').notNull().default(4),
  pomoMinutes: integer('pomo_minutes').notNull().default(25),
  streak: integer('streak').notNull().default(0),
  recordStreak: integer('record_streak').notNull().default(0),
  theme: text('theme').notNull().default('light'),
  tutorialsSeen: jsonb('tutorials_seen').$type<Record<string, boolean>>().notNull().default(sql`'{}'::jsonb`),
  seeded: boolean('seeded').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    professor: text('professor').notNull().default(''),
    schedule: text('schedule').notNull().default(''),
    assessments: jsonb('assessments').$type<import('@/lib/types').Assessment[]>().notNull().default([]),
    gradeMax: doublePrecision('grade_max').notNull().default(10),
    gradingMethod: text('grading_method').notNull().default('normalized'),
    approvalRules: jsonb('approval_rules').$type<import('@/lib/types').ApprovalRules>().notNull().default({
      directThreshold: 7,
      finalEligibilityThreshold: 4,
      finalTarget: 5,
      finalMaxScore: 10,
      finalWeight: 50,
    }),
    p1: doublePrecision('p1').notNull().default(0),
    p2: doublePrecision('p2').notNull().default(0),
    hoursStudied: doublePrecision('hours_studied').notNull().default(0),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('subjects_owner_idx').on(table.ownerId)]
);

export const quickTasks = pgTable(
  'quick_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    completed: boolean('completed').notNull().default(false),
    subjectId: text('subject_id').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('quick_tasks_owner_idx').on(table.ownerId)]
);

export const pomodoroSessions = pgTable(
  'pomodoro_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    subjectId: text('subject_id').notNull().default('geral'),
    subjectName: text('subject_name').notNull(),
    mode: text('mode').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    dateKey: text('date_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('pomodoro_sessions_owner_idx').on(table.ownerId)]
);

export const studySessionRuns = pgTable('study_session_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  subjectId: text('subject_id').notNull().default('geral'),
  subjectName: text('subject_name').notNull(),
  mode: text('mode').notNull(),
  status: text('status').notNull().default('running'),
  accumulatedSeconds: integer('accumulated_seconds').notNull().default(0),
  activeSince: timestamp('active_since', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  check('study_session_runs_mode_check', sql`${table.mode} IN ('pomodoro25', 'ultra50')`),
  check('study_session_runs_status_check', sql`${table.status} IN ('running', 'paused', 'completed', 'cancelled')`),
  check('study_session_runs_accumulated_check', sql`${table.accumulatedSeconds} >= 0`),
  uniqueIndex('study_session_runs_one_active_per_user').on(table.ownerId).where(sql`${table.status} IN ('running', 'paused')`),
]);

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: text('type').notNull(),
  sourceId: text('source_id').notNull().unique(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('credit_transactions_amount_check', sql`${table.amount} <> 0`),
  check('credit_transactions_type_check', sql`${table.type} IN ('study', 'purchase')`),
  index('credit_transactions_owner_date_idx').on(table.ownerId, table.createdAt),
]);

export const cosmeticOwnership = pgTable('cosmetic_ownership', {
  ownerId: text('owner_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull(),
  category: text('category').notNull(),
  equipped: boolean('equipped').notNull().default(false),
  acquiredAt: timestamp('acquired_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ name: 'cosmetic_ownership_pk', columns: [table.ownerId, table.itemId] }),
  check('cosmetic_ownership_category_check', sql`${table.category} IN ('theme', 'avatar')`),
  uniqueIndex('cosmetic_ownership_one_equipped_per_category').on(table.ownerId, table.category).where(sql`${table.equipped} = true`),
]);

export const scheduleBlocks = pgTable(
  'schedule_blocks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    dayIndex: integer('day_index').notNull(),
    startHour: integer('start_hour').notNull(),
    endHour: integer('end_hour').notNull(),
    type: text('type').notNull(),
    subjectId: text('subject_id').notNull().default(''),
    subjectName: text('subject_name').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('schedule_blocks_owner_idx').on(table.ownerId)]
);

export const studyNotes = pgTable(
  'study_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    subjectId: text('subject_id').notNull().default(''),
    subjectName: text('subject_name').notNull().default(''),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('study_notes_owner_idx').on(table.ownerId)]
);

export const semesterGoals = pgTable(
  'semester_goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    category: text('category').notNull().default('Estudos'),
    currentValue: doublePrecision('current_value').notNull().default(0),
    targetValue: doublePrecision('target_value').notNull().default(10),
    unit: text('unit').notNull().default('h'),
    deadline: text('deadline').notNull().default(''),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('semester_goals_owner_idx').on(table.ownerId)]
);

export const communityMessages = pgTable(
  'community_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    authorName: text('author_name').notNull(),
    authorCourse: text('author_course').notNull().default(''),
    channel: text('channel').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('community_messages_channel_idx').on(table.channel)]
);

export const usersRelations = relations(users, ({ many }) => ({
  subjects: many(subjects),
  quickTasks: many(quickTasks),
  pomodoroSessions: many(pomodoroSessions),
  scheduleBlocks: many(scheduleBlocks),
  studyNotes: many(studyNotes),
  semesterGoals: many(semesterGoals),
  communityMessages: many(communityMessages),
}));

export const subjectsRelations = relations(subjects, ({ one }) => ({
  owner: one(users, {
    fields: [subjects.ownerId],
    references: [users.uid],
  }),
}));

export const quickTasksRelations = relations(quickTasks, ({ one }) => ({
  owner: one(users, {
    fields: [quickTasks.ownerId],
    references: [users.uid],
  }),
}));

export const pomodoroSessionsRelations = relations(pomodoroSessions, ({ one }) => ({
  owner: one(users, {
    fields: [pomodoroSessions.ownerId],
    references: [users.uid],
  }),
}));

export const scheduleBlocksRelations = relations(scheduleBlocks, ({ one }) => ({
  owner: one(users, {
    fields: [scheduleBlocks.ownerId],
    references: [users.uid],
  }),
}));

export const studyNotesRelations = relations(studyNotes, ({ one }) => ({
  owner: one(users, {
    fields: [studyNotes.ownerId],
    references: [users.uid],
  }),
}));

export const semesterGoalsRelations = relations(semesterGoals, ({ one }) => ({
  owner: one(users, {
    fields: [semesterGoals.ownerId],
    references: [users.uid],
  }),
}));

export const communityMessagesRelations = relations(communityMessages, ({ one }) => ({
  author: one(users, {
    fields: [communityMessages.authorId],
    references: [users.uid],
  }),
}));
