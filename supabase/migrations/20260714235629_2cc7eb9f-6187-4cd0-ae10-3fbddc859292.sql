
CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC) INTO result
  FROM (
    SELECT
      p.id,
      COALESCE(u.email, '') AS email,
      u.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at,
      p.full_name,
      p.avatar_url,
      p.city,
      p.district,
      p.phone,
      p.is_verified,
      p.trust_level,
      COALESCE(
        (SELECT array_agg(role::text) FROM public.user_roles ur WHERE ur.user_id = p.id),
        ARRAY[]::text[]
      ) AS roles
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
  ) t;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;
