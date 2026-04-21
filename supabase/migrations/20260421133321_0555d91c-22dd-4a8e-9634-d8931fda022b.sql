-- 1. Rename sub-rating columns to UK-trade vocabulary
ALTER TABLE public.reviews RENAME COLUMN quality_rating TO workmanship_rating;
ALTER TABLE public.reviews RENAME COLUMN timeliness_rating TO reliability_rating;

COMMENT ON COLUMN public.reviews.workmanship_rating IS 'Optional 1-5. NULL = deliberately skipped by homeowner (do NOT derive from overall rating).';
COMMENT ON COLUMN public.reviews.reliability_rating IS 'Optional 1-5. NULL = deliberately skipped.';
COMMENT ON COLUMN public.reviews.communication_rating IS 'Optional 1-5. NULL = deliberately skipped.';
COMMENT ON COLUMN public.reviews.value_rating IS 'Optional 1-5. NULL = deliberately skipped.';

-- 2. Update enforce_review_update_scope trigger function to use new column names
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
    -- Trade may only modify trade_response / trade_responded_at
    IF NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.headline IS DISTINCT FROM OLD.headline
       OR NEW.body IS DISTINCT FROM OLD.body
       OR NEW.workmanship_rating IS DISTINCT FROM OLD.workmanship_rating
       OR NEW.communication_rating IS DISTINCT FROM OLD.communication_rating
       OR NEW.reliability_rating IS DISTINCT FROM OLD.reliability_rating
       OR NEW.value_rating IS DISTINCT FROM OLD.value_rating
       OR NEW.would_recommend IS DISTINCT FROM OLD.would_recommend
       OR NEW.job_id IS DISTINCT FROM OLD.job_id
       OR NEW.trade_id IS DISTINCT FROM OLD.trade_id
       OR NEW.homeowner_id IS DISTINCT FROM OLD.homeowner_id
       OR NEW.is_test IS DISTINCT FROM OLD.is_test THEN
      RAISE EXCEPTION 'Tradesmen can only update their public response on a review';
    END IF;
    IF NEW.trade_response IS DISTINCT FROM OLD.trade_response AND NEW.trade_responded_at IS NULL THEN
      NEW.trade_responded_at := now();
    END IF;
  ELSIF is_homeowner_owner THEN
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
$function$;

-- 3. Column-scope guard trigger on trades: prevent self-edit of system/admin columns
CREATE OR REPLACE FUNCTION public.enforce_trade_update_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  is_self boolean := false;
BEGIN
  -- Admins bypass
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Service role bypass (used by recompute triggers, edge functions)
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  is_self := (OLD.user_id IS NOT NULL AND OLD.user_id = auth.uid());

  IF is_self THEN
    -- System-computed columns (managed by recompute_trade_stats)
    IF NEW.completed_jobs_count IS DISTINCT FROM OLD.completed_jobs_count
       OR NEW.review_count IS DISTINCT FROM OLD.review_count
       OR NEW.avg_rating IS DISTINCT FROM OLD.avg_rating
       OR NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.tier_updated_at IS DISTINCT FROM OLD.tier_updated_at THEN
      RAISE EXCEPTION 'Tradesmen cannot modify system-computed reputation columns';
    END IF;

    -- Admin-verified columns
    IF NEW.verified IS DISTINCT FROM OLD.verified
       OR NEW.mcs_verified IS DISTINCT FROM OLD.mcs_verified
       OR NEW.trustmark_verified IS DISTINCT FROM OLD.trustmark_verified
       OR NEW.is_test IS DISTINCT FROM OLD.is_test
       OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Tradesmen cannot modify admin-verified columns';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_trade_update_scope ON public.trades;
CREATE TRIGGER trg_enforce_trade_update_scope
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.enforce_trade_update_scope();

-- 4. TODO marker comments on public review-read policies
COMMENT ON POLICY "Public can read live reviews" ON public.reviews IS
  'TODO (rate-limiting): Anon reads are open by design to support future public profile pages without RLS refactor. Add IP/edge-function rate-limiting once general infra exists.';
COMMENT ON POLICY "Public can read live followups" ON public.review_followups IS
  'TODO (rate-limiting): Anon reads open. Same rationale as reviews.';