
-- Make homeowner-side fields nullable so trade can create row first
ALTER TABLE public.reviews
  ALTER COLUMN rating DROP NOT NULL;

-- Add homeowner→trader 5th dimension
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS tidiness_rating smallint,
  ADD COLUMN IF NOT EXISTS homeowner_overall numeric(3,2),
  ADD COLUMN IF NOT EXISTS homeowner_review_submitted_at timestamptz,
  -- Trader→homeowner side
  ADD COLUMN IF NOT EXISTS trade_access_rating smallint,
  ADD COLUMN IF NOT EXISTS trade_communication_rating smallint,
  ADD COLUMN IF NOT EXISTS trade_payment_rating smallint,
  ADD COLUMN IF NOT EXISTS trade_scope_rating smallint,
  ADD COLUMN IF NOT EXISTS trade_reasonable_rating smallint,
  ADD COLUMN IF NOT EXISTS trade_review_comment text,
  ADD COLUMN IF NOT EXISTS trade_overall numeric(3,2),
  ADD COLUMN IF NOT EXISTS trade_review_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Range checks for new columns
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_tidiness_check CHECK (tidiness_rating IS NULL OR (tidiness_rating BETWEEN 1 AND 5)),
  ADD CONSTRAINT reviews_trade_access_check CHECK (trade_access_rating IS NULL OR (trade_access_rating BETWEEN 1 AND 5)),
  ADD CONSTRAINT reviews_trade_comm_check CHECK (trade_communication_rating IS NULL OR (trade_communication_rating BETWEEN 1 AND 5)),
  ADD CONSTRAINT reviews_trade_payment_check CHECK (trade_payment_rating IS NULL OR (trade_payment_rating BETWEEN 1 AND 5)),
  ADD CONSTRAINT reviews_trade_scope_check CHECK (trade_scope_rating IS NULL OR (trade_scope_rating BETWEEN 1 AND 5)),
  ADD CONSTRAINT reviews_trade_reasonable_check CHECK (trade_reasonable_rating IS NULL OR (trade_reasonable_rating BETWEEN 1 AND 5));

-- Allow trades to insert reviews on matched jobs (their side)
CREATE POLICY "Trades can create reviews on matched jobs"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  AND job_id IN (
    SELECT jm.job_id FROM public.job_matches jm
    WHERE jm.trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  )
);

-- Allow trades to update their own side of the review
DROP POLICY IF EXISTS "Trades can update response on own reviews" ON public.reviews;
CREATE POLICY "Trades can update own side"
ON public.reviews FOR UPDATE
TO authenticated
USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()))
WITH CHECK (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

-- Restrict public reads to published reviews only
DROP POLICY IF EXISTS "Public can read live reviews" ON public.reviews;
CREATE POLICY "Public can read published reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_test = false AND published_at IS NOT NULL);

-- Parties can read their own (unpublished) reviews
CREATE POLICY "Parties can read own reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  OR homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
);

-- Replace enforce_review_update_scope to allow each party to update their own side
CREATE OR REPLACE FUNCTION public.enforce_review_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  is_trade_owner boolean := false;
  is_homeowner_owner boolean := false;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.trades WHERE id = NEW.trade_id AND user_id = auth.uid()) INTO is_trade_owner;
  SELECT EXISTS (SELECT 1 FROM public.homeowners WHERE id = NEW.homeowner_id AND user_id = auth.uid()) INTO is_homeowner_owner;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF is_trade_owner AND NOT is_homeowner_owner THEN
    -- Trade may only modify their side: trade_* fields and trade_response
    IF NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.headline IS DISTINCT FROM OLD.headline
       OR NEW.body IS DISTINCT FROM OLD.body
       OR NEW.workmanship_rating IS DISTINCT FROM OLD.workmanship_rating
       OR NEW.communication_rating IS DISTINCT FROM OLD.communication_rating
       OR NEW.reliability_rating IS DISTINCT FROM OLD.reliability_rating
       OR NEW.value_rating IS DISTINCT FROM OLD.value_rating
       OR NEW.tidiness_rating IS DISTINCT FROM OLD.tidiness_rating
       OR NEW.would_recommend IS DISTINCT FROM OLD.would_recommend
       OR NEW.homeowner_overall IS DISTINCT FROM OLD.homeowner_overall
       OR NEW.homeowner_review_submitted_at IS DISTINCT FROM OLD.homeowner_review_submitted_at
       OR NEW.job_id IS DISTINCT FROM OLD.job_id
       OR NEW.trade_id IS DISTINCT FROM OLD.trade_id
       OR NEW.homeowner_id IS DISTINCT FROM OLD.homeowner_id
       OR NEW.is_test IS DISTINCT FROM OLD.is_test THEN
      RAISE EXCEPTION 'Trades can only update their own side of a review';
    END IF;
    IF NEW.trade_response IS DISTINCT FROM OLD.trade_response AND NEW.trade_responded_at IS NULL THEN
      NEW.trade_responded_at := now();
    END IF;
  ELSIF is_homeowner_owner AND NOT is_trade_owner THEN
    -- Homeowner cannot modify trade side
    IF NEW.job_id IS DISTINCT FROM OLD.job_id
       OR NEW.trade_id IS DISTINCT FROM OLD.trade_id
       OR NEW.homeowner_id IS DISTINCT FROM OLD.homeowner_id
       OR NEW.trade_response IS DISTINCT FROM OLD.trade_response
       OR NEW.trade_responded_at IS DISTINCT FROM OLD.trade_responded_at
       OR NEW.trade_access_rating IS DISTINCT FROM OLD.trade_access_rating
       OR NEW.trade_communication_rating IS DISTINCT FROM OLD.trade_communication_rating
       OR NEW.trade_payment_rating IS DISTINCT FROM OLD.trade_payment_rating
       OR NEW.trade_scope_rating IS DISTINCT FROM OLD.trade_scope_rating
       OR NEW.trade_reasonable_rating IS DISTINCT FROM OLD.trade_reasonable_rating
       OR NEW.trade_review_comment IS DISTINCT FROM OLD.trade_review_comment
       OR NEW.trade_overall IS DISTINCT FROM OLD.trade_overall
       OR NEW.trade_review_submitted_at IS DISTINCT FROM OLD.trade_review_submitted_at THEN
      RAISE EXCEPTION 'Homeowners cannot modify trade-side review fields';
    END IF;
  END IF;

  -- Auto-publish when both sides submitted
  IF NEW.published_at IS NULL
     AND NEW.homeowner_review_submitted_at IS NOT NULL
     AND NEW.trade_review_submitted_at IS NOT NULL THEN
    NEW.published_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- Loosen validate_review: allow inserts before stage=completed if trade-side only,
-- and skip the rating not-null requirement (handled per-side now)
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  job_stage text;
BEGIN
  IF NEW.headline IS NOT NULL AND char_length(NEW.headline) > 120 THEN
    RAISE EXCEPTION 'Review headline must be 120 characters or fewer';
  END IF;
  IF NEW.body IS NOT NULL AND char_length(NEW.body) > 2000 THEN
    RAISE EXCEPTION 'Review body must be 2000 characters or fewer';
  END IF;
  IF NEW.trade_response IS NOT NULL AND char_length(NEW.trade_response) > 2000 THEN
    RAISE EXCEPTION 'Trade response must be 2000 characters or fewer';
  END IF;
  IF NEW.trade_review_comment IS NOT NULL AND char_length(NEW.trade_review_comment) > 2000 THEN
    RAISE EXCEPTION 'Trade review comment must be 2000 characters or fewer';
  END IF;

  -- Auto-publish on insert too
  IF NEW.published_at IS NULL
     AND NEW.homeowner_review_submitted_at IS NOT NULL
     AND NEW.trade_review_submitted_at IS NOT NULL THEN
    NEW.published_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- Helper: lookup job by ref + ensure caller is participant; returns role
CREATE OR REPLACE FUNCTION public.get_review_context(_ref text)
RETURNS TABLE (
  job_id uuid,
  homeowner_id uuid,
  trade_id uuid,
  role text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job record;
  _trade_id uuid;
  _homeowner_id uuid;
BEGIN
  SELECT j.id, j.homeowner_id INTO _job FROM public.jobs j WHERE j.ref = _ref;
  IF _job.id IS NULL THEN RETURN; END IF;

  -- Is caller the homeowner on this job?
  SELECT h.id INTO _homeowner_id FROM public.homeowners h
    WHERE h.user_id = auth.uid() AND h.id = _job.homeowner_id;

  -- Is caller a matched trade?
  SELECT t.id INTO _trade_id FROM public.trades t
    JOIN public.job_matches jm ON jm.trade_id = t.id
    WHERE t.user_id = auth.uid() AND jm.job_id = _job.id
    LIMIT 1;

  IF _homeowner_id IS NOT NULL THEN
    RETURN QUERY SELECT _job.id, _job.homeowner_id,
      (SELECT jm.trade_id FROM public.job_matches jm WHERE jm.job_id = _job.id LIMIT 1),
      'homeowner'::text;
  ELSIF _trade_id IS NOT NULL THEN
    RETURN QUERY SELECT _job.id, _job.homeowner_id, _trade_id, 'trade'::text;
  END IF;
END;
$$;
