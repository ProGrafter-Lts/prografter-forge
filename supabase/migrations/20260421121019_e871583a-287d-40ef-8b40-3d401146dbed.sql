CREATE OR REPLACE FUNCTION public.user_owns_homeowner(_user_id uuid, _homeowner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.homeowners h
    WHERE h.id = _homeowner_id
      AND h.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.trade_can_access_job(_user_id uuid, _job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_matches jm
    JOIN public.trades t ON t.id = jm.trade_id
    WHERE t.user_id = _user_id
      AND jm.job_id = _job_id
  )
$$;

CREATE OR REPLACE FUNCTION public.trade_can_access_homeowner(_user_id uuid, _homeowner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.job_matches jm ON jm.job_id = j.id
    JOIN public.trades t ON t.id = jm.trade_id
    WHERE t.user_id = _user_id
      AND j.homeowner_id = _homeowner_id
  )
$$;

DROP POLICY IF EXISTS "Homeowners can view own jobs" ON public.jobs;
CREATE POLICY "Homeowners can view own jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (public.user_owns_homeowner(auth.uid(), homeowner_id));

DROP POLICY IF EXISTS "Trades can view matched jobs" ON public.jobs;
CREATE POLICY "Trades can view matched jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (public.trade_can_access_job(auth.uid(), id));

DROP POLICY IF EXISTS "Trades can view homeowners for matched jobs" ON public.homeowners;
CREATE POLICY "Trades can view homeowners for matched jobs"
ON public.homeowners
FOR SELECT
TO authenticated
USING (public.trade_can_access_homeowner(auth.uid(), id));