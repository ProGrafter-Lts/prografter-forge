ALTER TABLE public.job_photos
  ADD COLUMN IF NOT EXISTS taken_at timestamptz,
  ADD COLUMN IF NOT EXISTS taken_at_source text,
  ADD COLUMN IF NOT EXISTS gps_lat double precision,
  ADD COLUMN IF NOT EXISTS gps_lng double precision,
  ADD COLUMN IF NOT EXISTS camera_make_model text;

ALTER TABLE public.job_photos
  DROP CONSTRAINT IF EXISTS job_photos_taken_at_source_check;

ALTER TABLE public.job_photos
  ADD CONSTRAINT job_photos_taken_at_source_check
  CHECK (taken_at_source IS NULL OR taken_at_source IN ('exif', 'manual'));

CREATE INDEX IF NOT EXISTS job_photos_job_taken_at_idx
  ON public.job_photos (job_id, taken_at DESC);