
-- Private bucket for signed contract PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Helper: caller is party to the contract whose id matches the first folder segment
CREATE OR REPLACE FUNCTION public.user_is_contract_party(_user_id uuid, _contract_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contracts c
    LEFT JOIN public.homeowners h ON h.id = c.homeowner_id
    LEFT JOIN public.trades t ON t.id = c.trade_id
    WHERE c.id = _contract_id
      AND (h.user_id = _user_id OR t.user_id = _user_id)
  )
$$;

-- Read policy: only parties (or admins) may read PDFs in their contract folder
DROP POLICY IF EXISTS "Contract parties can read their contract PDFs" ON storage.objects;
CREATE POLICY "Contract parties can read their contract PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.user_is_contract_party(
      auth.uid(),
      NULLIF((storage.foldername(name))[1], '')::uuid
    )
  )
);

-- No INSERT/UPDATE/DELETE policies for authenticated users — only service_role
-- (used by the contract-pdf-snapshot edge function) writes to this bucket.

-- Trigger: enqueue PDF generation when activation or variation acceptance happens
CREATE OR REPLACE FUNCTION public.dispatch_contract_pdf_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_service_key text;
  v_url text := 'https://xryinqaxjclcmhebdcex.supabase.co/functions/v1/contract-pdf-snapshot';
  v_event text := NEW.event_type;
  v_payload jsonb;
BEGIN
  IF v_event NOT IN ('activated', 'variation_signed', 'completion_accepted') THEN
    RETURN NEW;
  END IF;

  -- Only fire for variation_signed when actually activated
  IF v_event = 'variation_signed'
     AND (NEW.payload->>'activated')::boolean IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets
    WHERE name = 'email_queue_service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pdf snapshot: vault read failed: %', SQLERRM;
    RETURN NEW;
  END;

  IF v_service_key IS NULL THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'contract_id', NEW.contract_id,
    'trigger_event', v_event,
    'variation_id', NEW.payload->>'variation_id'
  );

  PERFORM extensions.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := v_payload,
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'dispatch_contract_pdf_snapshot error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contract_events_pdf_snapshot ON public.contract_events;
CREATE TRIGGER contract_events_pdf_snapshot
AFTER INSERT ON public.contract_events
FOR EACH ROW EXECUTE FUNCTION public.dispatch_contract_pdf_snapshot();

-- Track snapshot metadata on contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS latest_pdf_path text,
  ADD COLUMN IF NOT EXISTS latest_pdf_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS latest_pdf_hash text;
