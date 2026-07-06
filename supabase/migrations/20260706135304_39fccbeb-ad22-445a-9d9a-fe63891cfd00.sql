
CREATE TABLE public.quote_standards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_id TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_date DATE,
  author TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active','draft','archived')),
  scope_summary TEXT,
  included_scope TEXT,
  excluded_scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trade_type, version)
);

CREATE TABLE public.quote_standard_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_uuid UUID NOT NULL REFERENCES public.quote_standards(id) ON DELETE CASCADE,
  standard_id TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  version TEXT NOT NULL,
  check_id TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  section_name TEXT,
  check_title TEXT NOT NULL,
  pass_condition TEXT,
  why_it_matters TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (standard_uuid, check_id)
);

CREATE INDEX idx_quote_standard_checks_std ON public.quote_standard_checks(standard_uuid, display_order);

GRANT SELECT ON public.quote_standards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quote_standards TO authenticated;
GRANT ALL ON public.quote_standards TO service_role;

GRANT SELECT ON public.quote_standard_checks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quote_standard_checks TO authenticated;
GRANT ALL ON public.quote_standard_checks TO service_role;

ALTER TABLE public.quote_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_standard_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active standards"
  ON public.quote_standards FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage standards"
  ON public.quote_standards FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active standard checks"
  ON public.quote_standard_checks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.quote_standards s WHERE s.id = standard_uuid AND s.status = 'active')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage standard checks"
  ON public.quote_standard_checks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quote_standards_updated_at
  BEFORE UPDATE ON public.quote_standards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lock each quote check report to the standard used
ALTER TABLE public.quote_checks
  ADD COLUMN IF NOT EXISTS standard_id TEXT,
  ADD COLUMN IF NOT EXISTS standard_version TEXT,
  ADD COLUMN IF NOT EXISTS standard_name TEXT,
  ADD COLUMN IF NOT EXISTS checklist_results JSONB,
  ADD COLUMN IF NOT EXISTS checklist_score INTEGER,
  ADD COLUMN IF NOT EXISTS addressed_count INTEGER,
  ADD COLUMN IF NOT EXISTS clarification_count INTEGER,
  ADD COLUMN IF NOT EXISTS missing_count INTEGER,
  ADD COLUMN IF NOT EXISTS total_checks INTEGER,
  ADD COLUMN IF NOT EXISTS standard_mismatch BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS analysis_mode TEXT DEFAULT 'fixed_standard';
