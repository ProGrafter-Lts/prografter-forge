-- 1. Allow legitimate parties (homeowners/trades) to read their own legacy contracts
CREATE POLICY "Parties can read legacy contracts"
ON public.contracts_legacy
FOR SELECT
USING (
  (homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid()))
  OR (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()))
);

-- 2. Scope trade application document uploads to the intended folder prefix
DROP POLICY IF EXISTS "Anyone can upload trade application docs" ON storage.objects;

CREATE POLICY "Scoped upload trade application docs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'trade-application-docs'
  AND (storage.foldername(name))[1] = 'trade-applications'
);