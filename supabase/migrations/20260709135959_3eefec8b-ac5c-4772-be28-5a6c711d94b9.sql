DROP POLICY IF EXISTS "Trade can view own references" ON public.trade_references;

CREATE POLICY "Trade can view own references"
ON public.trade_references
FOR SELECT
USING (
  trade_id IN (
    SELECT trades.id FROM public.trades WHERE trades.user_id = auth.uid()
  )
);