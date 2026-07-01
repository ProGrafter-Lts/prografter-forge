-- Homeowners manage files within their own user-id folder
CREATE POLICY "Users manage own job-brief-files"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'job-brief-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'job-brief-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can access all job-brief-files
CREATE POLICY "Admins access all job-brief-files"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'job-brief-files'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'job-brief-files'
  AND public.has_role(auth.uid(), 'admin')
);