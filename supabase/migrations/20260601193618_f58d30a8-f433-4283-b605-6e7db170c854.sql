CREATE OR REPLACE FUNCTION public.guard_contract_variation_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Service role (used by SECURITY DEFINER sign_variation) may change anything
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block direct changes to signing/state columns by ordinary callers.
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

DROP TRIGGER IF EXISTS guard_contract_variation_update ON public.contract_variations;

CREATE TRIGGER guard_contract_variation_update
BEFORE UPDATE ON public.contract_variations
FOR EACH ROW
EXECUTE FUNCTION public.guard_contract_variation_update();