-- Allow homeowners to view their own posted jobs
CREATE POLICY "Homeowners can view own jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (
    homeowner_id IN (
      SELECT id FROM public.homeowners WHERE user_id = auth.uid()
    )
  );
