
-- Lock down SECURITY DEFINER helpers to authenticated callers only
REVOKE EXECUTE ON FUNCTION public.has_family_access(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.family_role_of(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_family_id(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_family_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.family_role_of(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_family_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
