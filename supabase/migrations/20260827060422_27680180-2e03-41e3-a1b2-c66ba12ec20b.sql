CREATE TABLE public.planning_lead_contact_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  planning_alert_id uuid NOT NULL,
  event_type text NOT NULL,
  channel text,
  detail text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.planning_lead_contact_log TO authenticated;
GRANT ALL ON public.planning_lead_contact_log TO service_role;

ALTER TABLE public.planning_lead_contact_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades view own contact log"
ON public.planning_lead_contact_log FOR SELECT TO authenticated
USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Trades insert own contact log"
ON public.planning_lead_contact_log FOR INSERT TO authenticated
WITH CHECK (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all contact log"
ON public.planning_lead_contact_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_planning_lead_contact_log_trade_alert
ON public.planning_lead_contact_log (trade_id, planning_alert_id, created_at DESC);