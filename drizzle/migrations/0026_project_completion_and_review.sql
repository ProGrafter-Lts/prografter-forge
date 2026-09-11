-- Permanent completion record for a canonical project (one row per job).
CREATE TABLE public.project_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_by UUID NOT NULL,
  completed_by_role TEXT NOT NULL DEFAULT 'trade',
  completion_status TEXT NOT NULL DEFAULT 'completed',
  original_contract_pence BIGINT,
  approved_variations_pence BIGINT NOT NULL DEFAULT 0,
  final_value_pence BIGINT,
  paid_pence BIGINT NOT NULL DEFAULT 0,
  outstanding_pence BIGINT NOT NULL DEFAULT 0,
  planned_start DATE,
  actual_start DATE,
  planned_end DATE,
  actual_end DATE,
  readiness_snapshot JSONB,
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.project_completions TO authenticated;
GRANT ALL ON public.project_completions TO service_role;

ALTER TABLE public.project_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view project completions"
ON public.project_completions FOR SELECT TO authenticated
USING (public.user_is_job_participant(auth.uid(), job_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participants can record project completion"
ON public.project_completions FOR INSERT TO authenticated
WITH CHECK (public.user_is_job_participant(auth.uid(), job_id));

CREATE POLICY "Participants can update project completion"
ON public.project_completions FOR UPDATE TO authenticated
USING (public.user_is_job_participant(auth.uid(), job_id))
WITH CHECK (public.user_is_job_participant(auth.uid(), job_id));

CREATE INDEX idx_project_completions_job ON public.project_completions(job_id);

-- Private trade-only delivery review / lessons learned.
CREATE TABLE public.project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  went_well TEXT,
  lost_time TEXT,
  cost_more TEXT,
  price_differently TEXT,
  programme_differently TEXT,
  supplier_lessons TEXT,
  client_payment_lessons TEXT,
  repeat_next_time TEXT,
  payment_outcome TEXT,
  programme_outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, trade_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_reviews TO authenticated;
GRANT ALL ON public.project_reviews TO service_role;

ALTER TABLE public.project_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades manage their own project reviews"
ON public.project_reviews FOR ALL TO authenticated
USING (public.owns_trade(auth.uid(), trade_id))
WITH CHECK (public.owns_trade(auth.uid(), trade_id));

CREATE TRIGGER project_reviews_touch
BEFORE UPDATE ON public.project_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Homeowners may add permanent property information that was never captured
-- during delivery. The row still belongs to the project's matched trade.
CREATE POLICY "Homeowners can add materials for own jobs"
ON public.materials_log FOR INSERT TO authenticated
WITH CHECK (
  job_id IN (SELECT j.id FROM public.jobs j
             WHERE j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid()))
);

CREATE POLICY "Homeowners can add warranties for own jobs"
ON public.project_warranties FOR INSERT TO authenticated
WITH CHECK (
  job_id IN (SELECT j.id FROM public.jobs j
             WHERE j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid()))
);
