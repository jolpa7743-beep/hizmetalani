
-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_no_self CHECK (reviewer_id <> reviewee_id),
  UNIQUE (reviewer_id, reviewee_id)
);
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id, status);
CREATE INDEX idx_reviews_status ON public.reviews(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews readable by all" ON public.reviews
  FOR SELECT USING (status = 'approved' OR reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users insert own reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users update own pending reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid() AND status = 'pending')
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Admins manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users delete own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (reviewer_id = auth.uid());

CREATE TRIGGER reviews_set_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Reports
CREATE TABLE public.review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_reports_status ON public.review_reports(status);

GRANT SELECT, INSERT ON public.review_reports TO authenticated;
GRANT ALL ON public.review_reports TO service_role;

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users report reviews" ON public.review_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reporter reads own report" ON public.review_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins manage reports" ON public.review_reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Stats helper
CREATE OR REPLACE FUNCTION public.user_review_stats(_user_id uuid)
RETURNS TABLE (avg_rating numeric, review_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ROUND(AVG(rating)::numeric, 2), COUNT(*)::int
  FROM public.reviews
  WHERE reviewee_id = _user_id AND status = 'approved';
$$;

-- Admin list reviews
CREATE OR REPLACE FUNCTION public.admin_list_reviews(_status text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC) INTO result FROM (
    SELECT r.id, r.rating, r.comment, r.status, r.admin_note, r.created_at,
      r.reviewer_id, pr.full_name AS reviewer_name,
      r.reviewee_id, pe.full_name AS reviewee_name,
      r.listing_id,
      (SELECT COUNT(*) FROM public.review_reports rr WHERE rr.review_id = r.id AND rr.status='open')::int AS open_reports
    FROM public.reviews r
    LEFT JOIN public.profiles pr ON pr.id = r.reviewer_id
    LEFT JOIN public.profiles pe ON pe.id = r.reviewee_id
    WHERE (_status IS NULL OR r.status = _status)
  ) t;
  RETURN COALESCE(result, '[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_review_reports()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC) INTO result FROM (
    SELECT rr.id, rr.reason, rr.status, rr.created_at,
      rr.review_id, r.comment AS review_comment, r.rating, r.status AS review_status,
      rr.reporter_id, pr.full_name AS reporter_name,
      r.reviewee_id, pe.full_name AS reviewee_name
    FROM public.review_reports rr
    LEFT JOIN public.reviews r ON r.id = rr.review_id
    LEFT JOIN public.profiles pr ON pr.id = rr.reporter_id
    LEFT JOIN public.profiles pe ON pe.id = r.reviewee_id
  ) t;
  RETURN COALESCE(result, '[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_review_status(_review_id uuid, _status text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _status NOT IN ('pending','approved','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.reviews SET status = _status, admin_note = COALESCE(_note, admin_note), updated_at = now() WHERE id = _review_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_report_status(_report_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _status NOT IN ('open','resolved','dismissed') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.review_reports SET status = _status WHERE id = _report_id;
END; $$;
