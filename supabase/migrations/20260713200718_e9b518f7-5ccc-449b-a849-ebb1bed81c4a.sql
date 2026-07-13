
REVOKE EXECUTE ON FUNCTION public.admin_get_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
-- Only callable via service_role (server-side)
GRANT EXECUTE ON FUNCTION public.admin_get_user_id_by_email(text) TO service_role;
