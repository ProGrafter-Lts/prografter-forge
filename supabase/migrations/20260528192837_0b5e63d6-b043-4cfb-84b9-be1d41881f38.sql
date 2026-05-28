
-- Phase 1: Trade banding + dual verification routes

-- New columns on trades
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS band text
    CHECK (band IN ('legally_gated','scheme_preferred','competence_assessed')),
  ADD COLUMN IF NOT EXISTS verification_route text
    CHECK (verification_route IN ('registered','qualified','time_served')),
  ADD COLUMN IF NOT EXISTS years_in_trade integer,
  ADD COLUMN IF NOT EXISTS assessor_name text,
  ADD COLUMN IF NOT EXISTS assessment_notes text,
  ADD COLUMN IF NOT EXISTS assessment_evidence_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS references_called boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS site_assessment_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS competence_interview_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_probation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS probation_jobs_remaining integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS building_control_self_notify boolean NOT NULL DEFAULT false;

-- Extend allowed verification_status values (text column, no enum); document via comment.
COMMENT ON COLUMN public.trades.verification_status IS
  'One of: pending_docs, pending_verification, pending_assessment, verified, rejected (plus legacy: pending, approved).';

-- Extend doc_type whitelist on trade_verification_documents
ALTER TABLE public.trade_verification_documents
  DROP CONSTRAINT IF EXISTS trade_verification_documents_doc_type_check;
ALTER TABLE public.trade_verification_documents
  ADD CONSTRAINT trade_verification_documents_doc_type_check
  CHECK (doc_type IN ('insurance','id','qualification','years_evidence','portfolio','other'));

-- Portfolio items (time-served path)
CREATE TABLE IF NOT EXISTS public.trade_portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  area_or_address text,
  approx_date date,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_portfolio_items TO authenticated;
GRANT ALL ON public.trade_portfolio_items TO service_role;

ALTER TABLE public.trade_portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trade owns portfolio rows"
  ON public.trade_portfolio_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.trades t WHERE t.id = trade_portfolio_items.trade_id AND t.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.trades t WHERE t.id = trade_portfolio_items.trade_id AND t.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );

CREATE INDEX IF NOT EXISTS idx_trade_portfolio_items_trade ON public.trade_portfolio_items(trade_id);

-- Admin-only column guard: extend existing enforce_trade_update_scope by replacing it
CREATE OR REPLACE FUNCTION public.enforce_trade_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  is_self boolean := false;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  is_self := (OLD.user_id IS NOT NULL AND OLD.user_id = auth.uid());

  IF is_self THEN
    -- System-computed reputation
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

    -- Admin-only assessment / probation columns
    IF NEW.assessment_evidence_complete IS DISTINCT FROM OLD.assessment_evidence_complete
       OR NEW.references_called IS DISTINCT FROM OLD.references_called
       OR NEW.site_assessment_done IS DISTINCT FROM OLD.site_assessment_done
       OR NEW.competence_interview_done IS DISTINCT FROM OLD.competence_interview_done
       OR NEW.on_probation IS DISTINCT FROM OLD.on_probation
       OR NEW.probation_jobs_remaining IS DISTINCT FROM OLD.probation_jobs_remaining
       OR NEW.assessor_name IS DISTINCT FROM OLD.assessor_name
       OR NEW.assessment_notes IS DISTINCT FROM OLD.assessment_notes THEN
      RAISE EXCEPTION 'Only admins can modify assessment / probation columns';
    END IF;

    -- Trade may set verification_status only to a submission state, never to verified/rejected
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
       AND NEW.verification_status NOT IN ('pending_docs','pending_verification','pending_assessment') THEN
      RAISE EXCEPTION 'Only admins can finalise verification_status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Safety guard: cannot be verified if legally gated and missing required registration
CREATE OR REPLACE FUNCTION public.enforce_trade_verification_requirements()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.verification_status = 'verified' OR NEW.verified = true THEN
    IF NEW.band = 'legally_gated' THEN
      IF COALESCE(NEW.gas_safe_number,'') = ''
         AND COALESCE(NEW.cps_registration_number,'') = ''
         AND COALESCE(NEW.mcs_number,'') = ''
      THEN
        -- At least one gated registration must be present for legally-gated trades.
        -- (More granular per-trade-type rules are enforced in app layer.)
        RAISE EXCEPTION 'Legally-gated trade cannot be verified without a required registration number';
      END IF;
    END IF;

    -- Block time-served path for legally-gated trades
    IF NEW.band = 'legally_gated' AND NEW.verification_route = 'time_served' THEN
      RAISE EXCEPTION 'Legally-gated trades cannot use the time-served verification route';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_trade_verification_requirements ON public.trades;
CREATE TRIGGER trg_enforce_trade_verification_requirements
  BEFORE INSERT OR UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.enforce_trade_verification_requirements();

-- Admin approval RPC
CREATE OR REPLACE FUNCTION public.admin_approve_trade(_trade_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trade RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id;
  IF v_trade IS NULL THEN RAISE EXCEPTION 'Trade not found'; END IF;

  -- For time-served, require all 4 human checks
  IF v_trade.verification_route = 'time_served' THEN
    IF NOT (v_trade.assessment_evidence_complete
            AND v_trade.references_called
            AND v_trade.site_assessment_done
            AND v_trade.competence_interview_done) THEN
      RAISE EXCEPTION 'All four assessment checks must be completed before approval';
    END IF;
  END IF;

  UPDATE public.trades
  SET verified = true,
      verification_status = 'verified',
      verified_on_prografter_at = COALESCE(verified_on_prografter_at, now()),
      on_probation = (v_trade.verification_route = 'time_served'),
      probation_jobs_remaining = CASE WHEN v_trade.verification_route = 'time_served' THEN 3 ELSE 0 END
  WHERE id = _trade_id;

  RETURN jsonb_build_object('ok', true, 'trade_id', _trade_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_trade(uuid) TO authenticated;

-- Probation decrement on job completion
CREATE OR REPLACE FUNCTION public.decrement_probation_on_job_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trade_id uuid;
BEGIN
  IF NEW.stage = 'completed' AND COALESCE(OLD.stage,'') <> 'completed' THEN
    FOR v_trade_id IN
      SELECT DISTINCT c.trade_id FROM public.contracts c WHERE c.job_id = NEW.id
    LOOP
      UPDATE public.trades
      SET probation_jobs_remaining = GREATEST(0, probation_jobs_remaining - 1),
          on_probation = CASE WHEN GREATEST(0, probation_jobs_remaining - 1) = 0 THEN false ELSE on_probation END
      WHERE id = v_trade_id AND on_probation = true;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_probation_on_job_complete ON public.jobs;
CREATE TRIGGER trg_decrement_probation_on_job_complete
  AFTER UPDATE OF stage ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.decrement_probation_on_job_complete();
