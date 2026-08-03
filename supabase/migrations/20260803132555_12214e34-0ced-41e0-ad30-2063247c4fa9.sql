REVOKE ALL ON FUNCTION public.pc_path_belongs_to_user(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pc_path_belongs_to_user(text, uuid) TO service_role;