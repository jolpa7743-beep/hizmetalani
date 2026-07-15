
CREATE TABLE public.mod_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('review','report')),
  target_id UUID NOT NULL,
  action TEXT NOT NULL,
  prev_status TEXT,
  new_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mod_actions_created_at_idx ON public.mod_actions (created_at DESC);
CREATE INDEX mod_actions_target_idx ON public.mod_actions (target_type, target_id);

GRANT SELECT ON public.mod_actions TO authenticated;
GRANT ALL ON public.mod_actions TO service_role;

ALTER TABLE public.mod_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view mod actions"
  ON public.mod_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update review status fn to log
CREATE OR REPLACE FUNCTION public.admin_set_review_status(_review_id uuid, _status text, _note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _prev text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _status NOT IN ('pending','approved','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT status INTO _prev FROM public.reviews WHERE id = _review_id;
  UPDATE public.reviews SET status = _status, admin_note = COALESCE(_note, admin_note), updated_at = now() WHERE id = _review_id;
  INSERT INTO public.mod_actions (actor_id, target_type, target_id, action, prev_status, new_status, note)
  VALUES (auth.uid(), 'review', _review_id, 'set_status:' || _status, _prev, _status, _note);
END; $function$;

-- Update report status fn to log
CREATE OR REPLACE FUNCTION public.admin_set_report_status(_report_id uuid, _status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _prev text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _status NOT IN ('open','resolved','dismissed') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT status INTO _prev FROM public.review_reports WHERE id = _report_id;
  UPDATE public.review_reports SET status = _status WHERE id = _report_id;
  INSERT INTO public.mod_actions (actor_id, target_type, target_id, action, prev_status, new_status)
  VALUES (auth.uid(), 'report', _report_id, 'set_status:' || _status, _prev, _status);
END; $function$;

-- Recent actions with names
CREATE OR REPLACE FUNCTION public.admin_recent_mod_actions(_limit int DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC) INTO result FROM (
    SELECT m.id, m.target_type, m.target_id, m.action, m.prev_status, m.new_status, m.note, m.created_at,
      m.actor_id, pa.full_name AS actor_name
    FROM public.mod_actions m
    LEFT JOIN public.profiles pa ON pa.id = m.actor_id
    ORDER BY m.created_at DESC
    LIMIT _limit
  ) t;
  RETURN COALESCE(result, '[]'::jsonb);
END; $function$;

-- Unified inbox: pending reviews + open reports in one call
CREATE OR REPLACE FUNCTION public.admin_moderation_inbox()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE reviews jsonb; reports jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO reviews FROM (
    SELECT r.id, r.rating, r.comment, r.status, r.created_at,
      r.reviewer_id, pr.full_name AS reviewer_name,
      r.reviewee_id, pe.full_name AS reviewee_name,
      (SELECT COUNT(*) FROM public.review_reports rr WHERE rr.review_id = r.id AND rr.status='open')::int AS open_reports
    FROM public.reviews r
    LEFT JOIN public.profiles pr ON pr.id = r.reviewer_id
    LEFT JOIN public.profiles pe ON pe.id = r.reviewee_id
    WHERE r.status = 'pending'
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO reports FROM (
    SELECT rr.id, rr.reason, rr.status, rr.created_at,
      rr.review_id, r.comment AS review_comment, r.rating, r.status AS review_status,
      rr.reporter_id, pr.full_name AS reporter_name,
      r.reviewee_id, pe.full_name AS reviewee_name
    FROM public.review_reports rr
    LEFT JOIN public.reviews r ON r.id = rr.review_id
    LEFT JOIN public.profiles pr ON pr.id = rr.reporter_id
    LEFT JOIN public.profiles pe ON pe.id = r.reviewee_id
    WHERE rr.status = 'open'
  ) t;

  RETURN jsonb_build_object('reviews', reviews, 'reports', reports);
END; $function$;
