-- ============================================================
-- Milestone Escrow Release engine
-- Additive only: extends the existing wallet/drawdown tables.
-- ============================================================

-- 1. Building Control inspection reports, per wallet stage ----------------
CREATE TABLE public.stage_inspection_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  wallet_id uuid REFERENCES public.project_wallets(id) ON DELETE CASCADE,
  wallet_stage_id uuid REFERENCES public.project_wallet_stages(id) ON DELETE SET NULL,
  uploaded_by uuid,
  uploader_role text NOT NULL DEFAULT 'trade',
  file_path text,
  file_name text,
  inspector_name text,
  report_date date,
  raw_text text,
  classification text NOT NULL CHECK (classification IN ('CLEAR','HOLD','MIXED')),
  classification_reason text,
  required_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  open_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolved_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  clear_phrases jsonb NOT NULL DEFAULT '[]'::jsonb,
  unable_to_assess jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded','disputed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stage_inspection_reports_job ON public.stage_inspection_reports(job_id);
CREATE INDEX idx_stage_inspection_reports_stage ON public.stage_inspection_reports(wallet_stage_id);

GRANT SELECT ON public.stage_inspection_reports TO authenticated;
GRANT ALL ON public.stage_inspection_reports TO service_role;
ALTER TABLE public.stage_inspection_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view inspection reports"
ON public.stage_inspection_reports FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_wallets w
    WHERE w.job_id = stage_inspection_reports.job_id
      AND (
        EXISTS (SELECT 1 FROM public.homeowners h WHERE h.id = w.homeowner_id AND h.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = w.trade_id AND t.user_id = auth.uid())
      )
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 2. Qualifying disputes against a specific inspection report -------------
CREATE TABLE public.inspection_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_report_id uuid NOT NULL REFERENCES public.stage_inspection_reports(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  wallet_id uuid REFERENCES public.project_wallets(id) ON DELETE CASCADE,
  raised_by_user_id uuid NOT NULL,
  raised_by_role text NOT NULL CHECK (raised_by_role IN ('homeowner','trade','admin')),
  evidence_type text NOT NULL CHECK (evidence_type IN ('follow_up_inspection_report','professional_body_complaint','inspector_retraction')),
  evidence_reference text NOT NULL,
  evidence_path text,
  evidence_notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','rejected')),
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspection_disputes_job ON public.inspection_disputes(job_id);

GRANT SELECT ON public.inspection_disputes TO authenticated;
GRANT ALL ON public.inspection_disputes TO service_role;
ALTER TABLE public.inspection_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view inspection disputes"
ON public.inspection_disputes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_wallets w
    WHERE w.job_id = inspection_disputes.job_id
      AND (
        EXISTS (SELECT 1 FROM public.homeowners h WHERE h.id = w.homeowner_id AND h.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = w.trade_id AND t.user_id = auth.uid())
      )
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 3. Project-level freeze + final payment sizing warning ------------------
ALTER TABLE public.project_wallets
  ADD COLUMN IF NOT EXISTS frozen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_at timestamptz,
  ADD COLUMN IF NOT EXISTS frozen_reason text,
  ADD COLUMN IF NOT EXISTS frozen_by_dispute_id uuid,
  ADD COLUMN IF NOT EXISTS final_stage_pct numeric,
  ADD COLUMN IF NOT EXISTS final_stage_warning boolean NOT NULL DEFAULT false;

-- 4. Per-stage inspection outcome ----------------------------------------
ALTER TABLE public.project_wallet_stages
  ADD COLUMN IF NOT EXISTS inspection_status text,
  ADD COLUMN IF NOT EXISTS inspection_report_id uuid,
  ADD COLUMN IF NOT EXISTS inspection_passed_at timestamptz,
  ADD COLUMN IF NOT EXISTS release_block_reason text;

-- 5. Certificates: auto-release to the homeowner on stage release ---------
ALTER TABLE public.project_certificates
  ADD COLUMN IF NOT EXISTS wallet_stage_id uuid,
  ADD COLUMN IF NOT EXISTS stage_order integer,
  ADD COLUMN IF NOT EXISTS visible_to_homeowner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS released_at timestamptz;

-- Existing certificates stay visible (no regression for live projects).
UPDATE public.project_certificates SET visible_to_homeowner = true, released_at = COALESCE(released_at, created_at)
WHERE visible_to_homeowner = false;

-- Homeowner visibility now follows the release, never the trade's choice.
DROP POLICY IF EXISTS "Homeowners can view certs for own jobs" ON public.project_certificates;
CREATE POLICY "Homeowners can view released certs for own jobs"
ON public.project_certificates FOR SELECT TO authenticated
USING (
  visible_to_homeowner = true
  AND job_id IN (
    SELECT j.id FROM public.jobs j
    WHERE j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())
  )
);