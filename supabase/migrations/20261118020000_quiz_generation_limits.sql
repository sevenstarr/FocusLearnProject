CREATE TABLE IF NOT EXISTS public.quiz_generation_usage (
  owner_id text PRIMARY KEY REFERENCES public.users(uid) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0)
);

ALTER TABLE public.quiz_generation_usage ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.quiz_generation_usage TO service_role;

CREATE OR REPLACE FUNCTION public.focus_allow_quiz_generation(p_uid text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started timestamptz;
  v_count integer;
BEGIN
  INSERT INTO public.quiz_generation_usage(owner_id, window_started_at, request_count)
    VALUES (p_uid, now(), 1)
  ON CONFLICT (owner_id) DO UPDATE SET
    window_started_at = CASE
      WHEN quiz_generation_usage.window_started_at <= now() - interval '1 minute' THEN now()
      ELSE quiz_generation_usage.window_started_at
    END,
    request_count = CASE
      WHEN quiz_generation_usage.window_started_at <= now() - interval '1 minute' THEN 1
      ELSE quiz_generation_usage.request_count + 1
    END
  RETURNING window_started_at, request_count INTO v_started, v_count;

  RETURN v_started > now() - interval '1 minute' AND v_count <= 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.focus_allow_quiz_generation(text) TO service_role;
REVOKE ALL ON FUNCTION public.focus_allow_quiz_generation(text) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
