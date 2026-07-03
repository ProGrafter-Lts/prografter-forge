ALTER TABLE public.quote_checks
  ADD COLUMN IF NOT EXISTS file_hash text,
  ADD COLUMN IF NOT EXISTS analysis_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS consistency_diagnostic jsonb;

CREATE INDEX IF NOT EXISTS idx_quote_checks_file_hash ON public.quote_checks (file_hash);