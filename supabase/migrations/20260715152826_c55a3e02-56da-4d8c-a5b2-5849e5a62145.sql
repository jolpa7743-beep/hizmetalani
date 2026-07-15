
-- Restrict column-level SELECT on profiles to hide PII from public reads.
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, full_name, avatar_url, bio, city, district,
  is_verified, phone_verified, trust_level,
  created_at, updated_at, languages, skills, website
) ON public.profiles TO anon;

GRANT SELECT (
  id, full_name, avatar_url, bio, city, district,
  is_verified, phone_verified, trust_level,
  created_at, updated_at, languages, skills, website
) ON public.profiles TO authenticated;

-- Owner-only full profile read (includes phone, birth_year, gender, etc.)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
