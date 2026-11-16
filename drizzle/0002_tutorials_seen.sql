ALTER TABLE "users" ADD COLUMN "tutorials_seen" jsonb DEFAULT '{}'::jsonb NOT NULL;
