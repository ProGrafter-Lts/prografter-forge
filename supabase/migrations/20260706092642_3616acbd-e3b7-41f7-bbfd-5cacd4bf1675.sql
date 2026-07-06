ALTER TABLE public.quote_checks
  ADD COLUMN IF NOT EXISTS quote_evidence jsonb,
  ADD COLUMN IF NOT EXISTS evidence_validation jsonb,
  ADD COLUMN IF NOT EXISTS qs_scoring jsonb,
  ADD COLUMN IF NOT EXISTS document_score integer,
  ADD COLUMN IF NOT EXISTS project_confidence_score integer;