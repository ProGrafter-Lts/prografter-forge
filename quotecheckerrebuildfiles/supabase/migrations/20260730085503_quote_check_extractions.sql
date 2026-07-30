-- Pass 1 structured extraction JSON per quote-check submission, for the
-- Pass 0/1/2 Quote Checker rebuild (Landscaping/Driveway pilot). Backend
-- audit trail only — never read directly by the frontend (report reads
-- continue to go through read-simple-quote-check with the service role,
-- same as simple_quote_checks today).
CREATE TABLE public.quote_check_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quote_check_id UUID NOT NULL REFERENCES public.simple_quote_checks(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  pass0_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pass1_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  source_text_available BOOLEAN NOT NULL DEFAULT false,
  raw_model_output TEXT
);

CREATE INDEX idx_quote_check_extractions_quote_check_id ON public.quote_check_extractions(quote_check_id);

GRANT ALL ON public.quote_check_extractions TO service_role;

ALTER TABLE public.quote_check_extractions ENABLE ROW LEVEL SECURITY;
-- No policies for `authenticated`/`anon` — this table is written and read
-- exclusively by edge functions using the service role key, which bypasses
-- RLS. Intentionally no client-facing access.
