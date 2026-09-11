-- The guard trigger only exempted service_role, but sign_variation is
-- SECURITY DEFINER and still reports auth.role() = 'authenticated', so every
-- legitimate signature was rejected. Use a transaction-local flag set inside
-- sign_variation instead.

CREATE OR REPLACE FUNCTION public.guard_contract_variation_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role'
     OR coalesce(current_setting('app.signing_variation', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.activated_at IS DISTINCT FROM OLD.activated_at
     OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
     OR NEW.homeowner_signed_at IS DISTINCT FROM OLD.homeowner_signed_at
     OR NEW.homeowner_signature_hash IS DISTINCT FROM OLD.homeowner_signature_hash
     OR NEW.trade_signed_at IS DISTINCT FROM OLD.trade_signed_at
     OR NEW.trade_signature_hash IS DISTINCT FROM OLD.trade_signature_hash THEN
    RAISE EXCEPTION 'Variation signing state can only be changed via the sign_variation process';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sign_variation(_variation_id uuid, _signature_hash text, _accept boolean DEFAULT true, _rejection_reason text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  PERFORM set_config('app.signing_variation', 'on', true);

  IF NOT _accept THEN
    UPDATE public.contract_variations
    SET status = 'rejected', rejected_at = v_now, rejection_reason = _rejection_reason
    WHERE id = _variation_id;

    INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, actor_role, payload)
    VALUES (v_contract.id, 'variation_rejected', v_caller, v_role,
            jsonb_build_object('variation_id', _variation_id, 'reason', _rejection_reason));

    PERFORM set_config('app.signing_variation', 'off', true);
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

  PERFORM set_config('app.signing_variation', 'off', true);
  RETURN jsonb_build_object('status', CASE WHEN v_both THEN 'accepted' ELSE 'pending' END, 'both_signed', v_both);
END;
$function$;