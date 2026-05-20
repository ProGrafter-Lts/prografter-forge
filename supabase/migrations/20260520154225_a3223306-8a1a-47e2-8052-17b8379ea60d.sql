ALTER TABLE public.planning_leads
  ADD COLUMN IF NOT EXISTS council_application_url TEXT;