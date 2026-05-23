
DROP VIEW IF EXISTS public.public_trades;

-- Function: search trades by company/name (public directory)
CREATE OR REPLACE FUNCTION public.search_public_trades(_q text, _limit int DEFAULT 10)
RETURNS TABLE (
  id uuid, name text, company_name text, trade_type text, postcode text,
  verified boolean, mcs_verified boolean, trustmark_verified boolean,
  is_green_trade boolean, bio text, years_experience integer, website text,
  business_logo_path text, avg_rating numeric, review_count integer,
  completed_jobs_count integer, tier text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.name, t.company_name, t.trade_type, t.postcode,
         t.verified, t.mcs_verified, t.trustmark_verified,
         t.is_green_trade, t.bio, t.years_experience, t.website,
         t.business_logo_path, t.avg_rating, t.review_count,
         t.completed_jobs_count, t.tier
  FROM public.trades t
  WHERE t.is_test = false
    AND (
      _q IS NULL OR _q = ''
      OR t.company_name ILIKE '%' || _q || '%'
      OR t.name ILIKE '%' || _q || '%'
    )
  ORDER BY t.verified DESC, t.avg_rating DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 50));
$$;

-- Function: public profile by id
CREATE OR REPLACE FUNCTION public.get_public_trade(_id uuid)
RETURNS TABLE (
  id uuid, name text, company_name text, trade_type text, postcode text,
  verified boolean, mcs_verified boolean, trustmark_verified boolean,
  is_green_trade boolean, bio text, years_experience integer, website text,
  business_logo_path text, avg_rating numeric, review_count integer,
  completed_jobs_count integer, tier text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.name, t.company_name, t.trade_type, t.postcode,
         t.verified, t.mcs_verified, t.trustmark_verified,
         t.is_green_trade, t.bio, t.years_experience, t.website,
         t.business_logo_path, t.avg_rating, t.review_count,
         t.completed_jobs_count, t.tier
  FROM public.trades t
  WHERE t.id = _id AND t.is_test = false;
$$;

-- Function: count of verified trades (Hero stat)
CREATE OR REPLACE FUNCTION public.count_verified_trades()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::integer FROM public.trades
  WHERE verified = true AND is_test = false;
$$;
