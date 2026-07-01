-- Add WITH CHECK to trade self-update policy so a trade cannot re-assign
-- their record's user_id to another account.
DROP POLICY IF EXISTS "Trades can update own record" ON public.trades;
CREATE POLICY "Trades can update own record"
ON public.trades
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to read the supplier waitlist (currently no SELECT policy exists,
-- so admins cannot view submitted supplier contact details). Non-admins remain
-- blocked.
DROP POLICY IF EXISTS "Admins can view supplier waitlist" ON public.supplier_waitlist;
CREATE POLICY "Admins can view supplier waitlist"
ON public.supplier_waitlist
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));