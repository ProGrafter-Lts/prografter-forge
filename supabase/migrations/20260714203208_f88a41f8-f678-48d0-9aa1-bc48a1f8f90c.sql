
CREATE TABLE public.pending_module_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL,
  email TEXT NOT NULL,
  user_id UUID NULL,
  intake JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_path TEXT NOT NULL,
  supporting_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  project_type TEXT NULL,
  price_band TEXT NULL,
  amount_due INTEGER NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT NULL,
  stripe_payment_intent_id TEXT NULL,
  amount_paid INTEGER NULL,
  paid_at TIMESTAMPTZ NULL,
  analysed_check_id UUID NULL,
  analysed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.pending_module_checks TO service_role;
-- All access is via edge functions using service role; no client access.
ALTER TABLE public.pending_module_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no client access" ON public.pending_module_checks FOR ALL USING (false) WITH CHECK (false);

CREATE INDEX pending_module_checks_session_idx ON public.pending_module_checks(stripe_session_id);
