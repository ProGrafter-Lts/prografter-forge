-- Drop the broken "No public reads" policy and add a proper one
DROP POLICY IF EXISTS "No public reads on trades" ON public.trades;

CREATE POLICY "Trades can view own record"
  ON public.trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);