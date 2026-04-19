
-- Add funds verification columns to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS funds_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS funds_verification_type text,
  ADD COLUMN IF NOT EXISTS funds_verified_at timestamptz;

-- Funds verification submissions table
CREATE TABLE IF NOT EXISTS public.funds_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  homeowner_id uuid REFERENCES public.homeowners(id) ON DELETE CASCADE,
  document_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funds_verification ENABLE ROW LEVEL SECURITY;

-- Homeowners can insert their own verification submissions
CREATE POLICY "Homeowners can submit own funds verification"
ON public.funds_verification
FOR INSERT
TO authenticated
WITH CHECK (
  homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())
);

-- Homeowners can view their own submissions
CREATE POLICY "Homeowners can view own funds verification"
ON public.funds_verification
FOR SELECT
TO authenticated
USING (
  homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())
);

-- Admins can view & manage all verification submissions
CREATE POLICY "Admins can view all funds verification"
ON public.funds_verification
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update funds verification"
ON public.funds_verification
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trades can see funds_verified flag on matched jobs (existing jobs RLS already grants this)
-- No additional policy needed; column is part of jobs.

-- Private storage bucket for funds verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('funds-verification', 'funds-verification', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only the uploading homeowner (folder = user_id) and admins can read.
CREATE POLICY "Homeowners upload own funds docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'funds-verification'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Homeowners read own funds docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'funds-verification'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins read all funds docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'funds-verification'
  AND public.has_role(auth.uid(), 'admin')
);
