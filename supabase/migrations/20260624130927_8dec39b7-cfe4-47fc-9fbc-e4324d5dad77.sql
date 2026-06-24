DROP POLICY IF EXISTS "Scoped upload trade application docs" ON storage.objects;

CREATE POLICY "Scoped upload trade application docs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'trade-application-docs'
  AND (storage.foldername(name))[1] = 'trade-applications'
  AND array_length(storage.foldername(name), 1) >= 2
  AND lower(storage.extension(name)) IN ('pdf','png','jpg','jpeg','webp','gif','heic')
);