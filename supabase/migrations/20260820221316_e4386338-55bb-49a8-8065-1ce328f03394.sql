CREATE TABLE public.job_escalation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.job_briefs(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'auto_48h',
  expired_count integer NOT NULL DEFAULT 0,
  released_count integer NOT NULL DEFAULT 0,
  expired_invitation_ids uuid[] NOT NULL DEFAULT '{}',
  note text,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_escalation_events_job ON public.job_escalation_events(job_id, created_at DESC);

GRANT SELECT ON public.job_escalation_events TO authenticated;
GRANT ALL ON public.job_escalation_events TO service_role;

ALTER TABLE public.job_escalation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view escalation events"
ON public.job_escalation_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.scheduler_locks (
  name text PRIMARY KEY,
  locked_until timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.scheduler_locks TO service_role;

ALTER TABLE public.scheduler_locks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_jti_expiry_scan
  ON public.job_trade_invitations(expires_at)
  WHERE released = true AND expires_at IS NOT NULL;