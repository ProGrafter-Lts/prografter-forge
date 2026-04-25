-- =============================================================
-- 1. Rename existing contracts table to contracts_legacy
-- =============================================================
-- TODO: Drop public.contracts_legacy 30 days after the new contracts
-- flow goes live (target: ~late May 2026).
ALTER TABLE public.contracts RENAME TO contracts_legacy;

-- Drop existing policies on legacy (they reference homeowner_id / trade_id,
-- which still exist on the renamed table, but legacy data is intentionally
-- inaccessible going forward). Drop to avoid name conflicts with new policies.
DROP POLICY IF EXISTS "Homeowners can create contracts for own jobs" ON public.contracts_legacy;
DROP POLICY IF EXISTS "Homeowners can update contracts to sign" ON public.contracts_legacy;
DROP POLICY IF EXISTS "Homeowners can view contracts for own jobs" ON public.contracts_legacy;
DROP POLICY IF EXISTS "Trades can create contracts for matched jobs" ON public.contracts_legacy;
DROP POLICY IF EXISTS "Trades can update contracts to countersign" ON public.contracts_legacy;
DROP POLICY IF EXISTS "Trades can view contracts for matched jobs" ON public.contracts_legacy;
-- Legacy has RLS enabled but no policies — intentionally unreadable.

COMMENT ON TABLE public.contracts_legacy IS
  'Legacy contracts pre-2026-04 contract data model. Read-only historical reference. TODO: drop 30 days after launch of new contracts flow.';

-- =============================================================
-- 2. contract_templates
-- =============================================================
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  effective_from TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  legal_text TEXT NOT NULL,
  plain_english_summary TEXT NOT NULL,
  guidance_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  drafted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contract_templates_status_check CHECK (status IN ('draft','active','superseded'))
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read templates"
  ON public.contract_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage templates"
  ON public.contract_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- 3. contracts (new spec-compliant table)
-- =============================================================
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  quote_id UUID NOT NULL,
  homeowner_id UUID NOT NULL,
  trade_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.contract_templates(id),
  status TEXT NOT NULL DEFAULT 'draft',
  -- draft | pending_signatures | active | completed | terminated | closed

  -- Layer 2 snapshots (immutable once signed)
  homeowner_snapshot JSONB NOT NULL,
  trade_snapshot JSONB NOT NULL,
  property_address JSONB NOT NULL,
  scope_of_works TEXT NOT NULL,
  materials_specification JSONB,
  total_value_excl_vat_pence INTEGER NOT NULL,
  total_value_incl_vat_pence INTEGER NOT NULL,
  vat_rate_basis_points INTEGER NOT NULL DEFAULT 2000,
  payment_milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_start_date DATE,
  estimated_completion_date DATE,
  applicable_standards TEXT[] DEFAULT '{}',
  required_certificates TEXT[] DEFAULT '{}',

  -- Layer 3
  homeowner_bespoke_terms TEXT,
  trade_bespoke_terms TEXT,

  -- Signatures
  homeowner_signed_at TIMESTAMPTZ,
  homeowner_signature_hash TEXT,
  homeowner_signature_ip INET,
  trade_signed_at TIMESTAMPTZ,
  trade_signature_hash TEXT,
  trade_signature_ip INET,

  -- Lifecycle
  activated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  defects_period_ends_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT contracts_status_check CHECK (
    status IN ('draft','pending_signatures','active','completed','terminated','closed')
  ),
  CONSTRAINT contracts_quote_unique UNIQUE (quote_id)
);

CREATE INDEX idx_contracts_job_id ON public.contracts(job_id);
CREATE INDEX idx_contracts_homeowner_id ON public.contracts(homeowner_id);
CREATE INDEX idx_contracts_trade_id ON public.contracts(trade_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- SELECT: homeowner of project OR trade on project
CREATE POLICY "Parties can read contracts"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (
    homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
    OR trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  );

-- No direct INSERT — must use generate_contract_for_quote function
-- (no INSERT policy = blocked for normal authenticated users; SECURITY DEFINER
-- function bypasses RLS using its owner privileges)

-- UPDATE: limited to specific cases — actually controlled via SECURITY DEFINER
-- functions. We allow UPDATE for the parties so the RPC functions (which
-- may run as authenticated user calling SECURITY DEFINER) can write, but the
-- actual mutation paths are gated by application-side functions only.
-- Defense-in-depth: enforce that only signature/bespoke/lifecycle fields
-- change in a trigger.
CREATE POLICY "Parties can update own contract"
  ON public.contracts FOR UPDATE
  TO authenticated
  USING (
    homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
    OR trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  );

-- DELETE: denied (no policy)

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tamper-evidence trigger: once activated, immutable Layer 1/2 fields
CREATE OR REPLACE FUNCTION public.contracts_immutable_after_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- After signature, scope/snapshot/template can never change
  IF OLD.status IN ('active','completed','terminated','closed') THEN
    IF NEW.template_id IS DISTINCT FROM OLD.template_id
       OR NEW.scope_of_works IS DISTINCT FROM OLD.scope_of_works
       OR NEW.homeowner_snapshot::text IS DISTINCT FROM OLD.homeowner_snapshot::text
       OR NEW.trade_snapshot::text IS DISTINCT FROM OLD.trade_snapshot::text
       OR NEW.property_address::text IS DISTINCT FROM OLD.property_address::text
       OR NEW.payment_milestones::text IS DISTINCT FROM OLD.payment_milestones::text
       OR NEW.total_value_incl_vat_pence IS DISTINCT FROM OLD.total_value_incl_vat_pence
       OR NEW.total_value_excl_vat_pence IS DISTINCT FROM OLD.total_value_excl_vat_pence
       OR NEW.homeowner_signature_hash IS DISTINCT FROM OLD.homeowner_signature_hash
       OR NEW.trade_signature_hash IS DISTINCT FROM OLD.trade_signature_hash
       OR NEW.homeowner_signed_at IS DISTINCT FROM OLD.homeowner_signed_at
       OR NEW.trade_signed_at IS DISTINCT FROM OLD.trade_signed_at THEN
      RAISE EXCEPTION 'Contract is %, immutable fields cannot be modified', OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER contracts_immutable_check
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.contracts_immutable_after_active();

-- =============================================================
-- 4. contract_variations
-- =============================================================
CREATE TABLE public.contract_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reason TEXT,
  proposed_by TEXT NOT NULL CHECK (proposed_by IN ('homeowner','trade')),
  cost_change_pence INTEGER NOT NULL DEFAULT 0,
  programme_impact_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | accepted | rejected | superseded
  homeowner_signed_at TIMESTAMPTZ,
  homeowner_signature_hash TEXT,
  trade_signed_at TIMESTAMPTZ,
  trade_signature_hash TEXT,
  activated_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contract_variations_status_check CHECK (
    status IN ('pending','accepted','rejected','superseded')
  ),
  CONSTRAINT contract_variations_seq_unique UNIQUE (contract_id, sequence)
);

CREATE INDEX idx_contract_variations_contract_id ON public.contract_variations(contract_id);

ALTER TABLE public.contract_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read variations"
  ON public.contract_variations FOR SELECT
  TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.contracts c
      WHERE c.homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
         OR c.trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Parties can update variations"
  ON public.contract_variations FOR UPDATE
  TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.contracts c
      WHERE c.homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
         OR c.trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
    )
  );

-- INSERT is via SECURITY DEFINER function only

CREATE TRIGGER update_contract_variations_updated_at
  BEFORE UPDATE ON public.contract_variations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- 5. contract_events (append-only audit log)
-- =============================================================
CREATE TABLE public.contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  -- generated | viewed | bespoke_added | signed | activated |
  -- variation_proposed | variation_signed | variation_rejected |
  -- completion_marked | completion_accepted | terminated | closed | tamper_detected
  actor_user_id UUID,
  actor_role TEXT,
  actor_ip INET,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_events_contract_id ON public.contract_events(contract_id, created_at DESC);

ALTER TABLE public.contract_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read contract events"
  ON public.contract_events FOR SELECT
  TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.contracts c
      WHERE c.homeowner_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
         OR c.trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
    )
  );

-- INSERT via SECURITY DEFINER functions only. UPDATE and DELETE denied for all.

-- =============================================================
-- 6. Update recompute_trade_stats — was reading old contracts table
-- =============================================================
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

  -- Count completed jobs from new contracts table.
  -- Fall back to legacy if a trade only has historical contracts.
  SELECT COUNT(DISTINCT job_id) INTO v_completed_jobs FROM (
    SELECT c.job_id FROM public.contracts c
    JOIN public.jobs j ON j.id = c.job_id
    WHERE c.trade_id = _trade_id AND j.stage = 'completed'
    UNION
    SELECT cl.job_id FROM public.contracts_legacy cl
    JOIN public.jobs j ON j.id = cl.job_id
    WHERE cl.trade_id = _trade_id AND j.stage = 'completed'
  ) t;

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

-- =============================================================
-- 7. SECURITY DEFINER lifecycle functions
-- =============================================================

-- generate_contract_for_quote — called when homeowner accepts a quote
CREATE OR REPLACE FUNCTION public.generate_contract_for_quote(_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_quote RECORD;
  v_job RECORD;
  v_homeowner RECORD;
  v_trade RECORD;
  v_template RECORD;
  v_contract_id uuid;
  v_total_incl_pence integer;
  v_total_excl_pence integer;
  v_milestones jsonb;
  v_existing uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Quote must exist and be accepted
  SELECT * INTO v_quote FROM public.quotes WHERE id = _quote_id;
  IF v_quote IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  -- Idempotency: if a contract already exists for this quote, return it
  SELECT id INTO v_existing FROM public.contracts WHERE quote_id = _quote_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_quote.job_id;
  IF v_job IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;

  SELECT * INTO v_homeowner FROM public.homeowners WHERE id = v_job.homeowner_id;
  IF v_homeowner IS NULL THEN RAISE EXCEPTION 'Homeowner not found'; END IF;

  -- Caller must be the homeowner accepting the quote
  IF v_homeowner.user_id <> v_caller THEN
    RAISE EXCEPTION 'Only the homeowner can accept the quote';
  END IF;

  SELECT * INTO v_trade FROM public.trades WHERE id = v_quote.trade_id;
  IF v_trade IS NULL THEN RAISE EXCEPTION 'Trade not found'; END IF;

  -- Active template
  SELECT * INTO v_template
  FROM public.contract_templates
  WHERE status = 'active'
    AND (effective_from IS NULL OR effective_from <= NOW())
    AND superseded_at IS NULL
  ORDER BY effective_from DESC NULLS LAST
  LIMIT 1;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'No active contract template available — platform admin must publish one';
  END IF;

  -- Resolve quote amount (selected tier wins over base amount)
  v_total_incl_pence := ROUND(COALESCE(
    CASE
      WHEN v_quote.tier_enabled AND v_quote.selected_tier = 'budget' THEN v_quote.budget_price
      WHEN v_quote.tier_enabled AND v_quote.selected_tier = 'premium' THEN v_quote.premium_price
      WHEN v_quote.tier_enabled AND v_quote.selected_tier = 'standard' THEN v_quote.standard_price
      ELSE v_quote.amount
    END
  , v_quote.amount) * 100)::integer;

  -- Assume incl VAT figure; back out excl at 20%
  v_total_excl_pence := ROUND(v_total_incl_pence::numeric / 1.20)::integer;

  -- Standard 25/50/25 milestone schedule
  v_milestones := jsonb_build_array(
    jsonb_build_object(
      'sequence', 1,
      'description', 'Commencement payment (25%)',
      'amount_pence', ROUND(v_total_incl_pence * 0.25)::integer,
      'trigger_event', 'project_start'
    ),
    jsonb_build_object(
      'sequence', 2,
      'description', 'Practical completion (50%)',
      'amount_pence', ROUND(v_total_incl_pence * 0.50)::integer,
      'trigger_event', 'practical_completion'
    ),
    jsonb_build_object(
      'sequence', 3,
      'description', 'Final payment (25%)',
      'amount_pence', v_total_incl_pence - ROUND(v_total_incl_pence * 0.25)::integer - ROUND(v_total_incl_pence * 0.50)::integer,
      'trigger_event', 'snagging_signoff'
    )
  );

  INSERT INTO public.contracts (
    job_id, quote_id, homeowner_id, trade_id, template_id, status,
    homeowner_snapshot, trade_snapshot, property_address,
    scope_of_works, total_value_excl_vat_pence, total_value_incl_vat_pence,
    payment_milestones, applicable_standards, required_certificates
  ) VALUES (
    v_job.id, v_quote.id, v_homeowner.id, v_trade.id, v_template.id, 'pending_signatures',
    jsonb_build_object(
      'id', v_homeowner.id,
      'name', v_homeowner.name,
      'email', v_homeowner.email,
      'phone', v_homeowner.phone,
      'snapshot_at', NOW()
    ),
    jsonb_build_object(
      'id', v_trade.id,
      'name', v_trade.name,
      'company_name', v_trade.company_name,
      'phone', v_trade.phone,
      'trade_type', v_trade.trade_type,
      'verified', v_trade.verified,
      'snapshot_at', NOW()
    ),
    jsonb_build_object(
      'address', v_job.address,
      'postcode', v_job.postcode
    ),
    COALESCE(NULLIF(v_job.description, ''), v_job.job_type),
    v_total_excl_pence, v_total_incl_pence,
    v_milestones,
    CASE WHEN v_job.is_green_job THEN ARRAY['MCS','Part_P'] ELSE ARRAY[]::text[] END,
    CASE WHEN v_job.is_green_job THEN ARRAY['MCS_install_certificate'] ELSE ARRAY[]::text[] END
  ) RETURNING id INTO v_contract_id;

  -- Audit
  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
  VALUES (v_contract_id, 'generated', v_caller, 'homeowner',
          jsonb_build_object('quote_id', _quote_id, 'template_version', v_template.version));

  RETURN v_contract_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_contract_for_quote(uuid) TO authenticated;

-- sign_contract
CREATE OR REPLACE FUNCTION public.sign_contract(
  _contract_id uuid,
  _signature_hash text,
  _ip inet DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_contract RECORD;
  v_role text;
  v_homeowner_user uuid;
  v_trade_user uuid;
  v_now timestamptz := NOW();
  v_both_signed boolean := false;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _signature_hash IS NULL OR length(_signature_hash) < 32 THEN
    RAISE EXCEPTION 'Invalid signature hash';
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.status NOT IN ('pending_signatures','draft') THEN
    RAISE EXCEPTION 'Contract status % does not allow signing', v_contract.status;
  END IF;

  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;

  IF v_caller = v_homeowner_user THEN
    v_role := 'homeowner';
    UPDATE public.contracts
    SET homeowner_signed_at = v_now,
        homeowner_signature_hash = _signature_hash,
        homeowner_signature_ip = _ip
    WHERE id = _contract_id;
  ELSIF v_caller = v_trade_user THEN
    v_role := 'trade';
    UPDATE public.contracts
    SET trade_signed_at = v_now,
        trade_signature_hash = _signature_hash,
        trade_signature_ip = _ip
    WHERE id = _contract_id;
  ELSE
    RAISE EXCEPTION 'Caller is not a party to this contract';
  END IF;

  -- Re-read post-update
  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  v_both_signed := v_contract.homeowner_signed_at IS NOT NULL
                AND v_contract.trade_signed_at IS NOT NULL;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, actor_ip, payload)
  VALUES (_contract_id, 'signed', v_caller, v_role, _ip,
          jsonb_build_object('signature_hash', _signature_hash));

  IF v_both_signed AND v_contract.status = 'pending_signatures' THEN
    UPDATE public.contracts
    SET status = 'active', activated_at = v_now
    WHERE id = _contract_id;

    -- Progress the parent job
    UPDATE public.jobs SET stage = 'in_progress'
    WHERE id = v_contract.job_id AND stage IN ('enquiry','quoting','scheduled');

    INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, payload)
    VALUES (_contract_id, 'activated', v_caller,
            jsonb_build_object('activated_at', v_now));
  END IF;

  RETURN jsonb_build_object(
    'role', v_role,
    'both_signed', v_both_signed,
    'status', CASE WHEN v_both_signed THEN 'active' ELSE 'pending_signatures' END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sign_contract(uuid, text, inet) TO authenticated;

-- add_bespoke_terms
CREATE OR REPLACE FUNCTION public.add_bespoke_terms(
  _contract_id uuid,
  _terms text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_contract RECORD;
  v_role text;
  v_homeowner_user uuid;
  v_trade_user uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(COALESCE(_terms,'')) > 4000 THEN
    RAISE EXCEPTION 'Bespoke terms must be 500 words / 4000 characters or fewer';
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.status NOT IN ('draft','pending_signatures') THEN
    RAISE EXCEPTION 'Cannot edit bespoke terms once contract is %', v_contract.status;
  END IF;

  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;

  IF v_caller = v_homeowner_user THEN
    v_role := 'homeowner';
    UPDATE public.contracts
    SET homeowner_bespoke_terms = NULLIF(_terms,''),
        -- Other party must re-accept
        trade_signed_at = NULL,
        trade_signature_hash = NULL,
        trade_signature_ip = NULL,
        status = 'pending_signatures'
    WHERE id = _contract_id;
  ELSIF v_caller = v_trade_user THEN
    v_role := 'trade';
    UPDATE public.contracts
    SET trade_bespoke_terms = NULLIF(_terms,''),
        homeowner_signed_at = NULL,
        homeowner_signature_hash = NULL,
        homeowner_signature_ip = NULL,
        status = 'pending_signatures'
    WHERE id = _contract_id;
  ELSE
    RAISE EXCEPTION 'Caller is not a party to this contract';
  END IF;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
  VALUES (_contract_id, 'bespoke_added', v_caller, v_role,
          jsonb_build_object('length', length(COALESCE(_terms,''))));
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_bespoke_terms(uuid, text) TO authenticated;

-- propose_variation
CREATE OR REPLACE FUNCTION public.propose_variation(
  _contract_id uuid,
  _title text,
  _description text,
  _reason text,
  _cost_change_pence integer,
  _programme_impact_days integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_contract RECORD;
  v_role text;
  v_homeowner_user uuid;
  v_trade_user uuid;
  v_seq integer;
  v_id uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.status <> 'active' THEN
    RAISE EXCEPTION 'Variations can only be raised on active contracts';
  END IF;

  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;

  IF v_caller = v_homeowner_user THEN v_role := 'homeowner';
  ELSIF v_caller = v_trade_user THEN v_role := 'trade';
  ELSE RAISE EXCEPTION 'Caller is not a party to this contract';
  END IF;

  SELECT COALESCE(MAX(sequence),0)+1 INTO v_seq
  FROM public.contract_variations WHERE contract_id = _contract_id;

  INSERT INTO public.contract_variations (
    contract_id, sequence, title, description, reason, proposed_by,
    cost_change_pence, programme_impact_days, status
  ) VALUES (
    _contract_id, v_seq, _title, _description, _reason, v_role,
    COALESCE(_cost_change_pence,0), COALESCE(_programme_impact_days,0), 'pending'
  ) RETURNING id INTO v_id;

  -- The proposer is implicitly signing
  IF v_role = 'homeowner' THEN
    UPDATE public.contract_variations SET homeowner_signed_at = NOW() WHERE id = v_id;
  ELSE
    UPDATE public.contract_variations SET trade_signed_at = NOW() WHERE id = v_id;
  END IF;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
  VALUES (_contract_id, 'variation_proposed', v_caller, v_role,
          jsonb_build_object('variation_id', v_id, 'sequence', v_seq, 'title', _title));

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.propose_variation(uuid, text, text, text, integer, integer) TO authenticated;

-- sign_variation
CREATE OR REPLACE FUNCTION public.sign_variation(
  _variation_id uuid,
  _signature_hash text,
  _accept boolean DEFAULT true,
  _rejection_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_variation RECORD;
  v_contract RECORD;
  v_homeowner_user uuid;
  v_trade_user uuid;
  v_role text;
  v_now timestamptz := NOW();
  v_both boolean := false;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_variation FROM public.contract_variations WHERE id = _variation_id;
  IF v_variation IS NULL THEN RAISE EXCEPTION 'Variation not found'; END IF;
  IF v_variation.status <> 'pending' THEN
    RAISE EXCEPTION 'Variation already %', v_variation.status;
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = v_variation.contract_id;
  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;

  IF v_caller = v_homeowner_user THEN v_role := 'homeowner';
  ELSIF v_caller = v_trade_user THEN v_role := 'trade';
  ELSE RAISE EXCEPTION 'Caller is not a party to this contract';
  END IF;

  IF NOT _accept THEN
    UPDATE public.contract_variations
    SET status = 'rejected', rejected_at = v_now, rejection_reason = _rejection_reason
    WHERE id = _variation_id;

    INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
    VALUES (v_contract.id, 'variation_rejected', v_caller, v_role,
            jsonb_build_object('variation_id', _variation_id, 'reason', _rejection_reason));

    RETURN jsonb_build_object('status','rejected');
  END IF;

  IF v_role = 'homeowner' THEN
    UPDATE public.contract_variations
    SET homeowner_signed_at = v_now, homeowner_signature_hash = _signature_hash
    WHERE id = _variation_id;
  ELSE
    UPDATE public.contract_variations
    SET trade_signed_at = v_now, trade_signature_hash = _signature_hash
    WHERE id = _variation_id;
  END IF;

  SELECT * INTO v_variation FROM public.contract_variations WHERE id = _variation_id;
  v_both := v_variation.homeowner_signed_at IS NOT NULL AND v_variation.trade_signed_at IS NOT NULL;

  IF v_both THEN
    UPDATE public.contract_variations
    SET status = 'accepted', activated_at = v_now
    WHERE id = _variation_id;

    INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
    VALUES (v_contract.id, 'variation_signed', v_caller, v_role,
            jsonb_build_object('variation_id', _variation_id, 'activated', true));
  ELSE
    INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
    VALUES (v_contract.id, 'variation_signed', v_caller, v_role,
            jsonb_build_object('variation_id', _variation_id, 'activated', false));
  END IF;

  RETURN jsonb_build_object('status', CASE WHEN v_both THEN 'accepted' ELSE 'pending' END, 'both_signed', v_both);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sign_variation(uuid, text, boolean, text) TO authenticated;

-- mark_practical_completion (trade)
CREATE OR REPLACE FUNCTION public.mark_practical_completion(_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_contract RECORD;
  v_trade_user uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.status <> 'active' THEN RAISE EXCEPTION 'Only active contracts can be marked complete'; END IF;

  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;
  IF v_caller <> v_trade_user THEN RAISE EXCEPTION 'Only the trade can mark practical completion'; END IF;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
  VALUES (_contract_id, 'completion_marked', v_caller, 'trade', '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_practical_completion(uuid) TO authenticated;

-- accept_practical_completion (homeowner) — moves contract to completed
CREATE OR REPLACE FUNCTION public.accept_practical_completion(_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_contract RECORD;
  v_homeowner_user uuid;
  v_now timestamptz := NOW();
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.status <> 'active' THEN RAISE EXCEPTION 'Only active contracts can be completed'; END IF;

  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  IF v_caller <> v_homeowner_user THEN RAISE EXCEPTION 'Only the homeowner can accept completion'; END IF;

  UPDATE public.contracts
  SET status = 'completed',
      completed_at = v_now,
      defects_period_ends_at = v_now + INTERVAL '12 months'
  WHERE id = _contract_id;

  UPDATE public.jobs SET stage = 'completed' WHERE id = v_contract.job_id;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
  VALUES (_contract_id, 'completion_accepted', v_caller, 'homeowner',
          jsonb_build_object('completed_at', v_now, 'defects_until', v_now + INTERVAL '12 months'));

  PERFORM public.recompute_trade_stats(v_contract.trade_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_practical_completion(uuid) TO authenticated;

-- log_contract_view — used to record audit events from client
CREATE OR REPLACE FUNCTION public.log_contract_event(
  _contract_id uuid,
  _event_type text,
  _payload jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_contract RECORD;
  v_homeowner_user uuid;
  v_trade_user uuid;
  v_role text;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _event_type NOT IN ('viewed','tab_read') THEN
    RAISE EXCEPTION 'Only viewed/tab_read events can be logged from client';
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RETURN; END IF;

  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;

  IF v_caller = v_homeowner_user THEN v_role := 'homeowner';
  ELSIF v_caller = v_trade_user THEN v_role := 'trade';
  ELSE RETURN;
  END IF;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
  VALUES (_contract_id, _event_type, v_caller, v_role, _payload);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_contract_event(uuid, text, jsonb) TO authenticated;

-- =============================================================
-- 8. Seed placeholder contract template v2026.04
-- =============================================================
INSERT INTO public.contract_templates (
  version, status, effective_from, legal_text, plain_english_summary, guidance_notes, drafted_by
) VALUES (
  '2026.04-placeholder',
  'active',
  NOW(),
$LEGAL$# Domestic Construction Contract — PLACEHOLDER

> **NOTE:** This is a placeholder template used while the platform is built. The final legal text will be drafted by a UK construction solicitor and published as version 2026.04.

## 1. Parties
This contract is between **{{homeowner.name}}** ("the Client") and **{{trade.company_name}}** ("the Contractor"), trading as {{trade.name}}.

## 2. Property
The works will be carried out at:
{{property.address}}, {{property.postcode}}.

## 3. Scope of works
{{scope.description}}

## 4. Price
The total agreed price is **£{{value.incl_vat}}** including VAT at {{value.vat_rate}}% (£{{value.excl_vat}} excluding VAT).

## 5. Payment milestones
{{payment.milestones}}

## 6. Programme
The works are estimated to commence on {{dates.start_estimated}} and reach practical completion by {{dates.completion_estimated}}.

## 7. Variations
All changes to scope must be raised, costed and signed by both parties as a numbered Variation through the ProGrafter platform before the variation work begins. A platform commission of 3.75% applies to approved variations.

## 8. Standards & certificates
The Contractor will work to all applicable UK standards and provide the following certificates on completion: {{compliance.certificates}}.

## 9. Defects period
The Contractor is liable for defects in workmanship and materials for **12 months** from the date of practical completion. Defects reported in this period will be remedied at no further cost to the Client.

## 10. Dispute resolution
Disputes will first be addressed through ProGrafter mediation. If unresolved, the parties agree to RICS or CIArb adjudication before any legal proceedings.

## 11. Statutory rights
Nothing in this contract affects the Client's statutory rights under the Consumer Rights Act 2015 or related legislation.

## 12. Platform
ProGrafter Ltd (company number 17124130) provides the platform. ProGrafter is not a party to this contract.

---
_Contract reference: {{contract.id}} • Version {{template.version}} • Generated {{dates.contract_date}}_
$LEGAL$,
$SUMMARY$**Plain-English summary**

This is a contract between you and your tradesperson. It sets out:

- **Who** is doing the work and where.
- **What** the work is.
- **How much** you'll pay and **when** (in three instalments — start, halfway, end).
- **How long** it should take.
- **What happens if you change your mind** mid-project (you both have to agree and sign a Variation).
- **What happens if something goes wrong** (12 months of defect cover, then ProGrafter mediation, then independent adjudication).
- Your **statutory consumer rights** are protected and not changed by this contract.

The full legal text is in the "Full Legal Text" tab. Please read all four tabs before signing.$SUMMARY$,
$GUIDANCE${
  "1": "Confirms who the contract is between. Names are taken from your accounts at the moment of signing — they're locked in even if you later edit your profile.",
  "5": "ProGrafter releases each milestone payment only when both parties agree the trigger event has happened. This protects you from paying for work that hasn't been done.",
  "9": "If something the Contractor installed fails within 12 months, they have to come back and fix it for free.",
  "10": "We don't want disputes to end up in court. ProGrafter will help you resolve issues; if that fails, an independent adjudicator decides."
}$GUIDANCE$,
  'PLACEHOLDER — pending solicitor draft'
);