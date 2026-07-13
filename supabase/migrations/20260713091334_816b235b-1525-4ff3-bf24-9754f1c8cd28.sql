DROP POLICY IF EXISTS "Anyone can submit a manual review request" ON public.manual_quote_review_requests;

CREATE POLICY "Anyone can submit a manual review request"
ON public.manual_quote_review_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND length(name) BETWEEN 1 AND 200
  AND length(email) BETWEEN 5 AND 254
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(quote_type) BETWEEN 1 AND 100
  AND (phone IS NULL OR length(phone) <= 40)
  AND (note IS NULL OR length(note) <= 5000)
  AND (file_path IS NULL OR length(file_path) <= 1000)
  AND (file_name IS NULL OR length(file_name) <= 500)
);