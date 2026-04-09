
-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  deposit_paid BOOLEAN NOT NULL DEFAULT false,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
CREATE POLICY "Anyone can insert jobs"
ON public.jobs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No public reads
CREATE POLICY "No public reads on jobs"
ON public.jobs
FOR SELECT
TO public
USING (false);

-- Create storage bucket for job photos
INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', true);

-- Allow anyone to upload job photos
CREATE POLICY "Anyone can upload job photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'job-photos');

-- Allow public reads on job photos
CREATE POLICY "Public read job photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'job-photos');
