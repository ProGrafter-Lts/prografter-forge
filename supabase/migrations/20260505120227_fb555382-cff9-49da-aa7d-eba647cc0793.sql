-- Drop existing main-trade ALL + any prior split policies (idempotent)
DROP POLICY IF EXISTS "Main trades can manage own sub assignments" ON public.sub_trade_assignments;
DROP POLICY IF EXISTS "Main trades can view own sub assignments" ON public.sub_trade_assignments;
DROP POLICY IF EXISTS "Main trades can insert own sub assignments" ON public.sub_trade_assignments;
DROP POLICY IF EXISTS "Main trades can update own sub assignments" ON public.sub_trade_assignments;

CREATE POLICY "Main trades can view own sub assignments"
ON public.sub_trade_assignments
FOR SELECT
TO authenticated
USING (
  main_trade_id IN (SELECT t.id FROM public.trades t WHERE t.user_id = auth.uid())
);

CREATE POLICY "Main trades can insert own sub assignments"
ON public.sub_trade_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  main_trade_id IN (SELECT t.id FROM public.trades t WHERE t.user_id = auth.uid())
);

CREATE POLICY "Main trades can update own sub assignments"
ON public.sub_trade_assignments
FOR UPDATE
TO authenticated
USING (
  main_trade_id IN (SELECT t.id FROM public.trades t WHERE t.user_id = auth.uid())
)
WITH CHECK (
  main_trade_id IN (SELECT t.id FROM public.trades t WHERE t.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Homeowners can view sub assignments for own jobs" ON public.sub_trade_assignments;
CREATE POLICY "Homeowners can view sub assignments for own jobs"
ON public.sub_trade_assignments
FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM public.jobs j
    WHERE j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())
  )
);