
UPDATE storage.buckets SET public = false WHERE id = 'job-photos';
DROP POLICY IF EXISTS "Public read for job photos" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can read trade directory" ON public.trades;

DROP POLICY IF EXISTS "Homeowner counterparty can read trade" ON public.trades;
CREATE POLICY "Homeowner counterparty can read trade"
ON public.trades FOR SELECT
TO authenticated
USING (public.homeowner_has_relationship_with_trade(auth.uid(), id));

DROP VIEW IF EXISTS public.public_trades;
CREATE VIEW public.public_trades
WITH (security_invoker = false) AS
SELECT
  id, user_id, name, company_name, trade_type, postcode,
  verified, mcs_verified, trustmark_verified, is_green_trade,
  bio, years_experience, website, business_logo_path,
  avg_rating, review_count, completed_jobs_count, tier,
  created_at
FROM public.trades
WHERE is_test = false;

GRANT SELECT ON public.public_trades TO anon, authenticated;
