
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_quest(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_quest(UUID) TO authenticated;
