ALTER TABLE public.planning_leads
  ADD COLUMN IF NOT EXISTS applicant_name TEXT,
  ADD COLUMN IF NOT EXISTS applicant_address TEXT,
  ADD COLUMN IF NOT EXISTS applicant_contact TEXT,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_address TEXT,
  ADD COLUMN IF NOT EXISTS agent_contact TEXT,
  ADD COLUMN IF NOT EXISTS proposal_type TEXT,
  ADD COLUMN IF NOT EXISTS pdf_enriched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_source_url TEXT;