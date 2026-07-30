-- Consistency-gate run log for the Pass 0/1/2 Quote Checker rebuild (see
-- scripts/quote-checker-consistency-gate.mjs). Each row is one of the 5 runs
-- against one reference quote; the gate requires >=95% field-agreement rate
-- across the 5 runs, on all 3 reference quotes, before a category's flag in
-- supabase/functions/_shared/quote-checker-v2-flags.ts is flipped to true.
-- This table is the audit trail if that due-diligence is ever questioned.
CREATE TABLE public.quote_check_consistency_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT NOT NULL,
  test_quote_label TEXT NOT NULL, -- 'weak' | 'medium' | 'strong'
  test_quote_path TEXT NOT NULL,
  run_number INTEGER NOT NULL,
  extraction_json JSONB NOT NULL,
  passed BOOLEAN,
  tested_by TEXT,
  tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_check_consistency_tests_category ON public.quote_check_consistency_tests(category, test_quote_label);

GRANT ALL ON public.quote_check_consistency_tests TO service_role;

ALTER TABLE public.quote_check_consistency_tests ENABLE ROW LEVEL SECURITY;
-- No policies for `authenticated`/`anon` — populated only by the
-- consistency-gate script using the service role key, which bypasses RLS.
