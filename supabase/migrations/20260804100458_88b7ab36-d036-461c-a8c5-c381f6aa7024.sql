-- Make backend-only access explicit on the two Quote Checker audit tables.
-- Both are written/read exclusively by edge functions using the service role,
-- which bypasses RLS. These policies document and enforce "no client access".

REVOKE ALL ON public.quote_check_extractions FROM anon, authenticated;
REVOKE ALL ON public.quote_check_consistency_tests FROM anon, authenticated;

GRANT ALL ON public.quote_check_extractions TO service_role;
GRANT ALL ON public.quote_check_consistency_tests TO service_role;

ALTER TABLE public.quote_check_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_check_consistency_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON public.quote_check_extractions;
CREATE POLICY "Service role only"
  ON public.quote_check_extractions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "No client access" ON public.quote_check_extractions;
CREATE POLICY "No client access"
  ON public.quote_check_extractions
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Service role only" ON public.quote_check_consistency_tests;
CREATE POLICY "Service role only"
  ON public.quote_check_consistency_tests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "No client access" ON public.quote_check_consistency_tests;
CREATE POLICY "No client access"
  ON public.quote_check_consistency_tests
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);