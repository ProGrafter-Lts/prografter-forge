
-- 1. Contracts: prevent cross-party signature tampering
CREATE OR REPLACE FUNCTION public.enforce_contract_signature_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_homeowner_user uuid;
  v_trade_user uuid;
  v_caller uuid := auth.uid();
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(v_caller, 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = NEW.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = NEW.trade_id;

  -- Trade attempting to change homeowner signature fields
  IF v_caller = v_trade_user AND v_caller IS DISTINCT FROM v_homeowner_user THEN
    IF NEW.homeowner_signed_at      IS DISTINCT FROM OLD.homeowner_signed_at
    OR NEW.homeowner_signature_hash IS DISTINCT FROM OLD.homeowner_signature_hash
    OR NEW.homeowner_signature_ip   IS DISTINCT FROM OLD.homeowner_signature_ip THEN
      RAISE EXCEPTION 'Trade cannot modify homeowner signature fields';
    END IF;
  END IF;

  -- Homeowner attempting to change trade signature fields
  IF v_caller = v_homeowner_user AND v_caller IS DISTINCT FROM v_trade_user THEN
    IF NEW.trade_signed_at      IS DISTINCT FROM OLD.trade_signed_at
    OR NEW.trade_signature_hash IS DISTINCT FROM OLD.trade_signature_hash
    OR NEW.trade_signature_ip   IS DISTINCT FROM OLD.trade_signature_ip THEN
      RAISE EXCEPTION 'Homeowner cannot modify trade signature fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_contract_signature_scope ON public.contracts;
CREATE TRIGGER enforce_contract_signature_scope
BEFORE UPDATE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.enforce_contract_signature_scope();

-- 2. Contract variations: same protection
CREATE OR REPLACE FUNCTION public.enforce_variation_signature_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_contract RECORD;
  v_homeowner_user uuid;
  v_trade_user uuid;
  v_caller uuid := auth.uid();
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(v_caller, 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = NEW.contract_id;
  IF v_contract IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;

  IF v_caller = v_trade_user AND v_caller IS DISTINCT FROM v_homeowner_user THEN
    IF NEW.homeowner_signed_at      IS DISTINCT FROM OLD.homeowner_signed_at
    OR NEW.homeowner_signature_hash IS DISTINCT FROM OLD.homeowner_signature_hash THEN
      RAISE EXCEPTION 'Trade cannot modify homeowner variation signature fields';
    END IF;
  END IF;

  IF v_caller = v_homeowner_user AND v_caller IS DISTINCT FROM v_trade_user THEN
    IF NEW.trade_signed_at      IS DISTINCT FROM OLD.trade_signed_at
    OR NEW.trade_signature_hash IS DISTINCT FROM OLD.trade_signature_hash THEN
      RAISE EXCEPTION 'Homeowner cannot modify trade variation signature fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_variation_signature_scope ON public.contract_variations;
CREATE TRIGGER enforce_variation_signature_scope
BEFORE UPDATE ON public.contract_variations
FOR EACH ROW EXECUTE FUNCTION public.enforce_variation_signature_scope();

-- 3. Tighten homeowner<->trade relationship: only accepted quotes or contracts
CREATE OR REPLACE FUNCTION public.homeowner_has_relationship_with_trade(_user_id uuid, _trade_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quotes q
    JOIN public.jobs j  ON j.id = q.job_id
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE q.trade_id = _trade_id
      AND h.user_id  = _user_id
      AND q.status = 'accepted'
  )
  OR EXISTS (
    SELECT 1
    FROM public.contracts c
    JOIN public.homeowners h ON h.id = c.homeowner_id
    WHERE c.trade_id = _trade_id
      AND h.user_id  = _user_id
      AND c.status IN ('awaiting_signatures','pending_signatures','active','completed')
  );
$$;

-- 4. Storage: remove permissive quote-pdfs upload policy
DROP POLICY IF EXISTS "Anyone can upload a quote PDF" ON storage.objects;

-- 5. Review followups: hide homeowner_id from public and require published parent review
DROP POLICY IF EXISTS "Public can read live followups" ON public.review_followups;
CREATE POLICY "Public can read live followups"
ON public.review_followups
FOR SELECT
USING (
  is_test = false
  AND EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_followups.review_id
      AND r.published_at IS NOT NULL
  )
);

REVOKE SELECT (homeowner_id) ON public.review_followups FROM anon, authenticated;
