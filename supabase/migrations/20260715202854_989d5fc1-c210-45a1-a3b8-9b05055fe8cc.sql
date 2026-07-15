
-- Remove the overly-permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

-- Owners can read their own full profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Safe public view: only non-sensitive columns
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT
  id,
  full_name,
  avatar_url,
  city,
  district,
  bio,
  is_verified,
  trust_level,
  created_at
FROM public.profiles
WHERE is_banned = false;

GRANT SELECT ON public.profiles_public TO anon, authenticated;
