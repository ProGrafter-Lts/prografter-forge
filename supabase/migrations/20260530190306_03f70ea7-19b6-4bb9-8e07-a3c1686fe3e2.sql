-- Extend trade_applications with verification workflow fields
ALTER TABLE public.trade_applications
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS verification_checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS decided_by uuid,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz;

-- Backfill existing rows to the 'new' workflow status
UPDATE public.trade_applications SET verification_status = 'new'
WHERE verification_status IS NULL OR verification_status = 'submitted';

-- Audit trail of every admin action against an application
CREATE TABLE IF NOT EXISTS public.trade_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.trade_applications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid,
  actor_email text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_application_events_app
  ON public.trade_application_events(application_id, created_at DESC);

GRANT SELECT, INSERT ON public.trade_application_events TO authenticated;
GRANT ALL ON public.trade_application_events TO service_role;

ALTER TABLE public.trade_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view application events"
ON public.trade_application_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can log application events"
ON public.trade_application_events FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_user_id = auth.uid());