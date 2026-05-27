-- Keep trades.verified in lockstep with verification_status (single source of truth)
CREATE OR REPLACE FUNCTION public.sync_trade_verified_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.verified := (NEW.verification_status = 'approved');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_trade_verified_flag ON public.trades;
CREATE TRIGGER trg_sync_trade_verified_flag
BEFORE INSERT OR UPDATE OF verification_status, verified ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.sync_trade_verified_flag();

-- Backfill: reconcile any drift
UPDATE public.trades
SET verified = (verification_status = 'approved')
WHERE verified IS DISTINCT FROM (verification_status = 'approved');