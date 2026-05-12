-- 1. Add ref column to jobs with auto-generation
CREATE OR REPLACE FUNCTION public.generate_job_ref()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text;
  i int;
  exists_check int;
BEGIN
  LOOP
    result := 'PG-';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_check FROM public.jobs WHERE ref = result;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN result;
END;
$$;

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ref text;

-- Backfill existing jobs
UPDATE public.jobs SET ref = public.generate_job_ref() WHERE ref IS NULL;

ALTER TABLE public.jobs ALTER COLUMN ref SET NOT NULL;
ALTER TABLE public.jobs ALTER COLUMN ref SET DEFAULT public.generate_job_ref();
CREATE UNIQUE INDEX IF NOT EXISTS jobs_ref_unique ON public.jobs(ref);

-- 2. job_photos table
CREATE TABLE IF NOT EXISTS public.job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  label text NOT NULL DEFAULT '',
  stage integer NOT NULL DEFAULT 0,
  uploaded_by text NOT NULL DEFAULT 'trade',
  uploader_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_photos_job_id_idx ON public.job_photos(job_id);

ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view photos for own jobs"
ON public.job_photos FOR SELECT TO authenticated
USING (job_id IN (SELECT j.id FROM public.jobs j
  WHERE j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())));

CREATE POLICY "Homeowners can insert photos for own jobs"
ON public.job_photos FOR INSERT TO authenticated
WITH CHECK (job_id IN (SELECT j.id FROM public.jobs j
  WHERE j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())));

CREATE POLICY "Trades can view photos for matched jobs"
ON public.job_photos FOR SELECT TO authenticated
USING (job_id IN (SELECT jm.job_id FROM public.job_matches jm
  WHERE jm.trade_id IN (SELECT t.id FROM public.trades t WHERE t.user_id = auth.uid())));

CREATE POLICY "Trades can insert photos for matched jobs"
ON public.job_photos FOR INSERT TO authenticated
WITH CHECK (job_id IN (SELECT jm.job_id FROM public.job_matches jm
  WHERE jm.trade_id IN (SELECT t.id FROM public.trades t WHERE t.user_id = auth.uid())));