-- Allow job participants (homeowner + matched trades) to upload and read
-- daily site-diary photos stored under diary/<job_id>/...
DROP POLICY IF EXISTS "Job participants can upload diary photos" ON storage.objects;
CREATE POLICY "Job participants can upload diary photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND (storage.foldername(name))[1] = 'diary'
  AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND public.user_is_job_participant(auth.uid(), ((storage.foldername(name))[2])::uuid)
);

DROP POLICY IF EXISTS "Job participants can read diary photos" ON storage.objects;
CREATE POLICY "Job participants can read diary photos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (storage.foldername(name))[1] = 'diary'
  AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND public.user_is_job_participant(auth.uid(), ((storage.foldername(name))[2])::uuid)
);