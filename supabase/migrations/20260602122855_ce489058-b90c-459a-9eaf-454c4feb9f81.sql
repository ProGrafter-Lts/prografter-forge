-- 1. job_briefs: account link, segmentation, lifecycle columns
ALTER TABLE public.job_briefs
  ADD COLUMN IF NOT EXISTS homeowner_user_id uuid,
  ADD COLUMN IF NOT EXISTS homeowner_id uuid,
  ADD COLUMN IF NOT EXISTS existing_quotes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scoping_notes text,
  ADD COLUMN IF NOT EXISTS scoped_by uuid,
  ADD COLUMN IF NOT EXISTS scoped_at timestamptz,
  ADD COLUMN IF NOT EXISTS planning_notes text,
  ADD COLUMN IF NOT EXISTS planning_guidance_by uuid,
  ADD COLUMN IF NOT EXISTS planning_guidance_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS override_reason text;

-- Normalise existing status values to the new lifecycle vocabulary
UPDATE public.job_briefs SET status = 'published_to_trades' WHERE status IN ('published');
UPDATE public.job_briefs SET status = 'under_review' WHERE status IN ('new','received','pending');
UPDATE public.job_briefs SET status = 'under_review'
  WHERE status NOT IN ('new','under_review','awaiting_scoping','scoped','approved','published_to_trades');

ALTER TABLE public.job_briefs ALTER COLUMN status SET DEFAULT 'under_review';

ALTER TABLE public.job_briefs DROP CONSTRAINT IF EXISTS job_briefs_status_check;
ALTER TABLE public.job_briefs ADD CONSTRAINT job_briefs_status_check
  CHECK (status IN ('new','under_review','awaiting_scoping','scoped','approved','published_to_trades'));

-- Homeowner can read their own briefs (admins already have policies)
DROP POLICY IF EXISTS "Homeowners can view their own briefs" ON public.job_briefs;
CREATE POLICY "Homeowners can view their own briefs"
  ON public.job_briefs FOR SELECT
  TO authenticated
  USING (homeowner_user_id = auth.uid());

-- 2. quote_check_entitlements
CREATE TABLE IF NOT EXISTS public.quote_check_entitlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'first_job_post',
  granted_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  quote_check_id uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_check_entitlements TO authenticated;
GRANT ALL ON public.quote_check_entitlements TO service_role;

ALTER TABLE public.quote_check_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own entitlements" ON public.quote_check_entitlements;
CREATE POLICY "Users view own entitlements"
  ON public.quote_check_entitlements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- 3. consents_log: allow service_role inserts from edge function
DROP POLICY IF EXISTS "Service role can insert consents" ON public.consents_log;
CREATE POLICY "Service role can insert consents"
  ON public.consents_log FOR INSERT
  TO service_role
  WITH CHECK (true);
GRANT INSERT ON public.consents_log TO service_role;