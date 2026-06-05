ALTER TABLE public.quote_checks
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS subtotal_text text,
  ADD COLUMN IF NOT EXISTS vat_text text,
  ADD COLUMN IF NOT EXISTS total_text text;

ALTER TABLE public.quote_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_quote_checks_select" ON public.quote_checks;
CREATE POLICY "own_quote_checks_select" ON public.quote_checks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quote_checks_user ON public.quote_checks(user_id);