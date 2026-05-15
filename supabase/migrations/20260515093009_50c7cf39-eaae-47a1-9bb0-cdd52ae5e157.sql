CREATE OR REPLACE VIEW public.trades_public
WITH (security_invoker=true) AS
SELECT
  id,
  name,
  company_name,
  trade_type,
  verified,
  mcs_verified,
  trustmark_verified,
  is_green_trade,
  bio,
  years_experience,
  website,
  avg_rating,
  review_count,
  completed_jobs_count,
  tier,
  cps_scheme,
  cps_registration_number,
  gas_safe_number
FROM public.trades t
WHERE is_test = false;