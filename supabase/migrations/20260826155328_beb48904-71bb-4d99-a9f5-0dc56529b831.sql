ALTER TABLE public.planning_leads
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS homeowner_letter_template text,
  ADD COLUMN IF NOT EXISTS homeowner_last_contact_method text,
  ADD COLUMN IF NOT EXISTS homeowner_last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS agent_last_contact_method text,
  ADD COLUMN IF NOT EXISTS agent_last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS agent_outreach_status text,
  ADD COLUMN IF NOT EXISTS response_state text,
  ADD COLUMN IF NOT EXISTS response_at timestamptz,
  ADD COLUMN IF NOT EXISTS outreach_campaign text,
  ADD COLUMN IF NOT EXISTS letter_batch_status text,
  ADD COLUMN IF NOT EXISTS letter_batch_added_at timestamptz,
  ADD COLUMN IF NOT EXISTS letter_batch_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_planning_leads_letter_batch_status ON public.planning_leads(letter_batch_status);
CREATE INDEX IF NOT EXISTS idx_planning_leads_response_state ON public.planning_leads(response_state);

CREATE TABLE IF NOT EXISTS public.planning_lead_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.planning_leads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  detail text,
  template text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_lead_events TO authenticated;
GRANT ALL ON public.planning_lead_events TO service_role;

ALTER TABLE public.planning_lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage planning lead events"
ON public.planning_lead_events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_planning_lead_events_lead ON public.planning_lead_events(lead_id, created_at DESC);