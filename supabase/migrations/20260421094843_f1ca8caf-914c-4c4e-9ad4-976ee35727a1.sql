-- Lock down the manual-documents bucket: switch to private and add an
-- owner-scoped SELECT policy so users can only download files in their own
-- folder (folder name = auth.uid()).

UPDATE storage.buckets SET public = false WHERE id = 'manual-documents';

DROP POLICY IF EXISTS "Users can read own manual docs" ON storage.objects;

CREATE POLICY "Users can read own manual docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'manual-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);