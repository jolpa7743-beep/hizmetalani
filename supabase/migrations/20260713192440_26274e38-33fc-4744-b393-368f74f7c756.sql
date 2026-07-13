CREATE OR REPLACE FUNCTION public.increment_listing_view(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.listings SET view_count = view_count + 1 WHERE id = _id AND status = 'active';
$$;

REVOKE ALL ON FUNCTION public.increment_listing_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_listing_view(uuid) TO anon, authenticated;