ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tutorials_seen jsonb NOT NULL DEFAULT '{}'::jsonb;
