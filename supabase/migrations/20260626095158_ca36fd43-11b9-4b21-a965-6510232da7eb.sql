
-- Lead distribution: each match (job brief sent to a trade) with job + trade detail
CREATE OR REPLACE FUNCTION public.admin_lead_distribution()
RETURNS TABLE(
  match_id uuid,
  job_id uuid,
  job_ref text,
  job_type text,
  job_postcode text,
  job_created_at timestamptz,
  match_status text,
  notified_at timestamptz,
  trade_id uuid,
  trade_name text,
  trade_company text,
  trade_type text,
  trade_postcode text,
  trade_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    jm.id, j.id, j.ref, j.job_type, j.postcode, j.created_at,
    jm.status, jm.notified_at,
    t.id, t.name, t.company_name, t.trade_type, t.postcode, t.verified
  FROM public.job_matches jm
  JOIN public.jobs j ON j.id = jm.job_id
  JOIN public.trades t ON t.id = jm.trade_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND jm.is_test = false
    AND j.is_test = false
    AND t.is_test = false
  ORDER BY j.created_at DESC, jm.notified_at DESC;
$$;

-- Area coverage: per postcode-area, counts of registered trades and job posts
CREATE OR REPLACE FUNCTION public.admin_area_coverage()
RETURNS TABLE(
  area text,
  trade_count integer,
  job_count integer,
  match_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH guard AS (
    SELECT public.has_role(auth.uid(), 'admin') AS ok
  ),
  trade_areas AS (
    SELECT NULLIF(UPPER(SUBSTRING(REPLACE(postcode,' ','') FROM '^[A-Za-z]+')), '') AS area
    FROM public.trades
    WHERE is_test = false AND postcode IS NOT NULL
  ),
  job_areas AS (
    SELECT id, NULLIF(UPPER(SUBSTRING(REPLACE(postcode,' ','') FROM '^[A-Za-z]+')), '') AS area
    FROM public.jobs
    WHERE is_test = false AND postcode IS NOT NULL
  ),
  match_areas AS (
    SELECT ja.area
    FROM public.job_matches jm
    JOIN job_areas ja ON ja.id = jm.job_id
    WHERE jm.is_test = false
  ),
  t AS (SELECT area, COUNT(*)::int c FROM trade_areas WHERE area IS NOT NULL GROUP BY area),
  j AS (SELECT area, COUNT(*)::int c FROM job_areas WHERE area IS NOT NULL GROUP BY area),
  m AS (SELECT area, COUNT(*)::int c FROM match_areas WHERE area IS NOT NULL GROUP BY area),
  areas AS (
    SELECT area FROM t UNION SELECT area FROM j UNION SELECT area FROM m
  )
  SELECT a.area,
         COALESCE(t.c,0), COALESCE(j.c,0), COALESCE(m.c,0)
  FROM areas a
  LEFT JOIN t ON t.area = a.area
  LEFT JOIN j ON j.area = a.area
  LEFT JOIN m ON m.area = a.area
  WHERE (SELECT ok FROM guard)
  ORDER BY COALESCE(j.c,0) DESC, COALESCE(t.c,0) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_lead_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_area_coverage() TO authenticated;
