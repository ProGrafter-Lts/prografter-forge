-- Proforma invoices are trade-private: only the uploading trade (and service_role) can touch them.
CREATE POLICY "Trades can upload own proformas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'drawdown-proformas'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND (storage.foldername(name))[1] = t.id::text
  )
);

CREATE POLICY "Trades can read own proformas"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'drawdown-proformas'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND (storage.foldername(name))[1] = t.id::text
  )
);