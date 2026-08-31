-- Inspection reports are building-control documents: both parties may read
-- them (unlike drawdown proformas). Files are stored under <job_id>/...
CREATE POLICY "Project parties can read inspection reports"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'inspection-reports'
  AND EXISTS (
    SELECT 1 FROM public.project_wallets w
    WHERE w.job_id::text = (storage.foldername(name))[1]
      AND (
        EXISTS (SELECT 1 FROM public.homeowners h WHERE h.id = w.homeowner_id AND h.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = w.trade_id AND t.user_id = auth.uid())
      )
  )
);

CREATE POLICY "Project parties can upload inspection reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'inspection-reports'
  AND EXISTS (
    SELECT 1 FROM public.project_wallets w
    WHERE w.job_id::text = (storage.foldername(name))[1]
      AND (
        EXISTS (SELECT 1 FROM public.homeowners h WHERE h.id = w.homeowner_id AND h.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = w.trade_id AND t.user_id = auth.uid())
      )
  )
);