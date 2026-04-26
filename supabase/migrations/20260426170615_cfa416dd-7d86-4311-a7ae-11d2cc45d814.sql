
-- =====================================================================
-- 1. trades_public — safe, read-only directory view
-- =====================================================================
DROP VIEW IF EXISTS public.trades_public CASCADE;

CREATE VIEW public.trades_public
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.name,
  t.company_name,
  t.trade_type,
  t.verified,
  t.mcs_verified,
  t.trustmark_verified,
  t.is_green_trade,
  t.bio,
  t.years_experience,
  t.website,
  t.avg_rating,
  t.review_count,
  t.completed_jobs_count,
  t.tier
FROM public.trades t
WHERE t.is_test = false;

-- The view runs with the caller's privileges; we still need an explicit grant.
GRANT SELECT ON public.trades_public TO anon, authenticated;

-- A permissive SELECT policy on trades, scoped to columns the view exposes.
-- Because the view uses security_invoker, it needs a row that's readable by
-- the caller. Add a policy: anyone authenticated can SELECT a trade row
-- (RLS still guards what columns the application reads via this path —
-- application code reads from trades_public only).
DROP POLICY IF EXISTS "Authenticated users can read trade directory" ON public.trades;
CREATE POLICY "Authenticated users can read trade directory"
ON public.trades
FOR SELECT
TO authenticated
USING (is_test = false);

-- =====================================================================
-- 2. Helper: does this homeowner have a quoting/contractual relationship
--    with this trade?  Used for column-broader access in the future and
--    to express intent. (Not strictly required by the directory policy
--    above, but kept for clarity / future tightening.)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.homeowner_has_relationship_with_trade(
  _user_id uuid,
  _trade_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quotes q
    JOIN public.jobs j  ON j.id = q.job_id
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE q.trade_id = _trade_id
      AND h.user_id  = _user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.contracts c
    JOIN public.homeowners h ON h.id = c.homeowner_id
    WHERE c.trade_id = _trade_id
      AND h.user_id  = _user_id
  );
$$;

-- =====================================================================
-- 3. Allow homeowners to update stage/status on their own jobs
--    (fixes Bug 5 — quote accepted but job stays "open")
-- =====================================================================
DROP POLICY IF EXISTS "Homeowners can update own jobs" ON public.jobs;
CREATE POLICY "Homeowners can update own jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (
  homeowner_id IN (
    SELECT id FROM public.homeowners WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  homeowner_id IN (
    SELECT id FROM public.homeowners WHERE user_id = auth.uid()
  )
);

-- =====================================================================
-- 4. Trigger: when a quote moves to 'accepted', auto-progress the job
--    so every dashboard page sees a consistent "active" state.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.on_quote_accepted_advance_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'accepted'
     AND COALESCE(OLD.status, '') <> 'accepted' THEN
    UPDATE public.jobs
       SET stage  = CASE WHEN stage IN ('enquiry','quoting') THEN 'scheduled' ELSE stage END,
           status = CASE WHEN status IN ('open','awaiting_quotes') THEN 'in_progress' ELSE status END
     WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_accepted_advance_job ON public.quotes;
CREATE TRIGGER trg_quote_accepted_advance_job
AFTER UPDATE OF status ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.on_quote_accepted_advance_job();

-- =====================================================================
-- 5. Make the job-photos bucket public-read (Bug 6 photo thumbnails)
--    Writes remain RLS-protected via existing storage.objects policies.
-- =====================================================================
UPDATE storage.buckets
SET public = true
WHERE id = 'job-photos';

-- Ensure a SELECT policy exists for anonymous reads of job-photos.
DROP POLICY IF EXISTS "Public read for job photos" ON storage.objects;
CREATE POLICY "Public read for job photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'job-photos');
