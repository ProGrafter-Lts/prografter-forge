CREATE OR REPLACE FUNCTION public.get_trade_for_homeowner(_trade_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  company_name text,
  phone text,
  trade_type text,
  verified boolean,
  mcs_verified boolean,
  trustmark_verified boolean,
  is_green_trade boolean,
  avg_rating numeric,
  review_count integer,
  completed_jobs_count integer,
  tier text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.id, t.name, t.company_name, t.phone, t.trade_type,
         t.verified, t.mcs_verified, t.trustmark_verified, t.is_green_trade,
         t.avg_rating, t.review_count, t.completed_jobs_count, t.tier
  FROM public.trades t
  WHERE t.id = _trade_id
    AND public.homeowner_has_relationship_with_trade(auth.uid(), _trade_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_trade_for_homeowner(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_trade_for_homeowner(uuid) TO authenticated;

DROP POLICY IF EXISTS "Homeowner counterparty can read trade" ON public.trades;

DROP POLICY IF EXISTS "Anyone can create quote checks" ON public.quote_checks;

CREATE POLICY "Users can update own manual docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'manual-documents' AND (storage.foldername(name))[1] = (auth.uid())::text)
WITH CHECK (bucket_id = 'manual-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can delete own manual docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'manual-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);