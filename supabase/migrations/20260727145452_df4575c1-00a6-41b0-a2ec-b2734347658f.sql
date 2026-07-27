ALTER TABLE public.project_intelligence_records
  ADD COLUMN IF NOT EXISTS builder_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS construction_confidence smallint;