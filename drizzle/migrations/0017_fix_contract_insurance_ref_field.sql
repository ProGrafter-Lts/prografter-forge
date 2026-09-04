CREATE OR REPLACE FUNCTION public.create_contract_for_quote_internal(_quote_id uuid, _actor uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_quote RECORD;
  v_job RECORD;
  v_homeowner RECORD;
  v_trade RECORD;
  v_trade_email text;
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
  SELECT * INTO v_quote FROM public.quotes WHERE id = _quote_id;
  IF v_quote IS NULL THEN RAISE EXCEPTION 'Quote not found'; END IF;

  SELECT id INTO v_existing FROM public.contracts WHERE quote_id = _quote_id;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_quote.job_id;
  IF v_job IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;

  SELECT * INTO v_homeowner FROM public.homeowners WHERE id = v_job.homeowner_id;
  IF v_homeowner IS NULL THEN RAISE EXCEPTION 'Homeowner not found'; END IF;

  SELECT * INTO v_trade FROM public.trades WHERE id = v_quote.trade_id;
  IF v_trade IS NULL THEN RAISE EXCEPTION 'Trade not found'; END IF;

  SELECT email INTO v_trade_email FROM auth.users WHERE id = v_trade.user_id;

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
    jsonb_build_object('sequence', 1, 'description', 'Commencement payment (25%)',
      'amount_pence', ROUND(v_total_incl_pence * 0.25)::integer, 'trigger_event', 'project_start'),
    jsonb_build_object('sequence', 2, 'description', 'Practical completion (50%)',
      'amount_pence', ROUND(v_total_incl_pence * 0.50)::integer, 'trigger_event', 'practical_completion'),
    jsonb_build_object('sequence', 3, 'description', 'Final payment (25%)',
      'amount_pence', v_total_incl_pence - ROUND(v_total_incl_pence * 0.25)::integer - ROUND(v_total_incl_pence * 0.50)::integer,
      'trigger_event', 'snagging_signoff')
  );

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

  v_milestone_table := '';
  FOR v_m IN SELECT * FROM jsonb_array_elements(v_milestones)
  LOOP
    v_milestone_table := v_milestone_table
      || (v_m->>'sequence') || '. ' || (v_m->>'description') || ' — £'
      || to_char((v_m->>'amount_pence')::integer / 100.0, 'FM999G999G990D00') || E'\n';
  END LOOP;

  v_rendered := v_template.legal_text;
  v_rendered := replace(v_rendered, '{{homeowner_name}}',     COALESCE(v_homeowner.name, ''));
  v_rendered := replace(v_rendered, '{{homeowner_email}}',    COALESCE(v_homeowner.email, ''));
  v_rendered := replace(v_rendered, '{{homeowner_address}}',  COALESCE(v_job.address, '') || ', ' || COALESCE(v_job.postcode, ''));
  v_rendered := replace(v_rendered, '{{trade_business_name}}',COALESCE(v_trade.company_name, ''));
  v_rendered := replace(v_rendered, '{{trade_name}}',         COALESCE(v_trade.name, ''));
  v_rendered := replace(v_rendered, '{{trade_email}}',        COALESCE(v_trade_email, ''));
  v_rendered := replace(v_rendered, '{{trade_companies_house}}', COALESCE(v_trade.companies_house_number, ''));
  v_rendered := replace(v_rendered, '{{trade_insurance_ref}}', COALESCE(v_trade.public_liability_insurer, ''));
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

  UPDATE public.contracts SET rendered_legal_text = v_rendered WHERE id = v_contract_id;

  v_hash := public.compute_contract_hash(v_contract_id);
  UPDATE public.contracts SET full_text_hash = v_hash WHERE id = v_contract_id;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
  VALUES (v_contract_id, 'generated', _actor,
          CASE WHEN _actor IS NULL THEN 'system' ELSE 'homeowner' END,
          jsonb_build_object('quote_id', _quote_id, 'template_version', v_template.version,
                             'full_text_hash', v_hash));

  RETURN v_contract_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_contract_for_quote(_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_quote RECORD;
  v_job RECORD;
  v_homeowner RECORD;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_quote FROM public.quotes WHERE id = _quote_id;
  IF v_quote IS NULL THEN RAISE EXCEPTION 'Quote not found'; END IF;
  SELECT * INTO v_job FROM public.jobs WHERE id = v_quote.job_id;
  IF v_job IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;
  SELECT * INTO v_homeowner FROM public.homeowners WHERE id = v_job.homeowner_id;
  IF v_homeowner IS NULL THEN RAISE EXCEPTION 'Homeowner not found'; END IF;
  IF v_homeowner.user_id <> v_caller AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Only the homeowner can accept the quote';
  END IF;
  RETURN public.create_contract_for_quote_internal(_quote_id, v_caller);
END;
$function$;