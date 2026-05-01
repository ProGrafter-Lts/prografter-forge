-- 1. reference column
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS reference text;

-- 2. uniqueness once populated
CREATE UNIQUE INDEX IF NOT EXISTS contracts_reference_key
  ON public.contracts (reference) WHERE reference IS NOT NULL;

-- 3. generator
CREATE OR REPLACE FUNCTION public.generate_contract_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_next int;
  v_ref text;
BEGIN
  -- count contracts whose reference starts with PG-<year>- and add 1
  SELECT COALESCE(MAX( (split_part(reference, '-', 3))::int ), 0) + 1
  INTO v_next
  FROM public.contracts
  WHERE reference LIKE 'PG-' || v_year || '-%';

  v_ref := 'PG-' || v_year || '-' || lpad(v_next::text, 4, '0');
  RETURN v_ref;
END;
$$;

-- 4. trigger to auto-fill reference on insert
CREATE OR REPLACE FUNCTION public.set_contract_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := public.generate_contract_reference();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_contract_reference ON public.contracts;
CREATE TRIGGER trg_set_contract_reference
BEFORE INSERT ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.set_contract_reference();

-- 5. backfill existing rows (oldest first, sequenced per year)
DO $$
DECLARE
  r RECORD;
  v_year text;
  v_counts jsonb := '{}'::jsonb;
  v_next int;
BEGIN
  FOR r IN
    SELECT id, created_at
    FROM public.contracts
    WHERE reference IS NULL
    ORDER BY created_at ASC
  LOOP
    v_year := to_char(r.created_at, 'YYYY');
    v_next := COALESCE((v_counts->>v_year)::int, 0) + 1;
    v_counts := v_counts || jsonb_build_object(v_year, v_next);
    UPDATE public.contracts
    SET reference = 'PG-' || v_year || '-' || lpad(v_next::text, 4, '0')
    WHERE id = r.id;
  END LOOP;
END $$;

-- 6. audit hook for email sends
CREATE OR REPLACE FUNCTION public.log_contract_email_sent(
  _contract_id uuid,
  _email_type text,
  _recipient_email text,
  _recipient_role text
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
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = _contract_id;
  IF v_contract IS NULL THEN RETURN; END IF;

  SELECT user_id INTO v_homeowner_user FROM public.homeowners WHERE id = v_contract.homeowner_id;
  SELECT user_id INTO v_trade_user FROM public.trades WHERE id = v_contract.trade_id;

  -- Only parties to the contract can log an email-sent audit row for it
  IF v_caller <> v_homeowner_user AND v_caller <> v_trade_user THEN
    RAISE EXCEPTION 'Caller is not a party to this contract';
  END IF;

  INSERT INTO public.contract_events (contract_id, event_type, actor_user_id, payload)
  VALUES (_contract_id, 'email_sent', v_caller,
          jsonb_build_object(
            'email_type', _email_type,
            'recipient_email', _recipient_email,
            'recipient_role', _recipient_role,
            'sent_at', now()
          ));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_contract_email_sent(uuid, text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.log_contract_email_sent(uuid, text, text, text) TO authenticated;