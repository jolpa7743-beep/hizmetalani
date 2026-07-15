
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_level smallint NOT NULL DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 3);

-- Backfill: existing verified users get level 1
UPDATE public.profiles SET trust_level = 1 WHERE is_verified = true AND trust_level = 0;

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS trust_badge_visibility text NOT NULL DEFAULT 'all' CHECK (trust_badge_visibility IN ('all','verified_only','hidden'));

-- Bulk owner stats (public, anon-callable)
CREATE OR REPLACE FUNCTION public.listings_owner_stats(_user_ids uuid[])
RETURNS TABLE (user_id uuid, avg_rating numeric, review_count integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT reviewee_id, ROUND(AVG(rating)::numeric, 2), COUNT(*)::int
  FROM public.reviews
  WHERE reviewee_id = ANY(_user_ids) AND status = 'approved'
  GROUP BY reviewee_id
$$;

GRANT EXECUTE ON FUNCTION public.listings_owner_stats(uuid[]) TO anon, authenticated;

-- Admin: set trust level
CREATE OR REPLACE FUNCTION public.admin_set_trust_level(_user_id uuid, _level smallint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _level < 0 OR _level > 3 THEN RAISE EXCEPTION 'Invalid level'; END IF;
  UPDATE public.profiles
     SET trust_level = _level,
         is_verified = (_level >= 1)
   WHERE id = _user_id;
END; $$;
