-- Add homeowner sign-off columns to project_stages
ALTER TABLE public.project_stages
ADD COLUMN homeowner_confirmed boolean NOT NULL DEFAULT false,
ADD COLUMN homeowner_confirmed_at timestamptz;

-- Allow trades to update stages for matched jobs
CREATE POLICY "Trades can update stages for matched jobs"
ON public.project_stages
FOR UPDATE
TO authenticated
USING (
  job_id IN (
    SELECT jm.job_id FROM job_matches jm
    WHERE jm.trade_id IN (
      SELECT t.id FROM trades t WHERE t.user_id = auth.uid()
    )
  )
);

-- Allow homeowners to update stages for own jobs
CREATE POLICY "Homeowners can update stages for own jobs"
ON public.project_stages
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