-- Trigger function: called AFTER INSERT on contract_events.
-- For events that should drive an email, post to the dispatcher edge function
-- using the email_queue_service_role_key already stored in Vault by setup_email_infra.
CREATE OR REPLACE FUNCTION public.dispatch_contract_event_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
  v_dispatch_url text;
  v_payload jsonb;
  v_event text;
  v_variation_id text;
  v_variation_status text;
  v_contract_status text;
BEGIN
  -- Only act on events we want to email about
  v_event := NEW.event_type;
  IF v_event NOT IN (
    'generated','signed','activated',
    'variation_proposed','variation_signed',
    'completion_marked','completion_accepted'
  ) THEN
    RETURN NEW;
  END IF;

  -- Resolve URL + service role key from environment / vault
  -- pg_net is available in extensions schema; vault.decrypted_secrets stores keys
  BEGIN
    SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets
    WHERE name = 'email_queue_service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- Vault read failure: silently no-op rather than block contract write
    RAISE NOTICE 'dispatch_contract_event_email: vault read failed: %', SQLERRM;
    RETURN NEW;
  END;

  IF v_service_key IS NULL THEN
    RAISE NOTICE 'dispatch_contract_event_email: email_queue_service_role_key not in vault';
    RETURN NEW;
  END IF;

  -- The supabase URL — we know the project ref. setup_email_infra also stores
  -- it indirectly, but the simplest approach is current_setting if present.
  v_supabase_url := 'https://xryinqaxjclcmhebdcex.supabase.co';
  v_dispatch_url := v_supabase_url || '/functions/v1/contract-email-dispatcher';

  -- Map raw event_type -> dispatcher event
  -- 'signed' may or may not also produce an 'activated' event right after
  -- (both are inserted by sign_contract). To avoid double sends:
  --   - For 'signed' we send the partial-signature email (the dispatcher
  --     looks at the contract row to see if both signed; if so it skips).
  --   - For 'activated' we send the activation email to both parties.
  -- 'variation_signed' only triggers the approval email when both parties have
  -- signed (status becomes 'accepted' in contract_variations).
  v_variation_id := NULL;
  IF v_event IN ('variation_proposed','variation_signed') THEN
    v_variation_id := NEW.payload->>'variation_id';

    IF v_event = 'variation_signed' THEN
      -- Only fire the "approved" email when activation actually happened
      IF (NEW.payload->>'activated')::boolean IS NOT TRUE THEN
        RETURN NEW;
      END IF;
    END IF;
  END IF;

  -- Translate event types to dispatcher event names
  DECLARE v_dispatch_event text;
  BEGIN
    v_dispatch_event := CASE v_event
      WHEN 'signed' THEN 'signed_partial'
      WHEN 'variation_signed' THEN 'variation_approved'
      ELSE v_event
    END;

    -- For 'signed' partial: skip if the contract is already active (the
    -- 'activated' event will handle that case).
    IF v_event = 'signed' THEN
      SELECT status INTO v_contract_status FROM public.contracts WHERE id = NEW.contract_id;
      IF v_contract_status = 'active' THEN
        RETURN NEW;
      END IF;
    END IF;

    v_payload := jsonb_build_object(
      'contract_id', NEW.contract_id,
      'event_type', v_dispatch_event,
      'variation_id', v_variation_id
    );

    -- Fire-and-forget HTTP POST. pg_net runs async so this won't block.
    PERFORM extensions.http_post(
      url := v_dispatch_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := v_payload,
      timeout_milliseconds := 5000
    );
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the originating transaction on email dispatch failure
  RAISE NOTICE 'dispatch_contract_event_email error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_contract_event_email ON public.contract_events;
CREATE TRIGGER trg_dispatch_contract_event_email
AFTER INSERT ON public.contract_events
FOR EACH ROW EXECUTE FUNCTION public.dispatch_contract_event_email();