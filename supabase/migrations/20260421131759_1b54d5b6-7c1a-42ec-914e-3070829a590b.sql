
-- ============================================================
-- STAGE A: REPUTATION SYSTEM SCHEMA
-- ============================================================

-- ---------- 1. reviews table ----------
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  homeowner_id uuid NOT NULL REFERENCES public.homeowners(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  headline text,
  body text,
  quality_rating smallint CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating smallint CHECK (communication_rating BETWEEN 1 AND 5),
  timeliness_rating smallint CHECK (timeliness_rating BETWEEN 1 AND 5),
  value_rating smallint CHECK (value_rating BETWEEN 1 AND 5),
  would_recommend boolean,
  trade_response text,
  trade_responded_at timestamptz,
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, homeowner_id)
);

CREATE INDEX idx_reviews_trade_id ON public.reviews(trade_id);
CREATE INDEX idx_reviews_trade_created ON public.reviews(trade_id, created_at DESC);
CREATE INDEX idx_reviews_job_id ON public.reviews(job_id);

-- ---------- 2. review_followups table (append-only) ----------
CREATE TABLE public.review_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  homeowner_id uuid NOT NULL REFERENCES public.homeowners(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_followups_review_id ON public.review_followups(review_id, created_at);

-- ---------- 3. Add stat columns to trades ----------
ALTER TABLE public.trades
  ADD COLUMN completed_jobs_count integer NOT NULL DEFAULT 0,
  ADD COLUMN review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN avg_rating numeric(3,2),
  ADD COLUMN tier text NOT NULL DEFAULT 'unverified' CHECK (tier IN ('unverified','bronze','silver','gold')),
  ADD COLUMN tier_updated_at timestamptz;

CREATE INDEX idx_trades_tier ON public.trades(tier);
CREATE INDEX idx_trades_avg_rating ON public.trades(avg_rating DESC NULLS LAST);

-- ---------- 4. Validation triggers ----------

-- Validate review lengths and that the underlying job is fully completed
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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

  IF TG_OP = 'INSERT' THEN
    SELECT stage INTO job_stage FROM public.jobs WHERE id = NEW.job_id;
    IF job_stage IS DISTINCT FROM 'completed' THEN
      RAISE EXCEPTION 'Reviews can only be created on completed jobs (current stage: %)', job_stage;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_review
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review();

-- Validate followup length
CREATE OR REPLACE FUNCTION public.validate_review_followup()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF char_length(NEW.body) = 0 OR char_length(NEW.body) > 2000 THEN
    RAISE EXCEPTION 'Follow-up body must be 1-2000 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_review_followup
BEFORE INSERT ON public.review_followups
FOR EACH ROW EXECUTE FUNCTION public.validate_review_followup();

-- updated_at maintenance on reviews
CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 5. Tier + stats recompute function ----------
CREATE OR REPLACE FUNCTION public.recompute_trade_stats(_trade_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_jobs integer;
  v_review_count integer;
  v_avg_rating numeric(3,2);
  v_verified boolean;
  v_tier text;
BEGIN
  IF _trade_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT c.job_id)
  INTO v_completed_jobs
  FROM public.contracts c
  JOIN public.jobs j ON j.id = c.job_id
  WHERE c.trade_id = _trade_id
    AND j.stage = 'completed';

  SELECT COUNT(*), ROUND(AVG(rating)::numeric, 2)
  INTO v_review_count, v_avg_rating
  FROM public.reviews
  WHERE trade_id = _trade_id
    AND is_test = false;

  -- Include test reviews in average too so seeded tradesmen render correctly
  SELECT COUNT(*), ROUND(AVG(rating)::numeric, 2)
  INTO v_review_count, v_avg_rating
  FROM public.reviews
  WHERE trade_id = _trade_id;

  SELECT verified INTO v_verified FROM public.trades WHERE id = _trade_id;

  IF NOT COALESCE(v_verified, false) THEN
    v_tier := 'unverified';
  ELSIF v_completed_jobs >= 15 AND v_review_count >= 10 AND COALESCE(v_avg_rating, 0) >= 4.5 THEN
    v_tier := 'gold';
  ELSIF v_completed_jobs >= 5 AND v_review_count >= 3 AND COALESCE(v_avg_rating, 0) >= 4.0 THEN
    v_tier := 'silver';
  ELSE
    v_tier := 'bronze';
  END IF;

  UPDATE public.trades
  SET completed_jobs_count = COALESCE(v_completed_jobs, 0),
      review_count = COALESCE(v_review_count, 0),
      avg_rating = v_avg_rating,
      tier = v_tier,
      tier_updated_at = now()
  WHERE id = _trade_id;
END;
$$;

-- ---------- 6. Triggers that recompute stats ----------

-- On reviews insert/update/delete
CREATE OR REPLACE FUNCTION public.reviews_recompute_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_trade_stats(OLD.trade_id);
    RETURN OLD;
  END IF;

  PERFORM public.recompute_trade_stats(NEW.trade_id);
  IF TG_OP = 'UPDATE' AND OLD.trade_id IS DISTINCT FROM NEW.trade_id THEN
    PERFORM public.recompute_trade_stats(OLD.trade_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_recompute_trigger();

-- On project_stages: auto-flip job to 'completed' AND recompute stats
CREATE OR REPLACE FUNCTION public.project_stages_completion_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_done integer;
  v_final_confirmed boolean;
  trade_rec record;
BEGIN
  -- Only act when status or homeowner_confirmed changes
  IF (OLD.status IS NOT DISTINCT FROM NEW.status)
     AND (OLD.homeowner_confirmed IS NOT DISTINCT FROM NEW.homeowner_confirmed) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE status = 'completed'),
         BOOL_AND(homeowner_confirmed) FILTER (WHERE stage_order = (SELECT MAX(stage_order) FROM public.project_stages WHERE job_id = NEW.job_id))
  INTO v_total, v_done, v_final_confirmed
  FROM public.project_stages
  WHERE job_id = NEW.job_id;

  IF v_total > 0 AND v_done = v_total AND COALESCE(v_final_confirmed, false) THEN
    UPDATE public.jobs SET stage = 'completed' WHERE id = NEW.job_id AND stage IS DISTINCT FROM 'completed';

    -- Recompute stats for every trade contracted on this job
    FOR trade_rec IN
      SELECT DISTINCT trade_id FROM public.contracts WHERE job_id = NEW.job_id
    LOOP
      PERFORM public.recompute_trade_stats(trade_rec.trade_id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_project_stages_completion
AFTER UPDATE ON public.project_stages
FOR EACH ROW EXECUTE FUNCTION public.project_stages_completion_trigger();

-- On trades: when verified flag changes, recompute tier
CREATE OR REPLACE FUNCTION public.trades_verified_recompute_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.verified IS DISTINCT FROM NEW.verified THEN
    PERFORM public.recompute_trade_stats(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trades_verified_recompute
AFTER UPDATE OF verified ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.trades_verified_recompute_trigger();

-- ---------- 7. Restrict review UPDATE columns for trades (response only) ----------
CREATE OR REPLACE FUNCTION public.enforce_review_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  is_trade_owner boolean := false;
  is_homeowner_owner boolean := false;
BEGIN
  -- Determine caller relationship
  SELECT EXISTS (SELECT 1 FROM public.trades WHERE id = NEW.trade_id AND user_id = auth.uid()) INTO is_trade_owner;
  SELECT EXISTS (SELECT 1 FROM public.homeowners WHERE id = NEW.homeowner_id AND user_id = auth.uid()) INTO is_homeowner_owner;

  -- Admins bypass
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF is_trade_owner AND NOT is_homeowner_owner THEN
    -- Trade may only modify trade_response / trade_responded_at
    IF NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.headline IS DISTINCT FROM OLD.headline
       OR NEW.body IS DISTINCT FROM OLD.body
       OR NEW.quality_rating IS DISTINCT FROM OLD.quality_rating
       OR NEW.communication_rating IS DISTINCT FROM OLD.communication_rating
       OR NEW.timeliness_rating IS DISTINCT FROM OLD.timeliness_rating
       OR NEW.value_rating IS DISTINCT FROM OLD.value_rating
       OR NEW.would_recommend IS DISTINCT FROM OLD.would_recommend
       OR NEW.job_id IS DISTINCT FROM OLD.job_id
       OR NEW.trade_id IS DISTINCT FROM OLD.trade_id
       OR NEW.homeowner_id IS DISTINCT FROM OLD.homeowner_id
       OR NEW.is_test IS DISTINCT FROM OLD.is_test THEN
      RAISE EXCEPTION 'Tradesmen can only update their public response on a review';
    END IF;
    -- Auto-stamp response time if response changed and not set
    IF NEW.trade_response IS DISTINCT FROM OLD.trade_response AND NEW.trade_responded_at IS NULL THEN
      NEW.trade_responded_at := now();
    END IF;
  ELSIF is_homeowner_owner THEN
    -- Homeowner may not change identifiers or trade response
    IF NEW.job_id IS DISTINCT FROM OLD.job_id
       OR NEW.trade_id IS DISTINCT FROM OLD.trade_id
       OR NEW.homeowner_id IS DISTINCT FROM OLD.homeowner_id
       OR NEW.trade_response IS DISTINCT FROM OLD.trade_response
       OR NEW.trade_responded_at IS DISTINCT FROM OLD.trade_responded_at THEN
      RAISE EXCEPTION 'Homeowners cannot modify identifiers or trade response fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_review_update_scope
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_update_scope();

-- ---------- 8. RLS ----------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_followups ENABLE ROW LEVEL SECURITY;

-- Public read of non-test reviews (anon + authenticated)
CREATE POLICY "Public can read live reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_test = false);

-- Test reviews readable by admin or owning trade/homeowner
CREATE POLICY "Owners and admins can read test reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (
  is_test = true AND (
    public.has_role(auth.uid(), 'admin')
    OR trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
    OR homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  )
);

-- Homeowners insert reviews on own completed jobs
CREATE POLICY "Homeowners can create reviews on own jobs"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  AND job_id IN (
    SELECT j.id FROM public.jobs j
    WHERE j.homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  )
);

-- Homeowners can update their own review within 48h; trades can update (response only — enforced by trigger)
CREATE POLICY "Homeowners can update own reviews within 48h"
ON public.reviews FOR UPDATE
TO authenticated
USING (
  homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  AND created_at > (now() - interval '48 hours')
);

CREATE POLICY "Trades can update response on own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

-- Homeowners can delete own review within 48h
CREATE POLICY "Homeowners can delete own reviews within 48h"
ON public.reviews FOR DELETE
TO authenticated
USING (
  homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  AND created_at > (now() - interval '48 hours')
);

-- Admins manage everything
CREATE POLICY "Admins manage reviews"
ON public.reviews FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- review_followups: public read non-test
CREATE POLICY "Public can read live followups"
ON public.review_followups FOR SELECT
TO anon, authenticated
USING (is_test = false);

CREATE POLICY "Owners and admins can read test followups"
ON public.review_followups FOR SELECT
TO authenticated
USING (
  is_test = true AND (
    public.has_role(auth.uid(), 'admin')
    OR homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  )
);

-- Homeowners can append follow-ups to their own reviews
CREATE POLICY "Homeowners can append followups to own reviews"
ON public.review_followups FOR INSERT
TO authenticated
WITH CHECK (
  homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  AND review_id IN (
    SELECT id FROM public.reviews
    WHERE homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins manage followups"
ON public.review_followups FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- NOTE: Anon rate-limiting on review reads is intentionally deferred.
-- Backend lacks rate-limit primitives; revisit when proper infra exists.
