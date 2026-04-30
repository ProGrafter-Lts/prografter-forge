-- Allow the inserter (and any caller) to read quote_checks rows.
-- Required so that PostgREST can return the inserted row (id, lookup_token)
-- when a visitor submits a quote check. The id/lookup_token are only known
-- to the submitter, mirroring the existing access pattern used by the
-- read-quote-check edge function.
CREATE POLICY "Anyone can read quote checks"
ON public.quote_checks
FOR SELECT
TO anon, authenticated
USING (true);