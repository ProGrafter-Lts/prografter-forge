-- PHASE 5: Homeowner Account -> Property -> Project(s)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES public.homeowners(id) ON DELETE CASCADE,
  label TEXT,
  address TEXT,
  postcode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners manage their own properties"
ON public.properties FOR ALL TO authenticated
USING (public.user_owns_homeowner(auth.uid(), homeowner_id))
WITH CHECK (public.user_owns_homeowner(auth.uid(), homeowner_id));

CREATE INDEX IF NOT EXISTS idx_properties_homeowner ON public.properties(homeowner_id);

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_property ON public.jobs(property_id);

INSERT INTO public.properties (homeowner_id, address, postcode)
SELECT DISTINCT j.homeowner_id, j.address, j.postcode
FROM public.jobs j
WHERE j.homeowner_id IS NOT NULL
  AND (j.address IS NOT NULL OR j.postcode IS NOT NULL);

UPDATE public.jobs j
SET property_id = p.id
FROM public.properties p
WHERE j.property_id IS NULL
  AND p.homeowner_id = j.homeowner_id
  AND p.address IS NOT DISTINCT FROM j.address
  AND p.postcode IS NOT DISTINCT FROM j.postcode;

-- PHASE 6: trade-private commercial data per project (preparation only).
CREATE TABLE IF NOT EXISTS public.project_commercials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  estimated_cost_pence BIGINT,
  actual_cost_pence BIGINT,
  labour_cost_pence BIGINT,
  materials_cost_pence BIGINT,
  subcontractor_cost_pence BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, trade_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_commercials TO authenticated;
GRANT ALL ON public.project_commercials TO service_role;

ALTER TABLE public.project_commercials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades manage their own project commercials"
ON public.project_commercials FOR ALL TO authenticated
USING (public.owns_trade(auth.uid(), trade_id))
WITH CHECK (public.owns_trade(auth.uid(), trade_id));

CREATE INDEX IF NOT EXISTS idx_project_commercials_trade ON public.project_commercials(trade_id);
CREATE INDEX IF NOT EXISTS idx_project_commercials_job ON public.project_commercials(job_id);