-- Allow the anon role to execute has_role so RLS policies that reference it
-- do not error for unauthenticated (anon) PostgREST requests. The function is
-- SECURITY DEFINER and only returns a boolean based on user_roles, so this is
-- safe and simply lets anon policy checks evaluate to false instead of failing.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;