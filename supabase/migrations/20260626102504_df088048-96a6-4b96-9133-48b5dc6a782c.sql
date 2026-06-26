-- Tighten quote-pdfs anonymous INSERT: keep anon, but constrain to root path,
-- allowed file extensions, and a sane filename length so arbitrary junk can't
-- be dumped into the private bucket root.
DROP POLICY IF EXISTS "Quote checker uploads to root" ON storage.objects;
CREATE POLICY "Quote checker uploads to root"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'quote-pdfs'
  AND storage.foldername(name) = '{}'::text[]
  AND char_length(name) <= 200
  AND lower(storage.extension(name)) = ANY (ARRAY['pdf','png','jpg','jpeg','webp'])
);

-- Tighten trade-application-docs anonymous INSERT: keep anon (pre-signup flow),
-- but re-affirm path scoping, extension allowlist and a filename length cap.
DROP POLICY IF EXISTS "Scoped upload trade application docs" ON storage.objects;
CREATE POLICY "Scoped upload trade application docs"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'trade-application-docs'
  AND (storage.foldername(name))[1] = 'trade-applications'
  AND array_length(storage.foldername(name), 1) >= 2
  AND char_length(name) <= 300
  AND lower(storage.extension(name)) = ANY (ARRAY['pdf','png','jpg','jpeg','webp','gif','heic'])
);