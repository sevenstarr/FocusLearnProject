ALTER TABLE public.subjects DROP COLUMN IF EXISTS credits;

CREATE TABLE IF NOT EXISTS public.study_session_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  subject_id text NOT NULL DEFAULT 'geral',
  subject_name text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('pomodoro25', 'ultra50')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  accumulated_seconds integer NOT NULL DEFAULT 0 CONSTRAINT study_session_runs_accumulated_check CHECK (accumulated_seconds >= 0),
  active_since timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS study_session_runs_one_active_per_user
  ON public.study_session_runs(owner_id) WHERE status IN ('running', 'paused');

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount <> 0),
  type text NOT NULL CHECK (type IN ('study', 'purchase')),
  source_id text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_transactions_source_id_unique UNIQUE (source_id)
);
CREATE INDEX IF NOT EXISTS credit_transactions_owner_date_idx
  ON public.credit_transactions(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.cosmetic_ownership (
  owner_id text NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  item_id text NOT NULL,
  category text NOT NULL CHECK (category IN ('theme', 'avatar')),
  equipped boolean NOT NULL DEFAULT false,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id, item_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS cosmetic_ownership_one_equipped_per_category
  ON public.cosmetic_ownership(owner_id,category) WHERE equipped=true;
ALTER TABLE public.study_session_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetic_ownership ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.study_session_runs, public.credit_transactions, public.cosmetic_ownership TO service_role;

CREATE OR REPLACE FUNCTION public.focus_start_session(p_uid text, p_mode text, p_subject_id text, p_subject_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_run public.study_session_runs;
BEGIN
  IF p_mode NOT IN ('pomodoro25', 'ultra50') THEN RAISE EXCEPTION 'Invalid focus mode'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_uid));
  SELECT * INTO v_run FROM study_session_runs WHERE owner_id=p_uid AND status IN ('running','paused') LIMIT 1;
  IF FOUND THEN RETURN to_jsonb(v_run); END IF;
  INSERT INTO study_session_runs(owner_id,subject_id,subject_name,mode,active_since)
    VALUES(p_uid,left(coalesce(p_subject_id,'geral'),128),left(coalesce(p_subject_name,'Estudo Geral'),120),p_mode,now())
    RETURNING * INTO v_run;
  RETURN to_jsonb(v_run);
END $$;

CREATE OR REPLACE FUNCTION public.focus_set_session_state(p_uid text, p_id uuid, p_state text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_run public.study_session_runs; v_now timestamptz := now();
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_uid));
  SELECT * INTO v_run FROM study_session_runs WHERE id=p_id AND owner_id=p_uid FOR UPDATE;
  IF NOT FOUND OR v_run.status NOT IN ('running','paused') THEN RAISE EXCEPTION 'Session is unavailable'; END IF;
  IF p_state='pause' AND v_run.status='running' THEN
    UPDATE study_session_runs SET accumulated_seconds=accumulated_seconds+greatest(0,floor(extract(epoch FROM (v_now-active_since)))::integer), active_since=NULL, status='paused' WHERE id=p_id RETURNING * INTO v_run;
  ELSIF p_state='resume' AND v_run.status='paused' THEN
    UPDATE study_session_runs SET active_since=v_now, status='running' WHERE id=p_id RETURNING * INTO v_run;
  ELSIF p_state='cancel' THEN
    UPDATE study_session_runs SET active_since=NULL, status='cancelled' WHERE id=p_id RETURNING * INTO v_run;
  ELSE RAISE EXCEPTION 'Invalid session state change'; END IF;
  RETURN to_jsonb(v_run);
END $$;

CREATE OR REPLACE FUNCTION public.focus_complete_session(p_uid text, p_id uuid, p_date_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_run public.study_session_runs; v_seconds integer; v_expected integer; v_reward integer; v_earned integer; v_session public.pomodoro_sessions; v_subject public.subjects; v_balance integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_uid));
  SELECT * INTO v_run FROM study_session_runs WHERE id=p_id AND owner_id=p_uid FOR UPDATE;
  IF NOT FOUND OR v_run.status NOT IN ('running','paused') THEN RAISE EXCEPTION 'Session is unavailable'; END IF;
  v_seconds := v_run.accumulated_seconds + CASE WHEN v_run.status='running' THEN greatest(0,floor(extract(epoch FROM (now()-v_run.active_since)))::integer) ELSE 0 END;
  v_expected := CASE WHEN v_run.mode='ultra50' THEN 3000 ELSE 1500 END;
  IF v_seconds < v_expected THEN RAISE EXCEPTION 'Session is not complete'; END IF;
  UPDATE study_session_runs SET status='completed',active_since=NULL,completed_at=now() WHERE id=p_id RETURNING * INTO v_run;
  INSERT INTO pomodoro_sessions(owner_id,subject_id,subject_name,mode,duration_minutes,date_key)
    VALUES(p_uid,v_run.subject_id,v_run.subject_name,v_run.mode,v_expected/60,coalesce(p_date_key,to_char(now() at time zone 'UTC','YYYY-MM-DD')))
    RETURNING * INTO v_session;
  IF v_run.subject_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    UPDATE subjects SET hours_studied=hours_studied+(v_expected::numeric/3600),updated_at=now() WHERE id=v_run.subject_id::uuid AND owner_id=p_uid RETURNING * INTO v_subject;
  END IF;
  SELECT coalesce(sum(amount),0)::integer INTO v_earned FROM credit_transactions WHERE owner_id=p_uid AND type='study' AND amount>0 AND created_at > now()-interval '24 hours';
  v_reward := least(CASE WHEN v_run.mode='ultra50' THEN 2 ELSE 1 END,greatest(0,8-v_earned));
  IF v_reward>0 THEN
    INSERT INTO credit_transactions(owner_id,amount,type,source_id,description)
      VALUES(p_uid,v_reward,'study','session:'||p_id::text,'Sessão de foco ('||(v_expected/60)||' min)');
  END IF;
  SELECT coalesce(sum(amount),0)::integer INTO v_balance FROM credit_transactions WHERE owner_id=p_uid;
  RETURN jsonb_build_object('session',to_jsonb(v_session),'updatedSubject',CASE WHEN v_subject.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_subject.id,'ownerId',v_subject.owner_id,'code',v_subject.code,'name',v_subject.name,'professor',v_subject.professor,'schedule',v_subject.schedule,'p1',v_subject.p1,'p2',v_subject.p2,'hoursStudied',v_subject.hours_studied,'status',v_subject.status) END,'reward',v_reward,'balance',v_balance);
END $$;

CREATE OR REPLACE FUNCTION public.focus_buy_cosmetic(p_uid text, p_item_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_price integer; v_category text; v_name text; v_balance integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_uid));
  SELECT price,category,name INTO v_price,v_category,v_name FROM (VALUES
    ('mare','theme','Maré',10),('bosque','theme','Bosque',40),('nebulosa','theme','Nebulosa',100),
    ('raposa','avatar','Raposa',15),('coruja','avatar','Coruja',35),('capivara','avatar','Capivara',70)
  ) AS catalog(id,category,name,price) WHERE id=p_item_id;
  IF v_price IS NULL THEN RAISE EXCEPTION 'Unknown cosmetic'; END IF;
  IF EXISTS(SELECT 1 FROM cosmetic_ownership WHERE owner_id=p_uid AND item_id=p_item_id) THEN RAISE EXCEPTION 'Already owned'; END IF;
  SELECT coalesce(sum(amount),0)::integer INTO v_balance FROM credit_transactions WHERE owner_id=p_uid;
  IF v_balance<v_price THEN RAISE EXCEPTION 'Insufficient credits'; END IF;
  INSERT INTO cosmetic_ownership(owner_id,item_id,category) VALUES(p_uid,p_item_id,v_category);
  INSERT INTO credit_transactions(owner_id,amount,type,source_id,description)
    VALUES(p_uid,-v_price,'purchase','purchase:'||p_uid||':'||p_item_id,'Compra: '||v_name);
  SELECT coalesce(sum(amount),0)::integer INTO v_balance FROM credit_transactions WHERE owner_id=p_uid;
  RETURN jsonb_build_object('balance',v_balance,'itemId',p_item_id);
END $$;

CREATE OR REPLACE FUNCTION public.focus_equip_cosmetic(p_uid text, p_item_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_category text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_uid));
  SELECT category INTO v_category FROM cosmetic_ownership WHERE owner_id=p_uid AND item_id=p_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cosmetic not owned'; END IF;
  UPDATE cosmetic_ownership SET equipped=false WHERE owner_id=p_uid AND category=v_category;
  UPDATE cosmetic_ownership SET equipped=true WHERE owner_id=p_uid AND item_id=p_item_id;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.focus_shop_balance(p_uid text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(sum(amount),0)::integer FROM credit_transactions WHERE owner_id=p_uid
$$;

GRANT EXECUTE ON FUNCTION public.focus_start_session(text,text,text,text), public.focus_set_session_state(text,uuid,text), public.focus_complete_session(text,uuid,text), public.focus_buy_cosmetic(text,text), public.focus_equip_cosmetic(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.focus_shop_balance(text) TO service_role;
REVOKE ALL ON FUNCTION public.focus_start_session(text,text,text,text), public.focus_set_session_state(text,uuid,text), public.focus_complete_session(text,uuid,text), public.focus_buy_cosmetic(text,text), public.focus_equip_cosmetic(text,text), public.focus_shop_balance(text) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
