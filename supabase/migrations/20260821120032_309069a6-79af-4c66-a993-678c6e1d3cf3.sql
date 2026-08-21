-- Support recording quotes/contracts agreed outside the platform's standard flow
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS is_offline_agreement boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_pdf_path text,
  ADD COLUMN IF NOT EXISTS agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS offline_recorded_by uuid,
  ADD COLUMN IF NOT EXISTS offline_notes text;

-- Admins need to view and record these
CREATE POLICY "Admins can view all quotes"
  ON public.quotes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Homeowners must be able to read the agreed contract document for their own job
CREATE POLICY "Homeowner can read agreed contract docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'quote-pdfs'
    AND EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.jobs j ON j.id = q.job_id
      JOIN public.homeowners h ON h.id = j.homeowner_id
      WHERE h.user_id = auth.uid()
        AND q.contract_pdf_path IS NOT NULL
        AND q.contract_pdf_path = objects.name
    )
  );

-- Trades must be able to read the agreed contract document on their own quote
CREATE POLICY "Trade can read agreed contract docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'quote-pdfs'
    AND EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.trades t ON t.id = q.trade_id
      WHERE t.user_id = auth.uid()
        AND q.contract_pdf_path IS NOT NULL
        AND q.contract_pdf_path = objects.name
    )
  );