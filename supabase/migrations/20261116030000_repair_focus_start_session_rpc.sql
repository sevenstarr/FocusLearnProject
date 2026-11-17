-- Restore the session-start RPC if the initial shop migration was only
-- partially applied, then refresh PostgREST's function schema cache.
CREATE TABLE IF NOT EXISTS public.study_session_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  subject_id text NOT NULL DEFAULT 'geral',
  subject_name text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('pomodoro25', 'ultra50')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  accumulated_seconds integer NOT NULL DEFAULT 0 CHECK (accumulated_seconds >= 0),
  active_since timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS study_session_runs_one_active_per_user
  ON public.study_session_runs(owner_id)
  WHERE status IN ('running', 'paused');

ALTER TABLE public.study_session_runs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.study_session_runs TO service_role;

CREATE OR REPLACE FUNCTION public.focus_start_session(
  p_uid text,
  p_mode text,
  p_subject_id text,
  p_subject_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run public.study_session_runs;
BEGIN
  IF p_mode NOT IN ('pomodoro25', 'ultra50') THEN
    RAISE EXCEPTION 'Invalid focus mode';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_uid));

  SELECT * INTO v_run
    FROM public.study_session_runs
    WHERE owner_id = p_uid AND status IN ('running', 'paused')
    LIMIT 1;
  IF FOUND THEN
    RETURN to_jsonb(v_run);
  END IF;

  INSERT INTO public.study_session_runs(owner_id, subject_id, subject_name, mode, active_since)
    VALUES (
      p_uid,
      left(coalesce(p_subject_id, 'geral'), 128),
      left(coalesce(p_subject_name, 'Estudo Geral'), 120),
      p_mode,
      now()
    )
    RETURNING * INTO v_run;

  RETURN to_jsonb(v_run);
END;
$$;

GRANT EXECUTE ON FUNCTION public.focus_start_session(text, text, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.focus_start_session(text, text, text, text) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
