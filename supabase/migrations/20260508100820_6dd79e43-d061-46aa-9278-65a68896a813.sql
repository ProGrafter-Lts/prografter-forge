
-- =========================================================
-- QUOTES: PDF + Schedule of Works fields
-- =========================================================
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS methodology text,
  ADD COLUMN IF NOT EXISTS valid_until date DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  ADD COLUMN IF NOT EXISTS materials_spec jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exclusions text,
  ADD COLUMN IF NOT EXISTS estimated_start_date date,
  ADD COLUMN IF NOT EXISTS working_days integer,
  ADD COLUMN IF NOT EXISTS vat_registered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accept_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdf_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;

-- Length validation for methodology (CHECK is fine here — string length is immutable)
DO $$ BEGIN
  ALTER TABLE public.quotes
    ADD CONSTRAINT quotes_methodology_length_chk
    CHECK (methodology IS NULL OR char_length(methodology) <= 600);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_accept_token_idx ON public.quotes(accept_token);
CREATE UNIQUE INDEX IF NOT EXISTS quotes_reference_idx ON public.quotes(reference) WHERE reference IS NOT NULL;

-- Generate a quote reference automatically when missing.
CREATE OR REPLACE FUNCTION public.generate_quote_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_next int;
BEGIN
  SELECT COALESCE(MAX( (split_part(reference, '-', 3))::int ), 0) + 1
  INTO v_next
  FROM public.quotes
  WHERE reference LIKE 'QPG-' || v_year || '-%';

  RETURN 'QPG-' || v_year || '-' || lpad(v_next::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_quote_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := public.generate_quote_reference();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quotes_set_reference ON public.quotes;
CREATE TRIGGER quotes_set_reference
BEFORE INSERT ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.set_quote_reference();

-- Backfill references for any existing rows
UPDATE public.quotes
SET reference = public.generate_quote_reference()
WHERE reference IS NULL;

-- =========================================================
-- TRADES: business logo, VAT, structured insurance, Companies House
-- =========================================================
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS business_logo_path text,
  ADD COLUMN IF NOT EXISTS vat_registered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS companies_house_number text,
  ADD COLUMN IF NOT EXISTS public_liability_insurer text,
  ADD COLUMN IF NOT EXISTS public_liability_policy_number text,
  ADD COLUMN IF NOT EXISTS public_liability_cover_pence bigint,
  ADD COLUMN IF NOT EXISTS public_liability_expiry date,
  ADD COLUMN IF NOT EXISTS professional_indemnity_insurer text,
  ADD COLUMN IF NOT EXISTS professional_indemnity_policy_number text,
  ADD COLUMN IF NOT EXISTS professional_indemnity_cover_pence bigint,
  ADD COLUMN IF NOT EXISTS professional_indemnity_expiry date,
  ADD COLUMN IF NOT EXISTS verified_on_prografter_at timestamptz;

-- Backfill verified_on_prografter_at for already-verified trades
UPDATE public.trades
SET verified_on_prografter_at = COALESCE(verified_on_prografter_at, tier_updated_at, created_at)
WHERE verified = true AND verified_on_prografter_at IS NULL;

-- =========================================================
-- QUOTE PDF EVENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.quote_pdf_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('generated','downloaded','viewed','accept_clicked','sent')),
  actor_user_id uuid,
  actor_role text,
  ip inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_pdf_events_quote_idx ON public.quote_pdf_events(quote_id, created_at DESC);

ALTER TABLE public.quote_pdf_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trade owner can read quote pdf events" ON public.quote_pdf_events;
CREATE POLICY "Trade owner can read quote pdf events"
ON public.quote_pdf_events
FOR SELECT
TO authenticated
USING (
  quote_id IN (
    SELECT q.id FROM public.quotes q
    JOIN public.trades t ON t.id = q.trade_id
    WHERE t.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Homeowner party can read quote pdf events" ON public.quote_pdf_events;
CREATE POLICY "Homeowner party can read quote pdf events"
ON public.quote_pdf_events
FOR SELECT
TO authenticated
USING (
  quote_id IN (
    SELECT q.id FROM public.quotes q
    JOIN public.jobs j ON j.id = q.job_id
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE h.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can read quote pdf events" ON public.quote_pdf_events;
CREATE POLICY "Admins can read quote pdf events"
ON public.quote_pdf_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Inserts only via security-definer RPC
CREATE OR REPLACE FUNCTION public.record_quote_pdf_event(
  _quote_id uuid,
  _event_type text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_role text;
  v_is_trade boolean := false;
  v_is_homeowner boolean := false;
BEGIN
  IF _event_type NOT IN ('generated','downloaded','viewed','accept_clicked','sent') THEN
    RAISE EXCEPTION 'Invalid event_type %', _event_type;
  END IF;

  IF v_caller IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.quotes q JOIN public.trades t ON t.id = q.trade_id
      WHERE q.id = _quote_id AND t.user_id = v_caller
    ) INTO v_is_trade;

    SELECT EXISTS(
      SELECT 1 FROM public.quotes q
      JOIN public.jobs j ON j.id = q.job_id
      JOIN public.homeowners h ON h.id = j.homeowner_id
      WHERE q.id = _quote_id AND h.user_id = v_caller
    ) INTO v_is_homeowner;

    IF v_is_trade THEN v_role := 'trade';
    ELSIF v_is_homeowner THEN v_role := 'homeowner';
    ELSE v_role := 'other';
    END IF;
  ELSE
    v_role := 'anon';
  END IF;

  INSERT INTO public.quote_pdf_events (quote_id, event_type, actor_user_id, actor_role, metadata)
  VALUES (_quote_id, _event_type, v_caller, v_role, COALESCE(_metadata, '{}'::jsonb));

  IF _event_type = 'viewed' THEN
    UPDATE public.quotes
    SET view_count = view_count + 1,
        last_viewed_at = now()
    WHERE id = _quote_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_quote_pdf_event(uuid, text, jsonb) TO authenticated, anon;

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-pdfs', 'quote-pdfs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-logos', 'trade-logos', true)
ON CONFLICT (id) DO NOTHING;

-- quote-pdfs: trade owner can read/write own files
DROP POLICY IF EXISTS "Trade owner can read own quote pdfs" ON storage.objects;
CREATE POLICY "Trade owner can read own quote pdfs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can write own quote pdfs" ON storage.objects;
CREATE POLICY "Trade owner can write own quote pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can update own quote pdfs" ON storage.objects;
CREATE POLICY "Trade owner can update own quote pdfs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
  )
);

-- Homeowner party can read PDFs for quotes on their own jobs
DROP POLICY IF EXISTS "Homeowner can read quote pdfs for own jobs" ON storage.objects;
CREATE POLICY "Homeowner can read quote pdfs for own jobs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.jobs j ON j.id = q.job_id
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE h.user_id = auth.uid()
      AND q.pdf_path IS NOT NULL
      AND name = q.pdf_path
  )
);

DROP POLICY IF EXISTS "Admins can read all quote pdfs" ON storage.objects;
CREATE POLICY "Admins can read all quote pdfs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'quote-pdfs'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- trade-logos: public read, trade owner can upload/update/delete own folder
DROP POLICY IF EXISTS "Trade logos are publicly readable" ON storage.objects;
CREATE POLICY "Trade logos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'trade-logos');

DROP POLICY IF EXISTS "Trade owner can upload own logo" ON storage.objects;
CREATE POLICY "Trade owner can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-logos'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can update own logo" ON storage.objects;
CREATE POLICY "Trade owner can update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trade-logos'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Trade owner can delete own logo" ON storage.objects;
CREATE POLICY "Trade owner can delete own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-logos'
  AND EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
  )
);
