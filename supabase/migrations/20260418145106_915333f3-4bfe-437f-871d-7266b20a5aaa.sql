-- Allow anonymous + authenticated INSERT only (the public Quote Checker uploads from the browser).
-- Reads remain service-role-only via the existing "Service role full access to quote-pdfs" policy.
CREATE POLICY "Anyone can upload a quote PDF"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'quote-pdfs');
