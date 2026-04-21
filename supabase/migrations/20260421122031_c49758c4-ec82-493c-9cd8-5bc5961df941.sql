-- Allow homeowners to create contracts when accepting a quote on their own job
CREATE POLICY "Homeowners can create contracts for own jobs"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (
  homeowner_id IN (
    SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid()
  )
  AND job_id IN (
    SELECT j.id FROM public.jobs j
    WHERE j.homeowner_id IN (
      SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid()
    )
  )
);