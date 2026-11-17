ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS assessments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS grade_max double precision NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS grading_method text NOT NULL DEFAULT 'normalized',
  ADD COLUMN IF NOT EXISTS approval_rules jsonb NOT NULL DEFAULT '{"directThreshold":7,"finalEligibilityThreshold":4,"finalTarget":5,"finalMaxScore":10,"finalWeight":50}'::jsonb;

UPDATE public.subjects
SET assessments = jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'name', 'P1', 'score', p1, 'maxScore', 10, 'weight', 50),
      jsonb_build_object('id', gen_random_uuid()::text, 'name', 'P2', 'score', p2, 'maxScore', 10, 'weight', 50)
    ),
    grading_method = 'normalized',
    grade_max = 10,
    approval_rules = '{"directThreshold":7,"finalEligibilityThreshold":4,"finalTarget":5,"finalMaxScore":10,"finalWeight":50}'::jsonb;

ALTER TABLE public.subjects
  ADD CONSTRAINT subjects_grade_max_positive CHECK (grade_max > 0),
  ADD CONSTRAINT subjects_grading_method_valid CHECK (grading_method IN ('sum', 'normalized', 'weighted'));

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
  RETURN jsonb_build_object('session',to_jsonb(v_session),'updatedSubject',CASE WHEN v_subject.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_subject.id,'ownerId',v_subject.owner_id,'code',v_subject.code,'name',v_subject.name,'professor',v_subject.professor,'schedule',v_subject.schedule,'assessments',v_subject.assessments,'gradeMax',v_subject.grade_max,'gradingMethod',v_subject.grading_method,'approvalRules',v_subject.approval_rules,'hoursStudied',v_subject.hours_studied,'status',v_subject.status) END,'reward',v_reward,'balance',v_balance);
END $$;
