CREATE POLICY "Quote checker uploads to root"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'quote-pdfs'
  AND (storage.foldername(name) = '{}'::text[])
);