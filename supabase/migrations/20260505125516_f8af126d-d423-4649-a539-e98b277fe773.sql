-- Add a share flag on quotes so trades can opt-in to revealing materials to homeowner
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS share_materials_with_homeowner boolean NOT NULL DEFAULT false;

-- quote_materials: structured line-item capture
CREATE TABLE IF NOT EXISTS public.quote_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description text NOT NULL CHECK (char_length(description) >= 3),
  brand text,
  model_or_spec text,
  quantity numeric(10,2) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'each'
    CHECK (unit IN ('each','m','m2','kg','l','hours')),
  unit_price_ex_vat numeric(10,2) NOT NULL CHECK (unit_price_ex_vat >= 0),
  vat_rate_pct numeric(4,2) NOT NULL DEFAULT 20.00 CHECK (vat_rate_pct >= 0 AND vat_rate_pct <= 100),
  line_total_ex_vat numeric(12,2)
    GENERATED ALWAYS AS (quantity * unit_price_ex_vat) STORED,
  line_total_inc_vat numeric(12,2)
    GENERATED ALWAYS AS (quantity * unit_price_ex_vat * (1 + vat_rate_pct / 100)) STORED,
  category text CHECK (category IS NULL OR category IN
    ('electrical','plumbing','timber','fixings','paint','glass','insulation','other')),
  merchant_hint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_materials_quote_id ON public.quote_materials(quote_id);

ALTER TABLE public.quote_materials ENABLE ROW LEVEL SECURITY;

-- Helper predicate inlined per-policy to avoid circular function deps
-- SELECT: trade who owns the parent quote, homeowner who received it, or admin
DROP POLICY IF EXISTS "View quote materials" ON public.quote_materials;
CREATE POLICY "View quote materials"
ON public.quote_materials
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.trades t ON t.id = q.trade_id
    WHERE q.id = quote_materials.quote_id
      AND t.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.jobs j ON j.id = q.job_id
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE q.id = quote_materials.quote_id
      AND h.user_id = auth.uid()
  )
);

-- INSERT: only the trade who owns the parent quote
DROP POLICY IF EXISTS "Trade insert quote materials" ON public.quote_materials;
CREATE POLICY "Trade insert quote materials"
ON public.quote_materials
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.trades t ON t.id = q.trade_id
    WHERE q.id = quote_materials.quote_id
      AND t.user_id = auth.uid()
  )
);

-- UPDATE: only the trade who owns the parent quote
DROP POLICY IF EXISTS "Trade update quote materials" ON public.quote_materials;
CREATE POLICY "Trade update quote materials"
ON public.quote_materials
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.trades t ON t.id = q.trade_id
    WHERE q.id = quote_materials.quote_id
      AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.trades t ON t.id = q.trade_id
    WHERE q.id = quote_materials.quote_id
      AND t.user_id = auth.uid()
  )
);

-- DELETE: only the trade who owns the parent quote
DROP POLICY IF EXISTS "Trade delete quote materials" ON public.quote_materials;
CREATE POLICY "Trade delete quote materials"
ON public.quote_materials
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.trades t ON t.id = q.trade_id
    WHERE q.id = quote_materials.quote_id
      AND t.user_id = auth.uid()
  )
);