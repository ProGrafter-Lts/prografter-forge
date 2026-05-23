
-- 1. Fix broken homeowner quote-pdfs policy
DROP POLICY IF EXISTS "Homeowner can read quote pdfs for own jobs" ON storage.objects;
CREATE POLICY "Homeowner can read quote pdfs for own jobs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1
    FROM public.quotes q
    JOIN public.jobs j ON j.id = q.job_id
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE h.user_id = auth.uid()
      AND q.pdf_path IS NOT NULL
      AND q.pdf_path = objects.name
  )
);

-- 2. Fix broken trade logo / quote pdfs policies (use objects.name not t.name)
DROP POLICY IF EXISTS "Trade owner can read own quote pdfs" ON storage.objects;
CREATE POLICY "Trade owner can read own quote pdfs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND (t.id)::text = (storage.foldername(objects.name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can update own quote pdfs" ON storage.objects;
CREATE POLICY "Trade owner can update own quote pdfs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND (t.id)::text = (storage.foldername(objects.name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can write own quote pdfs" ON storage.objects;
CREATE POLICY "Trade owner can write own quote pdfs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND (t.id)::text = (storage.foldername(objects.name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can upload own logo" ON storage.objects;
CREATE POLICY "Trade owner can upload own logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trade-logos'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND (t.id)::text = (storage.foldername(objects.name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can update own logo" ON storage.objects;
CREATE POLICY "Trade owner can update own logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'trade-logos'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND (t.id)::text = (storage.foldername(objects.name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can delete own logo" ON storage.objects;
CREATE POLICY "Trade owner can delete own logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trade-logos'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND (t.id)::text = (storage.foldername(objects.name))[1]
  )
);

-- 3. Remove public SELECT on quote_checks — read flow goes through read-quote-check edge function
DROP POLICY IF EXISTS "Anyone can read quote checks" ON public.quote_checks;

-- 4. Restrict contract_templates to contract parties + admins
DROP POLICY IF EXISTS "Authenticated users can read templates" ON public.contract_templates;
CREATE POLICY "Contract parties can read templates they signed"
ON public.contract_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    LEFT JOIN public.homeowners h ON h.id = c.homeowner_id
    LEFT JOIN public.trades t ON t.id = c.trade_id
    WHERE c.template_id = contract_templates.id
      AND (h.user_id = auth.uid() OR t.user_id = auth.uid())
  )
);

-- 5. Add INSERT policy on quote_pdf_events for trade owner and homeowner party
CREATE POLICY "Trade owner can insert quote pdf events"
ON public.quote_pdf_events FOR INSERT
TO authenticated
WITH CHECK (
  quote_id IN (
    SELECT q.id FROM public.quotes q
    JOIN public.trades t ON t.id = q.trade_id
    WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Homeowner party can insert quote pdf events"
ON public.quote_pdf_events FOR INSERT
TO authenticated
WITH CHECK (
  quote_id IN (
    SELECT q.id FROM public.quotes q
    JOIN public.jobs j ON j.id = q.job_id
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE h.user_id = auth.uid()
  )
);
