
-- BUG 4: SECURITY DEFINER RPC to fetch the matched trade's public columns for a given job,
-- bypassing the trades_public view's is_test filter. Caller must be the homeowner of the job
-- OR the matched trade themselves. Returns NULL if not authorised or no match.
CREATE OR REPLACE FUNCTION public.get_trade_for_job(_job_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  company_name text,
  trade_type text,
  verified boolean,
  mcs_verified boolean,
  trustmark_verified boolean,
  is_green_trade boolean,
  bio text,
  years_experience integer,
  website text,
  avg_rating numeric,
  review_count integer,
  completed_jobs_count integer,
  tier text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.company_name, t.trade_type, t.verified, t.mcs_verified,
         t.trustmark_verified, t.is_green_trade, t.bio, t.years_experience, t.website,
         t.avg_rating, t.review_count, t.completed_jobs_count, t.tier
  FROM public.trades t
  JOIN public.job_matches jm ON jm.trade_id = t.id
  JOIN public.jobs j ON j.id = jm.job_id
  WHERE jm.job_id = _job_id
    AND (
      -- caller is the homeowner of this job
      j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())
      -- OR caller is the matched trade
      OR t.user_id = auth.uid()
    )
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_trade_for_job(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_trade_for_job(uuid) TO authenticated;

-- BUG 5: Server-side single source of truth for active projects.
-- A project is "active" when:
--   - it has a contract that is signed/active (not draft, not completed, not terminated/closed)
--     OR its stage is in (scheduled, in_progress, review)
--   - AND its stage is not 'completed' / 'cancelled'
-- The function returns the same shape regardless of whether the caller is the homeowner
-- or the matched trade.
CREATE OR REPLACE FUNCTION public.active_projects_for_user(_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  job_type text,
  postcode text,
  address text,
  stage text,
  status text,
  is_green_job boolean,
  homeowner_id uuid,
  trade_id uuid,
  contract_id uuid,
  contract_status text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ho AS (
    SELECT id FROM public.homeowners WHERE user_id = _user_id
  ),
  tr AS (
    SELECT id FROM public.trades WHERE user_id = _user_id
  )
  SELECT DISTINCT
    j.id,
    j.title,
    j.job_type,
    j.postcode,
    j.address,
    j.stage,
    j.status,
    j.is_green_job,
    j.homeowner_id,
    jm.trade_id,
    c.id AS contract_id,
    c.status AS contract_status,
    CASE
      WHEN j.homeowner_id IN (SELECT id FROM ho) THEN 'homeowner'
      WHEN jm.trade_id IN (SELECT id FROM tr) THEN 'trade'
      ELSE 'unknown'
    END AS role,
    j.created_at
  FROM public.jobs j
  LEFT JOIN public.job_matches jm ON jm.job_id = j.id
  LEFT JOIN public.contracts c ON c.job_id = j.id
  WHERE
    -- visibility
    (
      j.homeowner_id IN (SELECT id FROM ho)
      OR jm.trade_id IN (SELECT id FROM tr)
    )
    -- not completed / cancelled
    AND COALESCE(LOWER(j.stage), '') NOT IN ('completed', 'complete', 'cancelled', 'draft')
    AND COALESCE(LOWER(j.status), '') NOT IN ('completed', 'complete', 'cancelled', 'closed')
    -- contracted OR actively engaged (matches isContractedActiveJob semantics)
    AND (
      COALESCE(LOWER(j.stage), '') IN ('scheduled', 'in_progress', 'review')
      OR COALESCE(LOWER(j.status), '') IN ('in_progress', 'matched', 'active')
      OR (c.id IS NOT NULL AND COALESCE(LOWER(c.status), '') NOT IN ('draft','terminated','closed','cancelled','completed'))
    )
  ORDER BY j.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.active_projects_for_user(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.active_projects_for_user(uuid) TO authenticated;
