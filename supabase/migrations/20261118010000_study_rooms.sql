CREATE TABLE IF NOT EXISTS public.study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  goal text NOT NULL DEFAULT '' CHECK (char_length(goal) <= 240),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_room_presence (
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS study_rooms_updated_idx ON public.study_rooms(updated_at DESC);
CREATE INDEX IF NOT EXISTS study_room_presence_seen_idx ON public.study_room_presence(room_id, last_seen DESC);
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_presence ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.study_rooms, public.study_room_presence TO service_role;

NOTIFY pgrst, 'reload schema';
