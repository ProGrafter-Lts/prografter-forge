
-- Create trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  postcode TEXT NOT NULL,
  bio TEXT,
  years_experience INTEGER,
  website TEXT,
  insurance_cert_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (no auth required, like early_signups)
CREATE POLICY "Anyone can insert trades"
  ON public.trades
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public reads
CREATE POLICY "No public reads on trades"
  ON public.trades
  FOR SELECT
  TO public
  USING (false);

-- Create insurance-certs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('insurance-certs', 'insurance-certs', true);

-- Allow anyone to upload to insurance-certs
CREATE POLICY "Anyone can upload insurance certs"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'insurance-certs');

-- Allow public read of insurance certs
CREATE POLICY "Public read insurance certs"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'insurance-certs');
