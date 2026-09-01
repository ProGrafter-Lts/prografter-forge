-- 1. Preserve commission logic (3.75% of the variation cost) on the formal system.
ALTER TABLE public.contract_variations
  ADD COLUMN IF NOT EXISTS commission_pence INTEGER
  GENERATED ALWAYS AS (ROUND(GREATEST(cost_change_pence, 0) * 0.0375)::int) STORED;

-- Traceability back to the retired lightweight system.
ALTER TABLE public.contract_variations
  ADD COLUMN IF NOT EXISTS legacy_variation_id UUID;

-- 2. Archive of the retired lightweight `variations` table.
CREATE TABLE IF NOT EXISTS public.variations_archive (
  id UUID PRIMARY KEY,
  job_id UUID,
  trade_id UUID,
  title TEXT,
  description TEXT,
  reason TEXT,
  materials_cost NUMERIC,
  labour_cost NUMERIC,
  programme_impact_days INTEGER,
  status TEXT,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  migrated_contract_variation_id UUID
);

GRANT SELECT ON public.variations_archive TO authenticated;
GRANT ALL ON public.variations_archive TO service_role;

ALTER TABLE public.variations_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read variations archive" ON public.variations_archive;
CREATE POLICY "Admins can read variations archive"
  ON public.variations_archive FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Retire the lightweight table: no app path may read or write it any more.
DROP POLICY IF EXISTS "Homeowners can view variations for their jobs" ON public.variations;
DROP POLICY IF EXISTS "Homeowners can update variations for their jobs" ON public.variations;
DROP POLICY IF EXISTS "Trades can view variations for their jobs" ON public.variations;
DROP POLICY IF EXISTS "Trades can create variations" ON public.variations;
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='variations' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.variations', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.variations FROM anon, authenticated;
GRANT ALL ON public.variations TO service_role;

COMMENT ON TABLE public.variations IS 'RETIRED 2026-09: superseded by public.contract_variations. Read-only historical data, copied to public.variations_archive. Do not use.';