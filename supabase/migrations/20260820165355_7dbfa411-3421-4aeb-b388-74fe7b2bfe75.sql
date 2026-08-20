DROP FUNCTION IF EXISTS public.admin_area_coverage();

CREATE FUNCTION public.admin_area_coverage()
RETURNS TABLE(area text, trade_count integer, coming_soon_count integer, job_count integer, match_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH guard AS (
    SELECT public.has_role(auth.uid(), 'admin') AS ok
  ),
  trade_rows AS (
    SELECT NULLIF(UPPER(SUBSTRING(REPLACE(postcode,' ','') FROM '^[A-Za-z]+')), '') AS area,
           (verified IS TRUE
             AND COALESCE(verification_status,'') NOT IN ('coming_soon','rejected')) AS eligible,
           COALESCE(verification_status,'') = 'coming_soon' AS coming_soon
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
  t AS (
    SELECT area,
           COUNT(*) FILTER (WHERE eligible)::int AS c,
           COUNT(*) FILTER (WHERE coming_soon)::int AS cs
    FROM trade_rows WHERE area IS NOT NULL GROUP BY area
  ),
  j AS (SELECT area, COUNT(*)::int c FROM job_areas WHERE area IS NOT NULL GROUP BY area),
  m AS (SELECT area, COUNT(*)::int c FROM match_areas WHERE area IS NOT NULL GROUP BY area),
  areas AS (
    SELECT area FROM t UNION SELECT area FROM j UNION SELECT area FROM m
  )
  SELECT a.area,
         COALESCE(t.c,0), COALESCE(t.cs,0), COALESCE(j.c,0), COALESCE(m.c,0)
  FROM areas a
  LEFT JOIN t ON t.area = a.area
  LEFT JOIN j ON j.area = a.area
  LEFT JOIN m ON m.area = a.area
  WHERE (SELECT ok FROM guard)
  ORDER BY COALESCE(j.c,0) DESC, COALESCE(t.c,0) DESC;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_area_coverage() TO authenticated;