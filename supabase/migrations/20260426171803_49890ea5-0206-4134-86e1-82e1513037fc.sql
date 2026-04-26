
-- 1. consents_log table for audit trail of terms/marketing consent
CREATE TABLE IF NOT EXISTS public.consents_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms','marketing')),
  consented BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consents_log_user_id ON public.consents_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_log_type ON public.consents_log(consent_type);

ALTER TABLE public.consents_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own consents" ON public.consents_log;
CREATE POLICY "Users can read own consents"
  ON public.consents_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consents" ON public.consents_log;
CREATE POLICY "Users can insert own consents"
  ON public.consents_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all consents" ON public.consents_log;
CREATE POLICY "Admins can read all consents"
  ON public.consents_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Trade verification fields (rejection)
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','approved','info_requested','rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- 3. Private storage bucket for trade verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-verification-documents', 'trade-verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Trade can upload their own docs (filename prefixed with their user id)
DROP POLICY IF EXISTS "Trades can upload own verification docs" ON storage.objects;
CREATE POLICY "Trades can upload own verification docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'trade-verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Trades can read own verification docs" ON storage.objects;
CREATE POLICY "Trades can read own verification docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trade-verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Trades can update own verification docs" ON storage.objects;
CREATE POLICY "Trades can update own verification docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'trade-verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Trades can delete own verification docs" ON storage.objects;
CREATE POLICY "Trades can delete own verification docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'trade-verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can read all verification docs" ON storage.objects;
CREATE POLICY "Admins can read all verification docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trade-verification-documents'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4. Update handle_new_user trigger to also create homeowners/trades records
-- based on user_type metadata, so the signup flow doesn't need a second insert.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_type text := COALESCE(NEW.raw_user_meta_data->>'user_type', 'trade');
  v_full_name text := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_postcode  text := COALESCE(NEW.raw_user_meta_data->>'postcode', '');
  v_phone     text := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_company   text := COALESCE(NEW.raw_user_meta_data->>'company_name', v_full_name);
  v_trade_type text := COALESCE(NEW.raw_user_meta_data->>'trade_type', 'Other');
BEGIN
  -- Always create profile row
  INSERT INTO public.profiles (user_id, email, full_name, user_type, postcode, phone)
  VALUES (NEW.id, NEW.email, v_full_name, v_user_type, v_postcode, v_phone)
  ON CONFLICT DO NOTHING;

  -- Create the matching domain row
  IF v_user_type = 'homeowner' THEN
    INSERT INTO public.homeowners (user_id, name, email, phone)
    VALUES (NEW.id, v_full_name, NEW.email, v_phone)
    ON CONFLICT DO NOTHING;
  ELSIF v_user_type = 'trade' THEN
    INSERT INTO public.trades (user_id, name, company_name, email_dummy_placeholder, phone, postcode, trade_type, verified, verification_status)
    SELECT NEW.id, v_full_name, v_company, NULL, v_phone, v_postcode, v_trade_type, false, 'pending'
    WHERE NOT EXISTS (SELECT 1 FROM public.trades WHERE user_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$function$;
