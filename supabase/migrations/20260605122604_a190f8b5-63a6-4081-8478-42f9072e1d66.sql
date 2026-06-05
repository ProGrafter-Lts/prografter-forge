-- 1 & 2: Remove permissive direct-UPDATE policies on contracts and contract_variations.
-- All legitimate writes go through SECURITY DEFINER RPCs (sign_contract, add_bespoke_terms,
-- generate_contract_for_quote) which bypass RLS. The client only performs SELECTs on these tables.
DROP POLICY IF EXISTS "Parties can update own contract" ON public.contracts;
DROP POLICY IF EXISTS "Parties can update variations" ON public.contract_variations;

-- 3: quote_checks INSERT must only allow status = 'pending'. 'paid' is set server-side
-- (service role) after Stripe verification.
DROP POLICY IF EXISTS "Anyone can create quote checks" ON public.quote_checks;
CREATE POLICY "Anyone can create quote checks"
ON public.quote_checks
FOR INSERT
WITH CHECK (
  (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)
  AND (char_length(email) >= 3) AND (char_length(email) <= 320)
  AND (char_length(project_type) >= 1) AND (char_length(project_type) <= 200)
  AND (char_length(pdf_url) >= 1) AND (char_length(pdf_url) <= 2048)
  AND (char_length(description) <= 5000)
  AND (status = 'pending'::text)
);

-- 4: trade_applications INSERT policy aligned with the column defaults the client relies on
-- (status defaults to 'submitted', verification_status defaults to 'new'), while still blocking
-- applicants from pre-setting admin/decision fields.
DROP POLICY IF EXISTS "Anyone can submit a trade application" ON public.trade_applications;
CREATE POLICY "Anyone can submit a trade application"
ON public.trade_applications
FOR INSERT
WITH CHECK (
  (status = 'submitted'::text)
  AND (verification_status = 'new'::text)
  AND (admin_notes IS NULL)
  AND (decided_at IS NULL)
  AND (decided_by IS NULL)
  AND (decision_reason IS NULL)
);