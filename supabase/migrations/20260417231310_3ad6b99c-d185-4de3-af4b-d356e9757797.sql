-- Tighten storage policies on insurance-certs and job-photos
-- Remove anonymous INSERT access; only authenticated users may upload.

-- insurance-certs
DROP POLICY IF EXISTS "Anyone can upload insurance certs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view insurance certs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view insurance certs" ON storage.objects;

CREATE POLICY "Authenticated users can upload insurance certs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'insurance-certs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can read own insurance certs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'insurance-certs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- job-photos
DROP POLICY IF EXISTS "Anyone can upload job photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view job photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view job photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload job photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-photos');

-- Keep job-photos publicly readable (they're shown in trade dashboards / project pages
-- via getPublicUrl), but require auth to upload.
CREATE POLICY "Public can view job photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'job-photos');

-- Fix mutable search_path on remaining functions
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;