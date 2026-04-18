-- Remove any existing policies on storage.objects scoped to quote-pdfs
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname
    FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND (
        pg_get_expr(polqual, polrelid) ILIKE '%quote-pdfs%'
        OR pg_get_expr(polwithcheck, polrelid) ILIKE '%quote-pdfs%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.polname);
  END LOOP;
END $$;

-- Service role only — edge functions (create-quote-checkout uploads via service role,
-- analyse-quote / read-quote-check read via service role). No anon/authenticated access.
CREATE POLICY "Service role full access to quote-pdfs"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'quote-pdfs' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'quote-pdfs' AND auth.role() = 'service_role');
