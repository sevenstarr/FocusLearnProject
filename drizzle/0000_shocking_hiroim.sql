CREATE TABLE "community_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_course" text DEFAULT '' NOT NULL,
	"channel" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pomodoro_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"subject_id" text DEFAULT 'geral' NOT NULL,
	"subject_name" text NOT NULL,
	"mode" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"date_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"subject_id" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"day_index" integer NOT NULL,
	"start_hour" integer NOT NULL,
	"end_hour" integer NOT NULL,
	"type" text NOT NULL,
	"subject_id" text DEFAULT '' NOT NULL,
	"subject_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semester_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'Estudos' NOT NULL,
	"current_value" double precision DEFAULT 0 NOT NULL,
	"target_value" double precision DEFAULT 10 NOT NULL,
	"unit" text DEFAULT 'h' NOT NULL,
	"deadline" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"subject_id" text DEFAULT '' NOT NULL,
	"subject_name" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"professor" text DEFAULT '' NOT NULL,
	"schedule" text DEFAULT '' NOT NULL,
	"credits" integer DEFAULT 4 NOT NULL,
	"p1" double precision DEFAULT 0 NOT NULL,
	"p2" double precision DEFAULT 0 NOT NULL,
	"hours_studied" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"course" text DEFAULT 'Engenharia de Software' NOT NULL,
	"university" text DEFAULT 'Universidade Federal (UFC)' NOT NULL,
	"semester" text DEFAULT '5º Semestre' NOT NULL,
	"registration" text DEFAULT '2024.1.ES-0492' NOT NULL,
	"bio" text DEFAULT 'Estudante focada em sistemas distribuídos, algoritmos e produtividade acadêmica.' NOT NULL,
	"daily_goal_hours" double precision DEFAULT 5 NOT NULL,
	"pomo_minutes" integer DEFAULT 25 NOT NULL,
	"streak" integer DEFAULT 14 NOT NULL,
	"record_streak" integer DEFAULT 21 NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_author_id_users_uid_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_owner_id_users_uid_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_tasks" ADD CONSTRAINT "quick_tasks_owner_id_users_uid_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_owner_id_users_uid_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_goals" ADD CONSTRAINT "semester_goals_owner_id_users_uid_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_notes" ADD CONSTRAINT "study_notes_owner_id_users_uid_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_owner_id_users_uid_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_messages_channel_idx" ON "community_messages" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "pomodoro_sessions_owner_idx" ON "pomodoro_sessions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "quick_tasks_owner_idx" ON "quick_tasks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "schedule_blocks_owner_idx" ON "schedule_blocks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "semester_goals_owner_idx" ON "semester_goals" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "study_notes_owner_idx" ON "study_notes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "subjects_owner_idx" ON "subjects" USING btree ("owner_id");