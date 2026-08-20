CREATE POLICY "Trades read own migrated vault application docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-application-docs'
  AND EXISTS (
    SELECT 1 FROM public.tradevault_documents d
    WHERE d.source_bucket = 'trade-application-docs'
      AND d.file_url = storage.objects.name
      AND public.owns_trade(auth.uid(), d.trade_id)
  )
);