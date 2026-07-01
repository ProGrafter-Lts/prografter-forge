-- ============================================================
-- Phase A: Trust & Distribution data model
-- ============================================================

-- 1. Job trade invitations (batch-controlled distribution)
CREATE TABLE public.job_trade_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.job_briefs(id) ON DELETE SET NULL,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  batch_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'invited',
  released boolean NOT NULL DEFAULT true,
  rank integer,
  distance_miles numeric,
  invited_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  quote_submitted_at timestamptz,
  expires_at timestamptz,
  decline_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, trade_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_trade_invitations TO authenticated;
GRANT ALL ON public.job_trade_invitations TO service_role;

ALTER TABLE public.job_trade_invitations ENABLE ROW LEVEL SECURITY;

-- Trades: see their own released invitations
CREATE POLICY "Trades view own released invitations"
ON public.job_trade_invitations FOR SELECT TO authenticated
USING (
  released = true
  AND trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
);

-- Trades: update status on their own released invitations
CREATE POLICY "Trades update own released invitations"
ON public.job_trade_invitations FOR UPDATE TO authenticated
USING (
  released = true
  AND trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
)
WITH CHECK (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
);

-- Homeowners: read invitations for their own jobs
CREATE POLICY "Homeowners view invitations for own jobs"
ON public.job_trade_invitations FOR SELECT TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE h.user_id = auth.uid()
  )
);

-- Admins: full access
CREATE POLICY "Admins manage invitations"
ON public.job_trade_invitations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_job_trade_invitations_updated
BEFORE UPDATE ON public.job_trade_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_job_trade_invitations_job ON public.job_trade_invitations(job_id);
CREATE INDEX idx_job_trade_invitations_trade ON public.job_trade_invitations(trade_id);

-- 2. Job publish overrides (audit log)
CREATE TABLE public.job_publish_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  brief_id uuid REFERENCES public.job_briefs(id) ON DELETE SET NULL,
  admin_id uuid NOT NULL,
  override_reason text NOT NULL,
  blocking_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.job_publish_overrides TO authenticated;
GRANT ALL ON public.job_publish_overrides TO service_role;

ALTER TABLE public.job_publish_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage publish overrides"
ON public.job_publish_overrides FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Job brief files (optional homeowner uploads)
CREATE TABLE public.job_brief_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_brief_id uuid REFERENCES public.job_briefs(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_type text,
  file_size bigint,
  category text,
  storage_path text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.job_brief_files TO authenticated;
GRANT ALL ON public.job_brief_files TO service_role;

ALTER TABLE public.job_brief_files ENABLE ROW LEVEL SECURITY;

-- Homeowner who owns the brief can manage their files
CREATE POLICY "Homeowners manage own brief files"
ON public.job_brief_files FOR ALL TO authenticated
USING (
  uploaded_by = auth.uid()
  OR job_brief_id IN (
    SELECT b.id FROM public.job_briefs b
    JOIN public.homeowners h ON h.id = b.homeowner_id
    WHERE h.user_id = auth.uid()
  )
)
WITH CHECK (
  uploaded_by = auth.uid()
  OR job_brief_id IN (
    SELECT b.id FROM public.job_briefs b
    JOIN public.homeowners h ON h.id = b.homeowner_id
    WHERE h.user_id = auth.uid()
  )
);

-- Invited trades can view files once the job has been published to them
CREATE POLICY "Invited trades view job files"
ON public.job_brief_files FOR SELECT TO authenticated
USING (
  job_id IS NOT NULL
  AND public.trade_can_access_job(auth.uid(), job_id)
);

-- Admins full access
CREATE POLICY "Admins manage brief files"
ON public.job_brief_files FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Quotes: structured proposal columns
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS scope_of_works text,
  ADD COLUMN IF NOT EXISTS assumptions text,
  ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric,
  ADD COLUMN IF NOT EXISTS payment_schedule jsonb,
  ADD COLUMN IF NOT EXISTS line_items jsonb,
  ADD COLUMN IF NOT EXISTS certifications jsonb,
  ADD COLUMN IF NOT EXISTS terms jsonb,
  ADD COLUMN IF NOT EXISTS vat_status text,
  ADD COLUMN IF NOT EXISTS vat_amount numeric,
  ADD COLUMN IF NOT EXISTS estimated_duration_text text;