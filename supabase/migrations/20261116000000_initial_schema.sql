-- FocusLearn — Supabase Initial Schema Migration
-- Cria todas as tabelas relacionais, chaves estrangeiras, índices e ativa Row Level Security (RLS).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" serial PRIMARY KEY NOT NULL,
  "uid" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "course" text NOT NULL DEFAULT '',
  "university" text NOT NULL DEFAULT '',
  "semester" text NOT NULL DEFAULT '',
  "registration" text NOT NULL DEFAULT '',
  "bio" text NOT NULL DEFAULT '',
  "daily_goal_hours" double precision NOT NULL DEFAULT 4,
  "pomo_minutes" integer NOT NULL DEFAULT 25,
  "streak" integer NOT NULL DEFAULT 0,
  "record_streak" integer NOT NULL DEFAULT 0,
  "theme" text NOT NULL DEFAULT 'light',
  "seeded" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."subjects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "public"."users"("uid") ON DELETE CASCADE,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "professor" text NOT NULL DEFAULT '',
  "schedule" text NOT NULL DEFAULT '',
  "credits" integer NOT NULL DEFAULT 4,
  "p1" double precision NOT NULL DEFAULT 0,
  "p2" double precision NOT NULL DEFAULT 0,
  "hours_studied" double precision NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."quick_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "public"."users"("uid") ON DELETE CASCADE,
  "title" text NOT NULL,
  "completed" boolean NOT NULL DEFAULT false,
  "subject_id" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."pomodoro_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "public"."users"("uid") ON DELETE CASCADE,
  "subject_id" text NOT NULL DEFAULT 'geral',
  "subject_name" text NOT NULL,
  "mode" text NOT NULL,
  "duration_minutes" integer NOT NULL,
  "date_key" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."schedule_blocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "public"."users"("uid") ON DELETE CASCADE,
  "title" text NOT NULL,
  "day_index" integer NOT NULL,
  "start_hour" integer NOT NULL,
  "end_hour" integer NOT NULL,
  "type" text NOT NULL,
  "subject_id" text NOT NULL DEFAULT '',
  "subject_name" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."study_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "public"."users"("uid") ON DELETE CASCADE,
  "title" text NOT NULL,
  "subject_id" text NOT NULL DEFAULT '',
  "subject_name" text NOT NULL DEFAULT '',
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "content" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."semester_goals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "public"."users"("uid") ON DELETE CASCADE,
  "title" text NOT NULL,
  "category" text NOT NULL DEFAULT 'Estudos',
  "current_value" double precision NOT NULL DEFAULT 0,
  "target_value" double precision NOT NULL DEFAULT 10,
  "unit" text NOT NULL DEFAULT 'h',
  "deadline" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."community_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "author_id" text NOT NULL REFERENCES "public"."users"("uid") ON DELETE CASCADE,
  "author_name" text NOT NULL,
  "author_course" text NOT NULL DEFAULT '',
  "channel" text NOT NULL,
  "text" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "subjects_owner_idx" ON "public"."subjects" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "quick_tasks_owner_idx" ON "public"."quick_tasks" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "pomodoro_sessions_owner_idx" ON "public"."pomodoro_sessions" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "schedule_blocks_owner_idx" ON "public"."schedule_blocks" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "study_notes_owner_idx" ON "public"."study_notes" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "semester_goals_owner_idx" ON "public"."semester_goals" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "community_messages_channel_idx" ON "public"."community_messages" USING btree ("channel");

-- Segurança: ativa RLS em todas as tabelas para bloquear acesso anônimo direto via PostgREST.
-- As rotas Next.js (/api/*) utilizam SUPABASE_SERVICE_ROLE_KEY após validar o Firebase JWT.
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quick_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pomodoro_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."schedule_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."study_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."semester_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."community_messages" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "service_role";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "service_role";

NOTIFY pgrst, 'reload schema';
