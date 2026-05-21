
ALTER TABLE public.planning_leads
  ADD COLUMN IF NOT EXISTS agent_contacted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS agent_contact_methods text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS homeowner_contacted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS homeowner_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS homeowner_contact_methods text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS homeowner_interested text;

ALTER TABLE public.planning_leads
  DROP CONSTRAINT IF EXISTS planning_leads_homeowner_interested_chk;
ALTER TABLE public.planning_leads
  ADD CONSTRAINT planning_leads_homeowner_interested_chk
  CHECK (homeowner_interested IS NULL OR homeowner_interested IN ('yes','no','unknown'));

-- Backfill agent_contacted from legacy pipeline_status
UPDATE public.planning_leads
SET agent_contacted = true
WHERE pipeline_status IN ('contacted_agent','call_made','meeting_booked','quote_posted','job_won')
  AND agent_contacted = false;

-- Case-insensitive uniqueness on agent identity so we can upsert safely
CREATE UNIQUE INDEX IF NOT EXISTS planning_agents_ci_name_idx
  ON public.planning_agents (
    lower(contact_name),
    lower(coalesce(company_name, ''))
  );

CREATE INDEX IF NOT EXISTS planning_leads_agent_id_idx ON public.planning_leads(agent_id);
