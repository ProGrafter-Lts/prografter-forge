-- =====================================================================
-- PHASE 1 — Contract tamper-evidence + lifecycle reconciliation
-- =====================================================================

-- 1. New columns on contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS rendered_legal_text TEXT,
  ADD COLUMN IF NOT EXISTS full_text_hash      TEXT,
  ADD COLUMN IF NOT EXISTS template_version    TEXT;

-- 2. Status check constraint: add awaiting_signatures + pending_completion_acceptance
--    Migrate any rows currently using 'pending_signatures' -> 'awaiting_signatures'
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;

UPDATE public.contracts
SET status = 'awaiting_signatures'
WHERE status = 'pending_signatures';

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_status_check
  CHECK (status = ANY (ARRAY[
    'draft',
    'awaiting_signatures',
    'active',
    'pending_completion_acceptance',
    'completed',
    'terminated',
    'closed'
  ]));

-- 3. Feature flag on contract_templates
ALTER TABLE public.contract_templates
  ADD COLUMN IF NOT EXISTS signing_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Backfill template_version on any existing contracts so the column is
--    populated for tamper checks.
UPDATE public.contracts c
SET template_version = ct.version
FROM public.contract_templates ct
WHERE c.template_id = ct.id
  AND c.template_version IS NULL;

-- =====================================================================
-- 5. Helper: compute the tamper fingerprint
-- =====================================================================
CREATE OR REPLACE FUNCTION public.compute_contract_hash(_contract_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v RECORD;
  v_canonical text;
BEGIN
  SELECT * INTO v FROM public.contracts WHERE id = _contract_id;
  IF v IS NULL THEN RETURN NULL; END IF;

  -- Canonical serialization: rendered text + key Layer 2 fields, in fixed order.
  -- Any change to these fields after signing will produce a different hash.
  v_canonical :=
       COALESCE(v.rendered_legal_text, '')
    || '|' || COALESCE(v.template_version, '')
    || '|' || COALESCE(v.scope_of_works, '')
    || '|' || COALESCE(v.total_value_incl_vat_pence::text, '')
    || '|' || COALESCE(v.total_value_excl_vat_pence::text, '')
    || '|' || COALESCE(v.payment_milestones::text, '')
    || '|' || COALESCE(v.homeowner_snapshot::text, '')
    || '|' || COALESCE(v.trade_snapshot::text, '')
    || '|' || COALESCE(v.property_address::text, '')
    || '|' || COALESCE(v.estimated_start_date::text, '')
    || '|' || COALESCE(v.estimated_completion_date::text, '')
    || '|' || COALESCE(v.homeowner_bespoke_terms, '')
    || '|' || COALESCE(v.trade_bespoke_terms, '');

  RETURN encode(extensions.digest(v_canonical, 'sha256'), 'hex');
END;
$$;

-- =====================================================================
-- 6. Replace generate_contract_for_quote to render legal text + hash
-- =====================================================================
CREATE OR REPLACE FUNCTION public.generate_contract_for_quote(_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  v_rendered text;
  v_hash text;
  v_milestone_table text;
  v_m jsonb;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE id = _quote_id;
  IF v_quote IS NULL THEN RAISE EXCEPTION 'Quote not found'; END IF;

  SELECT id INTO v_existing FROM public.contracts WHERE quote_id = _quote_id;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_quote.job_id;
  IF v_job IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;

  SELECT * INTO v_homeowner FROM public.homeowners WHERE id = v_job.homeowner_id;
  IF v_homeowner IS NULL THEN RAISE EXCEPTION 'Homeowner not found'; END IF;

  IF v_homeowner.user_id <> v_caller THEN
    RAISE EXCEPTION 'Only the homeowner can accept the quote';
  END IF;

  SELECT * INTO v_trade FROM public.trades WHERE id = v_quote.trade_id;
  IF v_trade IS NULL THEN RAISE EXCEPTION 'Trade not found'; END IF;

  SELECT * INTO v_template
  FROM public.contract_templates
  WHERE status = 'active'
    AND (effective_from IS NULL OR effective_from <= NOW())
    AND superseded_at IS NULL
  ORDER BY effective_from DESC NULLS LAST
  LIMIT 1;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'No active contract template available';
  END IF;

  v_total_incl_pence := ROUND(COALESCE(
    CASE
      WHEN v_quote.tier_enabled AND v_quote.selected_tier = 'budget' THEN v_quote.budget_price
      WHEN v_quote.tier_enabled AND v_quote.selected_tier = 'premium' THEN v_quote.premium_price
      WHEN v_quote.tier_enabled AND v_quote.selected_tier = 'standard' THEN v_quote.standard_price
      ELSE v_quote.amount
    END
  , v_quote.amount) * 100)::integer;

  v_total_excl_pence := ROUND(v_total_incl_pence::numeric / 1.20)::integer;

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
      'amount_pence', v_total_incl_pence
                      - ROUND(v_total_incl_pence * 0.25)::integer
                      - ROUND(v_total_incl_pence * 0.50)::integer,
      'trigger_event', 'snagging_signoff'
    )
  );

  -- Insert the contract (status starts as awaiting_signatures)
  INSERT INTO public.contracts (
    job_id, quote_id, homeowner_id, trade_id, template_id, template_version, status,
    homeowner_snapshot, trade_snapshot, property_address,
    scope_of_works, total_value_excl_vat_pence, total_value_incl_vat_pence,
    payment_milestones, applicable_standards, required_certificates
  ) VALUES (
    v_job.id, v_quote.id, v_homeowner.id, v_trade.id, v_template.id, v_template.version, 'awaiting_signatures',
    jsonb_build_object('id', v_homeowner.id, 'name', v_homeowner.name, 'email', v_homeowner.email,
                       'phone', v_homeowner.phone, 'snapshot_at', NOW()),
    jsonb_build_object('id', v_trade.id, 'name', v_trade.name, 'company_name', v_trade.company_name,
                       'phone', v_trade.phone, 'trade_type', v_trade.trade_type,
                       'verified', v_trade.verified, 'snapshot_at', NOW()),
    jsonb_build_object('address', v_job.address, 'postcode', v_job.postcode),
    COALESCE(NULLIF(v_job.description, ''), v_job.job_type),
    v_total_excl_pence, v_total_incl_pence,
    v_milestones,
    CASE WHEN v_job.is_green_job THEN ARRAY['MCS','Part_P'] ELSE ARRAY[]::text[] END,
    CASE WHEN v_job.is_green_job THEN ARRAY['MCS_install_certificate'] ELSE ARRAY[]::text[] END
  ) RETURNING id INTO v_contract_id;

  -- Build a plain-text milestones table for the {{payment_milestones_table}} placeholder
  v_milestone_table := '';
  FOR v_m IN SELECT * FROM jsonb_array_elements(v_milestones)
  LOOP
    v_milestone_table := v_milestone_table
      || (v_m->>'sequence') || '. '
      || (v_m->>'description') || ' — £'
      || to_char((v_m->>'amount_pence')::integer / 100.0, 'FM999G999G990D00')
      || E'\n';
  END LOOP;

  -- Render placeholders into legal_text
  v_rendered := v_template.legal_text;
  v_rendered := replace(v_rendered, '{{homeowner_name}}',     COALESCE(v_homeowner.name, ''));
  v_rendered := replace(v_rendered, '{{homeowner_email}}',    COALESCE(v_homeowner.email, ''));
  v_rendered := replace(v_rendered, '{{homeowner_address}}',  COALESCE(v_job.address, '') || ', ' || COALESCE(v_job.postcode, ''));
  v_rendered := replace(v_rendered, '{{trade_business_name}}',COALESCE(v_trade.company_name, ''));
  v_rendered := replace(v_rendered, '{{trade_name}}',         COALESCE(v_trade.name, ''));
  v_rendered := replace(v_rendered, '{{trade_email}}',        COALESCE(v_trade.email, ''));
  v_rendered := replace(v_rendered, '{{trade_companies_house}}', COALESCE(v_trade.companies_house_number, ''));
  v_rendered := replace(v_rendered, '{{trade_insurance_ref}}',COALESCE(v_trade.insurance_reference, ''));
  v_rendered := replace(v_rendered, '{{property_address}}',   COALESCE(v_job.address, '') || ', ' || COALESCE(v_job.postcode, ''));
  v_rendered := replace(v_rendered, '{{scope_summary}}',      COALESCE(NULLIF(v_job.description, ''), v_job.job_type));
  v_rendered := replace(v_rendered, '{{contract_value}}',     '£' || to_char(v_total_incl_pence / 100.0, 'FM999G999G990D00'));
  v_rendered := replace(v_rendered, '{{contract_value_words}}', '');
  v_rendered := replace(v_rendered, '{{start_date}}',         COALESCE(v_job.estimated_start_date::text, 'TBC'));
  v_rendered := replace(v_rendered, '{{completion_date}}',    COALESCE(v_job.estimated_completion_date::text, 'TBC'));
  v_rendered := replace(v_rendered, '{{payment_milestones_table}}', v_milestone_table);
  v_rendered := replace(v_rendered, '{{contract_id}}',        v_contract_id::text);
  v_rendered := replace(v_rendered, '{{contract_date}}',      to_char(NOW(), 'DD Mon YYYY'));
  v_rendered := replace(v_rendered, '{{template_version}}',   v_template.version);

  -- Persist rendered text first (needed for hash computation)
  UPDATE public.contracts
  SET rendered_legal_text = v_rendered
  WHERE id = v_contract_id;

  -- Compute and store the tamper fingerprint
  v_hash := public.compute_contract_hash(v_contract_id);
  UPDATE public.contracts
  SET full_text_hash = v_hash
  WHERE id = v_contract_id;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
  VALUES (v_contract_id, 'generated', v_caller, 'homeowner',
          jsonb_build_object('quote_id', _quote_id, 'template_version', v_template.version,
                             'full_text_hash', v_hash));

  RETURN v_contract_id;
END;
$function$;

-- =====================================================================
-- 7. Tighten sign_contract — verify hash before allowing signature.
--    Re-hash AFTER signing isn't required because the canonical fields
--    aren't signature columns — the hash represents the document itself.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.sign_contract(_contract_id uuid, _signature_hash text, _ip inet DEFAULT NULL::inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_contract RECORD;
  v_role text;
  v_homeowner_user uuid;
  v_trade_user uuid;
  v_now timestamptz := NOW();
  v_both_signed boolean := false;
  v_recomputed_hash text;
  v_template RECORD;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _signature_hash IS NULL OR length(_signature_hash) < 32 THEN
    RAISE EXCEPTION 'Invalid signature hash';
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.status NOT IN ('awaiting_signatures','draft','pending_signatures') THEN
    RAISE EXCEPTION 'Contract status % does not allow signing', v_contract.status;
  END IF;

  -- Feature-flag enforcement: signing must be enabled on the template
  SELECT * INTO v_template FROM public.contract_templates WHERE id = v_contract.template_id;
  IF v_template IS NULL OR NOT COALESCE(v_template.signing_enabled, false) THEN
    RAISE EXCEPTION 'Contract template is under final legal review — signing is not yet enabled';
  END IF;

  -- Tamper check: recompute and compare
  IF v_contract.full_text_hash IS NOT NULL THEN
    v_recomputed_hash := public.compute_contract_hash(_contract_id);
    IF v_recomputed_hash IS DISTINCT FROM v_contract.full_text_hash THEN
      INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
      VALUES (_contract_id, 'tamper_detected', v_caller, NULL,
              jsonb_build_object('expected', v_contract.full_text_hash, 'recomputed', v_recomputed_hash, 'context', 'sign_contract'));
      RAISE EXCEPTION 'Contract integrity check failed — please refresh and try again';
    END IF;
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

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  v_both_signed := v_contract.homeowner_signed_at IS NOT NULL
                AND v_contract.trade_signed_at IS NOT NULL;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, actor_ip, payload)
  VALUES (_contract_id, 'signed', v_caller, v_role, _ip,
          jsonb_build_object('signature_hash', _signature_hash, 'full_text_hash', v_contract.full_text_hash));

  IF v_both_signed AND v_contract.status IN ('awaiting_signatures','pending_signatures') THEN
    UPDATE public.contracts
    SET status = 'active', activated_at = v_now
    WHERE id = _contract_id;

    UPDATE public.jobs SET stage = 'in_progress'
    WHERE id = v_contract.job_id AND stage IN ('enquiry','quoting','scheduled');

    INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, payload)
    VALUES (_contract_id, 'activated', v_caller,
            jsonb_build_object('activated_at', v_now));
  END IF;

  RETURN jsonb_build_object(
    'role', v_role,
    'both_signed', v_both_signed,
    'status', CASE WHEN v_both_signed THEN 'active' ELSE 'awaiting_signatures' END
  );
END;
$function$;

-- =====================================================================
-- 8. Public RPC: verify_contract_integrity — called from the contract page
-- =====================================================================
CREATE OR REPLACE FUNCTION public.verify_contract_integrity(_contract_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_contract RECORD;
  v_homeowner_user uuid;
  v_trade_user uuid;
  v_recomputed text;
  v_role text;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;

  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;

  IF v_caller = v_homeowner_user THEN v_role := 'homeowner';
  ELSIF v_caller = v_trade_user THEN v_role := 'trade';
  ELSE RAISE EXCEPTION 'Caller is not a party to this contract';
  END IF;

  IF v_contract.full_text_hash IS NULL THEN
    RETURN jsonb_build_object('verified', true, 'reason', 'no_hash_yet');
  END IF;

  v_recomputed := public.compute_contract_hash(_contract_id);

  IF v_recomputed IS DISTINCT FROM v_contract.full_text_hash THEN
    INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
    VALUES (_contract_id, 'tamper_detected', v_caller, v_role,
            jsonb_build_object('expected', v_contract.full_text_hash, 'recomputed', v_recomputed, 'context', 'page_load'));
    RETURN jsonb_build_object('verified', false, 'expected', v_contract.full_text_hash, 'recomputed', v_recomputed);
  END IF;

  RETURN jsonb_build_object('verified', true);
END;
$function$;

-- =====================================================================
-- 9. Update placeholder template — supersede old, insert pre-launch one
-- =====================================================================
UPDATE public.contract_templates
SET status = 'superseded', superseded_at = NOW()
WHERE version = '2026.04-placeholder';

INSERT INTO public.contract_templates (
  version, status, effective_from, legal_text, plain_english_summary,
  guidance_notes, drafted_by, signing_enabled
) VALUES (
  'placeholder-pre-launch',
  'active',
  NOW(),
  E'# CONSTRUCTION CONTRACT (PLACEHOLDER — UNDER LEGAL REVIEW)\n\n'
  || 'Reference: {{contract_id}}  |  Dated: {{contract_date}}  |  Template: {{template_version}}\n\n'
  || 'Between **{{homeowner_name}}** ("Homeowner") of {{homeowner_address}}\n'
  || 'and **{{trade_business_name}}** trading as {{trade_name}} ("Contractor"), Companies House: {{trade_companies_house}}, Insurance ref: {{trade_insurance_ref}}.\n\n'
  || E'## 1. Scope of Works\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. {{scope_summary}} Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.\n\n'
  || E'## 2. Contract Sum and Payment\n\nThe Contract Sum is {{contract_value}}. Payment shall be made according to the following schedule:\n\n{{payment_milestones_table}}\n\n'
  || E'## 3. Programme and Completion\n\nWorks shall commence on {{start_date}} and reach Practical Completion by {{completion_date}}. Lorem ipsum.\n\n'
  || E'## 4. Variations\n\nAny change to the Scope shall be agreed in writing through the Variations procedure on the ProGrafter platform. Lorem ipsum.\n\n'
  || E'## 5. Defects Liability\n\nThe Defects Liability Period shall be twelve (12) months from Practical Completion. Lorem ipsum.\n\n'
  || E'## 6. Insurance and Liability\n\nThe Contractor warrants that public liability insurance is in force throughout. Lorem ipsum.\n\n'
  || E'## 7. Termination and Disputes\n\nEither party may terminate for material breach. Lorem ipsum.\n\n'
  || E'---\n\n_This is a placeholder template. Final legal text is being drafted by a UK construction solicitor and is not yet approved for signing._\n',
  E'## Plain English Summary\n\nThis is a contract between you (the Homeowner) and the Contractor. In plain words:\n\n1. **Scope** — what the Contractor has agreed to do.\n2. **Money** — how much you''ll pay and when (split across milestones).\n3. **Timing** — when the work starts and when it should finish.\n4. **Changes** — if either of you needs to change the job, you do it through Variations.\n5. **Defects** — if something goes wrong in the first 12 months after completion, the Contractor will fix it.\n6. **Insurance** — the Contractor must be insured the whole time.\n7. **Ending early** — what happens if either of you needs to walk away.\n\n_The full legal text is currently being finalised by a solicitor and signing is disabled until that''s done._',
  '{}'::jsonb,
  'pre-launch-placeholder',
  FALSE
);

-- Backfill the version column on any contracts pointing at the old template
UPDATE public.contracts c
SET template_version = ct.version
FROM public.contract_templates ct
WHERE c.template_id = ct.id
  AND c.template_version IS NULL;
