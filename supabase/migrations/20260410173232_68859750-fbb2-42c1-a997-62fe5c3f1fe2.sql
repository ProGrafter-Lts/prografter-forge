
-- Create homeowners table
CREATE TABLE public.homeowners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.homeowners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own homeowner record"
ON public.homeowners FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own homeowner record"
ON public.homeowners FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add columns to jobs
ALTER TABLE public.jobs
ADD COLUMN homeowner_id UUID REFERENCES public.homeowners(id) ON DELETE CASCADE,
ADD COLUMN title TEXT,
ADD COLUMN status TEXT NOT NULL DEFAULT 'open',
ADD COLUMN budget TEXT;

-- Replace anon insert policy with authenticated
DROP POLICY IF EXISTS "Anyone can insert jobs" ON public.jobs;

CREATE POLICY "Authenticated users can insert own jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (
  homeowner_id IN (
    SELECT id FROM public.homeowners WHERE user_id = auth.uid()
  )
);
