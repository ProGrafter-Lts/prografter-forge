-- 1. Allow homeowners to update their own homeowner record
DROP POLICY IF EXISTS "Users can update own homeowner record" ON public.homeowners;
CREATE POLICY "Users can update own homeowner record"
ON public.homeowners
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Defence-in-depth: revoke EXECUTE on internal helper SECURITY DEFINER functions from anon.
-- These are only called from RLS policies (which run as the policy owner) and from
-- authenticated server logic; they should never be reachable from the unauthenticated PostgREST API.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.trade_can_access_homeowner(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.trade_can_access_job(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_owns_homeowner(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.homeowner_has_relationship_with_trade(uuid, uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trade_can_access_homeowner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trade_can_access_job(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_homeowner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.homeowner_has_relationship_with_trade(uuid, uuid) TO authenticated;