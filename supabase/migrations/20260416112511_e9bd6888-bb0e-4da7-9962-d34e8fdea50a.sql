
CREATE POLICY "Homeowners can update quotes for own jobs"
ON public.quotes
FOR UPDATE
TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    WHERE j.homeowner_id IN (
      SELECT h.id FROM homeowners h WHERE h.user_id = auth.uid()
    )
  )
);
