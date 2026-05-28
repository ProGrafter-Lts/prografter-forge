ALTER TABLE public.planning_leads
  ADD COLUMN IF NOT EXISTS outreach_status text NOT NULL DEFAULT 'not_contacted',
  ADD COLUMN IF NOT EXISTS letter_sent_at timestamp with time zone;

COMMENT ON COLUMN public.planning_leads.outreach_status IS 'Outreach lifecycle for auto-next-action / skip: not_contacted | no_next_action | letter_sent | skipped';