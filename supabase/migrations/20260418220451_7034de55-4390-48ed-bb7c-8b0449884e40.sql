-- Make job-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'job-photos';

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can upload job photos to own folder or updates" ON storage.objects;

-- Homeowners may upload photos under their own UID folder (used by Post-A-Job)
CREATE POLICY "Homeowners can upload job photos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND (storage.foldername(storage.objects.name))[1] = (auth.uid())::text
);

-- Trades may upload stage update photos under updates/<stage_id>/... ONLY if
-- they have a job_match for the job that owns that stage.
CREATE POLICY "Matched trades can upload stage update photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND (storage.foldername(storage.objects.name))[1] = 'updates'
  AND EXISTS (
    SELECT 1
    FROM public.project_stages ps
    JOIN public.job_matches jm ON jm.job_id = ps.job_id
    JOIN public.trades t ON t.id = jm.trade_id
    WHERE ps.id::text = (storage.foldername(storage.objects.name))[2]
      AND t.user_id = auth.uid()
  )
);

-- SELECT: homeowners may read photos for jobs they own
CREATE POLICY "Homeowners can read own job photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (
    (storage.foldername(storage.objects.name))[1] = (auth.uid())::text
    OR
    (
      (storage.foldername(storage.objects.name))[1] = 'updates'
      AND EXISTS (
        SELECT 1
        FROM public.project_stages ps
        JOIN public.jobs j ON j.id = ps.job_id
        JOIN public.homeowners h ON h.id = j.homeowner_id
        WHERE ps.id::text = (storage.foldername(storage.objects.name))[2]
          AND h.user_id = auth.uid()
      )
    )
  )
);

-- SELECT: matched trades may read photos for jobs they're matched to
CREATE POLICY "Matched trades can read job photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (
    (
      (storage.foldername(storage.objects.name))[1] = 'updates'
      AND EXISTS (
        SELECT 1
        FROM public.project_stages ps
        JOIN public.job_matches jm ON jm.job_id = ps.job_id
        JOIN public.trades t ON t.id = jm.trade_id
        WHERE ps.id::text = (storage.foldername(storage.objects.name))[2]
          AND t.user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.homeowners h ON h.id = j.homeowner_id
      JOIN public.job_matches jm ON jm.job_id = j.id
      JOIN public.trades t ON t.id = jm.trade_id
      WHERE h.user_id::text = (storage.foldername(storage.objects.name))[1]
        AND t.user_id = auth.uid()
    )
  )
);