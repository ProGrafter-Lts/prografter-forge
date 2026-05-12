
-- Disputes system
CREATE TABLE public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ref text NOT NULL UNIQUE DEFAULT ('DISP-' || lpad((floor(random()*99999)::int)::text, 5, '0')),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  raised_by_user_id uuid NOT NULL,
  raised_by_role text NOT NULL CHECK (raised_by_role IN ('homeowner','trade')),
  against_user_id uuid,
  reason text NOT NULL,
  reason_label text,
  amount_disputed_pence integer,
  frozen_amount_pence integer,
  claimant_statement text NOT NULL,
  respondent_statement text,
  desired_outcome text,
  evidence_notes text,
  status text NOT NULL DEFAULT 'awaiting_response' CHECK (status IN ('awaiting_response','under_review','resolved','escalated')),
  recommendation text,
  resolution text CHECK (resolution IN ('claimant','respondent','split')),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dispute_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('dispute','system','job')),
  event_text text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dispute_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('photo','document','message')),
  label text NOT NULL,
  url text,
  uploaded_by text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_job ON public.disputes(job_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_dispute_events_dispute ON public.dispute_events(dispute_id);
CREATE INDEX idx_dispute_evidence_dispute ON public.dispute_evidence(dispute_id);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

-- Helper: is user a participant in this job (homeowner or matched trade)?
CREATE OR REPLACE FUNCTION public.user_is_job_participant(_user_id uuid, _job_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE j.id = _job_id AND h.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.job_matches jm
    JOIN public.trades t ON t.id = jm.trade_id
    WHERE jm.job_id = _job_id AND t.user_id = _user_id
  );
$$;

-- DISPUTES policies
CREATE POLICY "Participants and admins view disputes"
ON public.disputes FOR SELECT TO authenticated
USING (
  public.user_is_job_participant(auth.uid(), job_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Participants raise disputes on their job"
ON public.disputes FOR INSERT TO authenticated
WITH CHECK (
  raised_by_user_id = auth.uid()
  AND public.user_is_job_participant(auth.uid(), job_id)
);

CREATE POLICY "Participants update own dispute statements"
ON public.disputes FOR UPDATE TO authenticated
USING (public.user_is_job_participant(auth.uid(), job_id))
WITH CHECK (public.user_is_job_participant(auth.uid(), job_id));

CREATE POLICY "Admins update any dispute"
ON public.disputes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- EVENTS policies
CREATE POLICY "Participants/admins view events"
ON public.dispute_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.disputes d
  WHERE d.id = dispute_id
  AND (public.user_is_job_participant(auth.uid(), d.job_id) OR public.has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Participants/admins insert events"
ON public.dispute_events FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.disputes d
  WHERE d.id = dispute_id
  AND (public.user_is_job_participant(auth.uid(), d.job_id) OR public.has_role(auth.uid(), 'admin'::app_role))
));

-- EVIDENCE policies
CREATE POLICY "Participants/admins view evidence"
ON public.dispute_evidence FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.disputes d
  WHERE d.id = dispute_id
  AND (public.user_is_job_participant(auth.uid(), d.job_id) OR public.has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Participants/admins insert evidence"
ON public.dispute_evidence FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.disputes d
  WHERE d.id = dispute_id
  AND (public.user_is_job_participant(auth.uid(), d.job_id) OR public.has_role(auth.uid(), 'admin'::app_role))
));

-- updated_at trigger
CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create initial timeline event when dispute is raised
CREATE OR REPLACE FUNCTION public.dispute_initial_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.dispute_events (dispute_id, event_type, event_text)
  VALUES (NEW.id, 'dispute', 'Dispute raised by ' || NEW.raised_by_role || ' — escrow frozen');
  INSERT INTO public.dispute_events (dispute_id, event_type, event_text)
  VALUES (NEW.id, 'system', 'Dispute notification sent to both parties');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dispute_initial_event
AFTER INSERT ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.dispute_initial_event();
