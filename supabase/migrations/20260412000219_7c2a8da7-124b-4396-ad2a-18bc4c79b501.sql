
-- Create quote_checks table
CREATE TABLE public.quote_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  project_type TEXT NOT NULL,
  postcode TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  pdf_url TEXT NOT NULL,
  report_html TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_checks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public feature, no auth required)
CREATE POLICY "Anyone can create quote checks"
  ON public.quote_checks FOR INSERT
  WITH CHECK (true);

-- Allow reading own record by id (for status polling)
CREATE POLICY "Anyone can read quote checks"
  ON public.quote_checks FOR SELECT
  USING (true);

-- Create storage bucket for quote PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('quote-pdfs', 'quote-pdfs', false);

-- Allow anonymous uploads to quote-pdfs bucket
CREATE POLICY "Anyone can upload quote PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quote-pdfs');

-- Allow reading quote PDFs (for edge function)
CREATE POLICY "Anyone can read quote PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quote-pdfs');
