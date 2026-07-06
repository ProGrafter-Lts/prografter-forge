-- Tighten trade_references INSERT policy to prevent anonymous users
-- from creating reference rows linked to arbitrary trades.
DROP POLICY IF EXISTS "Anyone can submit a reference" ON public.trade_references;

CREATE POLICY "Applicants and trade owners can submit references"
ON public.trade_references
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'not_contacted'::trade_reference_status
  AND admin_notes IS NULL
  AND status_updated_at IS NULL
  AND status_updated_by IS NULL
  AND (
    -- Authenticated trade owner attaching references to their own trade
    (
      trade_id IS NOT NULL
      AND trade_id IN (
        SELECT trades.id FROM public.trades WHERE trades.user_id = auth.uid()
      )
    )
    OR
    -- Anonymous / pre-account application flow: no trade linkage allowed,
    -- references are matched later by applicant_email
    (trade_id IS NULL AND applicant_email IS NOT NULL)
  )
);