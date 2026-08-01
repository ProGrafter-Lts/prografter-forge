CREATE TABLE IF NOT EXISTS public.quote_check_extractions (
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
CREATE INDEX IF NOT EXISTS idx_quote_check_extractions_quote_check_id ON public.quote_check_extractions(quote_check_id);
GRANT ALL ON public.quote_check_extractions TO service_role;
ALTER TABLE public.quote_check_extractions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quote_check_consistency_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT NOT NULL,
  test_quote_label TEXT NOT NULL,
  test_quote_path TEXT NOT NULL,
  run_number INTEGER NOT NULL,
  extraction_json JSONB NOT NULL,
  passed BOOLEAN,
  tested_by TEXT,
  tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quote_check_consistency_tests_category ON public.quote_check_consistency_tests(category, test_quote_label);
GRANT ALL ON public.quote_check_consistency_tests TO service_role;
ALTER TABLE public.quote_check_consistency_tests ENABLE ROW LEVEL SECURITY;