-- Fix: Public Bucket Allows Listing (job-photos, manual-documents)
-- Drop broad SELECT policies that let any client list all files
DROP POLICY IF EXISTS "Public can view job photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read job photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view manual docs" ON storage.objects;

-- Drop stale public read on insurance-certs (bucket is now private; admin/owner policies remain)
DROP POLICY IF EXISTS "Public read insurance certs" ON storage.objects;

-- Fix: RLS Policy Always True — tighten INSERT policies so users can only upload to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload job photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload manual docs" ON storage.objects;

-- job-photos: allow uploads to {user_id}/... (homeowner job photos) OR updates/... (trade stage updates)
CREATE POLICY "Users can upload job photos to own folder or updates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR (storage.foldername(name))[1] = 'updates'
  )
);

-- manual-documents: scope uploads to {user_id}/...
CREATE POLICY "Users can upload manual docs to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'manual-documents'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Buckets remain public so getPublicUrl() continues to serve files via CDN without listing.
-- Removing the broad SELECT policies prevents the storage API from being used to enumerate files,
-- but direct public URLs (already in use throughout the app) still work for individual files.