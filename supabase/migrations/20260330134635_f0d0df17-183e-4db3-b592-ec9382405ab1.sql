CREATE TABLE public.early_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  postcode TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'tradesperson',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.early_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert early signups"
  ON public.early_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "No one can read early signups"
  ON public.early_signups
  FOR SELECT
  USING (false);