-- Dispute evidence files live under disputes/<job_id>/... in the job-photos bucket.
DROP POLICY IF EXISTS "Job participants can upload dispute evidence" ON storage.objects;
CREATE POLICY "Job participants can upload dispute evidence" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND (storage.foldername(name))[1] = 'disputes'
  AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND (
    public.user_is_job_participant(auth.uid(), ((storage.foldername(name))[2])::uuid)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Job participants can read dispute evidence" ON storage.objects;
CREATE POLICY "Job participants can read dispute evidence" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (storage.foldername(name))[1] = 'disputes'
  AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND (
    public.user_is_job_participant(auth.uid(), ((storage.foldername(name))[2])::uuid)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);