ALTER TABLE "subjects" DROP COLUMN IF EXISTS "credits";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_session_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "users"("uid") ON DELETE CASCADE,
  "subject_id" text DEFAULT 'geral' NOT NULL,
  "subject_name" text NOT NULL,
  "mode" text NOT NULL CHECK ("mode" IN ('pomodoro25','ultra50')),
  "status" text DEFAULT 'running' NOT NULL CHECK ("status" IN ('running','paused','completed','cancelled')),
  "accumulated_seconds" integer DEFAULT 0 NOT NULL CONSTRAINT "study_session_runs_accumulated_check" CHECK ("accumulated_seconds" >= 0),
  "active_since" timestamp with time zone,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "study_session_runs_one_active_per_user" ON "study_session_runs" USING btree ("owner_id") WHERE "status" IN ('running','paused');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "users"("uid") ON DELETE CASCADE,
  "amount" integer NOT NULL CHECK ("amount" <> 0),
  "type" text NOT NULL CHECK ("type" IN ('study','purchase')),
  "source_id" text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "credit_transactions_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transactions_owner_date_idx" ON "credit_transactions" USING btree ("owner_id","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cosmetic_ownership" (
  "owner_id" text NOT NULL REFERENCES "users"("uid") ON DELETE CASCADE,
  "item_id" text NOT NULL,
  "category" text NOT NULL CHECK ("category" IN ('theme','avatar')),
  "equipped" boolean DEFAULT false NOT NULL,
  "acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "cosmetic_ownership_pk" PRIMARY KEY("owner_id","item_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cosmetic_ownership_one_equipped_per_category" ON "cosmetic_ownership" USING btree ("owner_id","category") WHERE "equipped" = true;
