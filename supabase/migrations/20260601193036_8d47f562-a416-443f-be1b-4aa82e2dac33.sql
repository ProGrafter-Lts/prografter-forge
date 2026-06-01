DROP POLICY IF EXISTS "Anyone can submit a trade application" ON public.trade_applications;

CREATE POLICY "Anyone can submit a trade application"
ON public.trade_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND verification_status = 'unverified'
  AND admin_notes IS NULL
  AND decided_at IS NULL
  AND decided_by IS NULL
  AND decision_reason IS NULL
);